/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Docs } from '../entity/docs.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateDocDTO } from '../dto/createDoc.dto';
import { UpdateDocDTO } from '../dto/updateDoc.dto';
import { Api } from 'src/api/entity/api.entity';
import { UserService } from 'src/user/service/user.service';
import { ActivityLogService } from 'src/activity_log/service/activity_log.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class DocsService {
  constructor(
    @InjectRepository(Docs)
    private readonly docsRepository: Repository<Docs>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationsService: NotificationsService, // ✅ injecter

  ) {}
  findByAssignedTo(clientId: string): Promise<Docs[]> {
    return this.docsRepository.find({
      where: { assignedTo: { id: clientId } },
      relations: ['user_creator', 'apis', 'assignedTo'],
    });
  }
  findAll(): Promise<Docs[]> {
    return this.docsRepository.find({
      relations: ['user_creator', 'apis', 'assignedTo'],
    });
  }

  findById(id: string): Promise<Docs | null> {
    return this.docsRepository.findOne({
      where: { id },
      relations: ['user_creator', 'apis'],
    });
  }

  findByCreatedBy(userId: string): Promise<Docs[]> {
    return this.docsRepository.find({
      where: {
        user_creator: { id: userId },
      },
      relations: ['user_creator', 'apis'],
    });
  }

  
  private determineNewVersion(currentVersion: string, changeReason: 'bug' | 'new_endpoint' | 'major_change'): string {
    // Parse la version actuelle (format: X.Y.Z)
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)$/;
    const match = currentVersion.match(versionRegex);
    
    if (!match) {
      // Si format invalide, retourne 1.0.0 par défaut
      return '1.0.0';
    }
    
    let major = parseInt(match[1], 10);
    let minor = parseInt(match[2], 10);
    let patch = parseInt(match[3], 10);
    
    switch (changeReason) {
      case 'bug': // Correction de bug → incrémenter le PATCH (1.0.0 → 1.0.1)
        patch++;
        break;
        
      case 'new_endpoint': // Nouvel endpoint → incrémenter le MINOR, reset PATCH (1.1.5 → 1.2.0)
        minor++;
        patch = 0;
        break;
        
      case 'major_change': // Changement majeur du doc → incrémenter le MAJOR, reset MINOR et PATCH (1.1.9 → 2.0.0)
        major++;
        minor = 0;
        patch = 0;
        break;
    }
    
    return `${major}.${minor}.${patch}`;
  }
  // docs.service.ts

  async create(doc: CreateDocDTO, email: string): Promise<Docs> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newDoc = this.docsRepository.create({
        name: doc.name,
        description: doc.description,
        submissionDate: doc.submissionDate,
        status: doc.status,
        baseUrl: doc.baseUrl,
        commonHeader: doc.commonHeader,
        bearerToken: doc.bearerToken,
        user_creator: { id: doc.user_creator },
        assignedTo: doc.assignedTo ? { id: doc.assignedTo } : undefined,
        version: doc.version
      });
      
      const actionCreator = await this.userService.findUserByMail(email);
      if (!actionCreator) {
        throw new UnauthorizedException('Action creator not found');
      }
      
      const ownerUser = await this.userService.findById(doc.user_creator);
      
      // 👈 Récupérer le client assigné - Version simplifiée
      let assignedToEmail: string | undefined = undefined;
      if (doc.assignedTo) {
        const assignedUser = await this.userService.findById(doc.assignedTo);
        assignedToEmail = assignedUser?.email;
      }
      
      await this.activityLogService.create({
        description: `Création du document ${JSON.stringify(newDoc)}`,
        dateAction: new Date(),
        typeAction: 'CREATE_DOC',
        user: actionCreator,
        isRollbackable: true
      });
      
      const savedDoc = await queryRunner.manager.save(newDoc);
      await queryRunner.commitTransaction();
      
      // ✅ Envoyer la notification au CLIENT ASSIGNÉ et au propriétaire
      this.notificationsService.notifyDocCreated(
        savedDoc.id,
        savedDoc.name ?? 'Sans titre',
        actionCreator.email,
        ownerUser?.email,
        assignedToEmail, // 👈 Email du client assigné
      );
      
      return savedDoc;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, doc: UpdateDocDTO, email: string, changeReason?: 'bug' | 'new_endpoint' | 'major_change'): Promise<Docs | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldData = { ...existing, apis: [...(existing.apis || [])] };
      
      let newVersion = existing.version;
      if (changeReason) {
        newVersion = this.determineNewVersion(existing.version || '1.0.0', changeReason);
      }

      const updated = this.docsRepository.merge(existing, {
        name: doc.name,
        description: doc.description,
        submissionDate: doc.submissionDate,
        status: doc.status,
        baseUrl: doc.baseUrl,
        commonHeader: doc.commonHeader,
        bearerToken: doc.bearerToken,
        user_creator: doc.user_creator ? { id: doc.user_creator } : existing.user_creator,
        version: newVersion,
        assignedTo: existing.assignedTo,
      });

      const actionCreator = await this.userService.findUserByMail(email);
      if (!actionCreator) {
        throw new UnauthorizedException('Action creator not found');
      }

      const changeReasonText = changeReason 
        ? `Raison du changement: ${changeReason} (Version: ${existing.version} → ${newVersion})`
        : '';

      await this.activityLogService.create({
        description: `Mise à jour du document. ${changeReasonText}
          Anciennes données : ${JSON.stringify(oldData)}
          Nouvelles données : ${JSON.stringify(updated)}`,
        dateAction: new Date(),
        typeAction: 'UPDATE_DOC',
        user: actionCreator,
        isRollbackable: true
      });

      await queryRunner.manager.save(updated);
      await queryRunner.commitTransaction();
      
      if (updated) {
        const ownerEmail = existing.user_creator?.email;
        const assignedToEmail = existing.assignedTo?.email; // 👈 Récupérer l'email du client assigné
        
        this.notificationsService.notifyDocUpdated(
          id,
          updated.name ?? 'Sans titre',
          actionCreator.email,
          ownerEmail,
          assignedToEmail,
        );
      }
      
      return this.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string, email: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const doc = await queryRunner.manager.findOne(Docs, {
        where: { id },
        relations: ['apis', 'user_creator', 'assignedTo'], // 👈 Ajouter assignedTo
      });

      if (!doc) {
        throw new UnauthorizedException('Document not found');
      }

      const docCreator = doc.user_creator;
      const docCreatorInfo = docCreator 
        ? `Créé par: ${docCreator.name} (Email: ${docCreator.email})` 
        : 'Créateur inconnu';

      const actionCreator = await this.userService.findUserByMail(email);
      if (!actionCreator) {
        throw new UnauthorizedException('Action creator not found');
      }

      if (doc.apis && doc.apis.length > 0) {
        await this.activityLogService.create({
          description: `Suppression des APIs liées au document "${doc.name}" (${docCreatorInfo}). APIs supprimées : ${JSON.stringify(doc.apis)}. Suppression effectuée par: ${actionCreator.name} (${actionCreator.email})`,
          dateAction: new Date(),
          typeAction: 'DELETE_API',
          user: actionCreator,
          isRollbackable: true
        });
      }

      await this.activityLogService.create({
        description: `Suppression du document "${doc.name}" (ID: ${doc.id}). ${docCreatorInfo}. Suppression effectuée par: ${actionCreator.name} (${actionCreator.email}). Données complètes: ${JSON.stringify(doc)}`,
        dateAction: new Date(),
        typeAction: 'DELETE_DOC',
        user: actionCreator,
        isRollbackable: true
      });

      await queryRunner.manager.delete(Api, { doc: { id } });
      await queryRunner.manager.delete(Docs, id);

      await queryRunner.commitTransaction();

      const ownerEmail = doc.user_creator?.email;
      const assignedToEmail = doc.assignedTo?.email; // 👈 Récupérer l'email du client assigné
      
      this.notificationsService.notifyDocDeleted(
        id,
        doc.name,
        actionCreator.email,
        ownerEmail,
        assignedToEmail, // 👈 Notifier le client assigné
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  // Vous pouvez aussi créer une méthode dédiée pour les corrections de bug
  async updateBugFix(id: string, doc: UpdateDocDTO, email: string): Promise<Docs | null> {
    return this.update(id, doc, email, 'bug');
  }

  // Méthode dédiée pour l'ajout de nouveaux endpoints
  async updateWithNewEndpoint(id: string, doc: UpdateDocDTO, email: string): Promise<Docs | null> {
    return this.update(id, doc, email, 'new_endpoint');
  }

  // Méthode dédiée pour les changements majeurs
  async updateMajorChange(id: string, doc: UpdateDocDTO, email: string): Promise<Docs | null> {
    return this.update(id, doc, email, 'major_change');
  }

}