import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/entity/user.entity";
import { UserService } from "src/user/service/user.service";
import { UserController } from "../controller/user.controller";
import { AuthService } from "src/auth/service/auth.service";
import { JwtService } from "@nestjs/jwt";
import { EmailService } from "src/email/service/email.service";
import { Activity_Log } from "src/activity_log/entity/activity_log.entity";
import { ActivityLogService } from "src/activity_log/service/activity_log.service";
import { Api } from "src/api/entity/api.entity";
import { Docs } from "src/docs/entity/docs.entity";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Api, Docs, Activity_Log, User]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    AuthService,
    JwtService,
    EmailService,
    ActivityLogService,
  ],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
