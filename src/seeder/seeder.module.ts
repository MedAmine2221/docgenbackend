import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeederService } from "./seeder.service";
import { Roles } from "src/roles/entity/roles.entity";
import { User } from "src/user/entity/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Roles, User])],
  providers: [SeederService],
})
export class SeederModule {}
