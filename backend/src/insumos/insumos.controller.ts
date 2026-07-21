import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
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
import { VincularFornecedoresEnvelopeDto } from './dto/vincular-fornecedores.dto';

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

  @Get('busca')
  buscarPorNome(
    @GetLoja() loja: loja,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 8;
    return this.insumosService.buscarSugestoesPorNome(
      loja,
      q ?? '',
      Number.isFinite(parsedLimit) ? parsedLimit : 8,
      excludeId,
    );
  }

  @Post(':id/duplicar')
  duplicar(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.insumosService.duplicar(id, loja);
  }

  @Get(':id/fornecedores/opcoes-orcamento')
  getOpcoesFornecedoresOrcamento(
    @Param('id') id: string,
    @GetLoja() loja: loja,
    @Query('selecionado') fornecedorSelecionadoId?: string,
  ) {
    return this.insumosService.getOpcoesFornecedoresOrcamento(
      id,
      loja,
      fornecedorSelecionadoId,
    );
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

  @Patch(':id/fornecedores')
  vincularFornecedores(
    @Param('id') id: string,
    @Body() dto: VincularFornecedoresEnvelopeDto,
    @GetLoja() loja: loja,
  ) {
    return this.insumosService.vincularFornecedores(id, dto, loja);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.insumosService.remove(id, loja);
  }

  @Post(':id/reativar')
  reativar(@Param('id') id: string, @GetLoja() loja: loja) {
    return this.insumosService.reativar(id, loja);
  }
}
