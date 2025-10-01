/**
 * Service para gestão de instâncias de workflow PCP
 * Limite: <= 400 linhas conforme premissas
 * Funcionalidades: CRUD instâncias, controle de etapas, apontamentos
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EstoqueApontamentoService } from './estoque-apontamento.service';
import {
  WorkflowInstanciaData,
  EtapaInstanciaData,
  ChecklistInstanciaData,
  ApontamentoData,
  CreateWorkflowInstanciaDto,
  CreateEtapaInstanciaDto,
  CreateChecklistInstanciaDto,
  CreateApontamentoDto,
  UpdateWorkflowInstanciaDto,
  UpdateEtapaInstanciaDto,
  UpdateChecklistInstanciaDto,
  StatusWorkflowInstancia,
  StatusEtapaInstancia,
  TipoApontamento,
  EstatisticasWorkflow,
  EstatisticasApontamento,
} from '../interfaces/workflow-pcp.interfaces';

@Injectable()
export class WorkflowInstanciaService {
  private readonly logger = new Logger(WorkflowInstanciaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly estoqueApontamentoService: EstoqueApontamentoService
  ) {}

  // ===== CRUD WORKFLOW INSTÂNCIA =====

  async criarInstancia(
    lojaId: string,
    createDto: CreateWorkflowInstanciaDto,
    usuarioId: string
  ): Promise<WorkflowInstanciaData> {
    try {
      this.logger.log(`Criando instância de workflow para OS ${createDto.os_id}`);

      // 1. Verificar se OS existe e pertence à loja
      const os = await this.prisma.ordemServico.findFirst({
        where: {
          id: createDto.os_id,
          loja_id: lojaId,
        },
      });

      if (!os) {
        throw new NotFoundException(`OS ${createDto.os_id} não encontrada`);
      }

      // 2. Verificar se já existe instância para esta OS
      const instanciaExistente = await this.prisma.workflowInstancia.findUnique({
        where: { os_id: createDto.os_id },
      });

      if (instanciaExistente) {
        throw new BadRequestException('Já existe instância de workflow para esta OS');
      }

      // 3. Verificar se workflow existe e está ativo
      const workflow = await this.prisma.workflowOS.findFirst({
        where: {
          id: createDto.workflow_id,
          loja_id: lojaId,
          ativo: true,
        },
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow ${createDto.workflow_id} não encontrado ou inativo`);
      }

      // 4. Criar instância
      const instancia = await this.prisma.workflowInstancia.create({
        data: {
          os_id: createDto.os_id,
          workflow_id: createDto.workflow_id,
          status: StatusWorkflowInstancia.ATIVO,
          etapa_atual: createDto.etapa_atual,
        },
      });

      // 5. Criar etapas baseadas no workflow
      const etapasWorkflow = JSON.parse(workflow.etapas);
      const etapasCriadas = [];

      for (const etapa of etapasWorkflow) {
        const etapaInstancia = await this.prisma.etapaInstancia.create({
          data: {
            workflow_instancia_id: instancia.id,
            etapa_nome: etapa.nome,
            ordem: etapa.ordem,
            status: StatusEtapaInstancia.PENDENTE,
            tempo_estimado: etapa.tempo_estimado,
            responsavel_id: etapa.responsaveis_permitidos?.[0], // Primeiro responsável
          },
        });

        // Criar checklists se existirem
        if (etapa.checklist && etapa.checklist.length > 0) {
          for (const item of etapa.checklist) {
            await this.prisma.checklistInstancia.create({
              data: {
                etapa_instancia_id: etapaInstancia.id,
                item_descricao: item.descricao,
                obrigatorio: item.obrigatorio ?? true,
                ordem: item.ordem ?? 0,
              },
            });
          }
        }

        etapasCriadas.push(etapaInstancia);
      }

      this.logger.log(`[OK] Instância de workflow criada - ID: ${instancia.id}`);
      return {
        ...instancia,
        etapas: etapasCriadas,
      } as unknown as WorkflowInstanciaData;
    } catch (error) {
      this.logger.error(`Erro ao criar instância de workflow: ${error.message}`);
      throw error;
    }
  }

  async buscarInstanciaPorOS(osId: string, lojaId: string): Promise<WorkflowInstanciaData> {
    const instancia = await this.prisma.workflowInstancia.findFirst({
      where: {
        os_id: osId,
        os: { loja_id: lojaId },
      },
      include: {
        workflow: true,
        etapas: {
          include: {
            checklists: true,
            apontamentos: true,
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!instancia) {
      throw new NotFoundException(`Instância de workflow não encontrada para OS ${osId}`);
    }

    return instancia as unknown as WorkflowInstanciaData;
  }

  async atualizarInstancia(
    instanciaId: string,
    updateDto: UpdateWorkflowInstanciaDto,
    usuarioId: string
  ): Promise<WorkflowInstanciaData> {
    try {
      const instancia = await this.prisma.workflowInstancia.update({
        where: { id: instanciaId },
        data: {
          ...updateDto,
          atualizado_em: new Date(),
        },
        include: {
          workflow: true,
          etapas: {
            include: {
              checklists: true,
              apontamentos: true,
            },
            orderBy: { ordem: 'asc' },
          },
        },
      });

      this.logger.log(`[OK] Instância de workflow atualizada - ID: ${instanciaId}`);
      return instancia as unknown as WorkflowInstanciaData;
    } catch (error) {
      this.logger.error(`Erro ao atualizar instância de workflow: ${error.message}`);
      throw error;
    }
  }

  // ===== CONTROLE DE ETAPAS =====

  async avancarEtapa(
    instanciaId: string,
    etapaId: string,
    usuarioId: string,
    observacoes?: string
  ): Promise<EtapaInstanciaData> {
    try {
      // 1. Buscar etapa atual
      const etapaAtual = await this.prisma.etapaInstancia.findFirst({
        where: {
          id: etapaId,
          workflow_instancia_id: instanciaId,
        },
      });

      if (!etapaAtual) {
        throw new NotFoundException(`Etapa ${etapaId} não encontrada`);
      }

      // 2. Verificar se todos os checklists obrigatórios foram concluídos
      const checklistsPendentes = await this.prisma.checklistInstancia.findMany({
        where: {
          etapa_instancia_id: etapaId,
          obrigatorio: true,
          concluido: false,
        },
      });

      if (checklistsPendentes.length > 0) {
        throw new BadRequestException(
          `Etapa não pode ser concluída. ${checklistsPendentes.length} checklists obrigatórios pendentes`
        );
      }

      // 3. Finalizar etapa atual
      await this.prisma.etapaInstancia.update({
        where: { id: etapaId },
        data: {
          status: StatusEtapaInstancia.CONCLUIDA,
          data_fim: new Date(),
          observacoes: observacoes,
        },
      });

      // 4. Buscar próxima etapa
      const proximaEtapa = await this.prisma.etapaInstancia.findFirst({
        where: {
          workflow_instancia_id: instanciaId,
          ordem: { gt: etapaAtual.ordem },
          status: StatusEtapaInstancia.PENDENTE,
        },
        orderBy: { ordem: 'asc' },
      });

      if (proximaEtapa) {
        // 5. Iniciar próxima etapa
        await this.prisma.etapaInstancia.update({
          where: { id: proximaEtapa.id },
          data: {
            status: StatusEtapaInstancia.EM_ANDAMENTO,
            data_inicio: new Date(),
            responsavel_id: usuarioId,
          },
        });

        // 6. Atualizar etapa atual da instância
        await this.prisma.workflowInstancia.update({
          where: { id: instanciaId },
          data: {
            etapa_atual: proximaEtapa.etapa_nome,
          },
        });

        return await this.buscarEtapa(proximaEtapa.id);
      } else {
        // 7. Finalizar workflow se não há próxima etapa
        await this.prisma.workflowInstancia.update({
          where: { id: instanciaId },
          data: {
            status: StatusWorkflowInstancia.CONCLUIDO,
            data_fim: new Date(),
            etapa_atual: null,
          },
        });

        return etapaAtual as EtapaInstanciaData;
      }
    } catch (error) {
      this.logger.error(`Erro ao avançar etapa: ${error.message}`);
      throw error;
    }
  }

  async buscarEtapa(etapaId: string): Promise<EtapaInstanciaData> {
    const etapa = await this.prisma.etapaInstancia.findUnique({
      where: { id: etapaId },
      include: {
        checklists: {
          orderBy: { ordem: 'asc' },
        },
        apontamentos: {
          orderBy: { data_apontamento: 'desc' },
        },
      },
    });

    if (!etapa) {
      throw new NotFoundException(`Etapa ${etapaId} não encontrada`);
    }

    return etapa as unknown as EtapaInstanciaData;
  }

  // ===== APONTAMENTOS =====

  async criarApontamento(
    lojaId: string,
    createDto: CreateApontamentoDto,
    usuarioId: string
  ): Promise<ApontamentoData> {
    try {
      // 1. Verificar se OS existe e pertence à loja
      const os = await this.prisma.ordemServico.findFirst({
        where: {
          id: createDto.os_id,
          loja_id: lojaId,
        },
      });

      if (!os) {
        throw new NotFoundException(`OS ${createDto.os_id} não encontrada`);
      }

      // 2. Processar operações de estoque se necessário
      let resultadoEstoque = null;
      if (this.deveProcessarEstoque(createDto.tipo)) {
        try {
          resultadoEstoque = await this.estoqueApontamentoService.processarOperacaoEstoque(
            createDto.os_id,
            createDto.tipo,
            createDto.quantidade_produzida,
            createDto.quantidade_refugo,
            createDto.observacoes
          );

          // Adicionar alertas de estoque às observações
          if (resultadoEstoque.alertas.length > 0) {
            const alertasTexto = resultadoEstoque.alertas.join('; ');
            createDto.observacoes = createDto.observacoes 
              ? `${createDto.observacoes} | Alertas: ${alertasTexto}`
              : `Alertas: ${alertasTexto}`;
          }

          // Se houve erros críticos, não criar o apontamento
          if (!resultadoEstoque.sucesso && resultadoEstoque.erros.length > 0) {
            throw new BadRequestException(
              `Erro ao processar estoque: ${resultadoEstoque.erros.join('; ')}`
            );
          }
        } catch (error) {
          this.logger.warn(`Erro ao processar estoque para apontamento: ${error.message}`);
          // Continua criando o apontamento mesmo com erro de estoque
        }
      }

      // 3. Criar apontamento
      const apontamento = await this.prisma.apontamento.create({
        data: {
          os_id: createDto.os_id,
          etapa_instancia_id: createDto.etapa_instancia_id,
          tipo: createDto.tipo,
          usuario_id: usuarioId,
          observacoes: createDto.observacoes,
          quantidade_produzida: createDto.quantidade_produzida,
          quantidade_refugo: createDto.quantidade_refugo,
          tempo_gasto: createDto.tempo_gasto,
          ip_origem: createDto.ip_origem,
          user_agent: createDto.user_agent,
        },
      });

      this.logger.log(`[OK] Apontamento criado - ID: ${apontamento.id}`);
      
      // 4. Log do resultado do estoque
      if (resultadoEstoque) {
        this.logger.log(
          `Operações de estoque: ${resultadoEstoque.operacoes_realizadas.length} realizadas, ` +
          `${resultadoEstoque.erros.length} erros, ${resultadoEstoque.alertas.length} alertas`
        );
      }

      return apontamento as unknown as ApontamentoData;
    } catch (error) {
      this.logger.error(`Erro ao criar apontamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Determina se o tipo de apontamento deve processar operações de estoque
   */
  private deveProcessarEstoque(tipo: string): boolean {
    return [
      'INICIO',
      'CONCLUSAO', 
      'REFUGO'
    ].includes(tipo);
  }

  async listarApontamentosOS(osId: string, lojaId: string): Promise<ApontamentoData[]> {
    const apontamentos = await this.prisma.apontamento.findMany({
      where: {
        os_id: osId,
        os: { loja_id: lojaId },
      },
      include: {
        etapa_instancia: true,
      },
      orderBy: { data_apontamento: 'desc' },
    });

    return apontamentos as unknown as ApontamentoData[];
  }

  // ===== CHECKLISTS =====

  async atualizarChecklist(
    checklistId: string,
    updateDto: UpdateChecklistInstanciaDto,
    usuarioId: string
  ): Promise<ChecklistInstanciaData> {
    try {
      const checklist = await this.prisma.checklistInstancia.update({
        where: { id: checklistId },
        data: {
          ...updateDto,
          concluido_por: updateDto.concluido ? usuarioId : null,
          data_conclusao: updateDto.concluido ? new Date() : null,
          atualizado_em: new Date(),
        },
      });

      this.logger.log(`[OK] Checklist atualizado - ID: ${checklistId}`);
      return checklist as ChecklistInstanciaData;
    } catch (error) {
      this.logger.error(`Erro ao atualizar checklist: ${error.message}`);
      throw error;
    }
  }

  // ===== ESTATÍSTICAS =====

  async obterEstatisticasWorkflow(lojaId: string): Promise<EstatisticasWorkflow> {
    const [
      totalInstancias,
      instanciasAtivas,
      instanciasConcluidas,
      instanciasPausadas,
    ] = await Promise.all([
      this.prisma.workflowInstancia.count({
        where: { os: { loja_id: lojaId } },
      }),
      this.prisma.workflowInstancia.count({
        where: {
          os: { loja_id: lojaId },
          status: StatusWorkflowInstancia.ATIVO,
        },
      }),
      this.prisma.workflowInstancia.count({
        where: {
          os: { loja_id: lojaId },
          status: StatusWorkflowInstancia.CONCLUIDO,
        },
      }),
      this.prisma.workflowInstancia.count({
        where: {
          os: { loja_id: lojaId },
          status: StatusWorkflowInstancia.PAUSADO,
        },
      }),
    ]);

    // Calcular tempo médio de execução
    const instanciasComTempo = await this.prisma.workflowInstancia.findMany({
      where: {
        os: { loja_id: lojaId },
        data_fim: { not: null },
      },
      select: {
        data_inicio: true,
        data_fim: true,
      },
    });

    const tempoMedioExecucao = instanciasComTempo.length > 0
      ? instanciasComTempo.reduce((acc, instancia) => {
          const tempo = instancia.data_fim!.getTime() - instancia.data_inicio.getTime();
          return acc + (tempo / (1000 * 60)); // Converter para minutos
        }, 0) / instanciasComTempo.length
      : 0;

    return {
      total_instancias: totalInstancias,
      instancias_ativas: instanciasAtivas,
      instancias_concluidas: instanciasConcluidas,
      instancias_pausadas: instanciasPausadas,
      tempo_medio_execucao: Math.round(tempoMedioExecucao),
      etapas_mais_demoradas: [], // TODO: Implementar consulta complexa
    };
  }

  async obterEstatisticasApontamento(lojaId: string): Promise<EstatisticasApontamento> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [
      totalApontamentos,
      apontamentosHoje,
      apontamentosComTempo,
    ] = await Promise.all([
      this.prisma.apontamento.count({
        where: { os: { loja_id: lojaId } },
      }),
      this.prisma.apontamento.count({
        where: {
          os: { loja_id: lojaId },
          data_apontamento: { gte: hoje },
        },
      }),
      this.prisma.apontamento.findMany({
        where: {
          os: { loja_id: lojaId },
          tempo_gasto: { not: null },
        },
        select: {
          tempo_gasto: true,
          quantidade_produzida: true,
          quantidade_refugo: true,
        },
      }),
    ]);

    const tempoTotalProducao = apontamentosComTempo.reduce(
      (acc, ap) => acc + (ap.tempo_gasto || 0),
      0
    );

    const quantidadeTotalProduzida = apontamentosComTempo.reduce(
      (acc, ap) => acc + Number(ap.quantidade_produzida || 0),
      0
    );

    const quantidadeTotalRefugo = apontamentosComTempo.reduce(
      (acc, ap) => acc + Number(ap.quantidade_refugo || 0),
      0
    );

    const eficiencia = quantidadeTotalProduzida > 0
      ? ((quantidadeTotalProduzida - quantidadeTotalRefugo) / quantidadeTotalProduzida) * 100
      : 0;

    return {
      total_apontamentos: totalApontamentos,
      apontamentos_hoje: apontamentosHoje,
      tempo_total_producao: tempoTotalProducao,
      quantidade_total_produzida: quantidadeTotalProduzida,
      quantidade_total_refugo: quantidadeTotalRefugo,
      eficiencia: Math.round(eficiencia * 100) / 100,
    };
  }
}
