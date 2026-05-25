import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OSCardKanban,
  KanbanStats,
  StatusSetorProdutivo,
} from '../entities/pcp.entities';
import { KanbanQueryDto } from '../dto/kanban.dto';
import { KanbanMapper } from '../mappers/kanban.mapper';
import { SetoresProdutivosService } from '../../configuracoes/services/centros-de-trabalho/setores-produtivos.service';

@Injectable()
export class PCPKanbanService {
  private readonly logger = new Logger(PCPKanbanService.name);

  constructor(
    private prisma: PrismaService,
    private setoresProdutivosService: SetoresProdutivosService,
  ) {}

  /**
   * Obtém dados do kanban geral para uma loja
   */
  async obterKanbanGeral(
    lojaId: string,
    filtros?: KanbanQueryDto,
  ): Promise<{
    cards: OSCardKanban[];
    stats: KanbanStats;
  }> {
    try {
      this.logger.log(`Obtendo kanban geral para loja ${lojaId}`);

      // Critério de "OS de PCP": aprovacao_tecnica_status = APROVADA + status
      // operacional não-terminal. Espelha o set já usado por
      // FluxoTrabalhoService.montarColunaProducao, kpi-dashboard.service e
      // alertas-operacionais.service para manter coerência entre a Home, o
      // Kanban e os alertas. APROVADA_TECNICA não entra porque, a partir de
      // 2026-05-25, a aprovação técnica promove a OS direto para
      // LIBERADA_PARA_PCP (ver os.service.ts:aprovarOSTecnica). Mantemos
      // PRODUCAO/ACABAMENTO/AGUARDANDO_MATERIAL para acomodar OS legadas que
      // já avançaram no operacional sem passar pelo checkpoint formal.
      const osLiberadas = await this.prisma.ordemServico.findMany({
        where: {
          loja_id: lojaId,
          aprovacao_tecnica_status: 'APROVADA',
          status: {
            in: [
              'LIBERADA_PARA_PCP',
              'EM_WORKFLOW',
              'PRODUCAO',
              'ACABAMENTO',
              'AGUARDANDO_MATERIAL',
              'FINALIZADA',
            ],
          },
          ...this.aplicarFiltros(filtros),
        },
        include: {
          cliente: true,
          workflow_instancia: {
            include: {
              workflow: true,
              etapas: {
                where: { status: 'EM_ANDAMENTO' },
              },
            },
          },
          itens: true,
        },
        orderBy: { data_prazo: 'asc' },
      });

      // Converter para formato do kanban
      const cards: OSCardKanban[] = osLiberadas.map((os) =>
        KanbanMapper.mapearOSParaKanban(os),
      );

      // Calcular estatísticas
      const stats = KanbanMapper.calcularEstatisticas(cards);

      this.logger.log(
        `Kanban obtido: ${cards.length} OSs, ${stats.total} total`,
      );

      return { cards, stats };
    } catch (error) {
      this.logger.error(`Erro ao obter kanban geral:`, error);
      throw error;
    }
  }

  /**
   * Obtém fila de um setor específico
   */
  async obterFilaSetor(
    setorId: string,
    operadorId?: string,
  ): Promise<OSCardKanban[]> {
    try {
      this.logger.log(`Obtendo fila do setor ${setorId}`);

      // Buscar instâncias de workflow do setor
      const instanciasSetor = await this.prisma.workflowInstanciaSetor.findMany(
        {
          where: {
            setor_id: setorId,
            status: {
              in: ['PENDENTE', 'EM_ANDAMENTO'],
            },
            ...(operadorId && { operador_id: operadorId }),
          },
          include: {
            item_os: {
              include: {
                os: {
                  include: {
                    cliente: true,
                  },
                },
              },
            },
            setor: true,
            operador: true,
            workflow_instancia: {
              include: {
                os: {
                  include: {
                    cliente: true,
                  },
                },
              },
            },
          },
          orderBy: [{ criado_em: 'asc' }, { ordem: 'asc' }],
        },
      );

      // Converter para formato do kanban
      const cards: OSCardKanban[] = instanciasSetor.map((instancia) =>
        KanbanMapper.mapearInstanciaParaKanban(instancia),
      );

      this.logger.log(`Fila do setor obtida: ${cards.length} itens`);

      return cards;
    } catch (error) {
      this.logger.error(`Erro ao obter fila do setor:`, error);
      throw error;
    }
  }

  /**
   * Atualiza o status operacional de uma OS diretamente no Kanban.
   * Mantido simples para viabilizar o endpoint administrativo.
   */
  async atualizarStatusOS(osId: string, status: string): Promise<void> {
    if (!status) {
      throw new BadRequestException('Status invalido.');
    }

    try {
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status,
          atualizado_em: new Date(),
        },
      });

      this.logger.log(`Status da OS ${osId} atualizado para ${status}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status da OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Inicia produção de um item
   */
  async iniciarProducao(
    itemOsId: string,
    operadorId: string,
    observacoes?: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Iniciando producao do item ${itemOsId} pelo operador ${operadorId}`,
      );

      const etapa = await this.prisma.workflowInstanciaSetor.findFirst({
        where: {
          item_os_id: itemOsId,
          status: 'PENDENTE',
        },
      });

      if (!etapa) {
        throw new BadRequestException(
          'Etapa nao disponivel para inicio (aguardando liberacao ou ja iniciada).',
        );
      }

      await this.prisma.workflowInstanciaSetor.update({
        where: { id: etapa.id },
        data: {
          status: 'EM_ANDAMENTO',
          operador_id: operadorId,
          data_inicio: new Date(),
          observacoes,
          atualizado_em: new Date(),
        },
      });

      await this.prisma.workflowInstancia.update({
        where: { id: etapa.workflow_instancia_id },
        data: {
          etapa_atual: etapa.setor_id,
          atualizado_em: new Date(),
        },
      });

      const itemOS = await this.prisma.itemOS.findUnique({
        where: { id: itemOsId },
        include: { os: true },
      });

      if (itemOS) {
        await this.prisma.apontamento.create({
          data: {
            os_id: itemOS.os_id,
            tipo: 'INICIO',
            data_apontamento: new Date(),
            usuario_id: operadorId,
            observacoes,
          },
        });
      }

      this.logger.log(`Producao iniciada com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao iniciar producao:`, error);
      throw error;
    }
  }

  /**
   * Conclui etapa de produção
   */
  async concluirEtapa(
    itemOsId: string,
    operadorId: string,
    observacoes?: string,
    quantidadeProduzida?: number,
  ): Promise<void> {
    try {
      this.logger.log(`Concluindo etapa do item ${itemOsId}`);

      const etapaAtual = await this.prisma.workflowInstanciaSetor.findFirst({
        where: {
          item_os_id: itemOsId,
          status: 'EM_ANDAMENTO',
        },
      });

      if (!etapaAtual) {
        throw new BadRequestException(
          'Nenhuma etapa em andamento encontrada para este item.',
        );
      }

      await this.prisma.workflowInstanciaSetor.update({
        where: { id: etapaAtual.id },
        data: {
          status: 'CONCLUIDA',
          data_conclusao: new Date(),
          observacoes: observacoes,
          atualizado_em: new Date(),
        },
      });

      const itemOS = await this.prisma.itemOS.findUnique({
        where: { id: itemOsId },
        include: { os: true },
      });

      if (itemOS) {
        await this.prisma.apontamento.create({
          data: {
            os_id: itemOS.os_id,
            tipo: 'CONCLUSAO',
            data_apontamento: new Date(),
            usuario_id: operadorId,
            observacoes: observacoes,
            quantidade_produzida: quantidadeProduzida,
          },
        });
      }

      await this.liberarProximoGrupo(
        etapaAtual.workflow_instancia_id,
        etapaAtual.ordem ?? 0,
      );

      this.logger.log(`Etapa concluida com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao concluir etapa:`, error);
      throw error;
    }
  }

  private async liberarProximoGrupo(
    workflowInstanciaId: string,
    ordemAtual: number,
  ) {
    const pendentesNoGrupo = await this.prisma.workflowInstanciaSetor.findFirst(
      {
        where: {
          workflow_instancia_id: workflowInstanciaId,
          ordem: ordemAtual,
          status: {
            in: ['PENDENTE', 'EM_ANDAMENTO'],
          },
        },
      },
    );

    if (pendentesNoGrupo) {
      return;
    }

    const proximoGrupo = await this.prisma.workflowInstanciaSetor.findFirst({
      where: {
        workflow_instancia_id: workflowInstanciaId,
        ordem: { gt: ordemAtual },
        status: 'AGUARDANDO',
      },
      orderBy: {
        ordem: 'asc',
      },
    });

    if (!proximoGrupo) {
      await this.prisma.workflowInstancia.update({
        where: { id: workflowInstanciaId },
        data: {
          status: 'CONCLUIDO',
          data_fim: new Date(),
          etapa_atual: null,
          atualizado_em: new Date(),
        },
      });
      return;
    }

    await this.prisma.workflowInstanciaSetor.updateMany({
      where: {
        workflow_instancia_id: workflowInstanciaId,
        ordem: proximoGrupo.ordem,
        status: 'AGUARDANDO',
      },
      data: {
        status: 'PENDENTE',
        atualizado_em: new Date(),
      },
    });

    await this.prisma.workflowInstancia.update({
      where: { id: workflowInstanciaId },
      data: {
        etapa_atual: proximoGrupo.setor_id,
        atualizado_em: new Date(),
      },
    });
  }

  /**
   * Aplica filtros na query
   */
  private aplicarFiltros(filtros?: KanbanQueryDto): any {
    if (!filtros) return {};

    const where: any = {};

    if (filtros.status) {
      where.status = filtros.status;
    }

    if (filtros.dataInicio) {
      where.data_prazo = {
        ...where.data_prazo,
        gte: new Date(filtros.dataInicio),
      };
    }

    if (filtros.dataFim) {
      where.data_prazo = {
        ...where.data_prazo,
        lte: new Date(filtros.dataFim),
      };
    }

    return where;
  }
}
