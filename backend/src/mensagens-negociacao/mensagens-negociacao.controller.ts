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
import { CreateMensagemNegociacaoDto } from './dto/create-mensagem-negociacao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';

/**
 * Chat de negociação do orçamento legado.
 *
 * Os três endpoints com sufixo `publico` declaravam `@Public()`, mas nunca
 * constaram da allowlist do `JwtGlobalMiddleware`: já respondiam `401`. O
 * Gate 0S (HS-03) alinhou a declaração ao comportamento efetivo em vez de
 * abrir a rota. Reabri-los depende de token vinculado, DTO tipado e rate
 * limit, que pertencem às fases funcionais do Módulo de Vendas.
 */
@Controller('orcamentos/:orcamentoId/mensagens')
export class MensagensNegociacaoController {
  constructor(
    private readonly mensagensNegociacaoService: MensagensNegociacaoService,
  ) {}

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
    @Param('orcamentoId') orcamentoId: string,
    @Body(
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: false,
        forbidNonWhitelisted: false,
      }),
    )
    body: any, // Desabilitar validação para este endpoint
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const dto: CreateMensagemNegociacaoDto = {
      mensagem: body.mensagem || '',
      tipo: body.tipo || 'CLIENTE',
      autor_nome: body.autor_nome || 'Cliente',
      autor_email: body.autor_email || '',
    };

    return this.mensagensNegociacaoService.createPublicoComAnexo(
      orcamentoId,
      dto,
      file,
    );
  }

  /**
   * Enviar uma nova mensagem (autenticado)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('orcamentoId') orcamentoId: string,
    @Body(
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: false,
        forbidNonWhitelisted: false,
      }),
    )
    dto: CreateMensagemNegociacaoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.mensagensNegociacaoService.create(orcamentoId, dto, lojaId);
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
