import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PCPCapacidadeService } from './pcp-capacidade.service';

interface FiltrosRelatorio {
  setorId?: string;
  status?: string;
  limite?: string;
}

@Injectable()
export class PCPRelatoriosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly capacidadeService: PCPCapacidadeService,
  ) {}

  async obterOcupacaoMaquinas(
    lojaId: string,
    filtros: Record<string, string> = {},
  ) {
    return this.capacidadeService.obterCapacidadeMaquinas(lojaId, filtros);
  }

  async obterPrevistoRealizado(lojaId: string, filtros: FiltrosRelatorio = {}) {
    const limite = Math.min(Number(filtros.limite ?? 100) || 100, 500);
    const statusFiltro = filtros.status?.trim();

    const where: Parameters<
      typeof this.prisma.workflowInstanciaSetor.findMany
    >[0]['where'] = {
      workflow_instancia: { os: { loja_id: lojaId } },
      OR: [{ tempo_estimado: { gt: 0 } }, { tempo_real: { gt: 0 } }],
      ...(filtros.setorId ? { setor_id: filtros.setorId } : {}),
      ...(statusFiltro ? { status: statusFiltro } : {}),
    };

    const instancias = await this.prisma.workflowInstanciaSetor.findMany({
      where,
      include: {
        setor: { select: { id: true, nome: true, cor: true } },
        item_os: { select: { id: true, produto_servico: true } },
        workflow_instancia: {
          include: {
            os: { select: { id: true, numero: true, nome_servico: true } },
          },
        },
      },
      orderBy: [{ data_conclusao: 'desc' }, { atualizado_em: 'desc' }],
      take: limite,
    });

    const itens = instancias.map((inst) => {
      const previsto = Number(inst.tempo_estimado ?? 0);
      const realizado = Number(inst.tempo_real ?? 0);
      const desvioMin = realizado - previsto;
      const desvioPercent =
        previsto > 0 ? Math.round((desvioMin / previsto) * 1000) / 10 : null;

      return {
        id: inst.id,
        os_id: inst.workflow_instancia.os_id,
        os_numero: inst.workflow_instancia.os.numero,
        os_titulo: inst.workflow_instancia.os.nome_servico,
        setor_id: inst.setor_id,
        setor_nome: inst.setor.nome,
        setor_cor: inst.setor.cor,
        item_os_id: inst.item_os_id,
        item_descricao: inst.item_os?.produto_servico ?? null,
        status: inst.status,
        tempo_previsto_min: previsto,
        tempo_realizado_min: realizado,
        desvio_min: desvioMin,
        desvio_percent: desvioPercent,
        data_inicio: inst.data_inicio?.toISOString() ?? null,
        data_conclusao: inst.data_conclusao?.toISOString() ?? null,
      };
    });

    const resumoPorSetor = new Map<
      string,
      {
        setor_id: string;
        setor_nome: string;
        itens: number;
        previsto_min: number;
        realizado_min: number;
      }
    >();

    for (const item of itens) {
      const atual = resumoPorSetor.get(item.setor_id) ?? {
        setor_id: item.setor_id,
        setor_nome: item.setor_nome,
        itens: 0,
        previsto_min: 0,
        realizado_min: 0,
      };
      atual.itens += 1;
      atual.previsto_min += item.tempo_previsto_min;
      atual.realizado_min += item.tempo_realizado_min;
      resumoPorSetor.set(item.setor_id, atual);
    }

    const totalPrevisto = itens.reduce((s, i) => s + i.tempo_previsto_min, 0);
    const totalRealizado = itens.reduce((s, i) => s + i.tempo_realizado_min, 0);

    return {
      resumo: {
        total_itens: itens.length,
        tempo_previsto_min: totalPrevisto,
        tempo_realizado_min: totalRealizado,
        desvio_min: totalRealizado - totalPrevisto,
        desvio_percent:
          totalPrevisto > 0
            ? Math.round(
                ((totalRealizado - totalPrevisto) / totalPrevisto) * 1000,
              ) / 10
            : null,
      },
      por_setor: Array.from(resumoPorSetor.values()).map((s) => ({
        ...s,
        desvio_min: s.realizado_min - s.previsto_min,
        desvio_percent:
          s.previsto_min > 0
            ? Math.round(
                ((s.realizado_min - s.previsto_min) / s.previsto_min) * 1000,
              ) / 10
            : null,
      })),
      itens,
      gerado_em: new Date().toISOString(),
    };
  }
}
