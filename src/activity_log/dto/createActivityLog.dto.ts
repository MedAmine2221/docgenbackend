/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/entity/user.entity';
export class CreateActivityLogDTO {

  @ApiProperty()
  description: string;

  @ApiProperty()
  dateAction: Date;

  @ApiProperty()
  typeAction: string;

  @ApiProperty()
  user: User;
}