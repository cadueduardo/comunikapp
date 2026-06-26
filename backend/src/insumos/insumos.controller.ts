import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { GetLoja } from '../auth/decorators';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimularChapaDto } from '../common/calculo-chapa/simular-chapa.dto';

@Controller('insumos')
@UseGuards(JwtAuthGuard)
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Post()
  create(@Body() createInsumoDto: CreateInsumoDto, @GetLoja() loja: loja) {
    return this.insumosService.create(createInsumoDto, loja);
  }

  @Post('importar')
  @UseInterceptors(FileInterceptor('file'))
  importar(@UploadedFile() file: Express.Multer.File, @GetLoja() loja: loja) {
    return this.insumosService.importarExcel(file, loja);
  }

  @Get('template')
  async baixarTemplate(@GetLoja() loja: loja, @Res() res: any) {
    const { buffer, filename } =
      await this.insumosService.gerarTemplateImportacao(loja);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(buffer);
  }

  @Get()
  findAll(@GetLoja() loja: loja) {
    return this.insumosService.findAll(loja);
  }

  @Post(':id/duplicar')
  duplicar(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.insumosService.duplicar(id, loja);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.insumosService.findOne(id, loja);
  }

  @Get(':id/calculo-chapa')
  getCalculoChapa(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.insumosService.getConfiguracaoCalculoChapa(id, loja);
  }

  @Post(':id/simular-chapa')
  simularChapa(
    @Param('id') id: string,
    @Body() dto: SimularChapaDto,
    @GetLoja() loja: loja,
  ) {
    return this.insumosService.simularChapa(id, dto, loja);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInsumoDto: UpdateInsumoDto,
    @GetLoja() loja: loja,
  ) {
    return this.insumosService.update(id, updateInsumoDto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.insumosService.remove(id, loja);
  }
}
