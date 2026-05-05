/* eslint-disable prettier/prettier */
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from 'src/roles/entity/roles.entity';
import { User } from 'src/user/entity/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepo: Repository<Roles>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {

    // 1. Seed Roles
    let adminRole = await this.rolesRepo.findOne({
      where: { name_fr: 'ADMIN' },
    });

    if (!adminRole) {
      adminRole = await this.rolesRepo.save({
        name_fr: 'ADMIN',
        name_eng: 'ADMIN',
      });
    }

    let devRole = await this.rolesRepo.findOne({
      where: { name_fr: 'DÉVELOPPEUR' },
    });

    if (!devRole) {
      devRole = await this.rolesRepo.save({
        name_fr: 'DÉVELOPPEUR',
        name_eng: 'DEVELOPER',
      });
    }

    // 2. Seed Users
    const adminZeinebExists = await this.userRepo.findOne({
      where: { email: 'zeinebmeriem.boukadida@polytechnicien.tn' },
    });
    const adminAmineExists = await this.userRepo.findOne({
      where: { email: 'lazregamine258@gmail.com' },
    });

    if (!adminZeinebExists && !adminAmineExists) {
      await this.userRepo.save(
        [{
          name: 'BOUKADIDA Zeineb',
          email: 'zeinebmeriem.boukadida@polytechnicien.tn',
          password: await bcrypt.hash('Admin@123', 10),
          role: adminRole,
        },
        {
          name: 'LAZREG Mohamed Amine',
          email: 'lazregamine258@gmail.com',
          password: await bcrypt.hash('Admin@123', 10),
          role: adminRole,
        },]
      );

    }

  }
}
