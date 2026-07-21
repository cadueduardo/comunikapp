import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatusAceiteServico,
  StatusContaPagar,
  StatusParcelaContaPagar,
  StatusRecebimentoCompra,
  loja,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CancelarContaPagarDto,
  CreateContaPagarDto,
} from '../dto/create-conta-pagar.dto';
import {
  COMPRAS_PERMISSOES,
  ContasPagarPermissionsService,
} from './contas-pagar-permissions.service';
import { roundMoney2 } from './contas-pagar-saldo.util';
import { rethrowUniqueConflict } from '../../../compras/services/pedido-totais.util';
import {
  assertParcelasSomamTotal,
  calcularValorFromPedido,
} from './contas-pagar-from-pedido.util';
import { CONTA_PAGAR_INCLUDE } from './contas-pagar-rollup.util';

@Injectable()
export class ContasPagarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ContasPagarPermissionsService,
  ) {}

  async create(
    dto: CreateContaPagarDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.CONTA_PAGAR_CRIAR,
    );

    if (dto.chave_idempotente) {
      const existente = await this.prisma.contaPagar.findFirst({
        where: {
          loja_id: lojaAtual.id,
          chave_idempotente: dto.chave_idempotente,
        },
        include: CONTA_PAGAR_INCLUDE,
      });
      if (existente) {
        return existente;
      }
    }

    assertParcelasSomamTotal(dto.valor_total, dto.parcelas);
    await this.assertFornecedor(lojaAtual.id, dto.fornecedor_id);
    if (dto.pedido_id) {
      await this.assertPedido(lojaAtual.id, dto.pedido_id, dto.fornecedor_id);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const conta = await tx.contaPagar.create({
          data: {
            loja_id: lojaAtual.id,
            fornecedor_id: dto.fornecedor_id,
            pedido_id: dto.pedido_id ?? null,
            tipo_documento: dto.tipo_documento,
            numero_documento: dto.numero_documento.trim(),
            data_emissao: new Date(dto.data_emissao),
            data_competencia: dto.data_competencia
              ? new Date(dto.data_competencia)
              : null,
            valor_total: new Prisma.Decimal(roundMoney2(dto.valor_total)),
            valor_pago: new Prisma.Decimal(0),
            status: StatusContaPagar.ABERTA,
            observacao: dto.observacao ?? null,
            chave_idempotente: dto.chave_idempotente ?? null,
            parcelas: {
              create: dto.parcelas.map((p) => ({
                loja_id: lojaAtual.id,
                numero_parcela: p.numero_parcela,
                valor_previsto: new Prisma.Decimal(
                  roundMoney2(p.valor_previsto),
                ),
                valor_pago: new Prisma.Decimal(0),
                data_vencimento: new Date(p.data_vencimento),
                status: StatusParcelaContaPagar.PREVISTO,
              })),
            },
          },
          include: CONTA_PAGAR_INCLUDE,
        });

        await tx.compraHistorico.create({
          data: {
            loja_id: lojaAtual.id,
            entidade_tipo: 'CONTA_PAGAR',
            entidade_id: conta.id,
            acao: 'CRIAR',
            status_anterior: null,
            status_novo: StatusContaPagar.ABERTA,
            dados: {
              tipo_documento: conta.tipo_documento,
              numero_documento: conta.numero_documento,
              valor_total: Number(conta.valor_total),
              pedido_id: conta.pedido_id,
            },
            usuario_id: usuarioId,
          },
        });

        return conta;
      });
    } catch (error) {
      if (dto.chave_idempotente) {
        const existente = await this.prisma.contaPagar.findFirst({
          where: {
            loja_id: lojaAtual.id,
            chave_idempotente: dto.chave_idempotente,
          },
          include: CONTA_PAGAR_INCLUDE,
        });
        if (existente) {
          return existente;
        }
      }
      rethrowUniqueConflict(
        error,
        'Já existe conta a pagar com este documento para o fornecedor nesta loja.',
      );
      throw error;
    }
  }

  async createFromPedido(
    pedidoId: string,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.CONTA_PAGAR_CRIAR,
    );

    const pedido = await this.prisma.pedidoCompra.findFirst({
      where: { id: pedidoId, loja_id: lojaAtual.id },
      include: {
        itens: true,
        recebimentos: {
          where: { status: StatusRecebimentoCompra.CONFIRMADO },
          select: { id: true },
        },
        aceites: {
          where: { status: StatusAceiteServico.CONFIRMADO },
          include: { itens: true },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido de compra não encontrado.');
    }

    if (pedido.recebimentos.length === 0 && pedido.aceites.length === 0) {
      throw new BadRequestException(
        'Conta a pagar só pode ser gerada após recebimento ou aceite confirmado.',
      );
    }

    const numeroDocumento = `PC-${pedido.numero}`;
    const existenteDoc = await this.prisma.contaPagar.findFirst({
      where: {
        loja_id: lojaAtual.id,
        fornecedor_id: pedido.fornecedor_id,
        tipo_documento: 'OUTRO',
        numero_documento: numeroDocumento,
      },
      include: CONTA_PAGAR_INCLUDE,
    });
    if (existenteDoc) {
      return existenteDoc;
    }

    const valorTotal = calcularValorFromPedido(pedido);
    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 30);

    return this.create(
      {
        fornecedor_id: pedido.fornecedor_id,
        pedido_id: pedido.id,
        tipo_documento: 'OUTRO',
        numero_documento: numeroDocumento,
        data_emissao: new Date().toISOString(),
        valor_total: valorTotal,
        observacao: `Gerada a partir do pedido ${pedido.numero}`,
        parcelas: [
          {
            numero_parcela: 1,
            valor_previsto: valorTotal,
            data_vencimento: vencimento.toISOString(),
          },
        ],
      },
      lojaAtual,
      usuarioId,
    );
  }

  async list(
    lojaAtual: loja,
    filtros: {
      status?: string;
      fornecedor_id?: string;
      pedido_id?: string;
    },
  ) {
    const where: Prisma.ContaPagarWhereInput = {
      loja_id: lojaAtual.id,
    };

    if (filtros.status) {
      where.status = filtros.status as StatusContaPagar;
    }
    if (filtros.fornecedor_id) {
      where.fornecedor_id = filtros.fornecedor_id;
    }
    if (filtros.pedido_id) {
      where.pedido_id = filtros.pedido_id;
    }

    return this.prisma.contaPagar.findMany({
      where,
      include: {
        parcelas: { orderBy: { numero_parcela: 'asc' } },
        fornecedor: {
          select: { id: true, nome: true, razao_social: true },
        },
        pedido: { select: { id: true, numero: true } },
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async findOne(id: string, lojaAtual: loja) {
    const conta = await this.prisma.contaPagar.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: {
        ...CONTA_PAGAR_INCLUDE,
        pagamentos: {
          orderBy: { criado_em: 'desc' },
          include: { apropriacoes: true },
        },
      },
    });
    if (!conta) {
      throw new NotFoundException('Conta a pagar não encontrada.');
    }
    return conta;
  }

  async cancelar(
    id: string,
    dto: CancelarContaPagarDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.CONTA_PAGAR_CRIAR,
    );

    const conta = await this.findOne(id, lojaAtual);

    if (conta.status === StatusContaPagar.CANCELADA) {
      return conta;
    }

    if (Number(conta.valor_pago) > 0) {
      throw new BadRequestException(
        'Não é possível cancelar conta com valor já pago. Estorne os pagamentos primeiro.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.contaPagarParcela.updateMany({
        where: { conta_pagar_id: conta.id, loja_id: lojaAtual.id },
        data: { status: StatusParcelaContaPagar.CANCELADA },
      });

      const atualizada = await tx.contaPagar.update({
        where: { id: conta.id },
        data: { status: StatusContaPagar.CANCELADA },
        include: CONTA_PAGAR_INCLUDE,
      });

      await tx.compraHistorico.create({
        data: {
          loja_id: lojaAtual.id,
          entidade_tipo: 'CONTA_PAGAR',
          entidade_id: conta.id,
          acao: 'CANCELAR',
          status_anterior: conta.status,
          status_novo: StatusContaPagar.CANCELADA,
          dados: { motivo: dto.motivo ?? null },
          usuario_id: usuarioId,
        },
      });

      return atualizada;
    });
  }

  private async assertFornecedor(lojaId: string, fornecedorId: string) {
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id: fornecedorId, loja_id: lojaId },
      select: { id: true },
    });
    if (!fornecedor) {
      throw new BadRequestException(
        'Fornecedor não encontrado nesta loja.',
      );
    }
  }

  private async assertPedido(
    lojaId: string,
    pedidoId: string,
    fornecedorId: string,
  ) {
    const pedido = await this.prisma.pedidoCompra.findFirst({
      where: { id: pedidoId, loja_id: lojaId },
      select: { id: true, fornecedor_id: true },
    });
    if (!pedido) {
      throw new BadRequestException('Pedido de compra não encontrado.');
    }
    if (pedido.fornecedor_id !== fornecedorId) {
      throw new BadRequestException(
        'fornecedor_id da conta deve ser o mesmo do pedido vinculado.',
      );
    }
  }
}
