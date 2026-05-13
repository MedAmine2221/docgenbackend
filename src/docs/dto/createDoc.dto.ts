/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
export class CreateDocDTO {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  submissionDate: Date;

  @ApiProperty()
  status: string;
  
  @ApiProperty()
  version: string;

  @ApiProperty()
  baseUrl: string;

  @ApiProperty()
  commonHeader: string;

  @ApiProperty()
  bearerToken: string;

  @ApiProperty()
  user_creator: string;
}