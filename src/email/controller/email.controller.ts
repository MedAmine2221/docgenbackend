import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from '../service/email.service';
import { sendEmailDto } from '../dto/email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Body() dto: sendEmailDto) {
    return this.emailService.sendEmail(dto);
  }
}
