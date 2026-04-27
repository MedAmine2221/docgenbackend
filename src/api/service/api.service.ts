/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Api } from '../entity/api.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateApiDTO } from '../dto/createApi.dto';
import { UpdateApiDTO } from '../dto/updateApi.dto';
import { Docs } from 'src/docs/entity/docs.entity';

@Injectable()
export class ApiService {
  constructor(
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    @InjectRepository(Docs)
    private readonly docsRepository: Repository<Docs>,
  ) {}

  findAll(): Promise<Api[]> {
    return this.apiRepository.find({
      relations: ['doc', 'doc.created_by'],
    });
  }

  findById(id: string): Promise<Api | null> {
    return this.apiRepository.findOne({
      where: { id },
      relations: ['doc', 'doc.created_by'],
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

  async create(apiDto: CreateApiDTO, docId: string): Promise<Api> {
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

    return this.apiRepository.save(newApi);
  }

  async update(id: string, apiDto: UpdateApiDTO): Promise<Api | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = this.apiRepository.merge(existing, {
      apiMethod: apiDto.apiMethod,
      endPoint: apiDto.endPoint,
    });

    return this.apiRepository.save(updated);
  }

  async delete(id: string): Promise<void> {
    await this.apiRepository.delete(id);
  }
}