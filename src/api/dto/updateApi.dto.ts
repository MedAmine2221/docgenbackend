/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/swagger';
import { CreateApiDTO } from './createApi.dto';

export class UpdateApiDTO extends PartialType(CreateApiDTO) {}