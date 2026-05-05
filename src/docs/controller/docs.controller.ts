/* eslint-disable prettier/prettier */
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
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/roles/guard/role.guard';
import { Roles } from 'src/roles/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateDocDTO } from '../dto/createDoc.dto';
import { DocsService } from '../service/docs.service';
import { Docs } from '../entity/docs.entity';
import { UpdateDocDTO } from '../dto/updateDoc.dto';

@Controller('docs')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth('access-token')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Roles('ADMIN')
  @Get()
  async findAllDocs(): Promise<Docs[]> {
    return this.docsService.findAll();
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Get('created-by/:userId')
  async getDocsByCreator(@Param('userId') userId: string): Promise<Docs[]> {
    return this.docsService.findByCreatedBy(userId);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Get(':id')
  async findDocById(@Param('id') id: string): Promise<Docs | null> {
    return this.docsService.findById(id);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Post()
  async createDoc(@Body() doc: CreateDocDTO): Promise<Docs> {
    
    return this.docsService.create(doc);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Put(':id')
  async updateDoc(
    @Param('id') id: string,
    @Body() doc: UpdateDocDTO,
  ): Promise<Docs | null> {
    return this.docsService.update(id, doc);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Delete(':id')
  async deleteDoc(@Param('id') id: string): Promise<void> {    
    return this.docsService.delete(id);
  }
}