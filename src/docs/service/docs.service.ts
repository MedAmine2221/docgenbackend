/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Docs } from '../entity/docs.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateDocDTO } from '../dto/createDoc.dto';
import { UpdateDocDTO } from '../dto/updateDoc.dto';
import { Api } from 'src/api/entity/api.entity';

@Injectable()
export class DocsService {
  constructor(
    @InjectRepository(Docs)
    private readonly docsRepository: Repository<Docs>,
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    private readonly dataSource: DataSource,
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

  async create(doc: CreateDocDTO): Promise<Docs> {
    console.log("dooc ", doc);
    
    // Vérifier qu'il y a au moins une API
    // if (!doc.apis || doc.apis.length === 0) {
    //   throw new BadRequestException('Un document doit contenir au moins une API');
    // }

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
        user_creator: { id: doc.user_creator },
        // apis: doc.apis
      });

      const savedDoc = await queryRunner.manager.save(newDoc);

      await queryRunner.commitTransaction();
      return savedDoc;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, doc: UpdateDocDTO): Promise<Docs | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Mettre à jour les champs du document
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

      await queryRunner.manager.save(updated);
      await queryRunner.commitTransaction();
      return this.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Supprimer d'abord les APIs liées
      await queryRunner.manager.delete(Api, { doc: { id } });
      // Puis supprimer le document
      await queryRunner.manager.delete(Docs, id);
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}