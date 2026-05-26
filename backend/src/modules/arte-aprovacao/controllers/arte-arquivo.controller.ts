import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  StreamableFile,
  SetMetadata,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { basename, join } from 'path';
import { ArteArquivoService } from '../services/arte-arquivo.service';
import { ArteThumbnailService } from '../services/arte-thumbnail.service';
import { ArteLinkAprovacaoService } from '../services/arte-link-aprovacao.service';
import { ArteArquivoResponseDto } from '../dto/arte-response.dto';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../../../auth/jwt-auth.guard';
import { multerConfig } from '../../../config/multer.config';

// Decorator para marcar rotas públicas
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('Arte & Aprovação - Arquivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/versoes/:versaoId/arquivos')
export class ArteArquivoController {
  constructor(
    private readonly arteArquivoService: ArteArquivoService,
    private readonly thumbnailService: ArteThumbnailService,
    private readonly linkAprovacaoService: ArteLinkAprovacaoService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar arquivos de uma versão' })
  @ApiResponse({
    status: 200,
    description: 'Lista de arquivos',
    type: [ArteArquivoResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  async findByVersao(
    @Param('versaoId') versaoId: string,
    @Request() req: any,
  ): Promise<ArteArquivoResponseDto[]> {
    console.log('📁 [Controller] Listando arquivos da versão:', {
      versaoId,
      lojaId: req.user.loja_id,
    });

    return this.arteArquivoService.findArquivosByVersao(
      versaoId,
      req.user.loja_id,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('arquivo', multerConfig))
  @ApiOperation({ summary: 'Upload de arquivo para versão' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Arquivo enviado com sucesso',
    type: ArteArquivoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  async uploadArquivo(
    @Param('versaoId') versaoId: string,
    @UploadedFile() arquivo: Express.Multer.File,
    @Request() req: any,
  ): Promise<ArteArquivoResponseDto> {
    console.log('📤 [Controller] Upload de arquivo:', {
      versaoId,
      nomeArquivo: arquivo?.originalname,
      tamanho: arquivo?.size,
      path: arquivo?.path,
      lojaId: req.user.loja_id,
    });

    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Gerar thumbnail se for imagem
    let thumbnailPath: string | null = null;
    let thumbnailFilename: string | undefined = undefined;

    if (this.thumbnailService.isImage(arquivo.path)) {
      thumbnailPath = await this.thumbnailService.generateThumbnail(
        arquivo.path,
      );

      if (thumbnailPath) {
        // Extrair apenas o nome do arquivo do thumbnail
        const parts = thumbnailPath.split(/[/\\]/);
        thumbnailFilename = parts[parts.length - 1];
      }
    }

    // Preparar dados do arquivo
    const arquivoData = {
      nome_arquivo: arquivo.filename, // Nome gerado pelo multer
      nome_original: arquivo.originalname,
      tipo_arquivo: arquivo.mimetype.split('/')[1] || 'unknown',
      tamanho: BigInt(arquivo.size),
      url_arquivo: `/api/arte-aprovacao/versoes/${versaoId}/arquivos/download/${arquivo.filename}`,
      url_thumbnail: thumbnailFilename
        ? `/api/arte-aprovacao/versoes/${versaoId}/arquivos/public/download/${thumbnailFilename}`
        : undefined,
      storage_provider: 'local',
      storage_path: arquivo.path,
    };

    return this.arteArquivoService.addArquivo(
      versaoId,
      arquivoData,
      req.user.loja_id,
    );
  }

  @Get(':arquivoId')
  @ApiOperation({ summary: 'Buscar arquivo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Arquivo encontrado',
    type: ArteArquivoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async findOne(
    @Param('versaoId') versaoId: string,
    @Param('arquivoId') arquivoId: string,
    @Request() req: any,
  ): Promise<ArteArquivoResponseDto> {
    console.log('🔍 [Controller] Buscando arquivo:', {
      versaoId,
      arquivoId,
      lojaId: req.user.loja_id,
    });

    return this.arteArquivoService.findArquivoById(arquivoId, req.user.loja_id);
  }

  @Get('public/download/:filename')
  @Public()
  @ApiOperation({
    summary: 'Download público de arquivo (para links de aprovação)',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo para download',
  })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async downloadArquivoPublico(
    @Param('versaoId') versaoId: string,
    @Param('filename') filename: string,
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const safeFilename = basename(filename);
    if (safeFilename !== filename) {
      throw new BadRequestException('Nome de arquivo inválido');
    }

    const arquivoAutorizado =
      await this.linkAprovacaoService.validarDownloadPublicoArquivo(
        token,
        versaoId,
        safeFilename,
      );

    const filePath = arquivoAutorizado.storagePath;

    if (!existsSync(filePath)) {
      throw new BadRequestException('Arquivo não encontrado');
    }

    const file = createReadStream(filePath);

    // Detectar tipo de arquivo
    const ext = safeFilename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      pdf: 'application/pdf',
      ai: 'application/postscript',
      psd: 'image/vnd.adobe.photoshop',
      eps: 'application/postscript',
    };

    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

    // Definir headers para preview inline
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${arquivoAutorizado.nomeOriginal.replace(/["\r\n]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
    });

    return new StreamableFile(file);
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download de arquivo' })
  @ApiResponse({
    status: 200,
    description: 'Arquivo para download',
  })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async downloadArquivo(
    @Param('versaoId') versaoId: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    console.log('📥 [Controller] Download de arquivo:', {
      versaoId,
      filename,
    });

    const safeFilename = basename(filename);
    if (safeFilename !== filename) {
      throw new BadRequestException('Nome de arquivo inválido');
    }

    const filePath = join(process.cwd(), 'uploads', 'arte', versaoId, safeFilename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Arquivo não encontrado');
    }

    const file = createReadStream(filePath);

    // Detectar tipo de arquivo
    const ext = safeFilename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      pdf: 'application/pdf',
      ai: 'application/postscript',
      psd: 'image/vnd.adobe.photoshop',
      eps: 'application/postscript',
    };

    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

    // Definir headers para preview inline
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${safeFilename.replace(/["\r\n]/g, '_')}"`,
      'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
    });

    return new StreamableFile(file);
  }

  @Get(':arquivoId/url-publica')
  @ApiOperation({ summary: 'Gerar URL pública para download' })
  @ApiResponse({
    status: 200,
    description: 'URL pública gerada',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://storage.com/arquivo.pdf' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async generatePublicUrl(
    @Param('versaoId') versaoId: string,
    @Param('arquivoId') arquivoId: string,
    @Request() req: any,
  ): Promise<{ url: string }> {
    console.log('🔗 [Controller] Gerando URL pública:', {
      versaoId,
      arquivoId,
      lojaId: req.user.loja_id,
    });

    const url = await this.arteArquivoService.generatePublicUrl(
      arquivoId,
      req.user.loja_id,
    );

    return { url };
  }

  @Delete(':arquivoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover arquivo' })
  @ApiResponse({ status: 204, description: 'Arquivo removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async remove(
    @Param('versaoId') versaoId: string,
    @Param('arquivoId') arquivoId: string,
    @Request() req: any,
  ): Promise<void> {
    console.log('🗑️ [Controller] Removendo arquivo:', {
      versaoId,
      arquivoId,
      lojaId: req.user.loja_id,
    });

    return this.arteArquivoService.removeArquivo(arquivoId, req.user.loja_id);
  }
}
