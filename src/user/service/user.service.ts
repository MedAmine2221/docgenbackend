/* eslint-disable @typescript-eslint/no-floating-promises */
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
import { NotificationsService } from 'src/notifications/notifications.service'; // ✅ Ajouter

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
    private readonly notificationsService: NotificationsService, // ✅ Injecter
  ) {}
  async onModuleInit() {}

  async findAll(): Promise<User[]> {
    const res =  await this.userRepository.find({
      relations: {
        role: true,
        docs: true,           
        assignedDocs: true,
        activityLog: true,
      },
    });
    return res;
    
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

    // ✅ Notifier les admins qu'un nouvel utilisateur a été créé
    this.notificationsService.notifyUserCreated(
      saved.id,
      saved.email,
      actionCreator.email // Qui a créé l'utilisateur
    );

    return saved;
  }

  // async update(id: string, user: User, email: string): Promise<User | null> {
  //   const old = await this.userRepository.findOne({
  //     where: { id },
  //     relations: ['role', 'docs'],
  //   });
    
  //   if (!old) return null;
    
  //   await this.userRepository.update(id, user);
  //   const updated = await this.userRepository.findOne({
  //     where: { id },
  //     relations: ['role', 'docs'],
  //   });
    
  //   const actionCreator = await this.findUserByMail(email);
  //   if (!actionCreator) {
  //     throw new UnauthorizedException('Action creator not found');
  //   }
    
  //   if (updated) {
  //     await this.activityLogService.create({
  //       description: `Mise à jour du profil.
  //       Anciennes données : ${JSON.stringify(old)}
  //       Nouvelles données : ${JSON.stringify(updated)}`,
  //       dateAction: new Date(),
  //       typeAction: 'UPDATE_USER',
  //       user: actionCreator,
  //       isRollbackable: true      
  //     });

  //     // ✅ Notifier l'UTILISATEUR MODIFIÉ que son profil a été mis à jour
  //     const isAdmin = actionCreator.role?.name_eng?.toLowerCase().includes('admin');
      
  //     if (isAdmin && updated.email !== actionCreator.email) {
  //       // Un admin modifie un autre utilisateur → notifier l'utilisateur modifié
  //       this.notificationsService.notifyUserUpdated(
  //         updated.id,
  //         updated.email,
  //         actionCreator.email, // Qui a fait la modification
  //         updated.email        // L'utilisateur modifié (optionnel, pour ciblage)
  //       );
  //     } else if (updated.email === actionCreator.email) {
  //       // L'utilisateur modifie son propre profil → notifier les admins
  //       this.notificationsService.notifyUserUpdated(
  //         updated.id,
  //         updated.email,
  //         actionCreator.email,
  //         undefined
  //       );
  //     } else {
  //       // Autre cas → notifier les admins
  //       this.notificationsService.notifyUserUpdated(
  //         updated.id,
  //         updated.email,
  //         actionCreator.email
  //       );
  //     }
  //   }

  //   return updated;
  // }
// user.service.ts - update method
async update(id: string, user: User, email: string): Promise<User | null> {
  const old = await this.userRepository.findOne({
    where: { id },
    relations: ['role', 'docs'],
  });
  
  if (!old) return null;
  
  // ✅ Sauvegarder l'email ORIGINAL avant modification
  const originalEmail = old.email;
  
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

    const isAdmin = actionCreator.role?.name_eng?.toLowerCase().includes('admin');
    
    if (isAdmin && originalEmail !== actionCreator.email) {
      // ✅ Utiliser l'email ORIGINAL pour notifier l'utilisateur modifié
      console.log(`📨 Admin ${actionCreator.email} modifie ${originalEmail}`);
      this.notificationsService.notifyUserUpdated(
        updated.id,
        updated.email,  // Nouvel email (peut avoir changé)
        actionCreator.email,
        originalEmail   // ✅ Email original pour la notification
      );
    } else if (originalEmail === actionCreator.email) {
      console.log(`📨 ${actionCreator.email} modifie son propre profil`);
      this.notificationsService.notifyUserUpdated(
        updated.id,
        updated.email,
        actionCreator.email,
        undefined
      );
    } else {
      this.notificationsService.notifyUserUpdated(
        updated.id,
        updated.email,
        actionCreator.email
      );
    }
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

    // ✅ Notifier l'utilisateur que son mot de passe a été changé
    this.notificationsService.notifyUserUpdated(
      saved.id,
      saved.email,
      saved.email, // C'est l'utilisateur lui-même qui change son mot de passe
      saved.email
    );

    return saved;
  }

// user.service.ts - delete method corrigée
async delete(id: number, email: string): Promise<void> {
  const user = await this.userRepository.findOne({ 
    where: { id: id as any },
    relations: ['role', 'docs', 'docs.apis']
  });

  if (!user) {
    throw new UnauthorizedException('Utilisateur non trouvé');
  }

  const actionCreator = await this.findUserByMail(email);
  if (!actionCreator) {
    throw new UnauthorizedException('Action creator not found');
  }
  
  // ✅ Sauvegarder les infos avant suppression
  const userEmail = user.email;
  const userId = user.id;
  const isAdmin = actionCreator.role?.name_eng?.toLowerCase().includes('admin');
  
  // ✅ 1. D'abord envoyer la notification (avant toute suppression)
  if (isAdmin && userEmail !== actionCreator.email) {
    // Admin supprime un autre utilisateur → notifier l'utilisateur supprimé
    console.log(`📨 Admin ${actionCreator.email} supprime ${userEmail}`);
    await this.notificationsService.notifyUserDeleted(
      userId,
      userEmail,
      actionCreator.email,
      userEmail
    );
  } else if (userEmail === actionCreator.email) {
    // L'utilisateur supprime son propre compte → notifier les admins
    console.log(`📨 ${actionCreator.email} supprime son propre compte`);
    await this.notificationsService.notifyUserDeleted(
      userId,
      userEmail,
      actionCreator.email
    );
  }

  // ✅ 2. Attendre que la notification soit envoyée (important pour WebSocket)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // ✅ 3. Logger l'activité
  await this.activityLogService.create({
    description: `Suppression du compte de ${JSON.stringify(user)}`,
    dateAction: new Date(),
    typeAction: 'DELETE_USER',
    user: actionCreator,
    isRollbackable: true
  });

  // ✅ 4. Ensuite supprimer les données
  // Supprimer dans l'ordre : apis → docs → user
  for (const doc of user.docs ?? []) {
    if (doc.apis?.length) {
      await this.apiRepository.delete(doc.apis.map(a => a.id));
    }
  }
  if (user.docs?.length) {
    await this.docRepository.delete(user.docs.map(d => d.id));
  }
  
  // ✅ 5. Finalement supprimer l'utilisateur
  await this.userRepository.delete(id);
  
  console.log(`✅ Utilisateur ${userEmail} supprimé avec succès`);
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

    // ✅ Notifier l'utilisateur que son mot de passe a été réinitialisé
    this.notificationsService.notifyUserUpdated(
      user.id,
      user.email,
      user.email,
      user.email
    );

    return { message: 'Un nouveau mot de passe a été envoyé à votre adresse email' };
  }

  async getMe(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'docs', 'docs.apis'],
    });
  }
}