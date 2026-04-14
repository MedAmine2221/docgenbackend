/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class sendEmailDto {
  @IsNotEmpty()
  @IsEmail()
  to: string;

  @IsNotEmpty()
  @IsString()
  object: string;

  @IsNotEmpty()
  @IsString()
  html: string;
}
