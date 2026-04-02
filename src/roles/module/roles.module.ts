import { Module } from '@nestjs/common';
import { Roles } from '../entity/roles.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from '../service/roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Roles])],
  providers: [RolesService],
})
export class RolesModule {}
