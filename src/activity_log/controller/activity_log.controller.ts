/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/roles/guard/role.guard';
import { Roles } from 'src/roles/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateActivityLogDTO } from '../dto/createActivityLog.dto';
import { ActivityLogService } from '../service/activity_log.service';
import { Activity_Log } from '../entity/activity_log.entity';
import { UserService } from 'src/user/service/user.service';

@Controller('Activity_Log')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth('access-token')
export class ActivityLogController {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly userService: UserService
  ) {}

  @Roles('ADMIN')
  @Get()
  async findAllActivityLog(): Promise<Activity_Log[]> {
    return this.activityLogService.findAll();
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Post()
  async createActivityLog(@Body() doc: CreateActivityLogDTO): Promise<Activity_Log> {
    return this.activityLogService.create(doc);
  }
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles('ADMIN')
  @Post(':id/rollback')
  async rollback(@Req() req: Request, @Param('id') id: string) {
    const email = req['decodedData'].email;
    const actionCreator = await this.userService.findUserByMail(email);
    if (!actionCreator) throw new UnauthorizedException();
    return this.activityLogService.rollback(id, actionCreator);
  }
}