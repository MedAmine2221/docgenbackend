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

@Module({
  imports: [TypeOrmModule.forFeature([Api, Docs]), UserModule, AuthModule],
  controllers: [ApiController],
  providers: [DocsService, ApiService],
  exports: [ApiService],
})
export class ApiModule {}
