import { forwardRef, Module } from "@nestjs/common";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";
import { UserModule } from "src/user/module/user.module";

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
