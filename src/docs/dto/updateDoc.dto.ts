/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/swagger';
import { CreateDocDTO } from './createDoc.dto';

export class UpdateDocDTO extends PartialType(CreateDocDTO) {}