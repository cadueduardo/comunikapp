import {
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VendasPermissionsGuard } from '../../vendas/permissions/vendas-permissions.guard';
import { RequerPermissaoVendas } from '../../vendas/permissions/requer-permissao-vendas.decorator';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { AcompanhamentoComercialService } from '../services/acompanhamento-comercial.service';

@ApiTags('Vendas - Pedidos e Acompanhamento')
@Controller('vendas/pedidos')
@ApiBearerAuth()
@UseGuards(VendasPermissionsGuard)
export class AcompanhamentoVendasController {
  constructor(
    private readonly acompanhamentoComercialService: AcompanhamentoComercialService,
  ) {}

  /**
   * Lista os pedidos comerciais ativos na loja.
   */
  @Get()
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PEDIDO_VER)
  @ApiOperation({ summary: 'Listar pedidos comerciais ativos da loja' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos comerciais retornada' })
  async listarPedidosComerciais(@Request() req: any) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.acompanhamentoComercialService.listarPedidosComerciais(
      lojaId,
      usuarioId,
    );
  }

  /**
   * Retorna a linha do tempo comercial sequencial de um pedido.
   */
  @Get(':id/timeline')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PEDIDO_VER)
  @ApiOperation({ summary: 'Obter linha do tempo comercial do pedido' })
  @ApiResponse({ status: 200, description: 'Linha do tempo comercial retornada' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async obterTimelinePedido(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.acompanhamentoComercialService.obterTimelinePedidoComercial(
      id,
      lojaId,
      usuarioId,
    );
  }
}
