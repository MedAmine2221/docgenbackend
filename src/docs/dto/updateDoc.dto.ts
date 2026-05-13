/* eslint-disable prettier/prettier */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDocDTO } from './createDoc.dto';
import { IsOptional } from 'class-validator';

export class UpdateDocDTO extends PartialType(CreateDocDTO) {
    @IsOptional()
    @ApiProperty()
    cause?: string;
}