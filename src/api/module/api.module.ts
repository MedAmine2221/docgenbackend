/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocsService } from 'src/docs/service/docs.service';
import { ApiService } from '../service/api.service';
import { ApiController } from '../controller/api.controller';
import { Api } from '../entity/api.entity';
import { UserModule } from 'src/user/module/user.module';
import { AuthModule } from 'src/auth/module/auth.module';
import { Docs } from 'src/docs/entity/docs.entity';
import { ActivityLogService } from 'src/activity_log/service/activity_log.service';

@Module({
  imports: [TypeOrmModule.forFeature([Api, Docs]), UserModule, AuthModule],
  controllers: [ApiController],
  providers: [DocsService, ApiService, ActivityLogService],
  exports: [ApiService],
})
export class ApiModule {}
