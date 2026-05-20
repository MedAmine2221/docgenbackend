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

  findAll(): Promise<Docs[]> {
    return this.docsRepository.find({
      relations: ['user_creator', 'apis'],
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
  async create(doc: CreateDocDTO, email: string): Promise<Docs> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Créer le document
      const newDoc = this.docsRepository.create({
        name: doc.name,
        description: doc.description,
        submissionDate: doc.submissionDate,
        status: doc.status,
        baseUrl: doc.baseUrl,
        commonHeader: doc.commonHeader,
        bearerToken: doc.bearerToken,
        user_creator: { id: doc.user_creator }, // 👈 C'est le développeur propriétaire
        version: doc.version
      });
      
      const actionCreator = await this.userService.findUserByMail(email);
      if (!actionCreator) {
        throw new UnauthorizedException('Action creator not found');
      }
      
      // 🔴 RÉCUPÉRER LE DÉVELOPPEUR PROPRIÉTAIRE
      const ownerUser = await this.userService.findById(doc.user_creator);
      
      await this.activityLogService.create({
        description: `Création du document ${JSON.stringify(newDoc)}`,
        dateAction: new Date(),
        typeAction: 'CREATE_DOC',
        user: actionCreator,
        isRollbackable: true
      });
      
      const savedDoc = await queryRunner.manager.save(newDoc);
      await queryRunner.commitTransaction();
      
      // ✅ Envoyer la notification au PROPRIÉTAIRE (ownerUser.email)
      // et pas à actionCreator.email
      this.notificationsService.notifyDocCreated(
        savedDoc.id,
        savedDoc.name ?? 'Sans titre',
        actionCreator.email,     // Qui a fait l'action (l'admin)
        ownerUser?.email,        // Pour qui le doc est créé (le développeur)
      );
      
      return savedDoc;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async update(id: string, doc: UpdateDocDTO, email: string): Promise<Docs | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldData = { ...existing, apis: [...(existing.apis || [])] };

      const updated = this.docsRepository.merge(existing, {
        name: doc.name,
        description: doc.description,
        submissionDate: doc.submissionDate,
        status: doc.status,
        baseUrl: doc.baseUrl,
        commonHeader: doc.commonHeader,
        bearerToken: doc.bearerToken,
        user_creator: doc.user_creator ? { id: doc.user_creator } : existing.user_creator,
      });

      const actionCreator = await this.userService.findUserByMail(email);
      if (!actionCreator) {
        throw new UnauthorizedException('Action creator not found');
      }

      await this.activityLogService.create({
        description: `Mise à jour du document.
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
        // ✅ Notifier le PROPRIÉTAIRE du document
        const ownerEmail = existing.user_creator?.email;
        this.notificationsService.notifyDocUpdated(
          id,
          updated.name ?? 'Sans titre',
          actionCreator.email,  // Qui a fait l'action
          ownerEmail,           // Propriétaire du doc
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
        relations: ['apis', 'user_creator'],
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

      // ✅ Notifier le PROPRIÉTAIRE du document
      const ownerEmail = doc.user_creator?.email;
      this.notificationsService.notifyDocDeleted(
        id,
        doc.name,
        actionCreator.email,  // Qui a fait l'action
        ownerEmail,           // Propriétaire du doc
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}