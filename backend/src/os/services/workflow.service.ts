/**
 * Service para gestao de Workflows configuraveis
 * Limite: <= 400 linhas conforme premissas
 * Funcionalidades: CRUD workflows, validacao de etapas, configuracao por loja
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from '../dto/workflow.dto';
import { WorkflowData, EtapaWorkflow } from '../interfaces/os.interfaces';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== CRUD DE WORKFLOWS =====

  async create(
    lojaId: string,
    createWorkflowDto: CreateWorkflowDto,
  ): Promise<WorkflowData> {
    try {
      this.logger.log(
        `Criando workflow "${createWorkflowDto.nome}" para loja ${lojaId}`,
      );

      // Validar se ja existe workflow com mesmo nome
      const workflowExistente = await this.prisma.workflowOS.findFirst({
        where: { loja_id: lojaId, nome: createWorkflowDto.nome },
      });

      if (workflowExistente) {
        throw new BadRequestException(
          `Ja existe um workflow com o nome "${createWorkflowDto.nome}"`,
        );
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

      this.logger.log(`Workflow "${workflow.nome}" criado com sucesso`);
      return this.formatarWorkflow(workflow);
    } catch (error) {
      this.logger.error('Erro ao criar workflow:', error);
      throw error;
    }
  }

  async findAll(lojaId: string, ativos = true): Promise<WorkflowData[]> {
    try {
      const workflows = await this.prisma.workflowOS.findMany({
        where: {
          loja_id: lojaId,
          ...(ativos && { ativo: true }),
        },
        orderBy: { criado_em: 'desc' },
      });

      return workflows.map((workflow) => this.formatarWorkflow(workflow));
    } catch (error) {
      this.logger.error('Erro ao listar workflows:', error);
      throw error;
    }
  }

  async findOne(id: string, lojaId: string): Promise<WorkflowData> {
    try {
      const workflow = await this.prisma.workflowOS.findFirst({
        where: { id, loja_id: lojaId },
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow com ID ${id} nao encontrado`);
      }

      return this.formatarWorkflow(workflow);
    } catch (error) {
      this.logger.error('Erro ao buscar workflow:', error);
      throw error;
    }
  }

  async update(
    id: string,
    lojaId: string,
    updateWorkflowDto: UpdateWorkflowDto,
  ): Promise<WorkflowData> {
    try {
      const workflowExistente = await this.prisma.workflowOS.findFirst({
        where: { id, loja_id: lojaId },
      });

      if (!workflowExistente) {
        throw new NotFoundException(`Workflow com ID ${id} nao encontrado`);
      }

      // Validar etapas se fornecidas
      if (updateWorkflowDto.etapas) {
        this.validarEtapas(updateWorkflowDto.etapas);
      }

      const workflow = await this.prisma.workflowOS.update({
        where: { id },
        data: {
          ...updateWorkflowDto,
          ...(updateWorkflowDto.etapas && {
            etapas: JSON.stringify(updateWorkflowDto.etapas),
          }),
        },
      });

      this.logger.log(`Workflow "${workflow.nome}" atualizado com sucesso`);
      return this.formatarWorkflow(workflow);
    } catch (error) {
      this.logger.error('Erro ao atualizar workflow:', error);
      throw error;
    }
  }

  async remove(id: string, lojaId: string): Promise<void> {
    try {
      const workflow = await this.prisma.workflowOS.findFirst({
        where: { id, loja_id: lojaId },
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow com ID ${id} nao encontrado`);
      }

      await this.prisma.workflowOS.update({
        where: { id },
        data: { ativo: false },
      });

      this.logger.log(`Workflow "${workflow.nome}" desativado com sucesso`);
    } catch (error) {
      this.logger.error('Erro ao desativar workflow:', error);
      throw error;
    }
  }

  // ===== WORKFLOW PADRAO =====

  async criarWorkflowPadrao(lojaId: string): Promise<WorkflowData> {
    try {
      this.logger.log(`Criando workflow padrao para loja ${lojaId}`);

      const etapasPadrao = [
        {
          nome: 'FILA',
          descricao: 'OS aguardando inicio da producao',
          ordem: 1,
          obrigatoria: true,
          tempo_estimado: 0,
        },
        {
          nome: 'PRODUCAO',
          descricao: 'Processo de impressao e producao',
          ordem: 2,
          obrigatoria: true,
          tempo_estimado: 240, // 4 horas
        },
        {
          nome: 'ACABAMENTO',
          descricao: 'Finalizacao e acabamento',
          ordem: 3,
          obrigatoria: true,
          tempo_estimado: 60, // 1 hora
        },
        {
          nome: 'FINALIZADA',
          descricao: 'OS concluida e pronta para entrega',
          ordem: 4,
          obrigatoria: true,
          tempo_estimado: 0,
        },
      ];

      const workflow = await this.prisma.workflowOS.create({
        data: {
          loja_id: lojaId,
          nome: 'Workflow Padrao',
          descricao: 'Workflow padrao para producao de comunicacao visual',
          etapas: JSON.stringify(etapasPadrao),
          sequencial: true,
          ativo: true,
        },
      });

      this.logger.log(`Workflow padrao criado com sucesso para loja ${lojaId}`);
      return this.formatarWorkflow(workflow);
    } catch (error) {
      this.logger.error('Erro ao criar workflow padrao:', error);
      throw error;
    }
  }

  // ===== VALIDACAO DE TRANSICOES =====

  async validarTransicaoWorkflow(
    workflowId: string,
    lojaId: string,
    etapaOrigem: string,
    etapaDestino: string,
  ): Promise<{ valida: boolean; motivo?: string }> {
    try {
      const workflow = await this.findOne(workflowId, lojaId);
      const etapas = workflow.etapas;

      // Verificar se as etapas existem
      const etapaOrigemExiste = etapas.find((e) => e.nome === etapaOrigem);
      const etapaDestinoExiste = etapas.find((e) => e.nome === etapaDestino);

      if (!etapaOrigemExiste) {
        return {
          valida: false,
          motivo: `Etapa origem "${etapaOrigem}" nao existe no workflow`,
        };
      }

      if (!etapaDestinoExiste) {
        return {
          valida: false,
          motivo: `Etapa destino "${etapaDestino}" nao existe no workflow`,
        };
      }

      // Verificar se e sequencial
      if (workflow.sequencial) {
        const ordemOrigem = etapaOrigemExiste.ordem;
        const ordemDestino = etapaDestinoExiste.ordem;

        if (ordemDestino !== ordemOrigem + 1) {
          return {
            valida: false,
            motivo: `Workflow e sequencial. So e possivel avancar para a proxima etapa`,
          };
        }
      }

      return { valida: true };
    } catch (error) {
      this.logger.error('Erro ao validar transicao:', error);
      return { valida: false, motivo: 'Erro interno na validacao' };
    }
  }

  // ===== METODOS AUXILIARES =====

  private validarEtapas(etapas: any[]): void {
    if (!etapas || etapas.length === 0) {
      throw new BadRequestException('Workflow deve ter pelo menos uma etapa');
    }

    // Verificar se todas as etapas tem ordem unica
    const ordens = etapas.map((e) => e.ordem);
    const ordensUnicas = new Set(ordens);
    if (ordens.length !== ordensUnicas.size) {
      throw new BadRequestException('Etapas devem ter ordens unicas');
    }

    // Verificar se pelo menos uma etapa e obrigatoria
    const temObrigatoria = etapas.some((e) => e.obrigatoria);
    if (!temObrigatoria) {
      throw new BadRequestException(
        'Workflow deve ter pelo menos uma etapa obrigatoria',
      );
    }
  }

  private formatarWorkflow(workflow: any): WorkflowData {
    return {
      id: workflow.id,
      loja_id: workflow.loja_id,
      nome: workflow.nome,
      descricao: workflow.descricao,
      etapas: JSON.parse(workflow.etapas || '[]'),
      ativo: workflow.ativo,
      sequencial: workflow.sequencial,
      criado_em: workflow.criado_em,
      atualizado_em: workflow.atualizado_em,
    };
  }
}
