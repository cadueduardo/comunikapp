import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentLojaId } from '../../auth/decorators';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { multerEstampaArteMestraConfig } from '../../config/multer-estampa-arte-mestra.config';
import { EstampaArteMestraService } from './estampa-arte-mestra.service';
import { EstampasService } from './estampas.service';
import { CreateEstampaDto } from './dto/create-estampa.dto';
import { ListEstampasQueryDto } from './dto/list-estampas-query.dto';
import { UpdateEstampaDto } from './dto/update-estampa.dto';

@ApiTags('Catálogo — Estampas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalogo/estampas')
export class EstampasController {
  constructor(
    private readonly estampasService: EstampasService,
    private readonly arteMestraService: EstampaArteMestraService,
  ) {}

  @Get('arte-mestra/:token')
  @ApiOperation({ summary: 'Serve arte-mestra autenticada (tenant-scoped)' })
  async servirArteMestra(
    @Param('token') token: string,
    @CurrentLojaId() lojaId: string,
    @Res() res: Response,
  ) {
    await this.arteMestraService.servir(token, lojaId, res);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra estampa do catálogo' })
  create(@Body() dto: CreateEstampaDto, @CurrentLojaId() lojaId: string) {
    return this.estampasService.create(lojaId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista estampas da loja (filtro opcional por produto finito)',
  })
  findAll(
    @CurrentLojaId() lojaId: string,
    @Query() query: ListEstampasQueryDto,
  ) {
    return this.estampasService.findAll(lojaId, query);
  }

  @Post(':id/arte-mestra')
  @UseInterceptors(
    FileInterceptor('arquivo', multerEstampaArteMestraConfig),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload seguro da arte-mestra (máx. 15 MB)' })
  uploadArteMestra(
    @Param('id') id: string,
    @UploadedFile() arquivo: Express.Multer.File,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.arteMestraService.upload({
      estampaId: id,
      lojaId,
      arquivo,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém estampa por ID (tenant-scoped)' })
  findOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.estampasService.findOne(id, lojaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza estampa' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEstampaDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.estampasService.update(id, lojaId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativa estampa (soft delete)' })
  remove(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.estampasService.remove(id, lojaId);
  }
}
