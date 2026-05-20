/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from 'src/user/service/user.service';
import { DocsService } from '../service/docs.service';
import { DocsController } from '../controller/docs.controller';
import { Docs } from '../entity/docs.entity';
import { UserModule } from 'src/user/module/user.module';
import { AuthModule } from 'src/auth/module/auth.module';
import { ApiModule } from 'src/api/module/api.module';
import { Api } from 'src/api/entity/api.entity';
import { Activity_Log } from 'src/activity_log/entity/activity_log.entity';
import { ActivityLogService } from 'src/activity_log/service/activity_log.service';
import { User } from 'src/user/entity/user.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Api, Docs, Activity_Log, User]), UserModule, AuthModule, ApiModule, NotificationsModule],
  controllers: [DocsController],
  providers: [UserService, DocsService, ActivityLogService],
  exports: [DocsService],
})
export class DocsModule {}
