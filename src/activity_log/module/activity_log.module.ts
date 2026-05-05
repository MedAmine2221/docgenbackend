/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/module/user.module';
import { ActivityLogController } from '../controller/activity_log.controller';
import { ActivityLogService } from '../service/activity_log.service';
import { Activity_Log } from '../entity/activity_log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity_Log]), UserModule],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
