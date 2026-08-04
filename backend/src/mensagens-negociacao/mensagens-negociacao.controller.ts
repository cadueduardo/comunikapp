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
  GoneException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MensagensNegociacaoService } from './mensagens-negociacao.service';
import { CreateMensagemNegociacaoDto } from './dto/create-mensagem-negociacao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';

const MSG_CHAT_DESCONTINUADO =
  'Este endpoint de mensagens foi descontinuado. Use o chat canônico MensagemChat em /orcamentos-v2/.../chat/.';

/**
 * Chat de negociação do orçamento legado — DESCONTINUADO (Fase 1).
 * Ver AGENTS.md neste diretório (auditoria de consumidores 2026-08-04).
 */
@ApiTags('mensagens-negociacao')
@Controller('orcamentos/:orcamentoId/mensagens')
export class MensagensNegociacaoController {
  constructor(
    private readonly mensagensNegociacaoService: MensagensNegociacaoService,
  ) {}

  private rejeitarEscritaDescontinuada(): never {
    throw new GoneException(MSG_CHAT_DESCONTINUADO);
  }

  @Get('publico')
  @UseGuards(JwtAuthGuard)
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

  @Post('publico')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        const tiposPermitidos = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Tipo de arquivo não permitido. Use apenas JPG, PNG ou PDF.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async createPublico(
    @Param('orcamentoId') _orcamentoId: string,
    @Body(
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: false,
        forbidNonWhitelisted: false,
      }),
    )
    _body: CreateMensagemNegociacaoDto,
    @UploadedFile() _file?: Express.Multer.File,
  ) {
    this.rejeitarEscritaDescontinuada();
  }

  /**
   * Enviar uma nova mensagem (autenticado) — descontinuado.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    deprecated: true,
    summary: 'Descontinuado — use MensagemChat em /orcamentos-v2',
  })
  @ApiResponse({ status: 410, description: 'Gone — chat legado descontinuado' })
  async create(
    @Param('orcamentoId') _orcamentoId: string,
    @Body(
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: false,
        forbidNonWhitelisted: false,
      }),
    )
    _dto: CreateMensagemNegociacaoDto,
    @CurrentLojaId() _lojaId: string,
  ) {
    this.rejeitarEscritaDescontinuada();
  }

  @Post('publico/:mensagemId/visualizar')
  @UseGuards(JwtAuthGuard)
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
   * Upload de anexo — descontinuado.
   */
  @Post(':mensagemId/anexo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('arquivo', {
      fileFilter: (req, file, callback) => {
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
    @Param('orcamentoId') _orcamentoId: string,
    @Param('mensagemId') _mensagemId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
        fileIsRequired: false,
      }),
    )
    _file: Express.Multer.File,
    @CurrentLojaId() _lojaId: string,
  ) {
    this.rejeitarEscritaDescontinuada();
  }
}
