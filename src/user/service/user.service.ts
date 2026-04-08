import { Injectable, OnModuleInit } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from 'src/roles/entity/roles.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async onModuleInit() {
    const adminRole = await this.userRepository.manager
      .getRepository(Roles)
      .findOne({ where: { name_fr: 'ADMIN' } });
    if (!adminRole) throw new Error('Admin role not found');

    const users = [
      {
        name: 'BOUKADIDA Zeineb',
        email: 'zeinebmeriem.boukadida@polytechnicien.tn',
        password: bcrypt.hash('Admin@123', 10),
        role: adminRole,
      },
      {
        name: 'LAZREG Mohamed Amine',
        email: 'lazregamine258@gmail.com',
        password: bcrypt.hash('Admin@123', 10),
        role: adminRole,
      },
    ];

    for (const user of users) {
      const exists = await this.userRepository.findOne({
        where: { email: user.email },
      });
      if (!exists) {
        const newUser = this.userRepository.create({ ...user });
        await this.userRepository.save(newUser);
      }
    }
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['role'],
    });
  }
  findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findUserByMail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    return user;
  }

  async create(user: User): Promise<User> {
    const { password, ...userData } = user;

    const hashedPassword = await bcrypt.hash(password, 10);
    const data = {
      ...userData,
      password: hashedPassword,
    };
    return this.userRepository.save(data);
  }

  async update(id: string, user: User): Promise<User | null> {
    await this.userRepository.update(id, user);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
