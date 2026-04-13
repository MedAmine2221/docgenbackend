import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiMethod } from 'src/enums/index.enums';
import { Type } from 'class-transformer';

export class CreateDocDTO {
  @ApiProperty({ example: 'doc_123456', required: false })
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Create User' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'create user account' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: '2025-04-13T10:30:00Z' })
  @Type(() => Date)
  @IsDate()
  submissionDate: Date;

  @ApiProperty({ example: 'pending' })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({ example: 'https://localhost:3001' })
  @IsNotEmpty()
  @IsString()
  baseUrl: string;

  @ApiProperty({ example: ApiMethod.POST, enum: ApiMethod })
  @IsEnum(ApiMethod)
  apiMethod: ApiMethod;

  @ApiProperty({ example: { 'Content-Type': 'application/json' } })
  @IsNotEmpty()
  @IsObject()
  commonHeader: Record<string, string>;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @IsOptional()
  bearerToken?: string;

  @ApiProperty({ example: 42 })
  @IsNotEmpty()
  @IsNumber()
  created_by: number;
}
