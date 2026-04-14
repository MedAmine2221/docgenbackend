/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { EmailController } from '../controller/email.controller';
import { EmailService } from '../service/email.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
