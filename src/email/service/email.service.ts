/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { sendEmailDto } from '../dto/email.dto';
@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}
  emailTransport() {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return transporter;
  }
  async sendEmail(dto: sendEmailDto) {
    const transporter = this.emailTransport();

    const mailOptions = {
      from: `"DocGen" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: dto.to,
      subject: dto.object,
      html: dto.html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return {
        message: 'Email envoyé avec succès',
        info,
      };
    } catch (error) {
      throw new Error('Erreur lors de l’envoi de l’email: ' + error?.message);
    }
  }
}
