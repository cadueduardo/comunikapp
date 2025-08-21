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
  FileTypeValidator,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MensagensNegociacaoService } from './mensagens-negociacao.service';
import { CreateMensagemNegociacaoDto } from '../orcamentos/dto/create-mensagem-negociacao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';
import { Public } from '../auth/decorators';

@Controller('orcamentos/:orcamentoId/mensagens')
export class MensagensNegociacaoController {
  constructor(
    private readonly mensagensNegociacaoService: MensagensNegociacaoService,
  ) {}

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
    @CurrentLojaId() lojaId: string,
  ) {
    return this.mensagensNegociacaoService.findNaoVisualizadas(
      orcamentoId,
      lojaId,
    );
  }

  /**
   * Contar mensagens não visualizadas
   */
  @Get('nao-visualizadas/count')
  @UseGuards(JwtAuthGuard)
  async countNaoVisualizadas(
    @Param('orcamentoId') orcamentoId: string,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.mensagensNegociacaoService.countNaoVisualizadas(
      orcamentoId,
      lojaId,
    );
  }

  /**
   * Listar todas as mensagens de um orçamento (autenticado)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param('orcamentoId') orcamentoId: string,
    @CurrentLojaId() lojaId: string,
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
    @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: false, forbidNonWhitelisted: false })) body: any, // Desabilitar validação para este endpoint
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('🔍 Controller publico - OrcamentoId:', orcamentoId);
    console.log('🔍 Controller publico - Body recebido:', JSON.stringify(body, null, 2));
    console.log('🔍 Controller publico - Body keys:', Object.keys(body));
    console.log(
      '🔍 Controller publico - File recebido:',
      file ? `${file.originalname} (${file.size} bytes, ${file.mimetype})` : 'nenhum',
    );

    // Criar DTO manualmente a partir do body
    const dto: CreateMensagemNegociacaoDto = {
      mensagem: body.mensagem || '',
      tipo: body.tipo || 'CLIENTE',
      autor_nome: body.autor_nome || 'Cliente',
      autor_email: body.autor_email || '',
    };

    console.log('🔍 Controller publico - DTO criado:', JSON.stringify(dto, null, 2));

    try {
      const result = await this.mensagensNegociacaoService.createPublicoComAnexo(
        orcamentoId,
        dto,
        file,
      );
      console.log('✅ Controller publico - Mensagem criada com sucesso:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Controller publico - Erro ao criar mensagem:', error);
      throw error;
    }
  }

  /**
   * Enviar uma nova mensagem (autenticado)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('orcamentoId') orcamentoId: string,
    @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: false, forbidNonWhitelisted: false })) dto: CreateMensagemNegociacaoDto,
    @CurrentLojaId() lojaId: string,
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
    @Param('mensagemId') mensagemId: string,
  ) {
    return this.mensagensNegociacaoService.marcarComoVisualizadaPublico(
      orcamentoId,
      mensagemId,
    );
  }

  /**
   * Marcar mensagem como visualizada (autenticado)
   */
  @Post(':mensagemId/visualizar')
  @UseGuards(JwtAuthGuard)
  async marcarComoVisualizada(
    @Param('orcamentoId') orcamentoId: string,
    @Param('mensagemId') mensagemId: string,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.mensagensNegociacaoService.marcarComoVisualizada(
      orcamentoId,
      mensagemId,
      lojaId,
    );
  }

  /**
   * Upload de anexo para uma mensagem existente
   */
  @Post(':mensagemId/anexo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('arquivo', {
      fileFilter: (req, file, callback) => {
        // Validar tipo de arquivo
        const tiposPermitidos = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Tipo de arquivo não permitido. Use apenas JPG, PNG, PDF ou ZIP.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadAnexo(
    @Param('orcamentoId') orcamentoId: string,
    @Param('mensagemId') mensagemId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.mensagensNegociacaoService.uploadAnexo(
      orcamentoId,
      mensagemId,
      file,
      lojaId,
    );
  }
}
