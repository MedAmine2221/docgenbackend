/* eslint-disable prettier/prettier */
import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from 'src/roles/entity/roles.entity';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from '../dto/forgetPass.dto';
import { EmailService } from 'src/email/service/email.service';
import { buildForgotPasswordEmail } from 'src/utils/functions';
import { CreateUserDTO } from '../dto/createUser.dto';

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
        password: await bcrypt.hash('Admin@123', 10),
        role: adminRole,
      },
      {
        name: 'LAZREG Mohamed Amine',
        email: 'lazregamine258@gmail.com',
        password: await bcrypt.hash('Admin@123', 10),
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

  async create(user: CreateUserDTO): Promise<User> {
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
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User Not Found');
    }

    const isMatch = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid current password');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);

    return await this.userRepository.save(user);
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
  async forgotPassword(
    email: string,
    emailService: EmailService,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Aucun compte associé à cet email');
    }

    // Générer un mot de passe aléatoire
    const newPassword = Math.random().toString(36).slice(-8) + 'A1!';
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // Envoyer l'email
    await emailService.sendEmail({
      to: email,
      object: 'Réinitialisation de votre mot de passe DocGen',
      html: buildForgotPasswordEmail(user.name, newPassword),
    });

    return {
      message: 'Un nouveau mot de passe a été envoyé à votre adresse email',
    };
  }
  async getMe(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'docs'],
    });
  }
}
