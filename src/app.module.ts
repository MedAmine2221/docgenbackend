import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user/controller/user.controller';
import { User } from './user/entity/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/module/auth.module';
import { AuthController } from './auth/controller/auth.controller';
import { AuthService } from './auth/service/auth.service';
import config from './config/config';
import dbConfig from './config/db.config';
import { UserService } from './user/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from './user/module/user.module';
import { RolesModule } from './roles/module/roles.module';
import { EmailModule } from './email/module/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => dbConfig(configService),
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    UserModule,
    RolesModule,
    EmailModule,
  ],
  controllers: [UserController, AuthController],
  providers: [AuthService, UserService, JwtService],
})
export class AppModule {}
