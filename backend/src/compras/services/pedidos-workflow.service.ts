import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { loja } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertTransicaoPedido,
  statusAlvoPedido,
} from '../policies/compras-estados.policy';
import { ComprasHistoricoService } from './compras-historico.service';
import {
  COMPRAS_PERMISSOES,
  ComprasPermissionsService,
} from './compras-permissions.service';
import { updatePedidoTenantSafe } from './pedido-matriz.util';
import { PedidosService } from './pedidos.service';

/**
 * Transições de status do pedido (enviar aprovação, aprovar, rejeitar, enviar, cancelar).
 * Separado de PedidosService para manter CRUD + matriz enxutos.
 */
@Injectable()
export class PedidosWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historicoService: ComprasHistoricoService,
    private readonly permissions: ComprasPermissionsService,
    private readonly pedidosService: PedidosService,
  ) {}

  async enviarAprovacao(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_CRIAR,
    );

    const atual = await this.pedidosService.findOne(id, lojaAtual);
    assertTransicaoPedido('enviarAprovacao', atual.status);

    const statusNovo = statusAlvoPedido('enviarAprovacao');
    await updatePedidoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'PEDIDO_COMPRA',
      entidadeId: id,
      acao: 'ENVIAR_APROVACAO',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: { permissao: COMPRAS_PERMISSOES.PEDIDO_CRIAR },
    });

    return this.pedidosService.findOne(id, lojaAtual);
  }

  async aprovar(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_APROVAR,
    );

    const atual = await this.pedidosService.findOne(id, lojaAtual);
    assertTransicaoPedido('aprovar', atual.status);

    const statusNovo = statusAlvoPedido('aprovar');
    await updatePedidoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
      aprovado_por: usuarioId,
      aprovado_em: new Date(),
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'PEDIDO_COMPRA',
      entidadeId: id,
      acao: 'APROVAR',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: { permissao: COMPRAS_PERMISSOES.PEDIDO_APROVAR },
    });

    return this.pedidosService.findOne(id, lojaAtual);
  }

  async rejeitar(
    id: string,
    lojaAtual: loja,
    usuarioId: string,
    motivo?: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_APROVAR,
    );

    const atual = await this.pedidosService.findOne(id, lojaAtual);
    assertTransicaoPedido('rejeitar', atual.status);

    const statusNovo = statusAlvoPedido('rejeitar');
    await updatePedidoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'PEDIDO_COMPRA',
      entidadeId: id,
      acao: 'REJEITAR',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: {
        permissao: COMPRAS_PERMISSOES.PEDIDO_APROVAR,
        ...(motivo ? { motivo } : {}),
      },
    });

    return this.pedidosService.findOne(id, lojaAtual);
  }

  async enviarFornecedor(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_ENVIAR,
    );

    const atual = await this.pedidosService.findOne(id, lojaAtual);
    assertTransicaoPedido('enviarFornecedor', atual.status);

    const statusNovo = statusAlvoPedido('enviarFornecedor');
    await updatePedidoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
      enviado_em: new Date(),
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'PEDIDO_COMPRA',
      entidadeId: id,
      acao: 'ENVIAR_FORNECEDOR',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: { permissao: COMPRAS_PERMISSOES.PEDIDO_ENVIAR },
    });

    return this.pedidosService.findOne(id, lojaAtual);
  }

  async cancelar(
    id: string,
    lojaAtual: loja,
    usuarioId: string,
    motivo: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_CANCELAR,
    );

    const motivoTrim = motivo?.trim();
    if (!motivoTrim) {
      throw new BadRequestException(
        'motivo é obrigatório para cancelar o pedido.',
      );
    }

    const atual = await this.pedidosService.findOne(id, lojaAtual);
    assertTransicaoPedido('cancelar', atual.status);

    const statusNovo = statusAlvoPedido('cancelar');
    await updatePedidoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
      cancelado_em: new Date(),
      cancelado_por: usuarioId,
      motivo_cancelamento: motivoTrim,
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'PEDIDO_COMPRA',
      entidadeId: id,
      acao: 'CANCELAR',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: {
        motivo: motivoTrim,
        permissao: COMPRAS_PERMISSOES.PEDIDO_CANCELAR,
      },
    });

    return this.pedidosService.findOne(id, lojaAtual);
  }
}
