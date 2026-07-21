import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusContaPagar, loja } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePagamentoDto } from '../dto/create-pagamento.dto';
import { EstornarPagamentoDto } from '../dto/estornar-pagamento.dto';
import {
  COMPRAS_PERMISSOES,
  ContasPagarPermissionsService,
} from './contas-pagar-permissions.service';
import { roundMoney2, saldoAberto } from './contas-pagar-saldo.util';
import { rethrowUniqueConflict } from '../../../compras/services/pedido-totais.util';
import { aplicarRollupContaPagarNoTx } from './contas-pagar-rollup.util';

const PAGAMENTO_INCLUDE = {
  apropriacoes: true,
  parcela: true,
  conta: {
    include: {
      parcelas: { orderBy: { numero_parcela: 'asc' as const } },
    },
  },
} satisfies Prisma.PagamentoFornecedorInclude;

@Injectable()
export class PagamentosFornecedorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ContasPagarPermissionsService,
  ) {}

  async registrar(
    contaId: string,
    dto: CreatePagamentoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PAGAMENTO_REGISTRAR,
    );

    if (dto.chave_idempotente) {
      const existente = await this.prisma.pagamentoFornecedor.findFirst({
        where: {
          loja_id: lojaAtual.id,
          chave_idempotente: dto.chave_idempotente,
        },
        include: PAGAMENTO_INCLUDE,
      });
      if (existente) {
        return existente;
      }
    }

    const conta = await this.prisma.contaPagar.findFirst({
      where: { id: contaId, loja_id: lojaAtual.id },
      include: { parcelas: true },
    });
    if (!conta) {
      throw new NotFoundException('Conta a pagar não encontrada.');
    }
    if (conta.status === StatusContaPagar.CANCELADA) {
      throw new BadRequestException(
        'Não é possível pagar conta cancelada.',
      );
    }
    if (conta.status === StatusContaPagar.PAGA) {
      throw new BadRequestException('Conta já está totalmente paga.');
    }

    const valor = roundMoney2(dto.valor);
    const saldoConta = saldoAberto(
      Number(conta.valor_total),
      Number(conta.valor_pago),
    );
    if (valor > saldoConta) {
      throw new BadRequestException(
        `Pagamento (${valor.toFixed(2)}) excede o saldo da conta (${saldoConta.toFixed(2)}).`,
      );
    }

    let parcela = dto.parcela_id
      ? conta.parcelas.find((p) => p.id === dto.parcela_id)
      : null;
    if (dto.parcela_id && !parcela) {
      throw new BadRequestException(
        'Parcela informada não pertence a esta conta.',
      );
    }
    if (!parcela) {
      parcela =
        conta.parcelas
          .filter((p) => Number(p.valor_pago) < Number(p.valor_previsto))
          .sort((a, b) => a.numero_parcela - b.numero_parcela)[0] ?? null;
    }
    if (parcela) {
      const saldoParcela = saldoAberto(
        Number(parcela.valor_previsto),
        Number(parcela.valor_pago),
      );
      if (valor > saldoParcela) {
        throw new BadRequestException(
          `Pagamento (${valor.toFixed(2)}) excede o saldo da parcela (${saldoParcela.toFixed(2)}).`,
        );
      }
    }

    this.assertApropriacoes(dto, valor);

    try {
      const pagamento = await this.prisma.$transaction(async (tx) => {
        const criado = await tx.pagamentoFornecedor.create({
          data: {
            loja_id: lojaAtual.id,
            conta_pagar_id: conta.id,
            parcela_id: parcela?.id ?? null,
            valor: new Prisma.Decimal(valor),
            data_pagamento: new Date(dto.data_pagamento),
            metodo: dto.metodo,
            referencia: dto.referencia ?? null,
            usuario_id: usuarioId,
            chave_idempotente: dto.chave_idempotente ?? null,
            apropriacoes: dto.apropriacoes?.length
              ? {
                  create: dto.apropriacoes.map((a) => ({
                    loja_id: lojaAtual.id,
                    destino_tipo: a.destino_tipo,
                    os_id: a.os_id ?? null,
                    item_os_id: a.item_os_id ?? null,
                    centro_custo: a.centro_custo ?? null,
                    pedido_item_apropriacao_id:
                      a.pedido_item_apropriacao_id ?? null,
                    valor: new Prisma.Decimal(roundMoney2(a.valor)),
                  })),
                }
              : undefined,
          },
          include: PAGAMENTO_INCLUDE,
        });

        await tx.contaPagar.update({
          where: { id: conta.id },
          data: {
            valor_pago: new Prisma.Decimal(
              roundMoney2(Number(conta.valor_pago) + valor),
            ),
          },
        });

        if (parcela) {
          await tx.contaPagarParcela.update({
            where: { id: parcela.id },
            data: {
              valor_pago: new Prisma.Decimal(
                roundMoney2(Number(parcela.valor_pago) + valor),
              ),
            },
          });
        }

        await aplicarRollupContaPagarNoTx(
          tx,
          conta.id,
          lojaAtual.id,
        );

        await tx.compraHistorico.create({
          data: {
            loja_id: lojaAtual.id,
            entidade_tipo: 'PAGAMENTO_FORNECEDOR',
            entidade_id: criado.id,
            acao: 'REGISTRAR',
            status_anterior: conta.status,
            status_novo: null,
            dados: {
              conta_pagar_id: conta.id,
              valor,
              metodo: dto.metodo,
              parcela_id: parcela?.id ?? null,
            },
            usuario_id: usuarioId,
          },
        });

        return criado;
      });

      return this.prisma.pagamentoFornecedor.findFirst({
        where: { id: pagamento.id, loja_id: lojaAtual.id },
        include: PAGAMENTO_INCLUDE,
      });
    } catch (error) {
      if (dto.chave_idempotente) {
        const existente = await this.prisma.pagamentoFornecedor.findFirst({
          where: {
            loja_id: lojaAtual.id,
            chave_idempotente: dto.chave_idempotente,
          },
          include: PAGAMENTO_INCLUDE,
        });
        if (existente) {
          return existente;
        }
      }
      rethrowUniqueConflict(
        error,
        'Conflito de unicidade ao registrar pagamento.',
      );
      throw error;
    }
  }

  async estornar(
    pagamentoId: string,
    dto: EstornarPagamentoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PAGAMENTO_ESTORNAR,
    );

    const pagamento = await this.prisma.pagamentoFornecedor.findFirst({
      where: { id: pagamentoId, loja_id: lojaAtual.id },
      include: PAGAMENTO_INCLUDE,
    });
    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado.');
    }
    if (pagamento.estornado) {
      return pagamento;
    }

    const valor = roundMoney2(Number(pagamento.valor));

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const estornado = await tx.pagamentoFornecedor.update({
        where: { id: pagamento.id },
        data: {
          estornado: true,
          estornado_em: new Date(),
          estornado_por: usuarioId,
          motivo_estorno: dto.motivo,
        },
        include: PAGAMENTO_INCLUDE,
      });

      const conta = await tx.contaPagar.findFirst({
        where: { id: pagamento.conta_pagar_id, loja_id: lojaAtual.id },
      });
      if (!conta) {
        throw new NotFoundException('Conta a pagar não encontrada.');
      }

      const novoValorPagoConta = roundMoney2(
        Math.max(0, Number(conta.valor_pago) - valor),
      );
      await tx.contaPagar.update({
        where: { id: conta.id },
        data: { valor_pago: new Prisma.Decimal(novoValorPagoConta) },
      });

      if (pagamento.parcela_id) {
        const parcela = await tx.contaPagarParcela.findFirst({
          where: {
            id: pagamento.parcela_id,
            loja_id: lojaAtual.id,
          },
        });
        if (parcela) {
          const novoValorPagoParcela = roundMoney2(
            Math.max(0, Number(parcela.valor_pago) - valor),
          );
          await tx.contaPagarParcela.update({
            where: { id: parcela.id },
            data: {
              valor_pago: new Prisma.Decimal(novoValorPagoParcela),
            },
          });
        }
      }

      await aplicarRollupContaPagarNoTx(
        tx,
        conta.id,
        lojaAtual.id,
      );

      await tx.compraHistorico.create({
        data: {
          loja_id: lojaAtual.id,
          entidade_tipo: 'PAGAMENTO_FORNECEDOR',
          entidade_id: pagamento.id,
          acao: 'ESTORNAR',
          status_anterior: null,
          status_novo: 'ESTORNADO',
          dados: {
            motivo: dto.motivo,
            valor,
            conta_pagar_id: conta.id,
          },
          usuario_id: usuarioId,
        },
      });

      return estornado;
    });

    return atualizado;
  }

  private assertApropriacoes(dto: CreatePagamentoDto, valorPagamento: number) {
    if (!dto.apropriacoes?.length) {
      return;
    }
    const soma = roundMoney2(
      dto.apropriacoes.reduce((acc, a) => acc + Number(a.valor), 0),
    );
    if (soma !== valorPagamento) {
      throw new BadRequestException(
        `Soma das apropriações (${soma.toFixed(2)}) deve ser igual ao valor do pagamento (${valorPagamento.toFixed(2)}).`,
      );
    }
  }
}
