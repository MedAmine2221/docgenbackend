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

@Module({
  imports: [TypeOrmModule.forFeature([Docs, Api]), UserModule, AuthModule, ApiModule],
  controllers: [DocsController],
  providers: [UserService, DocsService],
  exports: [DocsService],
})
export class DocsModule {}
