import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Roles } from 'src/roles/entity/roles.entity';

export class CreateUserDTO {
  @IsOptional()
  id: string;

  @ApiProperty({ example: 'john doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john_doe@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '********' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: {
      id: '1',
    },
  })
  @IsNotEmpty()
  role: Roles;
}
