/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/roles/guard/role.guard';
import { Roles } from 'src/roles/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateActivityLogDTO } from '../dto/createActivityLog.dto';
import { ActivityLogService } from '../service/activity_log.service';
import { Activity_Log } from '../entity/activity_log.entity';

@Controller('Activity_Log')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth('access-token')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Roles('ADMIN')
  @Get()
  async findAllActivityLog(): Promise<Activity_Log[]> {
    return this.activityLogService.findAll();
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Post()
  async createActivityLog(@Body() doc: CreateActivityLogDTO): Promise<Activity_Log> {
    return this.activityLogService.create(doc);
  }
}