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
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArteArquivoService } from '../services/arte-arquivo.service';
import { ArteArquivoResponseDto } from '../dto/arte-response.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@ApiTags('Arte & Aprovação - Arquivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/versoes/:versaoId/arquivos')
export class ArteArquivoController {
  constructor(private readonly arteArquivoService: ArteArquivoService) {}

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
  @UseInterceptors(FileInterceptor('arquivo'))
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
      lojaId: req.user.loja_id
    });

    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // TODO: Implementar upload real para storage (Google Drive, AWS S3, etc.)
    // Por enquanto, simular dados do arquivo
    const arquivoData = {
      nome_arquivo: `${Date.now()}-${arquivo.originalname}`,
      nome_original: arquivo.originalname,
      tipo_arquivo: arquivo.mimetype.split('/')[1] || 'unknown',
      tamanho: BigInt(arquivo.size),
      url_arquivo: `/uploads/arte/${versaoId}/${arquivo.originalname}`,
      url_thumbnail: arquivo.mimetype.startsWith('image/') 
        ? `/uploads/arte/${versaoId}/thumb_${arquivo.originalname}`
        : undefined,
      storage_provider: 'local',
      storage_path: `/uploads/arte/${versaoId}/${arquivo.originalname}`
    };

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
