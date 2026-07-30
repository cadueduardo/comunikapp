/**
 * Integração de apontamentos com estoque: reservas, baixas e liberações reais.
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MovimentacoesService } from '../../estoque/services/movimentacoes.service';
import { TipoApontamento } from '../interfaces/workflow-pcp.interfaces';

export const TIPO_LOG_ESTOQUE_RESERVA = 'ESTOQUE_RESERVA';

export interface OperacaoEstoque {
  insumo_id: string;
  quantidade: number;
  unidade: string;
  tipo: 'RESERVA' | 'BAIXA' | 'LIBERACAO';
  motivo: string;
  referencia_id: string;
}

export interface ResultadoOperacaoEstoque {
  sucesso: boolean;
  operacoes_realizadas: OperacaoEstoque[];
  erros: string[];
  alertas: string[];
}

type InsumoNecessario = {
  insumo_id: string;
  quantidade: number;
  unidade: string;
  nome: string;
  controla_estoque: boolean;
};

type EstoqueItemRow = {
  id: string;
  quantidadeAtual: number;
  quantidadeReservada: number;
};

@Injectable()
export class EstoqueApontamentoService {
  private readonly logger = new Logger(EstoqueApontamentoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly movimentacoesService: MovimentacoesService,
  ) {}

  async processarOperacaoEstoque(
    osId: string,
    tipoApontamento: TipoApontamento,
    quantidadeProduzida?: number,
    quantidadeRefugo?: number,
    _observacoes?: string,
    usuarioId?: string,
  ): Promise<ResultadoOperacaoEstoque> {
    this.logger.log(
      `Processando estoque OS ${osId} - Tipo: ${tipoApontamento}`,
    );

    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
      include: { itens: true },
    });

    if (!os) {
      throw new BadRequestException(`OS ${osId} não encontrada`);
    }

    const insumosNecessarios = await this.extrairInsumosOS(os);
    if (insumosNecessarios.length === 0) {
      return {
        sucesso: true,
        operacoes_realizadas: [],
        erros: [],
        alertas: ['OS não possui insumos para processar estoque'],
      };
    }

    const operacoes = this.determinarOperacoesEstoque(
      tipoApontamento,
      insumosNecessarios.filter((i) => i.controla_estoque),
      quantidadeProduzida,
      quantidadeRefugo,
    );

    if (operacoes.length === 0) {
      return {
        sucesso: true,
        operacoes_realizadas: [],
        erros: [],
        alertas: ['Nenhum insumo com controle de estoque para movimentar'],
      };
    }

    return this.executarOperacoesEstoque(
      operacoes,
      osId,
      os.loja_id,
      usuarioId,
    );
  }

  async liberarReservasEstoque(
    osId: string,
    usuarioId?: string,
  ): Promise<ResultadoOperacaoEstoque> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
      select: { loja_id: true },
    });
    if (!os) {
      throw new BadRequestException(`OS ${osId} não encontrada`);
    }

    const reservas = await this.buscarReservasAtivas(osId);
    const operacoes: OperacaoEstoque[] = reservas.map((reserva) => ({
      insumo_id: reserva.insumo_id,
      quantidade: reserva.quantidade,
      unidade: reserva.unidade,
      tipo: 'LIBERACAO',
      motivo: 'Cancelamento de OS - liberação de reservas',
      referencia_id: osId,
    }));

    return this.executarOperacoesEstoque(
      operacoes,
      osId,
      os.loja_id,
      usuarioId,
    );
  }

  private async extrairInsumosOS(os: {
    itens: Array<{ id: string; insumos_necessarios?: string | null }>;
  }): Promise<InsumoNecessario[]> {
    const insumos: InsumoNecessario[] = [];

    for (const item of os.itens) {
      if (!item.insumos_necessarios) continue;
      try {
        const parsed = JSON.parse(item.insumos_necessarios) as Array<{
          insumo_id?: string;
          quantidade?: number;
          quantidade_necessaria?: number;
          unidade?: string;
        }>;
        for (const raw of parsed) {
          if (!raw?.insumo_id) continue;
          const insumoCompleto = await this.prisma.insumo.findUnique({
            where: { id: raw.insumo_id },
            select: {
              nome: true,
              controla_estoque: true,
            },
          });
          const qtd = Number(
            raw.quantidade_necessaria ?? raw.quantidade ?? 0,
          );
          if (!Number.isFinite(qtd) || qtd <= 0) continue;
          insumos.push({
            insumo_id: raw.insumo_id,
            quantidade: qtd,
            unidade: raw.unidade || 'un',
            nome: insumoCompleto?.nome || 'Insumo não encontrado',
            controla_estoque: Boolean(insumoCompleto?.controla_estoque),
          });
        }
      } catch (error) {
        this.logger.warn(
          `Erro ao processar insumos do item ${item.id}: ${(error as Error).message}`,
        );
      }
    }

    return insumos;
  }

  private determinarOperacoesEstoque(
    tipoApontamento: TipoApontamento,
    insumosNecessarios: InsumoNecessario[],
    _quantidadeProduzida?: number,
    quantidadeRefugo?: number,
  ): OperacaoEstoque[] {
    const operacoes: OperacaoEstoque[] = [];

    switch (tipoApontamento) {
      case TipoApontamento.INICIO:
        for (const insumo of insumosNecessarios) {
          operacoes.push({
            insumo_id: insumo.insumo_id,
            quantidade: insumo.quantidade,
            unidade: insumo.unidade,
            tipo: 'RESERVA',
            motivo: 'Início de produção - reserva de insumos',
            referencia_id: '',
          });
        }
        break;
      case TipoApontamento.CONCLUSAO:
        for (const insumo of insumosNecessarios) {
          operacoes.push({
            insumo_id: insumo.insumo_id,
            quantidade: insumo.quantidade,
            unidade: insumo.unidade,
            tipo: 'BAIXA',
            motivo: 'Conclusão de produção - baixa de insumos',
            referencia_id: '',
          });
        }
        break;
      case TipoApontamento.REFUGO:
        if (quantidadeRefugo && quantidadeRefugo > 0) {
          for (const insumo of insumosNecessarios) {
            operacoes.push({
              insumo_id: insumo.insumo_id,
              quantidade: (insumo.quantidade * quantidadeRefugo) / 100,
              unidade: insumo.unidade,
              tipo: 'BAIXA',
              motivo: `Refugo de produção - ${quantidadeRefugo}%`,
              referencia_id: '',
            });
          }
        }
        break;
      default:
        break;
    }

    return operacoes;
  }

  private async executarOperacoesEstoque(
    operacoes: OperacaoEstoque[],
    osId: string,
    lojaId: string,
    usuarioId?: string,
  ): Promise<ResultadoOperacaoEstoque> {
    const operacoesRealizadas: OperacaoEstoque[] = [];
    const erros: string[] = [];
    const alertas: string[] = [];

    for (const operacao of operacoes) {
      try {
        operacao.referencia_id = osId;

        if (operacao.tipo === 'RESERVA' || operacao.tipo === 'BAIXA') {
          const validacao = await this.validarDisponibilidadeEstoque(
            operacao.insumo_id,
            operacao.quantidade,
            lojaId,
          );
          if (!validacao.disponivel) {
            erros.push(
              `${operacao.insumo_id}: ${validacao.motivo || 'indisponível'}`,
            );
            continue;
          }
          if (validacao.alerta) alertas.push(validacao.alerta);
        }

        await this.executarOperacaoIndividual(
          operacao,
          lojaId,
          usuarioId,
        );
        operacoesRealizadas.push(operacao);
      } catch (error) {
        const msg = `Erro estoque ${operacao.insumo_id}: ${(error as Error).message}`;
        erros.push(msg);
        this.logger.error(msg);
      }
    }

    return {
      sucesso: erros.length === 0,
      operacoes_realizadas: operacoesRealizadas,
      erros,
      alertas,
    };
  }

  private async validarDisponibilidadeEstoque(
    insumoId: string,
    quantidade: number,
    lojaId: string,
  ): Promise<{ disponivel: boolean; motivo?: string; alerta?: string }> {
    const estoque = await this.prisma.insumo.findFirst({
      where: { id: insumoId, loja_id: lojaId },
      select: {
        estoque_atual: true,
        estoque_minimo: true,
        controla_estoque: true,
        nome: true,
      },
    });

    if (!estoque) {
      return { disponivel: false, motivo: 'Insumo não encontrado' };
    }
    if (!estoque.controla_estoque) {
      return { disponivel: true, alerta: `${estoque.nome}: sem controle de estoque` };
    }

    const estoqueAtual = Number(estoque.estoque_atual || 0);
    const estoqueMinimo = Number(estoque.estoque_minimo || 0);
    if (estoqueAtual < quantidade) {
      return {
        disponivel: false,
        motivo: `Estoque insuficiente (${estoque.nome}). Disponível: ${estoqueAtual}, Necessário: ${quantidade}`,
      };
    }
    if (estoqueAtual - quantidade < estoqueMinimo) {
      return {
        disponivel: true,
        alerta: `${estoque.nome}: ficará abaixo do mínimo após a operação`,
      };
    }
    return { disponivel: true };
  }

  private async executarOperacaoIndividual(
    operacao: OperacaoEstoque,
    lojaId: string,
    usuarioId?: string,
  ): Promise<void> {
    const qtd = Number(operacao.quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      throw new BadRequestException('Quantidade de estoque inválida');
    }

    if (operacao.tipo === 'RESERVA') {
      await this.executarReserva(operacao, lojaId, qtd);
      return;
    }
    if (operacao.tipo === 'LIBERACAO') {
      await this.executarLiberacao(operacao, lojaId, qtd);
      return;
    }
    await this.executarBaixa(operacao, lojaId, qtd, usuarioId);
  }

  private async executarReserva(
    operacao: OperacaoEstoque,
    lojaId: string,
    qtd: number,
  ): Promise<void> {
    const item = await this.buscarItemEstoquePorInsumo(
      lojaId,
      operacao.insumo_id,
    );
    if (item) {
      await this.atualizarReservadaItem(
        lojaId,
        item.id,
        item.quantidadeReservada + qtd,
      );
    } else {
      this.logger.warn(
        `RESERVA sem estoque_itens para insumo ${operacao.insumo_id}; só registra log`,
      );
    }

    await this.prisma.ordemServicoLog.create({
      data: {
        os_id: operacao.referencia_id,
        tipo_acao: TIPO_LOG_ESTOQUE_RESERVA,
        descricao: operacao.motivo,
        dados_extras: JSON.stringify({
          ativa: true,
          insumo_id: operacao.insumo_id,
          quantidade: qtd,
          unidade: operacao.unidade,
          estoque_item_id: item?.id ?? null,
        }),
      },
    });
  }

  private async executarLiberacao(
    operacao: OperacaoEstoque,
    lojaId: string,
    qtd: number,
  ): Promise<void> {
    const logs = await this.prisma.ordemServicoLog.findMany({
      where: {
        os_id: operacao.referencia_id,
        tipo_acao: TIPO_LOG_ESTOQUE_RESERVA,
      },
      orderBy: { criado_em: 'asc' },
    });

    let restante = qtd;
    for (const log of logs) {
      if (restante <= 0) break;
      let extras: {
        ativa?: boolean;
        insumo_id?: string;
        quantidade?: number;
        estoque_item_id?: string | null;
      } = {};
      try {
        extras = JSON.parse(log.dados_extras || '{}');
      } catch {
        continue;
      }
      if (!extras.ativa || extras.insumo_id !== operacao.insumo_id) continue;

      const liberar = Math.min(Number(extras.quantidade || 0), restante);
      if (liberar <= 0) continue;

      if (extras.estoque_item_id) {
        const item = await this.buscarItemEstoquePorId(
          lojaId,
          extras.estoque_item_id,
        );
        if (item) {
          await this.atualizarReservadaItem(
            lojaId,
            item.id,
            Math.max(0, item.quantidadeReservada - liberar),
          );
        }
      }

      const novaQtd = Number(extras.quantidade || 0) - liberar;
      await this.prisma.ordemServicoLog.update({
        where: { id: log.id },
        data: {
          dados_extras: JSON.stringify({
            ...extras,
            quantidade: novaQtd,
            ativa: novaQtd > 0,
          }),
        },
      });
      restante -= liberar;
    }
  }

  private async executarBaixa(
    operacao: OperacaoEstoque,
    lojaId: string,
    qtd: number,
    usuarioId?: string,
  ): Promise<void> {
    const insumo = await this.prisma.insumo.findFirst({
      where: { id: operacao.insumo_id, loja_id: lojaId },
      select: { estoque_atual: true, controla_estoque: true },
    });
    if (!insumo?.controla_estoque) {
      this.logger.warn(
        `BAIXA ignorada: insumo ${operacao.insumo_id} sem controle`,
      );
      return;
    }

    const atual = Number(insumo.estoque_atual || 0);
    if (atual < qtd) {
      throw new BadRequestException(
        `Estoque insuficiente para baixa. Disponível: ${atual}, Necessário: ${qtd}`,
      );
    }

    // Consome reservas ativas antes da baixa física
    await this.executarLiberacao(
      { ...operacao, tipo: 'LIBERACAO', quantidade: qtd },
      lojaId,
      qtd,
    );

    await this.prisma.insumo.update({
      where: { id: operacao.insumo_id },
      data: { estoque_atual: atual - qtd },
    });

    const item = await this.buscarItemEstoquePorInsumo(
      lojaId,
      operacao.insumo_id,
    );
    if (item) {
      try {
        await this.movimentacoesService.criarMovimentacao(
          { lojaId, usuarioId },
          {
            estoqueId: item.id,
            tipo: 'SAIDA',
            quantidade: qtd,
            documentoRef: operacao.referencia_id,
            observacoes: operacao.motivo,
          },
        );
      } catch (error) {
        this.logger.warn(
          `Falha ao registrar movimentação estoque_itens: ${(error as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        `BAIXA só em Insumo.estoque_atual (sem estoque_itens) para ${operacao.insumo_id}`,
      );
    }
  }

  private async buscarReservasAtivas(osId: string): Promise<
    Array<{ insumo_id: string; quantidade: number; unidade: string }>
  > {
    const logs = await this.prisma.ordemServicoLog.findMany({
      where: { os_id: osId, tipo_acao: TIPO_LOG_ESTOQUE_RESERVA },
    });
    const out: Array<{
      insumo_id: string;
      quantidade: number;
      unidade: string;
    }> = [];
    for (const log of logs) {
      try {
        const extras = JSON.parse(log.dados_extras || '{}') as {
          ativa?: boolean;
          insumo_id?: string;
          quantidade?: number;
          unidade?: string;
        };
        if (!extras.ativa || !extras.insumo_id) continue;
        out.push({
          insumo_id: extras.insumo_id,
          quantidade: Number(extras.quantidade || 0),
          unidade: extras.unidade || 'un',
        });
      } catch {
        // ignore
      }
    }
    return out.filter((r) => r.quantidade > 0);
  }

  private async buscarItemEstoquePorInsumo(
    lojaId: string,
    insumoId: string,
  ): Promise<EstoqueItemRow | null> {
    try {
      const rows: Array<{
        id: string;
        quantidadeAtual: any;
        quantidadeReservada: any;
      }> = await this.prisma.$queryRawUnsafe(
        `SELECT id, quantidadeAtual, COALESCE(quantidadeReservada, 0) AS quantidadeReservada
         FROM estoque_itens
         WHERE lojaId = ? AND insumoId = ? AND ativo = 1
         ORDER BY quantidadeAtual DESC
         LIMIT 1`,
        lojaId,
        insumoId,
      );
      if (!rows?.length) return null;
      return {
        id: rows[0].id,
        quantidadeAtual: Number(rows[0].quantidadeAtual || 0),
        quantidadeReservada: Number(rows[0].quantidadeReservada || 0),
      };
    } catch (error) {
      this.logger.warn(
        `buscarItemEstoquePorInsumo falhou: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private async buscarItemEstoquePorId(
    lojaId: string,
    itemId: string,
  ): Promise<EstoqueItemRow | null> {
    try {
      const rows: Array<{
        id: string;
        quantidadeAtual: any;
        quantidadeReservada: any;
      }> = await this.prisma.$queryRawUnsafe(
        `SELECT id, quantidadeAtual, quantidadeReservada
         FROM estoque_itens
         WHERE lojaId = ? AND id = ?
         LIMIT 1`,
        lojaId,
        itemId,
      );
      if (!rows?.length) return null;
      return {
        id: rows[0].id,
        quantidadeAtual: Number(rows[0].quantidadeAtual || 0),
        quantidadeReservada: Number(rows[0].quantidadeReservada || 0),
      };
    } catch {
      return null;
    }
  }

  private async atualizarReservadaItem(
    lojaId: string,
    itemId: string,
    novaReservada: number,
  ): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE estoque_itens
       SET quantidadeReservada = ?
       WHERE id = ? AND lojaId = ?`,
      Math.max(0, novaReservada),
      itemId,
      lojaId,
    );
  }
}
