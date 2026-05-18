/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from '../dto/forgetPass.dto';
import { EmailService } from 'src/email/service/email.service';
import { buildForgotPasswordEmail } from 'src/utils/functions';
import { CreateUserDTO } from '../dto/createUser.dto';
import { ActivityLogService } from 'src/activity_log/service/activity_log.service';
import { Docs } from 'src/docs/entity/docs.entity';
import { Api } from 'src/api/entity/api.entity';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Docs)
    private readonly docRepository: Repository<Docs>,
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    private readonly activityLogService: ActivityLogService,
  ) {}
  async onModuleInit() {}

  findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['role', 'docs'] });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findUserByMail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async create(user: CreateUserDTO, actionCreatorEmail: string): Promise<User | {message: string}> {
    const { password, ...userData } = user;
    // Dans user.service.ts - méthode create
    const existingUser = await this.userRepository.findOne({
      where: { email: user.email }
    });

    if (existingUser) {
      return {message : `Un utilisateur avec l'email ${user.email} existe déjà`};
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const saved = await this.userRepository.save({ ...userData, password: hashedPassword });
    const actionCreator = await this.findUserByMail(actionCreatorEmail);
    if (!actionCreator) {
      throw new UnauthorizedException('Action creator not found');
    }
    await this.activityLogService.create({
      description: `Création du compte pour ${JSON.stringify(saved)}`,
      dateAction: new Date(),
      typeAction: 'CREATE_USER',
      user: actionCreator,
      isRollbackable: true  
    });

    return saved;
  }

  async update(id: string, user: User, email: string): Promise<User | null> {
    const old = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'docs'],
    })
    await this.userRepository.update(id, user);
    const updated = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'docs'],
    });
    const actionCreator = await this.findUserByMail(email);
    if (!actionCreator) {
      throw new UnauthorizedException('Action creator not found');
    }
    if (updated) {
      await this.activityLogService.create({
        description: `Mise à jour du profil.
        Anciennes données : ${JSON.stringify(old)}
        Nouvelles données : ${JSON.stringify(updated)}`,
        dateAction: new Date(),
        typeAction: 'UPDATE_USER',
        user: actionCreator,
        isRollbackable: true      
      });
    }

    return updated;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('User Not Found');

    const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid current password');

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    const saved = await this.userRepository.save(user);

    await this.activityLogService.create({
      description: `Changement de mot de passe pour ${user.name}`,
      dateAction: new Date(),
      typeAction: 'CHANGE_PASSWORD',
      user: saved,
      isRollbackable: true
    });

    return saved;
  }

  async delete(id: number, email: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id: id as any },
      relations: ['role', 'docs', 'docs.apis']  // ✅ charger toute la cascade
    });

    if (user) {
      const actionCreator = await this.findUserByMail(email);
      if (!actionCreator) {
        throw new UnauthorizedException('Action creator not found');
      }
      await this.activityLogService.create({
        description: `Suppression du compte de ${JSON.stringify(user)}`,
        dateAction: new Date(),
        typeAction: 'DELETE_USER',
        user: actionCreator,
        isRollbackable: true
      });

      // ✅ Supprimer dans l'ordre : apis → docs → user
      for (const doc of user.docs ?? []) {
        if (doc.apis?.length) {
          await this.apiRepository.delete(doc.apis.map(a => a.id));
        }
      }
      if (user.docs?.length) {
        await this.docRepository.delete(user.docs.map(d => d.id));
      }
    }

    await this.userRepository.delete(id);
  }

  async forgotPassword(email: string, emailService: EmailService): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Aucun compte associé à cet email');

    const newPassword = Math.random().toString(36).slice(-8) + 'A1!';
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    await emailService.sendEmail({
      to: email,
      object: 'Réinitialisation de votre mot de passe DocGen',
      html: buildForgotPasswordEmail(user.name, newPassword),
    });

    await this.activityLogService.create({
      description: `Réinitialisation du mot de passe pour ${user.name}`,
      dateAction: new Date(),
      typeAction: 'FORGOT_PASSWORD',
      user,
      isRollbackable: true
    });

    return { message: 'Un nouveau mot de passe a été envoyé à votre adresse email' };
  }

  async getMe(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'docs', 'docs.apis'],
    });
  }
}