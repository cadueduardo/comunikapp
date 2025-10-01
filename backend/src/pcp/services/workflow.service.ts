import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowInstanciaData, CreateWorkflowInstanciaDto, UpdateWorkflowInstanciaDto } from '../interfaces/pcp.interfaces';
import { OSPCPIntegrationService } from './os-pcp-integration.service';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private osPCPIntegration: OSPCPIntegrationService
  ) {}

  async criarInstancia(dto: CreateWorkflowInstanciaDto): Promise<WorkflowInstanciaData> {
    // Verificar se OS existe
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: dto.os_id }
    });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    // Verificar se já existe instância para esta OS
    const instanciaExistente = await this.prisma.workflowInstancia.findUnique({
      where: { os_id: dto.os_id }
    });

    if (instanciaExistente) {
      throw new BadRequestException('Já existe uma instância de workflow para esta OS');
    }

    // Verificar se workflow existe
    const workflow = await this.prisma.workflowOS.findUnique({
      where: { id: dto.workflow_id }
    });

    if (!workflow) {
      throw new NotFoundException('Workflow não encontrado');
    }

    // Criar instância
    const instancia = await this.prisma.workflowInstancia.create({
      data: {
        os_id: dto.os_id,
        workflow_id: dto.workflow_id,
        status: 'ATIVO',
        etapa_atual: dto.etapa_atual,
        data_inicio: new Date()
      },
      include: {
        workflow: true,
        etapas: {
          orderBy: { ordem: 'asc' }
        }
      }
    });

    // Notificar módulo OS sobre criação da instância
    await this.osPCPIntegration.notificarInstanciaCriada(dto.os_id, instancia.id);

    return this.converterParaInterface(instancia);
  }

  async buscarPorOS(osId: string): Promise<WorkflowInstanciaData | null> {
    const instancia = await this.prisma.workflowInstancia.findUnique({
      where: { os_id: osId },
      include: {
        workflow: true,
        etapas: {
          orderBy: { ordem: 'asc' },
          include: {
            checklists: {
              orderBy: { ordem: 'asc' }
            },
            apontamentos: {
              orderBy: { data_apontamento: 'desc' }
            }
          }
        }
      }
    });

    return instancia ? this.converterParaInterface(instancia) : null;
  }

  async atualizarStatus(id: string, dto: UpdateWorkflowInstanciaDto): Promise<WorkflowInstanciaData> {
    const instancia = await this.prisma.workflowInstancia.findUnique({
      where: { id }
    });

    if (!instancia) {
      throw new NotFoundException('Instância de workflow não encontrada');
    }

    const instanciaAtualizada = await this.prisma.workflowInstancia.update({
      where: { id },
      data: {
        ...dto,
        atualizado_em: new Date()
      },
      include: {
        workflow: true,
        etapas: {
          orderBy: { ordem: 'asc' }
        }
      }
    });

    // Notificar módulo OS sobre mudança de status
    await this.osPCPIntegration.notificarStatusAlterado(instancia.os_id, dto.status);

    return this.converterParaInterface(instanciaAtualizada);
  }

  async listarInstancias(filtros?: {
    status?: string;
    workflow_id?: string;
    data_inicio?: Date;
    data_fim?: Date;
  }): Promise<WorkflowInstanciaData[]> {
    const instancias = await this.prisma.workflowInstancia.findMany({
      where: {
        ...filtros
      },
      include: {
        workflow: true,
        etapas: {
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { data_inicio: 'desc' }
    });

    return instancias.map(instancia => this.converterParaInterface(instancia));
  }

  async deletarInstancia(id: string): Promise<void> {
    const instancia = await this.prisma.workflowInstancia.findUnique({
      where: { id }
    });

    if (!instancia) {
      throw new NotFoundException('Instância de workflow não encontrada');
    }

    // Notificar módulo OS sobre remoção da instância
    await this.osPCPIntegration.notificarInstanciaRemovida(instancia.os_id);

    await this.prisma.workflowInstancia.delete({
      where: { id }
    });
  }

  private converterParaInterface(instancia: any): WorkflowInstanciaData {
    return {
      id: instancia.id,
      os_id: instancia.os_id,
      workflow_id: instancia.workflow_id,
      status: instancia.status,
      etapa_atual: instancia.etapa_atual,
      data_inicio: instancia.data_inicio,
      data_fim: instancia.data_fim,
      criado_em: instancia.criado_em,
      atualizado_em: instancia.atualizado_em,
      workflow: instancia.workflow,
      etapas: instancia.etapas?.map(etapa => ({
        id: etapa.id,
        workflow_instancia_id: etapa.workflow_instancia_id,
        etapa_nome: etapa.etapa_nome,
        ordem: etapa.ordem,
        status: etapa.status,
        data_inicio: etapa.data_inicio,
        data_fim: etapa.data_fim,
        responsavel_id: etapa.responsavel_id,
        tempo_estimado: etapa.tempo_estimado,
        tempo_real: etapa.tempo_real,
        observacoes: etapa.observacoes,
        criado_em: etapa.criado_em,
        atualizado_em: etapa.atualizado_em,
        checklists: etapa.checklists?.map(checklist => ({
          id: checklist.id,
          etapa_instancia_id: checklist.etapa_instancia_id,
          item_descricao: checklist.item_descricao,
          obrigatorio: checklist.obrigatorio,
          concluido: checklist.concluido,
          concluido_por: checklist.concluido_por,
          data_conclusao: checklist.data_conclusao,
          observacoes: checklist.observacoes,
          ordem: checklist.ordem,
          criado_em: checklist.criado_em,
          atualizado_em: checklist.atualizado_em
        })),
        apontamentos: etapa.apontamentos?.map(apontamento => ({
          id: apontamento.id,
          os_id: apontamento.os_id,
          etapa_instancia_id: apontamento.etapa_instancia_id,
          tipo: apontamento.tipo,
          data_apontamento: apontamento.data_apontamento,
          usuario_id: apontamento.usuario_id,
          observacoes: apontamento.observacoes,
          quantidade_produzida: apontamento.quantidade_produzida,
          quantidade_refugo: apontamento.quantidade_refugo,
          tempo_gasto: apontamento.tempo_gasto,
          ip_origem: apontamento.ip_origem,
          user_agent: apontamento.user_agent,
          criado_em: apontamento.criado_em
        }))
      }))
    };
  }
}
