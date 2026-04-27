/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiDTO {
  @ApiProperty()
  apiMethod: string;

  @ApiProperty()
  endPoint: string;
}