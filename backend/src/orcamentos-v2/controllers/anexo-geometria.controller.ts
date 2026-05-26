import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { multerAnexoGeometriaConfig } from '../../config/multer-anexo-geometria.config';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AnexoGeometriaService } from '../services/anexo-geometria.service';
import type { DxfExtraido } from '../services/dxf-parser.service';
import type { SugestoesPorCamada } from '../services/dxf-sugestao-insumo.service';

/**
 * Endpoints de upload/download/remoção de anexos de geometria
 * (imagem colada/upload + DXF) usados pelo formulário do Orçamento V2.
 *
 * Multi-tenant: o `loja_id` vem do JWT (`@UseGuards(JwtAuthGuard)`) e é
 * gravado nos metadados do anexo. O GET valida que o JWT em uso tem a mesma
 * `loja_id` antes de servir o arquivo (defesa contra IDOR por enumeração de
 * UUID).
 *
 * Em criação de orçamento novo o produto ainda não tem `id`; por isso o
 * endpoint **não exige** produto_id na URL. O frontend recebe a URL relativa
 * do anexo e a coloca em `arquivo_geometria_url` no formulário; a persistência
 * efetiva acontece quando o orçamento é salvo (campo já existe em
 * `ProdutoOrcamento` desde a Fase 2).
 */
@ApiTags('Orçamentos V2 - Anexos de Geometria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orcamentos-v2/anexos-geometria')
export class AnexoGeometriaController {
  constructor(private readonly anexoService: AnexoGeometriaService) {}

  /**
   * Upload de imagem ou DXF. Aceita formatos:
   *  - Imagem: PNG, JPG, WEBP, GIF (até 5 MB)
   *  - Vetor:  DXF (até 20 MB)
   */
  @Post()
  @UseInterceptors(FileInterceptor('arquivo', multerAnexoGeometriaConfig))
  @ApiOperation({ summary: 'Faz upload de imagem ou DXF para um produto do orçamento' })
  @ApiConsumes('multipart/form-data')
  async upload(
    @UploadedFile() arquivo: Express.Multer.File,
    @Req() req: Request,
  ): Promise<{
    url: string;
    token: string;
    categoria: 'IMAGEM' | 'DXF';
    metadados: Record<string, unknown>;
    dxf_extraido: DxfExtraido | null;
    sugestoes_insumo: SugestoesPorCamada[];
  }> {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo recebido');
    }

    const lojaId = this.lojaIdFromJwt(req);
    const usuarioId = this.usuarioIdFromJwt(req);

    const resultado = await this.anexoService.salvar({
      arquivo,
      lojaId,
      usuarioId,
    });

    return {
      url: resultado.url,
      token: resultado.token,
      categoria: resultado.categoria,
      metadados: resultado.metadados,
      dxf_extraido: resultado.dxf_extraido,
      sugestoes_insumo: resultado.sugestoes_insumo,
    };
  }

  /**
   * Releitura dos metadados de extração de um DXF já enviado. Útil quando
   * o frontend perdeu o estado em memória (recarga de página, reabertura
   * de orçamento) e precisa repor o card "Valores detectados no DXF".
   */
  @Get(':token/dxf-extraido')
  @ApiOperation({
    summary: 'Lê os metadados extraídos de um DXF já enviado',
  })
  async lerDxfExtraido(
    @Param('token') token: string,
    @Req() req: Request,
  ): Promise<{
    dxf_extraido: DxfExtraido | null;
    sugestoes_insumo: SugestoesPorCamada[];
  }> {
    const lojaId = this.lojaIdFromJwt(req);
    return this.anexoService.lerDxfExtraido({ token, lojaId });
  }

  /**
   * Serve o arquivo bruto autenticado. Usado pelo `<img src="">` do preview
   * e pelo PCP/OS no futuro para baixar o DXF original.
   */
  @Get(':token')
  @ApiOperation({ summary: 'Baixa/serve o anexo de geometria pelo token' })
  async baixar(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const lojaId = this.lojaIdFromJwt(req);
    const { buffer, mimeType, nomeOriginal, categoria } =
      await this.anexoService.ler({ token, lojaId });

    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    // Inline para imagem (preview), attachment para DXF (download).
    const disposition = categoria === 'IMAGEM' ? 'inline' : 'attachment';
    const nomeSanitizado = nomeOriginal.replace(/["\r\n]/g, '_');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${nomeSanitizado}"`,
    );
    // Cache curto: o anexo é estável (token único), mas pode ser substituído
    // antes do orçamento ser salvo. 5 min é suficiente para preview repetido
    // sem segurar versão obsoleta.
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.end(buffer);
  }

  @Delete(':token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um anexo de geometria pelo token' })
  async remover(
    @Param('token') token: string,
    @Req() req: Request,
  ): Promise<void> {
    const lojaId = this.lojaIdFromJwt(req);
    await this.anexoService.remover({ token, lojaId });
  }

  private lojaIdFromJwt(req: Request): string {
    const user = (req as Request & { user?: { loja_id?: string } }).user;
    const lojaId = user?.loja_id;
    if (!lojaId) {
      throw new BadRequestException('Token sem loja_id');
    }
    return lojaId;
  }

  private usuarioIdFromJwt(req: Request): string {
    const user = (req as Request & { user?: { id?: string; sub?: string } })
      .user;
    return user?.id || user?.sub || 'desconhecido';
  }
}
