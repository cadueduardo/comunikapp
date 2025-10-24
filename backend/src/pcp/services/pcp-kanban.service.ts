import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OSCardKanban, KanbanStats, StatusSetorProdutivo } from '../entities/pcp.entities';
import { KanbanQueryDto } from '../dto/kanban.dto';
import { KanbanMapper } from '../mappers/kanban.mapper';
import { SetoresProdutivosService } from '../../configuracoes/services/centros-de-trabalho/setores-produtivos.service';

@Injectable()
export class PCPKanbanService {
  private readonly logger = new Logger(PCPKanbanService.name);

  constructor(
    private prisma: PrismaService,
    private setoresProdutivosService: SetoresProdutivosService
  ) {}

  /**
   * Obtém dados do kanban geral para uma loja
   */
  async obterKanbanGeral(lojaId: string, filtros?: KanbanQueryDto): Promise<{
    cards: OSCardKanban[];
    stats: KanbanStats;
  }> {
    try {
      this.logger.log(`Obtendo kanban geral para loja ${lojaId}`);

      // Buscar OSs liberadas para PCP (reaproveitando lógica existente)
      const osLiberadas = await this.prisma.ordemServico.findMany({
        where: {
          loja_id: lojaId,
          status: {
            in: ['LIBERADA_PARA_PCP', 'EM_WORKFLOW', 'FINALIZADA']
          },
          ...this.aplicarFiltros(filtros)
        },
        include: {
          cliente: true,
          workflow_instancia: {
            include: {
              workflow: true,
              etapas: {
                where: { status: 'EM_ANDAMENTO' }
              }
            }
          },
          itens: true
        },
        orderBy: { data_prazo: 'asc' }
      });

      // Converter para formato do kanban
      const cards: OSCardKanban[] = osLiberadas.map(os => KanbanMapper.mapearOSParaKanban(os));
      
      // Calcular estatísticas
      const stats = KanbanMapper.calcularEstatisticas(cards);

      this.logger.log(`Kanban obtido: ${cards.length} OSs, ${stats.total} total`);
      
      return { cards, stats };
    } catch (error) {
      this.logger.error(`Erro ao obter kanban geral:`, error);
      throw error;
    }
  }

  /**
   * Obtém fila de um setor específico
   */
  async obterFilaSetor(setorId: string, operadorId?: string): Promise<OSCardKanban[]> {
    try {
      this.logger.log(`Obtendo fila do setor ${setorId}`);

      // Buscar instâncias de workflow do setor
      const instanciasSetor = await this.prisma.workflowInstanciaSetor.findMany({
        where: {
          setor_id: setorId,
          status: {
            in: ['PENDENTE', 'EM_ANDAMENTO']
          },
          ...(operadorId && { operador_id: operadorId })
        },
        include: {
          item_os: {
            include: {
              os: {
                include: {
                  cliente: true
                }
              }
            }
          },
          setor: true,
          operador: true,
          workflow_instancia: {
            include: {
              os: {
                include: {
                  cliente: true
                }
              }
            }
          }
        },
        orderBy: [
          { criado_em: 'asc' },
          { ordem: 'asc' }
        ]
      });

      // Converter para formato do kanban
      const cards: OSCardKanban[] = instanciasSetor.map(instancia => 
        KanbanMapper.mapearInstanciaParaKanban(instancia)
      );

      this.logger.log(`Fila do setor obtida: ${cards.length} itens`);
      
      return cards;
    } catch (error) {
      this.logger.error(`Erro ao obter fila do setor:`, error);
      throw error;
    }
  }

  /**
   * Inicia produção de um item
   */
  async iniciarProducao(itemOsId: string, operadorId: string, observacoes?: string): Promise<void> {
    try {
      this.logger.log(`Iniciando produção do item ${itemOsId} pelo operador ${operadorId}`);

      // Atualizar instância do setor
      await this.prisma.workflowInstanciaSetor.updateMany({
        where: {
          item_os_id: itemOsId,
          status: 'PENDENTE'
        },
        data: {
          status: 'EM_ANDAMENTO',
          operador_id: operadorId,
          data_inicio: new Date(),
          observacoes: observacoes
        }
      });

      // Criar apontamento de início
      const itemOS = await this.prisma.itemOS.findUnique({
        where: { id: itemOsId },
        include: { os: true }
      });

      if (itemOS) {
        await this.prisma.apontamento.create({
          data: {
            os_id: itemOS.os_id,
            tipo: 'INICIO',
            data_apontamento: new Date(),
            usuario_id: operadorId,
            observacoes: observacoes
          }
        });
      }

      this.logger.log(`Produção iniciada com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao iniciar produção:`, error);
      throw error;
    }
  }

  /**
   * Conclui etapa de produção
   */
  async concluirEtapa(itemOsId: string, operadorId: string, observacoes?: string, quantidadeProduzida?: number): Promise<void> {
    try {
      this.logger.log(`Concluindo etapa do item ${itemOsId}`);

      // Atualizar instância do setor
      await this.prisma.workflowInstanciaSetor.updateMany({
        where: {
          item_os_id: itemOsId,
          status: 'EM_ANDAMENTO'
        },
        data: {
          status: 'CONCLUIDA',
          data_conclusao: new Date(),
          observacoes: observacoes
        }
      });

      // Criar apontamento de conclusão
      const itemOS = await this.prisma.itemOS.findUnique({
        where: { id: itemOsId },
        include: { os: true }
      });

      if (itemOS) {
        await this.prisma.apontamento.create({
          data: {
            os_id: itemOS.os_id,
            tipo: 'CONCLUSAO',
            data_apontamento: new Date(),
            usuario_id: operadorId, // Adicionar usuario_id obrigatório
            observacoes: observacoes,
            quantidade_produzida: quantidadeProduzida
          }
        });
      }

      this.logger.log(`Etapa concluída com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao concluir etapa:`, error);
      throw error;
    }
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
      where.data_prazo = { ...where.data_prazo, gte: new Date(filtros.dataInicio) };
    }

    if (filtros.dataFim) {
      where.data_prazo = { ...where.data_prazo, lte: new Date(filtros.dataFim) };
    }

    return where;
  }

}
