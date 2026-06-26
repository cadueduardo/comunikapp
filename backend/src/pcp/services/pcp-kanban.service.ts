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
import {
  KanbanQueryDto,
  KanbanPorSetoresQueryDto,
  PrazoBucketKanban,
  MoverItemSetorDto,
} from '../dto/kanban.dto';
import { KanbanMapper } from '../mappers/kanban.mapper';
import { SetoresProdutivosService } from '../../configuracoes/services/centros-de-trabalho/setores-produtivos.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { OSPCPIntegrationService } from './os-pcp-integration.service';
import { ExpedicaoCriacaoService } from '../../expedicao/services/expedicao-criacao.service';
import { obterLimiarHorasAtrasUtc } from '../../common/utils/utc-time.util';
import { deveExibirCardConcluidoPronto24h } from '../utils/pronto-24h-kanban.util';

/** Janela UTC da coluna «Pronto» (`CONCLUIDA`) no kanban geral do PCP. */
const JANELA_HORAS_COLUNA_PRONTO = 24;

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
    private osPcpIntegration: OSPCPIntegrationService,
    private expedicaoCriacaoService: ExpedicaoCriacaoService,
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
          ativo: true,
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
              workflow: {
                include: {
                  workflow_setores: {
                    orderBy: { ordem: 'asc' },
                    include: { setor: { select: { nome: true } } },
                  },
                },
              },
              instancias_setor: {
                include: {
                  setor: { select: { nome: true } },
                  operador: { select: { nome: true } },
                },
              },
            },
          },
          itens: true,
        },
        orderBy: [
          { aprovacao_tecnica_em: 'desc' },
          { criado_em: 'desc' },
        ],
      });

      // Converter para formato do kanban
      const cardsBrutos: OSCardKanban[] = osLiberadas.map((os) =>
        KanbanMapper.mapearOSParaKanban(os),
      );

      const cards = this.filtrarCardsColunaConcluida24h(osLiberadas, cardsBrutos);

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
                instancias_setor: {
                  select: {
                    id: true,
                    setor_id: true,
                    ordem: true,
                    status: true,
                    item_os_id: true,
                  },
                },
                os: {
                  include: {
                    cliente: true,
                  },
                },
                workflow: {
                  include: {
                    workflow_setores: {
                      orderBy: { ordem: 'asc' },
                      include: { setor: { select: { nome: true } } },
                    },
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
  async obterKanbanPorSetores(
    lojaId: string,
    filtros?: KanbanPorSetoresQueryDto,
  ): Promise<KanbanPorSetores> {
    try {
      this.logger.log(`Obtendo kanban por setores para loja ${lojaId}`);

      const where = this.montarWhereKanbanPorSetores(lojaId, filtros);

      const [setores, instanciasSetor] = await Promise.all([
        this.setoresProdutivosService.listar(lojaId, true),
        this.prisma.workflowInstanciaSetor.findMany({
          where,
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
                instancias_setor: {
                  select: {
                    id: true,
                    setor_id: true,
                    ordem: true,
                    status: true,
                    item_os_id: true,
                  },
                },
                os: {
                  include: {
                    cliente: true,
                  },
                },
                workflow: {
                  include: {
                    workflow_setores: {
                      orderBy: { ordem: 'asc' },
                      include: { setor: { select: { nome: true } } },
                    },
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
        const pendentes = cards.filter((card) => card.status === 'PENDENTE').length;
        const emAndamento = cards.filter(
          (card) => card.status === 'EM_ANDAMENTO',
        ).length;
        const pausadas = cards.filter((card) => card.status === 'PAUSADA').length;
        const atrasadas = cards.filter((card) =>
          this.estaAtrasada(card.data_prazo),
        ).length;
        const scoreGargalo = this.calcularScoreGargalo({
          pendentes,
          pausadas,
          atrasadas,
        });

        return {
          id: `setor-${setor.id}`,
          setor_id: setor.id,
          titulo: setor.nome,
          cor: setor.cor,
          ordem: setor.ordem,
          total: cards.length,
          pendentes,
          em_andamento: emAndamento,
          pausadas,
          atrasadas,
          score_gargalo: scoreGargalo,
          nivel_gargalo: this.classificarNivelGargalo(scoreGargalo),
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
  ): Promise<{ expedicao_criada: boolean; expedicao_cancelada: boolean }> {
    this.validarPermissaoOperacional(usuario);
    const statusPersistido = this.mapearStatusKanbanParaOS(status);

    try {
      const osAtual = await this.prisma.ordemServico.findFirst({
        where: { id: osId, loja_id: lojaId },
        select: { status: true },
      });

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

      let expedicaoCriada = false;
      let expedicaoCancelada = false;

      if (statusPersistido === 'FINALIZADA') {
        await this.finalizarWorkflowDaOs(osId);

        try {
          const criacao = await this.expedicaoCriacaoService.criarSeElegivel(
            osId,
            lojaId,
          );
          expedicaoCriada = criacao.criado === true;
        } catch (error) {
          this.logger.error(
            `Falha ao criar expedição para OS ${osId} após conclusão no kanban PCP:`,
            error,
          );
        }
      } else if (osAtual?.status === 'FINALIZADA') {
        const cancelamento =
          await this.expedicaoCriacaoService.cancelarPorReversaoConclusaoPcp(
            osId,
            lojaId,
          );
        expedicaoCancelada = cancelamento.cancelada;
      }

      this.logger.log(`Status da OS ${osId} atualizado para ${statusPersistido}`);
      return {
        expedicao_criada: expedicaoCriada,
        expedicao_cancelada: expedicaoCancelada,
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar status da OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Encerra workflow e setores pendentes quando a OS é marcada como FINALIZADA
   * via drag no kanban (inclui retrabalho devolvido da expedição).
   */
  private async finalizarWorkflowDaOs(osId: string): Promise<void> {
    const workflowInstancia = await this.prisma.workflowInstancia.findFirst({
      where: { os_id: osId },
      select: { id: true, status: true },
    });

    if (!workflowInstancia || workflowInstancia.status === 'CONCLUIDO') {
      return;
    }

    const agora = new Date();

    await this.prisma.$transaction([
      this.prisma.workflowInstanciaSetor.updateMany({
        where: {
          workflow_instancia_id: workflowInstancia.id,
          status: { notIn: ['CONCLUIDA', 'CANCELADA'] },
        },
        data: {
          status: 'CONCLUIDA',
          data_conclusao: agora,
          atualizado_em: agora,
        },
      }),
      this.prisma.workflowInstancia.update({
        where: { id: workflowInstancia.id },
        data: {
          status: 'CONCLUIDO',
          data_fim: agora,
          etapa_atual: null,
          atualizado_em: agora,
        },
      }),
    ]);

    try {
      await this.osPcpIntegration.notificarStatusAlterado(osId, 'CONCLUIDO');
    } catch (error) {
      this.logger.warn(
        `Workflow finalizado para OS ${osId}, mas notificação PCP falhou: ${
          error instanceof Error ? error.message : error
        }`,
      );
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
    maquinaId?: string,
  ): Promise<void> {
    try {
      await this.validarOperadorDaAcao(lojaId, operadorId, usuario);
      this.logger.log(
        `Iniciando producao do item ${itemOsId} pelo operador ${operadorId}`,
      );

      const etapa = await this.buscarInstanciaSetorPorReferencia(
        itemOsId,
        lojaId,
        { in: ['PENDENTE', 'PAUSADA'] },
      );

      if (!etapa) {
        throw new BadRequestException(
          'Etapa nao disponivel para inicio (aguardando liberacao ou ja iniciada).',
        );
      }

      const itemOsReferencia = etapa.item_os_id ?? itemOsId;
      if (maquinaId) {
        await this.vincularMaquinaPrevistaItemOS(
          itemOsReferencia,
          lojaId,
          maquinaId,
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

      const osId = await this.resolverOsIdDaInstanciaSetor(etapa.id);

      if (osId) {
        await this.prisma.apontamento.create({
          data: {
            os_id: osId,
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

      const etapaAtual = await this.buscarInstanciaSetorPorReferencia(
        itemOsId,
        lojaId,
        'EM_ANDAMENTO',
      );

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

      const osId = await this.resolverOsIdDaInstanciaSetor(etapaAtual.id);

      if (osId) {
        await this.prisma.apontamento.create({
          data: {
            os_id: osId,
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

      const etapa = await this.buscarInstanciaSetorPorReferencia(
        itemOsId,
        lojaId,
        'EM_ANDAMENTO',
      );

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

      const osId = await this.resolverOsIdDaInstanciaSetor(etapa.id);

      if (osId) {
        await this.prisma.apontamento.create({
          data: {
            os_id: osId,
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

  async moverItemEntreSetores(
    lojaId: string,
    itemOsId: string,
    data: MoverItemSetorDto,
    usuario?: AuthenticatedUser,
  ): Promise<void> {
    this.validarPermissaoOperacional(usuario);

    let etapaOrigem = await this.prisma.workflowInstanciaSetor.findFirst({
      where: {
        id: itemOsId,
        workflow_instancia: {
          os: {
            loja_id: lojaId,
          },
        },
        status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA'] },
      },
    });

    if (!etapaOrigem) {
      etapaOrigem = await this.buscarInstanciaSetorPorReferencia(
        itemOsId,
        lojaId,
        { in: ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA'] },
      );
    }

    if (!etapaOrigem) {
      throw new BadRequestException(
        'Item sem etapa ativa para movimentacao entre setores.',
      );
    }

    await this.setoresProdutivosService.obterPorId(data.setorDestinoId, lojaId);

    const etapaDestino = await this.prisma.workflowInstanciaSetor.findFirst({
      where: {
        workflow_instancia_id: etapaOrigem.workflow_instancia_id,
        item_os_id: etapaOrigem.item_os_id,
        setor_id: data.setorDestinoId,
      },
    });

    if (!etapaDestino) {
      throw new BadRequestException(
        'Setor destino nao pertence ao workflow deste item.',
      );
    }

    if (etapaDestino.id === etapaOrigem.id) {
      return;
    }

    if (etapaDestino.status === 'CONCLUIDA' || etapaDestino.status === 'CANCELADA') {
      throw new BadRequestException(
        'Setor destino ja esta encerrado para este item.',
      );
    }

    if (etapaDestino.ordem > etapaOrigem.ordem + 1) {
      throw new BadRequestException(
        'Movimentacao invalida: destino fora da proxima etapa permitida.',
      );
    }

    const statusDestino =
      etapaOrigem.status === 'EM_ANDAMENTO' ? 'EM_ANDAMENTO' : 'PENDENTE';
    const operadorDestino = data.operadorId ?? etapaOrigem.operador_id ?? null;
    if (operadorDestino) {
      await this.validarOperadorDaAcao(lojaId, operadorDestino, usuario);
    }

    const dataInicioDestino =
      statusDestino === 'EM_ANDAMENTO'
        ? etapaDestino.data_inicio ?? new Date()
        : etapaDestino.data_inicio;

    await this.prisma.$transaction(async (tx) => {
      await tx.workflowInstanciaSetor.update({
        where: { id: etapaOrigem.id },
        data: {
          status: 'CANCELADA',
          observacoes: data.observacoes
            ? `${etapaOrigem.observacoes ?? ''} Movida para outro setor: ${data.observacoes}`.trim()
            : etapaOrigem.observacoes,
          atualizado_em: new Date(),
        },
      });

      await tx.workflowInstanciaSetor.update({
        where: { id: etapaDestino.id },
        data: {
          status: statusDestino,
          operador_id: operadorDestino,
          data_inicio: dataInicioDestino,
          atualizado_em: new Date(),
        },
      });

      await tx.workflowInstancia.update({
        where: { id: etapaOrigem.workflow_instancia_id },
        data: {
          etapa_atual: etapaDestino.setor_id,
          atualizado_em: new Date(),
        },
      });
    });
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
      const workflowInstancia = await this.prisma.workflowInstancia.findUnique({
        where: { id: workflowInstanciaId },
        select: {
          os_id: true,
          os: { select: { loja_id: true } },
        },
      });

      await this.prisma.workflowInstancia.update({
        where: { id: workflowInstanciaId },
        data: {
          status: 'CONCLUIDO',
          data_fim: new Date(),
          etapa_atual: null,
          atualizado_em: new Date(),
        },
      });

      if (workflowInstancia?.os_id && workflowInstancia.os?.loja_id) {
        await this.osPcpIntegration.notificarStatusAlterado(
          workflowInstancia.os_id,
          'CONCLUIDO',
        );

        try {
          await this.expedicaoCriacaoService.criarSeElegivel(
            workflowInstancia.os_id,
            workflowInstancia.os.loja_id,
          );
        } catch (error) {
          this.logger.error(
            `Falha ao criar expedição para OS ${workflowInstancia.os_id} após conclusão do PCP:`,
            error,
          );
        }
      }
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

  private montarWhereKanbanPorSetores(
    lojaId: string,
    filtros?: KanbanPorSetoresQueryDto,
  ): any {
    const where: any = {
      status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA'] },
      workflow_instancia: {
        os: this.montarFiltroOSPorSetores(lojaId, filtros),
      },
    };

    if (filtros?.setorId) {
      where.setor_id = filtros.setorId;
    }

    if (filtros?.operadorId) {
      where.operador_id = filtros.operadorId;
    }

    return where;
  }

  private montarFiltroOSPorSetores(
    lojaId: string,
    filtros?: KanbanPorSetoresQueryDto,
  ): any {
    const osAnd: any[] = [];

    if (filtros?.prioridade) {
      osAnd.push({ prioridade: filtros.prioridade });
    }

    const rangeClause = this.montarFiltroRangePrazo(
      filtros?.dataInicial,
      filtros?.dataFinal,
    );
    if (rangeClause) {
      osAnd.push(rangeClause);
    }

    const bucketClause = this.montarFiltroBucketPrazo(filtros?.prazoBucket);
    if (bucketClause) {
      osAnd.push(bucketClause);
    }

    if (osAnd.length === 0) {
      return { loja_id: lojaId };
    }

    return {
      loja_id: lojaId,
      AND: osAnd,
    };
  }

  private montarFiltroRangePrazo(
    dataInicial?: string,
    dataFinal?: string,
  ): any | null {
    if (!dataInicial && !dataFinal) {
      return null;
    }

    const dataPrazo: Record<string, Date> = {};
    if (dataInicial) {
      dataPrazo.gte = this.inicioDoDia(dataInicial);
    }
    if (dataFinal) {
      dataPrazo.lte = this.fimDoDia(dataFinal);
    }

    return { data_prazo: dataPrazo };
  }

  private montarFiltroBucketPrazo(bucket?: PrazoBucketKanban): any | null {
    if (!bucket) {
      return null;
    }

    const hoje = this.inicioDoDia(new Date());
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    switch (bucket) {
      case PrazoBucketKanban.ATRASADOS:
        return { data_prazo: { lt: hoje } };
      case PrazoBucketKanban.VENCE_HOJE:
        return { data_prazo: { gte: hoje, lt: amanha } };
      case PrazoBucketKanban.ESTA_SEMANA: {
        const fimSemana = this.fimDaSemana(hoje);
        return { data_prazo: { gte: hoje, lte: fimSemana } };
      }
      case PrazoBucketKanban.SEM_PRAZO:
        return { data_prazo: null };
      default:
        return null;
    }
  }

  private inicioDoDia(data: string | Date): Date {
    const d = typeof data === 'string' ? new Date(data) : new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private fimDoDia(data: string | Date): Date {
    const d = typeof data === 'string' ? new Date(data) : new Date(data);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private fimDaSemana(data: Date): Date {
    const d = new Date(data);
    const diaSemana = d.getDay(); // 0 dom ... 6 sab
    const diasAteDomingo = (7 - diaSemana) % 7;
    d.setDate(d.getDate() + diasAteDomingo);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private estaAtrasada(dataPrazo?: string): boolean {
    if (!dataPrazo) {
      return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(dataPrazo);
    prazo.setHours(0, 0, 0, 0);
    return prazo < hoje;
  }

  private calcularScoreGargalo({
    pendentes,
    pausadas,
    atrasadas,
  }: {
    pendentes: number;
    pausadas: number;
    atrasadas: number;
  }): number {
    // Pesos explícitos para manter leitura clara e determinística.
    return pendentes * 1 + pausadas * 2 + atrasadas * 3;
  }

  private classificarNivelGargalo(
    score: number,
  ): 'BAIXO' | 'MEDIO' | 'ALTO' {
    if (score >= 10) {
      return 'ALTO';
    }
    if (score >= 4) {
      return 'MEDIO';
    }
    return 'BAIXO';
  }

  private async vincularMaquinaPrevistaItemOS(
    itemOsId: string,
    lojaId: string,
    maquinaId: string,
  ): Promise<void> {
    const maquina = await this.prisma.maquina.findFirst({
      where: {
        id: maquinaId,
        loja_id: lojaId,
        ativo: true,
      },
      select: { id: true, nome: true },
    });

    if (!maquina) {
      throw new BadRequestException(
        'Máquina não encontrada ou inativa para esta loja.',
      );
    }

    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemOsId,
        os: { loja_id: lojaId },
      },
      select: { id: true, parametros_tecnicos: true },
    });

    if (!item) {
      throw new BadRequestException('Item da OS não encontrado.');
    }

    let parametros: Record<string, unknown> = {};
    if (item.parametros_tecnicos) {
      try {
        parametros =
          typeof item.parametros_tecnicos === 'string'
            ? JSON.parse(item.parametros_tecnicos)
            : (item.parametros_tecnicos as Record<string, unknown>);
      } catch {
        parametros = {};
      }
    }

    const maquinasExistentes = Array.isArray(parametros.maquinas)
      ? (parametros.maquinas as Array<Record<string, unknown>>)
      : [];
    const horasExistentes =
      maquinasExistentes[0]?.horas_utilizadas ??
      maquinasExistentes[0]?.horas_uso ??
      null;

    parametros.maquina_id = maquina.id;
    parametros.maquinas = [
      {
        maquina_id: maquina.id,
        nome: maquina.nome,
        horas_utilizadas: horasExistentes,
      },
      ...maquinasExistentes.filter(
        (m) => (m.maquina_id ?? m.id) !== maquina.id,
      ),
    ];

    await this.prisma.itemOS.update({
      where: { id: item.id },
      data: {
        parametros_tecnicos: JSON.stringify(parametros),
      },
    });
  }

  private async buscarInstanciaSetorPorReferencia(
    referenciaItemId: string,
    lojaId: string,
    status: string | { in: string[] },
  ) {
    return this.prisma.workflowInstanciaSetor.findFirst({
      where: {
        OR: [{ id: referenciaItemId }, { item_os_id: referenciaItemId }],
        workflow_instancia: {
          os: {
            loja_id: lojaId,
          },
        },
        status,
      },
      orderBy: [{ ordem: 'asc' }, { criado_em: 'asc' }],
    });
  }

  private async resolverOsIdDaInstanciaSetor(
    instanciaSetorId: string,
  ): Promise<string | null> {
    const instancia = await this.prisma.workflowInstanciaSetor.findUnique({
      where: { id: instanciaSetorId },
      select: {
        item_os: { select: { os_id: true } },
        workflow_instancia: { select: { os_id: true } },
      },
    });

    return (
      instancia?.item_os?.os_id ?? instancia?.workflow_instancia?.os_id ?? null
    );
  }

  /**
   * Coluna «Pronto» (`CONCLUIDA`): exibe somente OS concluídas nas últimas 24h UTC.
   * Comparação em instantes UTC — independente do TZ do servidor (§2.7.3 do plano).
   */
  private filtrarCardsColunaConcluida24h(
    osLiberadas: Array<{
      id: string;
      status: string;
      atualizado_em: Date;
      workflow_instancia?: {
        status?: string;
        data_fim?: Date | null;
        instancias_setor?: Array<{ data_conclusao?: Date | null }>;
      } | null;
    }>,
    cards: OSCardKanban[],
  ): OSCardKanban[] {
    const limiarUtc = obterLimiarHorasAtrasUtc(JANELA_HORAS_COLUNA_PRONTO);
    const osPorId = new Map(osLiberadas.map((os) => [os.id, os]));

    return cards.filter((card) => {
      if (card.status !== 'CONCLUIDA') {
        return true;
      }

      const os = osPorId.get(card.id);
      if (!os) {
        return false;
      }

      return deveExibirCardConcluidoPronto24h(os, limiarUtc);
    });
  }
}
