/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { User } from 'src/user/entity/user.entity';
import { Entity, Column } from 'typeorm';

@Entity()
export class UpdateDocDTO {
  @ApiProperty({ description: 'Document ID', example: 1 })
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Document name', example: 'API Documentation' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Document description', example: 'This is my API doc' })
  @Column()
  description: string;

  @ApiProperty({ description: 'Submission date', example: '2024-01-01' })
  @Column()
  submissionDate: Date;

  @ApiProperty({ description: 'Document status', example: 'active' })
  @Column()
  status: string;

  @ApiProperty({ description: 'Base URL', example: 'https://api.example.com' })
  @Column()
  baseUrl: string;

  @ApiProperty({ description: 'HTTP method', example: 'GET' })
  @Column()
  apiMethod: string;

  @ApiProperty({ description: 'Common headers', example: { 'Content-Type': 'application/json' } })
  @Column({ type: 'json', nullable: true })
  commonHeader: object;

  @ApiProperty({ description: 'Bearer token', example: 'eyJhbGciOiJIUzI1NiIs...' })
  @Column({ nullable: true })
  bearerToken: string;

  @ApiProperty({ example: 1 })
  created_by: User;
}