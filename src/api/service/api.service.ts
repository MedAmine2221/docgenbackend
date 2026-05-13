/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Api } from '../entity/api.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateApiDTO } from '../dto/createApi.dto';
import { UpdateApiDTO } from '../dto/updateApi.dto';
import { Docs } from 'src/docs/entity/docs.entity';
import { UserService } from 'src/user/service/user.service';
import { ActivityLogService } from 'src/activity_log/service/activity_log.service';

@Injectable()
export class ApiService {
  constructor(
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    @InjectRepository(Docs)
    private readonly docsRepository: Repository<Docs>,
    private readonly userService: UserService,
    private readonly activityLogService: ActivityLogService
  ) {}

  findAll(): Promise<Api[]> {
    return this.apiRepository.find({
      relations: ['doc', 'doc.user_creator'],
    });
  }

  findById(id: string): Promise<Api | null> {
    return this.apiRepository.findOne({
      where: { id },
      relations: ['doc', 'doc.user_creator'],
    });
  }

  findByDoc(docId: string): Promise<Api[]> {
    return this.apiRepository.find({
      where: {
        doc: { id: docId },
      },
      relations: ['doc'],
    });
  }

  async create(apiDto: CreateApiDTO, docId: string, email: string): Promise<Api> {
    // Vérifier que le document existe
    const doc = await this.docsRepository.findOne({
      where: { id: docId },
    });

    if (!doc) {
      throw new NotFoundException(`Document avec l'ID ${docId} non trouvé`);
    }

    const newApi = this.apiRepository.create({
      apiMethod: apiDto.apiMethod,
      endPoint: apiDto.endPoint,
      doc: doc,
    });
    const actionCreator = await this.userService.findUserByMail(email);
    if (!actionCreator) {
      throw new UnauthorizedException('Action creator not found');
    }
    await this.activityLogService.create({
      description: `Création d'un Api pour le document ${doc.name} : ${JSON.stringify(newApi)}`,
      dateAction: new Date(),
      typeAction: 'CREATE_API',
      user: actionCreator,
      isRollbackable: true
    });
    return this.apiRepository.save(newApi);
  }

  // async update(id: string, apiDto: UpdateApiDTO, email: string): Promise<Api | null> {
  //   const existing = await this.findById(id);
  //   if (!existing) return null;
  //   const updated = this.apiRepository.merge(existing, {
  //     apiMethod: apiDto.apiMethod,
  //     endPoint: apiDto.endPoint,
  //   });
  //   const actionCreator = await this.userService.findUserByMail(email);
    
  //   if (!actionCreator) {
  //     throw new UnauthorizedException('Action creator not found');
  //   }
  //   await this.activityLogService.create({
  //     description: `Mise à jour de l’API liée au document "${existing.doc.name}".
  //     Anciennes données : ${JSON.stringify(existing)}
  //     Nouvelles données : ${JSON.stringify(updated)}`,
  //     dateAction: new Date(),
  //     typeAction: 'UPDATE_API',
  //     user: actionCreator,
  //     isRollbackable: true
  //   });
  //   return this.apiRepository.save(updated);
  // }
async update(id: string, apiDto: UpdateApiDTO, email: string): Promise<Api | null> {
  const existing = await this.findById(id);
  if (!existing) return null;

  // ✅ Cloner avant le merge
  const oldData = { ...existing };

  const updated = this.apiRepository.merge(existing, {
    apiMethod: apiDto.apiMethod,
    endPoint: apiDto.endPoint,
  });

  const actionCreator = await this.userService.findUserByMail(email);
  if (!actionCreator) {
    throw new UnauthorizedException('Action creator not found');
  }

  await this.activityLogService.create({
    description: `Mise à jour de l'API liée au document "${oldData.doc.name}".
      Anciennes données : ${JSON.stringify(oldData)}
      Nouvelles données : ${JSON.stringify(updated)}`,
    dateAction: new Date(),
    typeAction: 'UPDATE_API',
    user: actionCreator,
    isRollbackable: true
  });

  return this.apiRepository.save(updated);
}
  async delete(id: string, email: string): Promise<any> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const actionCreator = await this.userService.findUserByMail(email);
    
    if (!actionCreator) {
      throw new UnauthorizedException('Action creator not found');
    }
    await this.activityLogService.create({
      description: `Supression de l'api ${existing.apiMethod + " - " + existing.endPoint} pour le document ${existing.doc.name}}`,
      dateAction: new Date(),
      typeAction: 'DELETE_API',
      user: actionCreator,
      isRollbackable: true
    });
    return await this.apiRepository.delete(id);
  }
}