/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  async createDoc(@Req() req: Request, @Body() doc: CreateDocDTO): Promise<Docs> {
    const email = req['decodedData'].email;
    
    return this.docsService.create(doc, email);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')

  @Put(':id')
  async updateDoc(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() doc: UpdateDocDTO,
  ): Promise<Docs | null> {
    const email = req['decodedData'].email;
    const changeReason = doc.cause ? 
      (doc.cause === 'Bug' ? 'bug' :
      doc.cause === 'Nouveau EndPoint' ? 'new_endpoint' :
      doc.cause === 'Changement du document' ? 'major_change' : undefined) 
      : undefined;
    return this.docsService.update(id, doc, email, changeReason);
  }

  @Roles('ADMIN', 'DEVELOPER', 'DÉVELOPPEUR')
  @Delete(':id')
  async deleteDoc(@Req() req: Request, @Param('id') id: string): Promise<void> {   
    const email = req['decodedData'].email; 
    return this.docsService.delete(id, email);
  }
}