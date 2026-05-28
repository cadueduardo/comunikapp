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
  KanbanPorSetores,
  StatusSetorProdutivo,
} from '../entities/pcp.entities';
import { KanbanQueryDto } from '../dto/kanban.dto';
import { KanbanMapper } from '../mappers/kanban.mapper';
import { SetoresProdutivosService } from '../../configuracoes/services/centros-de-trabalho/setores-produtivos.service';
import { AuthenticatedUser } from '../../auth/auth.service';

@Injectable()
export class PCPKanbanService {
  private readonly logger = new Logger(PCPKanbanService.name);
  private readonly funcoesOperacionaisPCP = new Set([
    'ADMINISTRADOR',
    'PRODUCAO',
  ]);

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
      // Kanban e os alertas.
      //
      // IMPORTANTE: APROVADA_TECNICA precisa entrar aqui. O serviço
      // `aprovarOSTecnica` (os.service.ts e aprovacao-tecnica.service.ts)
      // grava o status `APROVADA_TECNICA` e NÃO promove automaticamente
      // para `LIBERADA_PARA_PCP` — a promoção depende de o usuário entrar
      // em `/pcp` e vincular um workflow manualmente. Até esse passo
      // acontecer, a OS precisa ser visível no Kanban (coluna FILA via
      // KanbanMapper.mapearStatusOS) para o operador saber que existe
      // trabalho pendente.
      //
      // PRODUCAO/ACABAMENTO/AGUARDANDO_MATERIAL cobrem OS que avançaram pelo
      // botão "Iniciar produção" do `OSWorkflowActions` sem passar pelo
      // checkpoint formal de PCP.
      const osLiberadas = await this.prisma.ordemServico.findMany({
        where: {
          loja_id: lojaId,
          aprovacao_tecnica_status: 'APROVADA',
          status: {
            in: [
              'APROVADA_TECNICA',
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
    lojaId: string,
    setorId: string,
    operadorId?: string,
  ): Promise<OSCardKanban[]> {
    try {
      this.logger.log(`Obtendo fila do setor ${setorId}`);

      await this.setoresProdutivosService.obterPorId(setorId, lojaId);

      // Buscar instâncias de workflow do setor, limitadas à loja atual.
      const instanciasSetor = await this.prisma.workflowInstanciaSetor.findMany(
        {
          where: {
            setor_id: setorId,
            workflow_instancia: {
              os: {
                loja_id: lojaId,
              },
            },
            status: {
              in: ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA'],
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
   * Obtém a visão gerencial do PCP Completo, agrupando itens por setor.
   */
  async obterKanbanPorSetores(lojaId: string): Promise<KanbanPorSetores> {
    try {
      this.logger.log(`Obtendo kanban por setores para loja ${lojaId}`);

      const [setores, instanciasSetor] = await Promise.all([
        this.setoresProdutivosService.listar(lojaId, true),
        this.prisma.workflowInstanciaSetor.findMany({
          where: {
            status: {
              in: ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA'],
            },
            workflow_instancia: {
              os: {
                loja_id: lojaId,
              },
            },
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
          orderBy: [{ ordem: 'asc' }, { criado_em: 'asc' }],
        }),
      ]);

      const cardsPorSetor = new Map<string, OSCardKanban[]>();
      for (const instancia of instanciasSetor) {
        const cards = cardsPorSetor.get(instancia.setor_id) ?? [];
        cards.push(KanbanMapper.mapearInstanciaParaKanban(instancia));
        cardsPorSetor.set(instancia.setor_id, cards);
      }

      const colunas = setores.map((setor) => {
        const cards = cardsPorSetor.get(setor.id) ?? [];
        return {
          id: `setor-${setor.id}`,
          setor_id: setor.id,
          titulo: setor.nome,
          cor: setor.cor,
          ordem: setor.ordem,
          total: cards.length,
          pendentes: cards.filter((card) => card.status === 'PENDENTE').length,
          em_andamento: cards.filter((card) => card.status === 'EM_ANDAMENTO')
            .length,
          pausadas: cards.filter((card) => card.status === 'PAUSADA').length,
          cards,
        };
      });

      return {
        colunas,
        total: instanciasSetor.length,
        gerado_em: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Erro ao obter kanban por setores:`, error);
      throw error;
    }
  }

  /**
   * Atualiza o status operacional de uma OS diretamente no Kanban.
   * Mantido simples para viabilizar o endpoint administrativo.
   */
  async atualizarStatusOS(
    lojaId: string,
    osId: string,
    status: string,
    usuario?: AuthenticatedUser,
  ): Promise<void> {
    this.validarPermissaoOperacional(usuario);
    const statusPersistido = this.mapearStatusKanbanParaOS(status);

    try {
      const resultado = await this.prisma.ordemServico.updateMany({
        where: { id: osId, loja_id: lojaId },
        data: {
          status: statusPersistido,
          atualizado_em: new Date(),
        },
      });

      if (resultado.count === 0) {
        throw new NotFoundException(`OS ${osId} nao encontrada nesta loja.`);
      }

      this.logger.log(`Status da OS ${osId} atualizado para ${statusPersistido}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status da OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Inicia produção de um item
   */
  async iniciarProducao(
    lojaId: string,
    itemOsId: string,
    operadorId: string,
    observacoes?: string,
    usuario?: AuthenticatedUser,
  ): Promise<void> {
    try {
      await this.validarOperadorDaAcao(lojaId, operadorId, usuario);
      this.logger.log(
        `Iniciando producao do item ${itemOsId} pelo operador ${operadorId}`,
      );

      const etapa = await this.prisma.workflowInstanciaSetor.findFirst({
        where: {
          item_os_id: itemOsId,
          status: { in: ['PENDENTE', 'PAUSADA'] },
          workflow_instancia: {
            os: {
              loja_id: lojaId,
            },
          },
        },
      });

      if (!etapa) {
        throw new BadRequestException(
          'Etapa nao disponivel para inicio (aguardando liberacao ou ja iniciada).',
        );
      }

      const tipoApontamento = etapa.status === 'PAUSADA' ? 'RETOMADA' : 'INICIO';

      await this.prisma.workflowInstanciaSetor.update({
        where: { id: etapa.id },
        data: {
          status: 'EM_ANDAMENTO',
          operador_id: operadorId,
          data_inicio: etapa.data_inicio ?? new Date(),
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
            tipo: tipoApontamento,
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
    lojaId: string,
    itemOsId: string,
    operadorId: string,
    observacoes?: string,
    quantidadeProduzida?: number,
    usuario?: AuthenticatedUser,
  ): Promise<void> {
    try {
      await this.validarOperadorDaAcao(lojaId, operadorId, usuario);
      this.logger.log(`Concluindo etapa do item ${itemOsId}`);

      const etapaAtual = await this.prisma.workflowInstanciaSetor.findFirst({
        where: {
          item_os_id: itemOsId,
          status: 'EM_ANDAMENTO',
          workflow_instancia: {
            os: {
              loja_id: lojaId,
            },
          },
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

  /**
   * Pausa uma etapa em andamento e registra apontamento operacional.
   */
  async pausarProducao(
    lojaId: string,
    itemOsId: string,
    operadorId: string,
    motivo: string,
    observacoes?: string,
    usuario?: AuthenticatedUser,
  ): Promise<void> {
    try {
      await this.validarOperadorDaAcao(lojaId, operadorId, usuario);
      this.logger.log(`Pausando producao do item ${itemOsId}`);

      const etapa = await this.prisma.workflowInstanciaSetor.findFirst({
        where: {
          item_os_id: itemOsId,
          status: 'EM_ANDAMENTO',
          workflow_instancia: {
            os: {
              loja_id: lojaId,
            },
          },
        },
      });

      if (!etapa) {
        throw new BadRequestException(
          'Nenhuma etapa em andamento encontrada para pausa.',
        );
      }

      const observacaoPausa = observacoes
        ? `Motivo da pausa: ${motivo}. ${observacoes}`
        : `Motivo da pausa: ${motivo}.`;

      await this.prisma.workflowInstanciaSetor.update({
        where: { id: etapa.id },
        data: {
          status: 'PAUSADA',
          operador_id: operadorId,
          observacoes: observacaoPausa,
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
            tipo: 'PAUSA',
            data_apontamento: new Date(),
            usuario_id: operadorId,
            observacoes: observacaoPausa,
          },
        });
      }

      this.logger.log(`Producao pausada com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao pausar producao:`, error);
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

  private validarPermissaoOperacional(usuario?: AuthenticatedUser): void {
    if (!usuario) {
      return;
    }

    if (!this.funcoesOperacionaisPCP.has(String(usuario.funcao))) {
      throw new BadRequestException(
        'Usuario sem permissao operacional para movimentar o PCP.',
      );
    }
  }

  private async validarOperadorDaAcao(
    lojaId: string,
    operadorId: string,
    usuario?: AuthenticatedUser,
  ): Promise<void> {
    this.validarPermissaoOperacional(usuario);

    if (
      usuario &&
      usuario.funcao !== 'ADMINISTRADOR' &&
      usuario.id !== operadorId
    ) {
      throw new BadRequestException(
        'Operador informado nao corresponde ao usuario autenticado.',
      );
    }

    const operador = await this.prisma.usuario.findFirst({
      where: {
        id: operadorId,
        loja_id: lojaId,
        status: 'ATIVO',
        email_verificado: true,
      },
      select: { id: true },
    });

    if (!operador) {
      throw new BadRequestException(
        'Operador invalido ou sem acesso a esta loja.',
      );
    }
  }

  private mapearStatusKanbanParaOS(status: string): string {
    const mapeamento: Record<string, string> = {
      FILA: 'LIBERADA_PARA_PCP',
      PRODUCAO: 'PRODUCAO',
      CONCLUIDA: 'FINALIZADA',
      REJEITADA: 'REJEITADA',
    };

    const statusPersistido = mapeamento[status];
    if (!statusPersistido) {
      throw new BadRequestException('Status invalido para o Kanban do PCP.');
    }

    return statusPersistido;
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
