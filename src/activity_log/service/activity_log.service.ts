/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Activity_Log } from '../entity/activity_log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivityLogDTO } from '../dto/createActivityLog.dto';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(Activity_Log)
    private readonly activityLogRepository: Repository<Activity_Log>,
  ) {}

  findAll(): Promise<Activity_Log[]> {
    return this.activityLogRepository.find({
      relations: ['user'],
    });
  }

  async create(doc: CreateActivityLogDTO): Promise<Activity_Log> {
    return this.activityLogRepository.save(doc);
  }
}