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
import { Public } from '../auth/decorators';

@Controller('orcamentos/:orcamentoId/mensagens')
export class MensagensNegociacaoController {
  constructor(private readonly mensagensNegociacaoService: MensagensNegociacaoService) {}

  /**
   * Listar todas as mensagens de um orçamento (público)
   */
  @Get('publico')
  @Public()
  async findAllPublico(@Param('orcamentoId') orcamentoId: string) {
    return this.mensagensNegociacaoService.findAllPublico(orcamentoId);
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

  /**
   * Listar todas as mensagens de um orçamento (autenticado)
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
   * Enviar uma nova mensagem (público)
   */
  @Post('publico')
  @Public()
  @UseInterceptors(FileInterceptor('arquivo'))
  async createPublico(
    @Param('orcamentoId') orcamentoId: string, 
    @Body() body: any, // Usar any para aceitar tanto JSON quanto FormData
    @UploadedFile() file?: Express.Multer.File
  ) {
    console.log('🔍 Controller publico - Body recebido:', body);
    console.log('🔍 Controller publico - File recebido:', file ? `${file.originalname} (${file.size} bytes)` : 'nenhum');
    
    // Criar DTO manualmente a partir do body
    const dto: CreateMensagemNegociacaoDto = {
      mensagem: body.mensagem || '',
      tipo: body.tipo || 'CLIENTE',
      autor_nome: body.autor_nome || 'Cliente',
      autor_email: body.autor_email,
    };
    
    console.log('🔍 Controller publico - DTO criado:', dto);
    
    return this.mensagensNegociacaoService.createPublicoComAnexo(orcamentoId, dto, file);
  }

  /**
   * Enviar uma nova mensagem (autenticado)
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
   * Marcar mensagem como visualizada (público)
   */
  @Post('publico/:mensagemId/visualizar')
  @Public()
  async marcarComoVisualizadaPublico(
    @Param('orcamentoId') orcamentoId: string,
    @Param('mensagemId') mensagemId: string
  ) {
    return this.mensagensNegociacaoService.marcarComoVisualizadaPublico(orcamentoId, mensagemId);
  }

  /**
   * Marcar mensagem como visualizada (autenticado)
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
} 