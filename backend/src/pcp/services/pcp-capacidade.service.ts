import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type StatusCarga = 'normal' | 'atencao' | 'cheia' | 'sobrecarregada';

interface FiltrosCapacidade {
  setorId?: string;
  maquinaId?: string;
  operadorId?: string;
  prioridade?: string;
  dataInicial?: string;
  dataFinal?: string;
}

@Injectable()
export class PCPCapacidadeService {
  constructor(private readonly prisma: PrismaService) {}

  async obterCapacidadeSetores(lojaId: string, filtros: FiltrosCapacidade = {}) {
    const [setores, instancias] = await Promise.all([
      this.prisma.setorProdutivo.findMany({
        where: {
          loja_id: lojaId,
          ativo: true,
          ...(filtros.setorId ? { id: filtros.setorId } : {}),
        },
        orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      }),
      this.buscarInstanciasProdutivas(lojaId, filtros),
    ]);

    const minutosPorSetor = new Map<string, number>();
    const itensPorSetor = new Map<string, any[]>();

    for (const instancia of instancias) {
      const minutos = Number(instancia.tempo_estimado ?? 0);
      minutosPorSetor.set(
        instancia.setor_id,
        (minutosPorSetor.get(instancia.setor_id) ?? 0) + minutos,
      );
      const itens = itensPorSetor.get(instancia.setor_id) ?? [];
      itens.push(this.mapearItemProgramado(instancia));
      itensPorSetor.set(instancia.setor_id, itens);
    }

    return {
      setores: setores.map((setor) => {
        const horasDisponiveis = this.capacidadeDiariaSetor(setor);
        const horasProgramadas = this.minutosParaHoras(
          minutosPorSetor.get(setor.id) ?? 0,
        );

        return {
          setor_id: setor.id,
          nome: setor.nome,
          cor: setor.cor,
          horas_disponiveis: horasDisponiveis,
          horas_programadas: horasProgramadas,
          horas_livres: this.arredondar(horasDisponiveis - horasProgramadas),
          ocupacao_percent: this.calcularOcupacao(
            horasProgramadas,
            horasDisponiveis,
          ),
          status_carga: this.classificarCarga(
            horasProgramadas,
            horasDisponiveis,
          ),
          itens_programados: itensPorSetor.get(setor.id) ?? [],
        };
      }),
      gerado_em: new Date().toISOString(),
    };
  }

  async obterCapacidadeMaquinas(lojaId: string, filtros: FiltrosCapacidade = {}) {
    const [maquinas, instancias] = await Promise.all([
      this.prisma.maquina.findMany({
        where: {
          loja_id: lojaId,
          ativo: true,
          usar_no_pcp: true,
          ...(filtros.setorId ? { setor_id: filtros.setorId } : {}),
          ...(filtros.maquinaId ? { id: filtros.maquinaId } : {}),
        },
        include: { setor: true },
        orderBy: { nome: 'asc' },
      }),
      this.buscarInstanciasProdutivas(lojaId, filtros),
    ]);

    const maquinasPorId = new Map(maquinas.map((maquina) => [maquina.id, maquina]));
    const minutosPorMaquina = new Map<string, number>();
    const itensPorMaquina = new Map<string, any[]>();
    const itensSemMaquina: any[] = [];

    for (const instancia of instancias) {
      const maquinaId = this.extrairMaquinaId(instancia.item_os);
      const maquina = maquinaId ? maquinasPorId.get(maquinaId) : null;
      const item = this.mapearItemProgramado(instancia, maquina ?? null);

      if (!maquina) {
        if (!filtros.maquinaId) {
          itensSemMaquina.push(item);
        }
        continue;
      }

      const minutos = Number(instancia.tempo_estimado ?? 0);
      minutosPorMaquina.set(
        maquina.id,
        (minutosPorMaquina.get(maquina.id) ?? 0) + minutos,
      );
      const itens = itensPorMaquina.get(maquina.id) ?? [];
      itens.push(item);
      itensPorMaquina.set(maquina.id, itens);
    }

    const maquinasCapacidade = maquinas.map((maquina) => {
      const horasDisponiveis = this.capacidadeDiariaMaquina(maquina);
      const horasProgramadas = this.minutosParaHoras(
        minutosPorMaquina.get(maquina.id) ?? 0,
      );

      return {
        maquina_id: maquina.id,
        nome: maquina.nome,
        setor: maquina.setor
          ? { id: maquina.setor.id, nome: maquina.setor.nome }
          : null,
        horas_disponiveis: horasDisponiveis,
        horas_programadas: horasProgramadas,
        horas_livres: this.arredondar(horasDisponiveis - horasProgramadas),
        ocupacao_percent: this.calcularOcupacao(
          horasProgramadas,
          horasDisponiveis,
        ),
        status_carga: this.classificarCarga(horasProgramadas, horasDisponiveis),
        itens_programados: itensPorMaquina.get(maquina.id) ?? [],
      };
    });

    return {
      maquinas: maquinasCapacidade,
      sem_maquina_definida: filtros.maquinaId
        ? null
        : {
            maquina_id: null,
            nome: 'Sem máquina definida',
            horas_programadas: this.minutosParaHoras(
              itensSemMaquina.reduce(
                (total, item) => total + Number(item.tempo_previsto_min ?? 0),
                0,
              ),
            ),
            itens_programados: itensSemMaquina,
          },
      gerado_em: new Date().toISOString(),
    };
  }

  async obterCargaSetor(
    lojaId: string,
    setorId: string,
    filtros: FiltrosCapacidade = {},
  ) {
    const resultado = await this.obterCapacidadeSetores(lojaId, {
      ...filtros,
      setorId,
    });
    return resultado.setores[0] ?? null;
  }

  private async buscarInstanciasProdutivas(
    lojaId: string,
    filtros: FiltrosCapacidade,
  ) {
    return this.prisma.workflowInstanciaSetor.findMany({
      where: {
        status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA'] },
        ...(filtros.setorId ? { setor_id: filtros.setorId } : {}),
        ...(filtros.operadorId ? { operador_id: filtros.operadorId } : {}),
        workflow_instancia: {
          os: {
            loja_id: lojaId,
            ...(filtros.prioridade ? { prioridade: filtros.prioridade } : {}),
            ...this.montarFiltroPrazo(filtros),
          },
        },
      },
      include: {
        setor: true,
        operador: true,
        item_os: {
          include: {
            os: {
              include: { cliente: true },
            },
          },
        },
        workflow_instancia: {
          include: {
            os: {
              include: { cliente: true },
            },
            workflow: true,
          },
        },
      },
      orderBy: [{ setor_id: 'asc' }, { ordem: 'asc' }, { criado_em: 'asc' }],
    });
  }

  private montarFiltroPrazo(filtros: FiltrosCapacidade) {
    if (!filtros.dataInicial && !filtros.dataFinal) {
      return {};
    }

    return {
      data_prazo: {
        ...(filtros.dataInicial
          ? { gte: this.inicioDoDia(filtros.dataInicial) }
          : {}),
        ...(filtros.dataFinal
          ? { lte: this.fimDoDia(filtros.dataFinal) }
          : {}),
      },
    };
  }

  private mapearItemProgramado(instancia: any, maquina?: any) {
    const item = instancia.item_os;
    const os = item?.os ?? instancia.workflow_instancia?.os;

    return {
      instancia_setor_id: instancia.id,
      item_os_id: item?.id ?? null,
      os_id: os?.id ?? null,
      os_numero: os?.numero ?? null,
      produto: item?.produto_servico ?? os?.nome_servico ?? null,
      cliente: os?.cliente?.nome ?? null,
      prazo: os?.data_prazo ?? null,
      workflow: instancia.workflow_instancia?.workflow?.nome ?? null,
      setor_atual: instancia.setor?.nome ?? null,
      status: instancia.status,
      maquina_prevista: maquina
        ? { id: maquina.id, nome: maquina.nome }
        : null,
      tempo_previsto_min: Number(instancia.tempo_estimado ?? 0),
      tempo_previsto_horas: this.minutosParaHoras(
        Number(instancia.tempo_estimado ?? 0),
      ),
      operador: instancia.operador
        ? {
            id: instancia.operador.id,
            nome: instancia.operador.nome_completo ?? instancia.operador.email,
          }
        : null,
    };
  }

  private extrairMaquinaId(itemOS: any): string | null {
    const parametros = this.parseJsonObject(itemOS?.parametros_tecnicos);
    const maquinas = Array.isArray(parametros?.maquinas)
      ? parametros.maquinas
      : [];

    return (
      parametros?.maquina_id ??
      parametros?.maquinaId ??
      maquinas.find((maquina) => maquina?.maquina_id || maquina?.id)
        ?.maquina_id ??
      maquinas.find((maquina) => maquina?.maquina_id || maquina?.id)?.id ??
      null
    );
  }

  private parseJsonObject(valor: unknown): any {
    if (!valor) {
      return null;
    }
    if (typeof valor !== 'string') {
      return valor;
    }
    try {
      return JSON.parse(valor);
    } catch {
      return null;
    }
  }

  private capacidadeDiariaSetor(setor: any): number {
    if (setor.horas_produtivas_mensais) {
      return this.arredondar(Number(setor.horas_produtivas_mensais) / 22);
    }
    return 8;
  }

  private capacidadeDiariaMaquina(maquina: any): number {
    const base =
      Number(maquina.horas_disponiveis_dia ?? 0) ||
      (maquina.setor ? this.capacidadeDiariaSetor(maquina.setor) : 8);

    if (!maquina.considerar_eficiencia_na_capacidade) {
      return this.arredondar(base);
    }

    const eficiencia = Number(maquina.eficiencia_percent ?? 100);
    return this.arredondar(base * (eficiencia / 100));
  }

  private calcularOcupacao(programadas: number, disponiveis: number): number {
    if (disponiveis <= 0) {
      return programadas > 0 ? 100 : 0;
    }
    return this.arredondar((programadas / disponiveis) * 100);
  }

  private classificarCarga(programadas: number, disponiveis: number): StatusCarga {
    const ocupacao = this.calcularOcupacao(programadas, disponiveis);
    if (ocupacao > 100) return 'sobrecarregada';
    if (ocupacao >= 90) return 'cheia';
    if (ocupacao >= 70) return 'atencao';
    return 'normal';
  }

  private minutosParaHoras(minutos: number): number {
    return this.arredondar(minutos / 60);
  }

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private inicioDoDia(data: string): Date {
    const date = new Date(data);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private fimDoDia(data: string): Date {
    const date = new Date(data);
    date.setHours(23, 59, 59, 999);
    return date;
  }
}
