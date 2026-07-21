import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FechamentoFinanceiroOS,
  Prisma,
  StatusFechamentoFinanceiroOS,
  loja,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ComprasHistoricoService } from '../../../compras/services/compras-historico.service';
import type { FecharFechamentoDto } from '../dto/fechar-fechamento.dto';
import {
  montarAvisosFechamentoMvp,
  transicionarParaFechado,
  transicionarParaReaberto,
} from '../utils/fechamento-financeiro-status.util';
import { PosCalculoPermissionsService } from './pos-calculo-permissions.service';
import { PosCalculoService } from './pos-calculo.service';

const ENTIDADE_TIPO = 'FECHAMENTO_FINANCEIRO_OS' as const;

export interface FechamentoFinanceiroSnapshot {
  id: string;
  os_id: string;
  status: StatusFechamentoFinanceiroOS;
  fechado_em: Date | null;
  fechado_por: string | null;
  reaberto_em: Date | null;
  reaberto_por: string | null;
  motivo_reabertura: string | null;
  versao: number;
  criado_em: Date;
  atualizado_em: Date;
}

export interface FecharFechamentoResultado {
  os_id: string;
  fechamento: FechamentoFinanceiroSnapshot;
  avisos: string[];
  ja_estava_fechado: boolean;
}

export interface ReabrirFechamentoResultado {
  os_id: string;
  fechamento: FechamentoFinanceiroSnapshot;
}

export interface HistoricoFechamentoResultado {
  os_id: string;
  fechamento_atual: FechamentoFinanceiroSnapshot | null;
  historico: Awaited<
    ReturnType<ComprasHistoricoService['listarPorEntidade']>
  >;
}

@Injectable()
export class FechamentoFinanceiroOsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historicoService: ComprasHistoricoService,
    private readonly permissions: PosCalculoPermissionsService,
    @Inject(forwardRef(() => PosCalculoService))
    private readonly posCalculoService: PosCalculoService,
  ) {}

  async obterOuCriar(
    osId: string,
    lojaAtual: loja,
  ): Promise<FechamentoFinanceiroOS> {
    await this.assertOsDaLoja(osId, lojaAtual.id);

    return this.prisma.fechamentoFinanceiroOS.upsert({
      where: {
        loja_id_os_id: {
          loja_id: lojaAtual.id,
          os_id: osId,
        },
      },
      create: {
        loja_id: lojaAtual.id,
        os_id: osId,
        status: StatusFechamentoFinanceiroOS.PENDENTE,
      },
      update: {},
    });
  }

  async fechar(
    osId: string,
    lojaAtual: loja,
    usuarioId: string,
    dto?: FecharFechamentoDto,
  ): Promise<FecharFechamentoResultado> {
    await this.permissions.assertPodeFechar(usuarioId, lojaAtual.id);
    await this.assertOsDaLoja(osId, lojaAtual.id);

    const fechamento = await this.obterOuCriar(osId, lojaAtual);
    const avisos = await this.coletarAvisosFechamento(
      osId,
      lojaAtual,
      usuarioId,
    );

    const transicao = transicionarParaFechado(fechamento.status);
    if (!transicao.alterado) {
      return {
        os_id: osId,
        fechamento: this.toSnapshot(fechamento),
        avisos,
        ja_estava_fechado: true,
      };
    }

    const statusAnterior = fechamento.status;
    const agora = new Date();

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const registro = await tx.fechamentoFinanceiroOS.update({
        where: { id: fechamento.id },
        data: {
          status: StatusFechamentoFinanceiroOS.FECHADO,
          fechado_em: agora,
          fechado_por: usuarioId,
          reaberto_em: null,
          reaberto_por: null,
          motivo_reabertura: null,
        },
      });

      await tx.compraHistorico.create({
        data: {
          loja_id: lojaAtual.id,
          entidade_tipo: ENTIDADE_TIPO,
          entidade_id: registro.id,
          acao: 'FECHAR',
          status_anterior: statusAnterior,
          status_novo: StatusFechamentoFinanceiroOS.FECHADO,
          dados: this.montarDadosHistorico({
            osId,
            versao: registro.versao,
            observacao: dto?.observacao,
            avisos,
          }),
          usuario_id: usuarioId,
        },
      });

      return registro;
    });

    return {
      os_id: osId,
      fechamento: this.toSnapshot(atualizado),
      avisos,
      ja_estava_fechado: false,
    };
  }

  async reabrir(
    osId: string,
    lojaAtual: loja,
    usuarioId: string,
    params: { motivo: string },
  ): Promise<ReabrirFechamentoResultado> {
    await this.permissions.assertPodeFechar(usuarioId, lojaAtual.id);
    await this.assertOsDaLoja(osId, lojaAtual.id);

    const fechamento = await this.obterOuCriar(osId, lojaAtual);
    const transicao = transicionarParaReaberto({
      statusAtual: fechamento.status,
      motivo: params.motivo,
      versaoAtual: fechamento.versao,
    });

    if (!transicao.ok) {
      if (transicao.codigo === 'MOTIVO_OBRIGATORIO') {
        throw new BadRequestException(transicao.mensagem);
      }
      throw new BadRequestException(transicao.mensagem);
    }

    const statusAnterior = fechamento.status;
    const agora = new Date();
    const motivo = params.motivo.trim();

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const registro = await tx.fechamentoFinanceiroOS.update({
        where: { id: fechamento.id },
        data: {
          status: transicao.status,
          versao: transicao.versao,
          reaberto_em: agora,
          reaberto_por: usuarioId,
          motivo_reabertura: motivo,
          fechado_em: null,
          fechado_por: null,
        },
      });

      await tx.compraHistorico.create({
        data: {
          loja_id: lojaAtual.id,
          entidade_tipo: ENTIDADE_TIPO,
          entidade_id: registro.id,
          acao: 'REABRIR',
          status_anterior: statusAnterior,
          status_novo: transicao.status,
          dados: this.montarDadosHistorico({
            osId,
            versao: registro.versao,
            motivo,
          }),
          usuario_id: usuarioId,
        },
      });

      return registro;
    });

    return {
      os_id: osId,
      fechamento: this.toSnapshot(atualizado),
    };
  }

  async historico(
    osId: string,
    lojaAtual: loja,
    usuarioId: string,
  ): Promise<HistoricoFechamentoResultado> {
    await this.permissions.assertPodeFechar(usuarioId, lojaAtual.id);
    await this.assertOsDaLoja(osId, lojaAtual.id);

    const fechamento = await this.prisma.fechamentoFinanceiroOS.findUnique({
      where: {
        loja_id_os_id: {
          loja_id: lojaAtual.id,
          os_id: osId,
        },
      },
    });

    const entidadeId = fechamento?.id;
    const historico = entidadeId
      ? await this.historicoService.listarPorEntidade(
          lojaAtual.id,
          ENTIDADE_TIPO,
          entidadeId,
        )
      : [];

    return {
      os_id: osId,
      fechamento_atual: fechamento ? this.toSnapshot(fechamento) : null,
      historico,
    };
  }

  private async coletarAvisosFechamento(
    osId: string,
    lojaAtual: loja,
    usuarioId: string,
  ): Promise<string[]> {
    const posCalculo = await this.posCalculoService.obterPorOs(
      osId,
      lojaAtual,
      usuarioId,
    );
    return montarAvisosFechamentoMvp(posCalculo.pendencias);
  }

  private async assertOsDaLoja(osId: string, lojaId: string): Promise<void> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId, ativo: true },
      select: { id: true },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }
  }

  private montarDadosHistorico(params: {
    osId: string;
    versao: number;
    observacao?: string;
    motivo?: string;
    avisos?: string[];
  }): Prisma.InputJsonValue {
    return {
      os_id: params.osId,
      versao: params.versao,
      ...(params.observacao ? { observacao: params.observacao } : {}),
      ...(params.motivo ? { motivo: params.motivo } : {}),
      ...(params.avisos && params.avisos.length > 0
        ? { avisos: params.avisos }
        : {}),
    };
  }

  private toSnapshot(
    registro: FechamentoFinanceiroOS,
  ): FechamentoFinanceiroSnapshot {
    return {
      id: registro.id,
      os_id: registro.os_id,
      status: registro.status,
      fechado_em: registro.fechado_em,
      fechado_por: registro.fechado_por,
      reaberto_em: registro.reaberto_em,
      reaberto_por: registro.reaberto_por,
      motivo_reabertura: registro.motivo_reabertura,
      versao: registro.versao,
      criado_em: registro.criado_em,
      atualizado_em: registro.atualizado_em,
    };
  }
}
