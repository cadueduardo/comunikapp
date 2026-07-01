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
  Body,
  NotFoundException,
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
import { ArteStorageService } from '../services/arte-storage.service';
import { ArteArquivoResponseDto } from '../dto/arte-response.dto';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../../../auth/jwt-auth.guard';
import { multerArteMemoryConfig } from '../../../config/multer-arte.config';
import { normalizeMultipartFilename } from '../../../common/utils/multipart-filename.util';
import { buildArteVersaoDownloadPath } from '../utils/arte-arquivo-url.util';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  ai: 'application/postscript',
  psd: 'image/vnd.adobe.photoshop',
  eps: 'application/postscript',
};

@ApiTags('Arte & Aprovação - Arquivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/versoes/:versaoId/arquivos')
export class ArteArquivoController {
  constructor(
    private readonly arteArquivoService: ArteArquivoService,
    private readonly thumbnailService: ArteThumbnailService,
    private readonly linkAprovacaoService: ArteLinkAprovacaoService,
    private readonly arteStorageService: ArteStorageService,
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
    @Request() req: { user: { loja_id: string } },
  ): Promise<ArteArquivoResponseDto[]> {
    return this.arteArquivoService.findArquivosByVersao(
      versaoId,
      req.user.loja_id,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('arquivo', multerArteMemoryConfig))
  @ApiOperation({ summary: 'Upload de arquivo para versão (Google Drive)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Arquivo enviado com sucesso',
    type: ArteArquivoResponseDto,
  })
  async uploadArquivo(
    @Param('versaoId') versaoId: string,
    @UploadedFile() arquivo: Express.Multer.File,
    @Body('nome_original') nomeOriginalInformado: string | undefined,
    @Request() req: { user: { loja_id: string } },
  ): Promise<ArteArquivoResponseDto> {
    if (!arquivo?.buffer) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const nomeOriginal = normalizeMultipartFilename(
      nomeOriginalInformado?.trim() || arquivo.originalname,
    );

    const uploadResult = await this.arteStorageService.uploadArteVersao({
      lojaId: req.user.loja_id,
      versaoId,
      fileName: nomeOriginal,
      mimeType: arquivo.mimetype || 'application/octet-stream',
      buffer: arquivo.buffer,
    });

    let urlThumbnail: string | undefined;
    if (this.thumbnailService.isImageMime(arquivo.mimetype)) {
      const thumbBuffer = await this.thumbnailService.generateThumbnailFromBuffer(
        arquivo.buffer,
      );
      if (thumbBuffer) {
        const thumbUpload = await this.arteStorageService.uploadArteVersao({
          lojaId: req.user.loja_id,
          versaoId,
          fileName: `thumb_${uploadResult.nome_arquivo}.jpg`,
          mimeType: 'image/jpeg',
          buffer: thumbBuffer,
        });
        urlThumbnail = buildArteVersaoDownloadPath(
          versaoId,
          thumbUpload.nome_arquivo,
        );
      }
    }

    const ext = nomeOriginal.split('.').pop()?.toLowerCase() || 'unknown';

    return this.arteArquivoService.addArquivo(
      versaoId,
      {
        nome_arquivo: uploadResult.nome_arquivo,
        nome_original: nomeOriginal,
        tipo_arquivo: ext,
        tamanho: BigInt(arquivo.size),
        url_arquivo: buildArteVersaoDownloadPath(
          versaoId,
          uploadResult.nome_arquivo,
        ),
        url_thumbnail: urlThumbnail,
        storage_provider: uploadResult.storage_provider,
        storage_path: uploadResult.storage_path,
      },
      req.user.loja_id,
    );
  }

  @Get(':arquivoId')
  @ApiOperation({ summary: 'Buscar arquivo por ID' })
  async findOne(
    @Param('arquivoId') arquivoId: string,
    @Request() req: { user: { loja_id: string } },
  ): Promise<ArteArquivoResponseDto> {
    return this.arteArquivoService.findArquivoById(arquivoId, req.user.loja_id);
  }

  @Get('public/download/:filename')
  @Public()
  @ApiOperation({ summary: 'Download público de arquivo (link de aprovação)' })
  async downloadArquivoPublico(
    @Param('versaoId') versaoId: string,
    @Param('filename') filename: string,
    @Query('token') token: string | string[],
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const approvalToken = Array.isArray(token) ? token[0] : token;
    if (!approvalToken) {
      throw new BadRequestException('Token público obrigatório');
    }

    let safeFilename: string;
    try {
      safeFilename = basename(decodeURIComponent(filename));
    } catch {
      throw new BadRequestException('Nome de arquivo inválido');
    }

    if (
      !safeFilename ||
      safeFilename.includes('..') ||
      safeFilename.includes('/') ||
      safeFilename.includes('\\')
    ) {
      throw new BadRequestException('Nome de arquivo inválido');
    }

    const arquivoAutorizado =
      await this.linkAprovacaoService.validarDownloadPublicoArquivo(
        approvalToken,
        versaoId,
        safeFilename,
      );

    return this.streamArquivo(
      res,
      arquivoAutorizado.lojaId,
      arquivoAutorizado.storageProvider,
      arquivoAutorizado.storageProvider === 'google_drive'
        ? arquivoAutorizado.storagePath
        : arquivoAutorizado.storagePath,
      arquivoAutorizado.nomeOriginal,
      arquivoAutorizado.tipoArquivo,
    );
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download de arquivo autenticado' })
  async downloadArquivo(
    @Param('versaoId') versaoId: string,
    @Param('filename') filename: string,
    @Request() req: { user: { loja_id: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const safeFilename = basename(filename);
    if (safeFilename !== filename) {
      throw new BadRequestException('Nome de arquivo inválido');
    }

    const registro = await this.arteArquivoService.findArquivoByVersaoFilename(
      versaoId,
      safeFilename,
      req.user.loja_id,
    );

    if (!registro) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return this.streamArquivo(
      res,
      req.user.loja_id,
      registro.storage_provider,
      registro.storage_path,
      registro.nome_original,
      registro.tipo_arquivo,
    );
  }

  @Get(':arquivoId/url-publica')
  @ApiOperation({ summary: 'Gerar URL pública para download' })
  async generatePublicUrl(
    @Param('arquivoId') arquivoId: string,
    @Request() req: { user: { loja_id: string } },
  ): Promise<{ url: string }> {
    const url = await this.arteArquivoService.generatePublicUrl(
      arquivoId,
      req.user.loja_id,
    );
    return { url };
  }

  @Delete(':arquivoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover arquivo' })
  async remove(
    @Param('arquivoId') arquivoId: string,
    @Request() req: { user: { loja_id: string } },
  ): Promise<void> {
    return this.arteArquivoService.removeArquivo(arquivoId, req.user.loja_id);
  }

  private async streamArquivo(
    res: Response,
    lojaId: string,
    storageProvider: string,
    storagePath: string,
    nomeOriginal: string,
    tipoArquivo: string,
  ): Promise<StreamableFile> {
    const contentType =
      MIME_TYPES[tipoArquivo.toLowerCase()] || 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${nomeOriginal.replace(/["\r\n]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
    });

    if (storageProvider === 'google_drive') {
      const { stream } = await this.arteStorageService.getDownloadStream(
        lojaId,
        storageProvider,
        storagePath,
      );
      return new StreamableFile(stream);
    }

    if (!existsSync(storagePath)) {
      const legacyPath = join(
        process.cwd(),
        'uploads',
        'arte',
        storagePath,
      );
      if (existsSync(legacyPath)) {
        return new StreamableFile(createReadStream(legacyPath));
      }
      throw new NotFoundException('Arquivo não encontrado');
    }

    return new StreamableFile(createReadStream(storagePath));
  }
}
