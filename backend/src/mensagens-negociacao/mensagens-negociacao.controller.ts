import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MensagensNegociacaoService } from './mensagens-negociacao.service';
import { CreateMensagemNegociacaoDto } from '../orcamentos/dto/create-mensagem-negociacao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';

@Controller('orcamentos/:orcamentoId/mensagens')
export class MensagensNegociacaoController {
  constructor(private readonly mensagensNegociacaoService: MensagensNegociacaoService) {}

  /**
   * Enviar uma nova mensagem
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('orcamentoId') orcamentoId: string, 
    @Body() dto: CreateMensagemNegociacaoDto, 
    @CurrentLojaId() lojaId: string
  ) {
    return this.mensagensNegociacaoService.create(orcamentoId, dto, lojaId);
  }

  /**
   * Listar todas as mensagens de um orçamento
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param('orcamentoId') orcamentoId: string, 
    @CurrentLojaId() lojaId: string
  ) {
    return this.mensagensNegociacaoService.findAll(orcamentoId, lojaId);
  }

  /**
   * Marcar mensagem como visualizada
   */
  @Post(':mensagemId/visualizar')
  @UseGuards(JwtAuthGuard)
  async marcarComoVisualizada(
    @Param('mensagemId') mensagemId: string, 
    @CurrentLojaId() lojaId: string
  ) {
    return this.mensagensNegociacaoService.marcarComoVisualizada(mensagemId, lojaId);
  }

  /**
   * Upload de anexo para uma mensagem
   */
  @Post(':mensagemId/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('arquivo'))
  async uploadAnexo(
    @Param('orcamentoId') orcamentoId: string,
    @Param('mensagemId') mensagemId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(pdf|jpg|jpeg|png)' }),
        ],
      }),
    ) file: Express.Multer.File,
    @CurrentLojaId() lojaId: string
  ) {
    return this.mensagensNegociacaoService.uploadAnexo(mensagemId, file, lojaId);
  }

  /**
   * Buscar mensagens não visualizadas
   */
  @Get('nao-visualizadas')
  @UseGuards(JwtAuthGuard)
  async findNaoVisualizadas(
    @Param('orcamentoId') orcamentoId: string, 
    @CurrentLojaId() lojaId: string
  ) {
    return this.mensagensNegociacaoService.findNaoVisualizadas(orcamentoId, lojaId);
  }

  /**
   * Contar mensagens não visualizadas
   */
  @Get('nao-visualizadas/count')
  @UseGuards(JwtAuthGuard)
  async countNaoVisualizadas(
    @Param('orcamentoId') orcamentoId: string, 
    @CurrentLojaId() lojaId: string
  ) {
    return this.mensagensNegociacaoService.countNaoVisualizadas(orcamentoId, lojaId);
  }
} 