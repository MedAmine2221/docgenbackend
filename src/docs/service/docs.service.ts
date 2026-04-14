/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Docs } from '../entity/docs.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocDTO } from '../dto/createDoc.dto';

@Injectable()
export class DocsService {
  constructor(
    @InjectRepository(Docs)
    private readonly docsRepository: Repository<Docs>,
  ) {}

  findAll(): Promise<Docs[]> {
    return this.docsRepository.find({
      relations: ['created_by'],
    });
  }

  findById(id: string): Promise<Docs | null> {
    return this.docsRepository.findOne({
      where: { id },
      relations: ['created_by'],
    });
  }

  findByCreatedBy(userId: string): Promise<Docs[]> {
    return this.docsRepository.find({
      where: {
        created_by: { id: userId },
      },
      relations: ['created_by'],
    });
  }

  async create(doc: CreateDocDTO): Promise<Docs> {
    const newDoc = this.docsRepository.create({
      name: doc.name,
      description: doc.description,
      submissionDate: doc.submissionDate,
      status: doc.status,
      baseUrl: doc.baseUrl,
      apiMethod: doc.apiMethod,
      commonHeader: doc.commonHeader,
      bearerToken: doc.bearerToken,
      created_by: { id: doc.created_by },
    } as unknown as Partial<Docs>);

    return this.docsRepository.save(newDoc);
  }

  async update(id: string, doc: Partial<Docs>): Promise<Docs | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = this.docsRepository.merge(existing, doc);
    return this.docsRepository.save(updated);
  }

  async delete(id: string): Promise<void> {
    await this.docsRepository.delete(id);
  }
}
