/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Activity_Log } from '../entity/activity_log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivityLogDTO } from '../dto/createActivityLog.dto';
import { User } from 'src/user/entity/user.entity';
import { Api } from 'src/api/entity/api.entity';
import { Docs } from 'src/docs/entity/docs.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(Activity_Log)
    private readonly activityLogRepository: Repository<Activity_Log>,
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    @InjectRepository(Docs)
    private readonly docsRepository: Repository<Docs>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(): Promise<Activity_Log[]> {
    return this.activityLogRepository.find({
      relations: ['user'],
    });
  }

  async create(doc: CreateActivityLogDTO): Promise<Activity_Log> {
    return this.activityLogRepository.save(doc);
  }

  async rollback(logId: string, actionCreator: User): Promise<{ message: string }> {
    const log = await this.activityLogRepository.findOne({ where: { id: logId } });
    if (!log) throw new NotFoundException('Log introuvable');
    if (!log.isRollbackable) throw new BadRequestException('Action non annulable');
    return this.applyRollback(log, actionCreator);
  }

  // ── Extracteurs ────────────────────────────────────────────────────

  private extractOldData(description: string): any {
    // UPDATE format : "Anciennes données : {...} Nouvelles données"
    const matchUpdate = description.match(/Anciennes données\s*:\s*(\{[\s\S]*?\})\s*Nouvelles données/);
    if (matchUpdate) {
      try { return JSON.parse(matchUpdate[1]); } catch { return null; }
    }
    // DELETE format : premier { ... } trouvé dans la description
    const matchDelete = description.match(/(\{[\s\S]*\})/);
    if (matchDelete) {
      try { return JSON.parse(matchDelete[1]); } catch { return null; }
    }
    return null;
  }

  // ── Rollback ───────────────────────────────────────────────────────

  private async applyRollback(log: Activity_Log, actionCreator: User): Promise<{ message: string }> {
    switch (log.typeAction) {

      // ── UPDATE ──────────────────────────────────────────────────────

      case 'UPDATE_USER': {
        const old = this.extractOldData(log.description);
        if (!old?.id) throw new BadRequestException('Données insuffisantes pour le rollback');
        await this.userRepository.update(old.id, {
          name: old.name,
          email: old.email,
          role: old.role,
        });
        await this.create({
          description: `Rollback UPDATE_USER — restauration de "${old.name}"`,
          dateAction: new Date(),
          typeAction: 'ROLLBACK',
          user: actionCreator,
          isRollbackable: false,
        });
        return { message: `Utilisateur "${old.name}" restauré avec succès` };
      }

      case 'UPDATE_DOC': {
        const old = this.extractOldData(log.description);
        if (!old?.id) throw new BadRequestException('Données insuffisantes pour le rollback');
        await this.docsRepository.update(old.id, {
          name: old.name,
          description: old.description,
          status: old.status,
          baseUrl: old.baseUrl,
          commonHeader: old.commonHeader,
          bearerToken: old.bearerToken,
          version: old.version,
          cause: old.cause,
        });
        await this.create({
          description: `Rollback UPDATE_DOC — restauration du document "${old.name}"`,
          dateAction: new Date(),
          typeAction: 'ROLLBACK',
          user: actionCreator,
          isRollbackable: false,
        });
        return { message: `Document "${old.name}" restauré avec succès` };
      }

      case 'UPDATE_API': {
        const old = this.extractOldData(log.description);
        if (!old?.id) throw new BadRequestException('Données insuffisantes pour le rollback');
        await this.apiRepository.update(old.id, {
          apiMethod: old.apiMethod,
          endPoint: old.endPoint,
        });
        await this.create({
          description: `Rollback UPDATE_API — restauration de l'API "${old.endPoint}"`,
          dateAction: new Date(),
          typeAction: 'ROLLBACK',
          user: actionCreator,
          isRollbackable: false,
        });
        return { message: `API "${old.endPoint}" restaurée avec succès` };
      }

      // ── DELETE ──────────────────────────────────────────────────────

      case 'DELETE_DOC': {
        const old = this.extractOldData(log.description);
        if (!old?.id) throw new BadRequestException('Données insuffisantes pour le rollback');

        // Recréer le document avec son ID original
        const doc = this.docsRepository.create({
          id: old.id,
          name: old.name,
          description: old.description,
          submissionDate: old.submissionDate,
          status: old.status,
          baseUrl: old.baseUrl,
          commonHeader: old.commonHeader,
          bearerToken: old.bearerToken,
          version: old.version,
          cause: old.cause,
          user_creator: { id: old.user_creator?.id },
        });
        await this.docsRepository.save(doc);

        // Recréer les APIs liées si elles existaient
        if (old.apis?.length > 0) {
          for (const api of old.apis) {
            await this.apiRepository.save({
              id: api.id,
              apiMethod: api.apiMethod,
              endPoint: api.endPoint,
              doc: { id: old.id },
            });
          }
        }

        await this.create({
          description: `Rollback DELETE_DOC — recréation du document "${old.name}" avec ${old.apis?.length ?? 0} API(s)`,
          dateAction: new Date(),
          typeAction: 'ROLLBACK',
          user: actionCreator,
          isRollbackable: false,
        });
        return { message: `Document "${old.name}" et ses APIs recréés avec succès` };
      }

      case 'DELETE_API': {
        const old = this.extractOldData(log.description);
        if (!old?.id) throw new BadRequestException('Données insuffisantes pour le rollback');

        // Vérifier que le doc parent existe toujours
        const parentDoc = await this.docsRepository.findOne({ where: { id: old.doc?.id } });
        if (!parentDoc) throw new BadRequestException(`Le document parent (id: ${old.doc?.id}) n'existe plus — rollback impossible`);

        await this.apiRepository.save({
          id: old.id,
          apiMethod: old.apiMethod,
          endPoint: old.endPoint,
          doc: { id: old.doc?.id },
        });

        await this.create({
          description: `Rollback DELETE_API — recréation de l'API "${old.endPoint}" pour le document "${old.doc?.name}"`,
          dateAction: new Date(),
          typeAction: 'ROLLBACK',
          user: actionCreator,
          isRollbackable: false,
        });
        return { message: `API "${old.endPoint}" recréée avec succès` };
      }

      case 'DELETE_USER': {
        const old = this.extractOldData(log.description);
        if (!old?.id) throw new BadRequestException('Données insuffisantes pour le rollback');

        await this.userRepository.save({
          id: old.id,
          name: old.name,
          email: old.email,
          password: old.password, // déjà hashé
          role: old.role,
        });

        await this.create({
          description: `Rollback DELETE_USER — recréation de l'utilisateur "${old.name}"`,
          dateAction: new Date(),
          typeAction: 'ROLLBACK',
          user: actionCreator,
          isRollbackable: false,
        });
        return { message: `Utilisateur "${old.name}" recréé avec succès` };
      }

      default:
        throw new BadRequestException(`Le rollback n'est pas supporté pour le type "${log.typeAction}"`);
    }
  }
}