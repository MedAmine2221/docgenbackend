/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/user/entity/user.entity';
import { UserService } from '../service/user.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/roles/guard/role.guard';
import { Roles } from 'src/roles/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ChangePasswordDto } from '../dto/forgetPass.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { EmailService } from 'src/email/service/email.service';
import { CreateUserDTO } from '../dto/createUser.dto';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles('ADMIN')
  @Get()
  async findAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('me')
  async getMe(@Req() req: Request): Promise<User | null> {    
    const email = req['decodedData'].email;
    const result = await this.userService.getMe(email);
    console.log("result ===> ",result);
    
    return result;
  }
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles('ADMIN')
  @Get(':id')
  async findUserById(@Param('id') id: string): Promise<User | null> {
    return this.userService.findById(id);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles('ADMIN')
  @Get('email/:email')
  async findUserByEmail(@Param('email') email: string): Promise<User | null> {
    return this.userService.findUserByMail(email);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles('ADMIN')
  @Post()
  async createUser(@Body() user: CreateUserDTO): Promise<User> {
    return this.userService.create(user);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles('ADMIN')
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() user: User,
  ): Promise<User | null> {
    return this.userService.update(id, user);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles('ADMIN')
  @Put('/change-password/:id')
  async changePassword(
    @Param('id') id: string,
    @Body() data: ChangePasswordDto,
  ): Promise<User | null> {
    return this.userService.changePassword(id, data);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ResetPasswordDto) {
    return this.userService.forgotPassword(dto.email, this.emailService);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles('ADMIN')
  @Delete(':id')
  async deleteUser(@Param('id') id: number): Promise<void> {
    return this.userService.delete(id);
  }
}
