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
  StreamableFile
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { ArteArquivoService } from '../services/arte-arquivo.service';
import { ArteThumbnailService } from '../services/arte-thumbnail.service';
import { ArteArquivoResponseDto } from '../dto/arte-response.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { multerConfig } from '../../../config/multer.config';

@ApiTags('Arte & Aprovação - Arquivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/versoes/:versaoId/arquivos')
export class ArteArquivoController {
  constructor(
    private readonly arteArquivoService: ArteArquivoService,
    private readonly thumbnailService: ArteThumbnailService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar arquivos de uma versão' })
  @ApiResponse({
    status: 200,
    description: 'Lista de arquivos',
    type: [ArteArquivoResponseDto]
  })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  async findByVersao(
    @Param('versaoId') versaoId: string,
    @Request() req: any
  ): Promise<ArteArquivoResponseDto[]> {
    console.log('📁 [Controller] Listando arquivos da versão:', {
      versaoId,
      lojaId: req.user.loja_id
    });

    return this.arteArquivoService.findArquivosByVersao(versaoId, req.user.loja_id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('arquivo', multerConfig))
  @ApiOperation({ summary: 'Upload de arquivo para versão' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Arquivo enviado com sucesso',
    type: ArteArquivoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  async uploadArquivo(
    @Param('versaoId') versaoId: string,
    @UploadedFile() arquivo: Express.Multer.File,
    @Request() req: any
  ): Promise<ArteArquivoResponseDto> {
    console.log('📤 [Controller] Upload de arquivo:', {
      versaoId,
      nomeArquivo: arquivo?.originalname,
      tamanho: arquivo?.size,
      path: arquivo?.path,
      lojaId: req.user.loja_id
    });

    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Gerar thumbnail se for imagem
    let thumbnailPath: string | null = null;
    let thumbnailFilename: string | undefined = undefined;
    
    if (this.thumbnailService.isImage(arquivo.path)) {
      thumbnailPath = await this.thumbnailService.generateThumbnail(arquivo.path);
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
        ? `/api/arte-aprovacao/versoes/${versaoId}/arquivos/download/${thumbnailFilename}`
        : undefined,
      storage_provider: 'local',
      storage_path: arquivo.path
    };

    console.log('✅ [Controller] Arquivo salvo:', {
      path: arquivo.path,
      filename: arquivo.filename,
      thumbnail: thumbnailPath,
      thumbnailFilename: thumbnailFilename,
      url_arquivo: arquivoData.url_arquivo,
      url_thumbnail: arquivoData.url_thumbnail
    });

    return this.arteArquivoService.addArquivo(versaoId, arquivoData, req.user.loja_id);
  }

  @Get(':arquivoId')
  @ApiOperation({ summary: 'Buscar arquivo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Arquivo encontrado',
    type: ArteArquivoResponseDto
  })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async findOne(
    @Param('versaoId') versaoId: string,
    @Param('arquivoId') arquivoId: string,
    @Request() req: any
  ): Promise<ArteArquivoResponseDto> {
    console.log('🔍 [Controller] Buscando arquivo:', {
      versaoId,
      arquivoId,
      lojaId: req.user.loja_id
    });

    return this.arteArquivoService.findArquivoById(arquivoId, req.user.loja_id);
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download de arquivo' })
  @ApiResponse({
    status: 200,
    description: 'Arquivo para download'
  })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async downloadArquivo(
    @Param('versaoId') versaoId: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    console.log('📥 [Controller] Download de arquivo:', {
      versaoId,
      filename
    });

    const filePath = join(process.cwd(), 'uploads', 'arte', versaoId, filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Arquivo não encontrado');
    }

    const file = createReadStream(filePath);
    
    // Definir headers para download
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `inline; filename="${filename}"`,
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
        url: { type: 'string', example: 'https://storage.com/arquivo.pdf' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async generatePublicUrl(
    @Param('versaoId') versaoId: string,
    @Param('arquivoId') arquivoId: string,
    @Request() req: any
  ): Promise<{ url: string }> {
    console.log('🔗 [Controller] Gerando URL pública:', {
      versaoId,
      arquivoId,
      lojaId: req.user.loja_id
    });

    const url = await this.arteArquivoService.generatePublicUrl(arquivoId, req.user.loja_id);
    
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
    @Request() req: any
  ): Promise<void> {
    console.log('🗑️ [Controller] Removendo arquivo:', {
      versaoId,
      arquivoId,
      lojaId: req.user.loja_id
    });

    return this.arteArquivoService.removeArquivo(arquivoId, req.user.loja_id);
  }
}
