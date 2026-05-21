/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
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
  @IsOptional()
  version?: string;

  @ApiProperty()
  baseUrl: string;

  @ApiProperty()
  commonHeader: string;

  @ApiProperty()
  bearerToken: string;

  @ApiProperty()
  user_creator: string;
  
  @ApiProperty()
  assignedTo: string;
}