import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VendasPermissionsGuard } from '../../vendas/permissions/vendas-permissions.guard';
import { RequerPermissaoVendas } from '../../vendas/permissions/requer-permissao-vendas.decorator';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { AditivosComerciaisService } from '../services/aditivos-comerciais.service';
import { PrecificarOcorrenciaDto } from '../dto/precificar-ocorrencia.dto';
import { GerarOsAditivaDto } from '../dto/gerar-os-aditiva.dto';

@ApiTags('Vendas - Aditivos Comerciais')
@Controller('vendas/aditivos')
@ApiBearerAuth()
@UseGuards(VendasPermissionsGuard)
export class AditivosVendasController {
  constructor(
    private readonly aditivosComerciaisService: AditivosComerciaisService,
  ) {}

  /**
   * Lista as ocorrências operacionais pendentes de aditivo comercial na loja.
   */
  @Get('ocorrencias')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.ADITIVO_VER)
  @ApiOperation({ summary: 'Listar ocorrências operacionais pendentes para aditivo' })
  @ApiResponse({ status: 200, description: 'Lista de ocorrências retornada' })
  async listarOcorrenciasPendentes(@Request() req: any) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.aditivosComerciaisService.listarOcorrenciasPendentes(
      lojaId,
      usuarioId,
    );
  }

  /**
   * Precifica ou abona comercialmente uma ocorrência operacional.
   */
  @Post('precificar')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.ADITIVO_PRECIFICAR)
  @ApiOperation({ summary: 'Precificar ou abonar comercialmente uma ocorrência' })
  @ApiResponse({ status: 200, description: 'Ocorrência precificada com sucesso' })
  @ApiResponse({ status: 400, description: 'Ocorrência já faturada ou dados inválidos' })
  async precificarOcorrencia(
    @Body() dto: PrecificarOcorrenciaDto,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.aditivosComerciaisService.precificarOcorrencia(
      lojaId,
      usuarioId,
      dto,
    );
  }

  /**
   * Consolida ocorrências precificadas e gera a OS Aditiva e Cobrança comercial.
   */
  @Post('gerar-os-aditiva')
  @HttpCode(HttpStatus.OK)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.ADITIVO_GERAR_OS)
  @ApiOperation({ summary: 'Gerar OS Aditiva e cobrança comercial' })
  @ApiResponse({ status: 200, description: 'OS Aditiva gerada com sucesso' })
  @ApiResponse({ status: 400, description: 'Ocorrências inválidas ou já faturadas' })
  async gerarOsAditiva(
    @Body() dto: GerarOsAditivaDto,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.aditivosComerciaisService.gerarOsAditiva(
      lojaId,
      usuarioId,
      dto,
    );
  }
}
