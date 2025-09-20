/**
 * Service para gestão de Workflows configuráveis
 * Limite: ≤ 400 linhas conforme premissas
 * Funcionalidades: CRUD workflows, validação de etapas, configuração por loja
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from '../dto/workflow.dto';
import { WorkflowData, EtapaWorkflow } from '../interfaces/os.interfaces';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== CRUD DE WORKFLOWS =====

  async create(lojaId: string, createWorkflowDto: CreateWorkflowDto): Promise<WorkflowData> {
    try {
      this.logger.log(`Criando workflow "${createWorkflowDto.nome}" para loja ${lojaId}`);

      // Validar se já existe workflow com mesmo nome
      const workflowExistente = await this.prisma.workflowOS.findFirst({
        where: { loja_id: lojaId, nome: createWorkflowDto.nome },
      });

      if (workflowExistente) {
        throw new BadRequestException(`Já existe um workflow com o nome "${createWorkflowDto.nome}"`);
      }

      // Validar etapas
      this.validarEtapas(createWorkflowDto.etapas);

      // Criar workflow
      const workflow = await this.prisma.workflowOS.create({
        data: {
          loja_id: lojaId,
          nome: createWorkflowDto.nome,
          descricao: createWorkflowDto.descricao,
          etapas: JSON.stringify(createWorkflowDto.etapas),
          sequencial: createWorkflowDto.sequencial,
          ativo: true,
        },
      });

      this.logger.log(`✅ Workflow "${workflow.nome}" criado com sucesso`);
      return this.formatarWorkflow(workflow);
    } catch (error) {
      this.logger.error('Erro ao criar workflow:', error);
      throw error;
    }
  }

  async findAll(lojaId: string, apenasAtivos = true): Promise<WorkflowData[]> {
    try {
      const where: any = { loja_id: lojaId };
      if (apenasAtivos) where.ativo = true;

      const workflows = await this.prisma.workflowOS.findMany({
        where,
        orderBy: { criado_em: 'desc' },
      });

      return workflows.map(w => this.formatarWorkflow(w));
    } catch (error) {
      this.logger.error('Erro ao buscar workflows:', error);
      throw error;
    }
  }

  async findOne(id: string, lojaId: string): Promise<WorkflowData> {
    try {
      const workflow = await this.prisma.workflowOS.findFirst({
        where: { id, loja_id: lojaId },
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow com ID ${id} não encontrado`);
      }

      return this.formatarWorkflow(workflow);
    } catch (error) {
      this.logger.error(`Erro ao buscar workflow ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: string,
    lojaId: string,
    updateWorkflowDto: UpdateWorkflowDto,
  ): Promise<WorkflowData> {
    try {
      // Verificar se workflow existe
      await this.findOne(id, lojaId);

      // Preparar dados para atualização
      const dadosAtualizacao: any = {};
      
      if (updateWorkflowDto.nome) dadosAtualizacao.nome = updateWorkflowDto.nome;
      if (updateWorkflowDto.descricao) dadosAtualizacao.descricao = updateWorkflowDto.descricao;
      if (updateWorkflowDto.ativo !== undefined) dadosAtualizacao.ativo = updateWorkflowDto.ativo;
      if (updateWorkflowDto.sequencial !== undefined) dadosAtualizacao.sequencial = updateWorkflowDto.sequencial;
      
      if (updateWorkflowDto.etapas) {
        this.validarEtapas(updateWorkflowDto.etapas);
        dadosAtualizacao.etapas = JSON.stringify(updateWorkflowDto.etapas);
      }

      // Atualizar workflow
      const workflowAtualizado = await this.prisma.workflowOS.update({
        where: { id },
        data: dadosAtualizacao,
      });

      this.logger.log(`✅ Workflow "${workflowAtualizado.nome}" atualizado com sucesso`);
      return this.formatarWorkflow(workflowAtualizado);
    } catch (error) {
      this.logger.error(`Erro ao atualizar workflow ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string, lojaId: string): Promise<void> {
    try {
      // Verificar se workflow existe
      const workflow = await this.findOne(id, lojaId);

      // Verificar se há OS usando este workflow
      // TODO: Implementar verificação quando houver relacionamento

      // Desativar ao invés de excluir (soft delete)
      await this.prisma.workflowOS.update({
        where: { id },
        data: { ativo: false },
      });

      this.logger.log(`✅ Workflow "${workflow.nome}" desativado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao remover workflow ${id}:`, error);
      throw error;
    }
  }

  // ===== MÉTODOS ESPECÍFICOS =====

  async criarWorkflowPadrao(lojaId: string): Promise<WorkflowData> {
    try {
      const workflowPadrao: CreateWorkflowDto = {
        nome: 'Workflow Padrão',
        descricao: 'Workflow padrão para produção de comunicação visual',
        sequencial: true,
        etapas: [
          {
            nome: 'FILA',
            descricao: 'OS aguardando início da produção',
            ordem: 1,
            obrigatoria: true,
            tempo_estimado: 0,
            responsaveis_permitidos: ['ADMINISTRADOR', 'PRODUCAO', 'VENDAS'],
            checklist: [],
            acoes_automaticas: [],
          },
          {
            nome: 'PRODUCAO',
            descricao: 'Processo de impressão e produção',
            ordem: 2,
            obrigatoria: true,
            tempo_estimado: 240, // 4 horas
            responsaveis_permitidos: ['ADMINISTRADOR', 'PRODUCAO'],
            checklist: [
              { descricao: 'Verificar materiais disponíveis', obrigatorio: true, ordem: 1 },
              { descricao: 'Configurar máquina', obrigatorio: true, ordem: 2 },
              { descricao: 'Iniciar impressão', obrigatorio: true, ordem: 3 },
            ],
            acoes_automaticas: [
              { tipo: 'BAIXAR_ESTOQUE', configuracao: { percentual: 100 } },
            ],
          },
          {
            nome: 'ACABAMENTO',
            descricao: 'Acabamento final e controle de qualidade',
            ordem: 3,
            obrigatoria: true,
            tempo_estimado: 60, // 1 hora
            responsaveis_permitidos: ['ADMINISTRADOR', 'PRODUCAO'],
            checklist: [
              { descricao: 'Verificar qualidade da impressão', obrigatorio: true, ordem: 1 },
              { descricao: 'Realizar acabamento', obrigatorio: true, ordem: 2 },
              { descricao: 'Embalar produto', obrigatorio: false, ordem: 3 },
            ],
            acoes_automaticas: [],
          },
          {
            nome: 'FINALIZADA',
            descricao: 'OS concluída e pronta para entrega',
            ordem: 4,
            obrigatoria: true,
            tempo_estimado: 0,
            responsaveis_permitidos: ['ADMINISTRADOR', 'PRODUCAO'],
            checklist: [
              { descricao: 'Produto conferido e aprovado', obrigatorio: true, ordem: 1 },
            ],
            acoes_automaticas: [
              { tipo: 'NOTIFICAR', configuracao: { destinatarios: ['cliente', 'vendas'] } },
            ],
          },
        ],
      };

      return await this.create(lojaId, workflowPadrao);
    } catch (error) {
      this.logger.error('Erro ao criar workflow padrão:', error);
      throw error;
    }
  }

  async obterEtapasWorkflow(workflowId: string, lojaId: string): Promise<EtapaWorkflow[]> {
    try {
      const workflow = await this.findOne(workflowId, lojaId);
      return workflow.etapas;
    } catch (error) {
      this.logger.error(`Erro ao obter etapas do workflow ${workflowId}:`, error);
      throw error;
    }
  }

  async validarTransicaoWorkflow(
    workflowId: string,
    lojaId: string,
    etapaAtual: string,
    proximaEtapa: string,
  ): Promise<{ valida: boolean; motivo?: string }> {
    try {
      const workflow = await this.findOne(workflowId, lojaId);
      
      if (!workflow.ativo) {
        return { valida: false, motivo: 'Workflow está inativo' };
      }

      const etapas = workflow.etapas;
      const etapaAtualObj = etapas.find(e => e.nome === etapaAtual);
      const proximaEtapaObj = etapas.find(e => e.nome === proximaEtapa);

      if (!etapaAtualObj || !proximaEtapaObj) {
        return { valida: false, motivo: 'Etapa não encontrada no workflow' };
      }

      // Se workflow é sequencial, validar ordem
      if (workflow.sequencial) {
        const ordemAtual = etapaAtualObj.ordem;
        const ordemProxima = proximaEtapaObj.ordem;

        // Permitir avançar para próxima ou retroceder uma etapa
        const diferencaOrdem = ordemProxima - ordemAtual;
        if (diferencaOrdem !== 1 && diferencaOrdem !== -1) {
          return { 
            valida: false, 
            motivo: `Em workflow sequencial, só é possível avançar uma etapa ou retroceder uma etapa` 
          };
        }
      }

      return { valida: true };
    } catch (error) {
      this.logger.error('Erro ao validar transição de workflow:', error);
      return { valida: false, motivo: 'Erro interno na validação' };
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private validarEtapas(etapas: any[]): void {
    if (!etapas || etapas.length === 0) {
      throw new BadRequestException('Workflow deve ter pelo menos uma etapa');
    }

    // Verificar se há etapas duplicadas
    const nomesEtapas = etapas.map(e => e.nome);
    const nomesUnicos = new Set(nomesEtapas);
    if (nomesUnicos.size !== nomesEtapas.length) {
      throw new BadRequestException('Não é possível ter etapas com nomes duplicados');
    }

    // Verificar se há pelo menos uma etapa obrigatória
    const etapasObrigatorias = etapas.filter(e => e.obrigatoria);
    if (etapasObrigatorias.length === 0) {
      throw new BadRequestException('Workflow deve ter pelo menos uma etapa obrigatória');
    }

    // Validar ordem sequencial
    const ordens = etapas.map(e => e.ordem).sort((a, b) => a - b);
    for (let i = 0; i < ordens.length; i++) {
      if (ordens[i] !== i + 1) {
        throw new BadRequestException('Ordem das etapas deve ser sequencial (1, 2, 3, ...)');
      }
    }
  }

  private formatarWorkflow(workflow: any): WorkflowData {
    return {
      id: workflow.id,
      loja_id: workflow.loja_id,
      nome: workflow.nome,
      descricao: workflow.descricao,
      etapas: workflow.etapas ? JSON.parse(workflow.etapas) : [],
      ativo: workflow.ativo,
      sequencial: workflow.sequencial,
      criado_em: workflow.criado_em,
      atualizado_em: workflow.atualizado_em,
    };
  }
}
