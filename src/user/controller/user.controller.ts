import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/user/entity/user.entity';
import { UserService } from '../service/user.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/roles/guard/role.guard';
import { Roles } from 'src/roles/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ChangePasswordDto } from '../dto/forgetPass.dto';

@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth('access-token')
@Roles('ADMIN')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  async findAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findUserById(@Param('id') id: string): Promise<User | null> {
    return this.userService.findById(id);
  }

  @Get('email/:email')
  async findUserByEmail(@Param('email') email: string): Promise<User | null> {
    return this.userService.findUserByMail(email);
  }

  @Post()
  async createUser(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() user: User,
  ): Promise<User | null> {
    return this.userService.update(id, user);
  }

  @Put('/change-password/:id')
  async changePassword(
    @Param('id') id: string,
    @Body() data: ChangePasswordDto,
  ): Promise<User | null> {
    return this.userService.changePassword(id, data);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number): Promise<void> {
    return this.userService.delete(id);
  }
}
