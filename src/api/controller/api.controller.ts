/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/roles/guard/role.guard';
import { Roles } from 'src/roles/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateApiDTO } from '../dto/createApi.dto';
import { ApiService } from '../service/api.service';
import { Api } from '../entity/api.entity';
import { UpdateApiDTO } from '../dto/updateApi.dto';

@Controller('apis')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth('access-token')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Roles('ADMIN')
  @Get()
  async findAllApis(): Promise<Api[]> {
    return this.apiService.findAll();
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Get('doc/:docId')
  async getApisByDoc(@Param('docId') docId: string): Promise<Api[]> {
    return this.apiService.findByDoc(docId);
  }

  @Roles('ADMIN')
  @Get(':id')
  async findApiById(@Param('id') id: string): Promise<Api | null> {
    return this.apiService.findById(id);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Post('doc/:docId')
  async createApi(
    @Req() req: Request,
    @Param('docId') docId: string,
    @Body() api: CreateApiDTO,
  ): Promise<Api> {
    const email = req['decodedData'].email; 
    return this.apiService.create(api, docId, email);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Put(':id')
  async updateApi(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() api: UpdateApiDTO,
  ): Promise<Api | null> {
    const email = req['decodedData'].email; 
    return this.apiService.update(id, api, email);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Delete(':id')
  async deleteApi(@Req() req: Request, @Param('id') id: string): Promise<any> {
    const email = req['decodedData'].email;
    return this.apiService.delete(id, email);
  }
}