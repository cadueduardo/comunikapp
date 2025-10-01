import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EtapaInstanciaData, CreateEtapaInstanciaDto, UpdateEtapaInstanciaDto } from '../interfaces/pcp.interfaces';

@Injectable()
export class EtapaService {
  constructor(private prisma: PrismaService) {}

  async criarEtapa(dto: CreateEtapaInstanciaDto): Promise<EtapaInstanciaData> {
    // Verificar se workflow_instancia existe
    const workflowInstancia = await this.prisma.workflowInstancia.findUnique({
      where: { id: dto.workflow_instancia_id }
    });

    if (!workflowInstancia) {
      throw new NotFoundException('Instância de workflow não encontrada');
    }

    // Verificar se já existe etapa com a mesma ordem
    const etapaExistente = await this.prisma.etapaInstancia.findFirst({
      where: {
        workflow_instancia_id: dto.workflow_instancia_id,
        ordem: dto.ordem
      }
    });

    if (etapaExistente) {
      throw new BadRequestException('Já existe uma etapa com esta ordem neste workflow');
    }

    const etapa = await this.prisma.etapaInstancia.create({
      data: {
        workflow_instancia_id: dto.workflow_instancia_id,
        etapa_nome: dto.etapa_nome,
        ordem: dto.ordem,
        responsavel_id: dto.responsavel_id,
        tempo_estimado: dto.tempo_estimado,
        observacoes: dto.observacoes,
        status: 'PENDENTE'
      },
      include: {
        checklists: {
          orderBy: { ordem: 'asc' }
        },
        apontamentos: {
          orderBy: { data_apontamento: 'desc' }
        }
      }
    });

    return this.converterParaInterface(etapa);
  }

  async buscarPorId(id: string): Promise<EtapaInstanciaData | null> {
    const etapa = await this.prisma.etapaInstancia.findUnique({
      where: { id },
      include: {
        checklists: {
          orderBy: { ordem: 'asc' }
        },
        apontamentos: {
          orderBy: { data_apontamento: 'desc' }
        }
      }
    });

    return etapa ? this.converterParaInterface(etapa) : null;
  }

  async buscarPorWorkflow(workflowInstanciaId: string): Promise<EtapaInstanciaData[]> {
    const etapas = await this.prisma.etapaInstancia.findMany({
      where: { workflow_instancia_id: workflowInstanciaId },
      orderBy: { ordem: 'asc' },
      include: {
        checklists: {
          orderBy: { ordem: 'asc' }
        },
        apontamentos: {
          orderBy: { data_apontamento: 'desc' }
        }
      }
    });

    return etapas.map(etapa => this.converterParaInterface(etapa));
  }

  async atualizarEtapa(id: string, dto: UpdateEtapaInstanciaDto): Promise<EtapaInstanciaData> {
    const etapa = await this.prisma.etapaInstancia.findUnique({
      where: { id }
    });

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    const etapaAtualizada = await this.prisma.etapaInstancia.update({
      where: { id },
      data: {
        ...dto,
        atualizado_em: new Date()
      },
      include: {
        checklists: {
          orderBy: { ordem: 'asc' }
        },
        apontamentos: {
          orderBy: { data_apontamento: 'desc' }
        }
      }
    });

    return this.converterParaInterface(etapaAtualizada);
  }

  async iniciarEtapa(id: string, responsavelId: string): Promise<EtapaInstanciaData> {
    const etapa = await this.prisma.etapaInstancia.findUnique({
      where: { id }
    });

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    if (etapa.status !== 'PENDENTE') {
      throw new BadRequestException('Etapa não pode ser iniciada no status atual');
    }

    const etapaAtualizada = await this.prisma.etapaInstancia.update({
      where: { id },
      data: {
        status: 'EM_ANDAMENTO',
        data_inicio: new Date(),
        responsavel_id: responsavelId,
        atualizado_em: new Date()
      },
      include: {
        checklists: {
          orderBy: { ordem: 'asc' }
        },
        apontamentos: {
          orderBy: { data_apontamento: 'desc' }
        }
      }
    });

    return this.converterParaInterface(etapaAtualizada);
  }

  async concluirEtapa(id: string, observacoes?: string): Promise<EtapaInstanciaData> {
    const etapa = await this.prisma.etapaInstancia.findUnique({
      where: { id },
      include: { checklists: true }
    });

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    if (etapa.status !== 'EM_ANDAMENTO') {
      throw new BadRequestException('Etapa não pode ser concluída no status atual');
    }

    // Verificar se todos os checklists obrigatórios foram concluídos
    const checklistsObrigatorios = etapa.checklists.filter(c => c.obrigatorio);
    const checklistsConcluidos = checklistsObrigatorios.filter(c => c.concluido);

    if (checklistsConcluidos.length !== checklistsObrigatorios.length) {
      throw new BadRequestException('Todos os checklists obrigatórios devem ser concluídos');
    }

    const etapaAtualizada = await this.prisma.etapaInstancia.update({
      where: { id },
      data: {
        status: 'CONCLUIDA',
        data_fim: new Date(),
        observacoes: observacoes || etapa.observacoes,
        atualizado_em: new Date()
      },
      include: {
        checklists: {
          orderBy: { ordem: 'asc' }
        },
        apontamentos: {
          orderBy: { data_apontamento: 'desc' }
        }
      }
    });

    return this.converterParaInterface(etapaAtualizada);
  }

  async deletarEtapa(id: string): Promise<void> {
    const etapa = await this.prisma.etapaInstancia.findUnique({
      where: { id }
    });

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    await this.prisma.etapaInstancia.delete({
      where: { id }
    });
  }

  private converterParaInterface(etapa: any): EtapaInstanciaData {
    return {
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
    };
  }
}
