/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogController } from '../controller/activity_log.controller';
import { ActivityLogService } from '../service/activity_log.service';
import { Activity_Log } from '../entity/activity_log.entity';
import { User } from 'src/user/entity/user.entity';
import { Docs } from 'src/docs/entity/docs.entity';
import { Api } from 'src/api/entity/api.entity';
import { AuthModule } from 'src/auth/module/auth.module';
import { UserModule } from 'src/user/module/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity_Log, User, Docs, Api]),
    AuthModule,
    UserModule
  ],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
