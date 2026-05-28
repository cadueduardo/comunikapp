import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApontamentoData,
  CreateApontamentoDto,
  UpdateApontamentoDto,
} from '../interfaces/pcp.interfaces';
import { OSPCPIntegrationService } from './os-pcp-integration.service';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';

@Injectable()
export class ApontamentoService {
  constructor(
    private prisma: PrismaService,
    private osPCPIntegration: OSPCPIntegrationService,
    private validacaoEstoque: ValidacaoEstoqueService,
  ) {}

  async criarApontamento(
    lojaId: string,
    dto: CreateApontamentoDto,
  ): Promise<ApontamentoData> {
    await this.assertOsDaLoja(lojaId, dto.os_id);

    if (dto.etapa_instancia_id) {
      await this.assertEtapaDaLoja(lojaId, dto.etapa_instancia_id, dto.os_id);
    }

    this.validarTipoApontamento(dto.tipo, dto.etapa_instancia_id);

    const apontamento = await this.prisma.apontamento.create({
      data: {
        os_id: dto.os_id,
        etapa_instancia_id: dto.etapa_instancia_id,
        tipo: dto.tipo,
        data_apontamento: new Date(),
        usuario_id: dto.usuario_id || 'sistema',
        observacoes: dto.observacoes,
        quantidade_produzida: dto.quantidade_produzida,
        quantidade_refugo: dto.quantidade_refugo,
        tempo_gasto: dto.tempo_gasto,
        ip_origem: dto.ip_origem,
        user_agent: dto.user_agent,
      },
    });

    await this.processarIntegracaoEstoque(lojaId, apontamento);
    await this.osPCPIntegration.notificarApontamento(dto.os_id, dto.tipo);

    return this.converterParaInterface(apontamento);
  }

  async buscarPorOS(lojaId: string, osId: string): Promise<ApontamentoData[]> {
    await this.assertOsDaLoja(lojaId, osId);

    const apontamentos = await this.prisma.apontamento.findMany({
      where: {
        os_id: osId,
        os: { loja_id: lojaId },
      },
      orderBy: { data_apontamento: 'desc' },
    });

    return apontamentos.map((apontamento) =>
      this.converterParaInterface(apontamento),
    );
  }

  async buscarPorEtapa(
    lojaId: string,
    etapaInstanciaId: string,
  ): Promise<ApontamentoData[]> {
    await this.assertEtapaDaLoja(lojaId, etapaInstanciaId);

    const apontamentos = await this.prisma.apontamento.findMany({
      where: {
        etapa_instancia_id: etapaInstanciaId,
        os: { loja_id: lojaId },
      },
      orderBy: { data_apontamento: 'desc' },
    });

    return apontamentos.map((apontamento) =>
      this.converterParaInterface(apontamento),
    );
  }

  async buscarPorId(
    lojaId: string,
    id: string,
  ): Promise<ApontamentoData | null> {
    const apontamento = await this.prisma.apontamento.findFirst({
      where: {
        id,
        os: { loja_id: lojaId },
      },
    });

    return apontamento ? this.converterParaInterface(apontamento) : null;
  }

  async atualizarApontamento(
    lojaId: string,
    id: string,
    dto: UpdateApontamentoDto,
  ): Promise<ApontamentoData> {
    const apontamento = await this.prisma.apontamento.findFirst({
      where: {
        id,
        os: { loja_id: lojaId },
      },
    });

    if (!apontamento) {
      throw new NotFoundException('Apontamento não encontrado nesta loja.');
    }

    const tempoLimite = 24 * 60 * 60 * 1000;
    const tempoDecorrido = Date.now() - apontamento.data_apontamento.getTime();

    if (tempoDecorrido > tempoLimite) {
      throw new BadRequestException(
        'Apontamento não pode ser editado após 24 horas',
      );
    }

    const apontamentoAtualizado = await this.prisma.apontamento.update({
      where: { id },
      data: {
        observacoes: dto.observacoes,
        quantidade_produzida: dto.quantidade_produzida,
        quantidade_refugo: dto.quantidade_refugo,
        tempo_gasto: dto.tempo_gasto,
      },
    });

    return this.converterParaInterface(apontamentoAtualizado);
  }

  async deletarApontamento(lojaId: string, id: string): Promise<void> {
    const apontamento = await this.prisma.apontamento.findFirst({
      where: {
        id,
        os: { loja_id: lojaId },
      },
    });

    if (!apontamento) {
      throw new NotFoundException('Apontamento não encontrado nesta loja.');
    }

    const tempoLimite = 24 * 60 * 60 * 1000;
    const tempoDecorrido = Date.now() - apontamento.data_apontamento.getTime();

    if (tempoDecorrido > tempoLimite) {
      throw new BadRequestException(
        'Apontamento não pode ser deletado após 24 horas',
      );
    }

    await this.prisma.apontamento.delete({
      where: { id },
    });
  }

  async listarApontamentos(
    lojaId: string,
    filtros?: {
      os_id?: string;
      etapa_instancia_id?: string;
      tipo?: string;
      usuario_id?: string;
      data_inicio?: Date;
      data_fim?: Date;
    },
  ): Promise<ApontamentoData[]> {
    if (filtros?.os_id) {
      await this.assertOsDaLoja(lojaId, filtros.os_id);
    }

    if (filtros?.etapa_instancia_id) {
      await this.assertEtapaDaLoja(lojaId, filtros.etapa_instancia_id);
    }

    const apontamentos = await this.prisma.apontamento.findMany({
      where: {
        ...(filtros?.os_id && { os_id: filtros.os_id }),
        ...(filtros?.etapa_instancia_id && {
          etapa_instancia_id: filtros.etapa_instancia_id,
        }),
        ...(filtros?.tipo && { tipo: filtros.tipo }),
        ...(filtros?.usuario_id && { usuario_id: filtros.usuario_id }),
        ...(filtros?.data_inicio || filtros?.data_fim
          ? {
              data_apontamento: {
                ...(filtros.data_inicio && { gte: filtros.data_inicio }),
                ...(filtros.data_fim && { lte: filtros.data_fim }),
              },
            }
          : {}),
        os: { loja_id: lojaId },
      },
      orderBy: { data_apontamento: 'desc' },
    });

    return apontamentos.map((apontamento) =>
      this.converterParaInterface(apontamento),
    );
  }

  private async assertOsDaLoja(lojaId: string, osId: string): Promise<void> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: { id: true },
    });

    if (!os) {
      throw new NotFoundException(
        'Ordem de Serviço não encontrada nesta loja.',
      );
    }
  }

  private async assertEtapaDaLoja(
    lojaId: string,
    etapaInstanciaId: string,
    osIdEsperado?: string,
  ): Promise<void> {
    const etapa = await this.prisma.etapaInstancia.findFirst({
      where: {
        id: etapaInstanciaId,
        workflow_instancia: {
          os: { loja_id: lojaId },
        },
      },
      select: {
        id: true,
        workflow_instancia: {
          select: { os_id: true },
        },
      },
    });

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada nesta loja.');
    }

    if (osIdEsperado && etapa.workflow_instancia.os_id !== osIdEsperado) {
      throw new BadRequestException(
        'Etapa não pertence à Ordem de Serviço informada.',
      );
    }
  }

  private validarTipoApontamento(
    tipo: string,
    etapaInstanciaId?: string,
  ): void {
    const tiposValidos = ['INICIO', 'PAUSA', 'RETOMADA', 'CONCLUSAO', 'REFUGO'];

    if (!tiposValidos.includes(tipo)) {
      throw new BadRequestException(`Tipo de apontamento inválido: ${tipo}`);
    }

    if (tipo === 'INICIO' && !etapaInstanciaId) {
      throw new BadRequestException(
        'Apontamento de INÍCIO deve estar associado a uma etapa',
      );
    }

    if (tipo === 'CONCLUSAO' && !etapaInstanciaId) {
      throw new BadRequestException(
        'Apontamento de CONCLUSÃO deve estar associado a uma etapa',
      );
    }
  }

  private async processarIntegracaoEstoque(
    lojaId: string,
    apontamento: { id: string; os_id: string; tipo: string },
  ): Promise<void> {
    const tiposComEstoque = ['INICIO', 'CONCLUSAO', 'REFUGO'];

    if (!tiposComEstoque.includes(apontamento.tipo)) {
      return;
    }

    try {
      const os = await this.prisma.ordemServico.findFirst({
        where: { id: apontamento.os_id, loja_id: lojaId },
        include: { itens: true },
      });

      if (!os?.itens?.length) {
        return;
      }

      // TODO: integração real de estoque quando estrutura de itens estiver completa
      void this.validacaoEstoque;
    } catch (error) {
      console.error(
        `Erro ao processar integração com estoque para apontamento ${apontamento.id}:`,
        error,
      );
    }
  }

  private converterParaInterface(apontamento: any): ApontamentoData {
    return {
      id: apontamento.id,
      os_id: apontamento.os_id,
      etapa_instancia_id: apontamento.etapa_instancia_id ?? undefined,
      tipo: apontamento.tipo,
      data_apontamento: apontamento.data_apontamento,
      usuario_id: apontamento.usuario_id,
      observacoes: apontamento.observacoes ?? undefined,
      quantidade_produzida: apontamento.quantidade_produzida
        ? Number(apontamento.quantidade_produzida)
        : undefined,
      quantidade_refugo: apontamento.quantidade_refugo
        ? Number(apontamento.quantidade_refugo)
        : undefined,
      tempo_gasto: apontamento.tempo_gasto ?? undefined,
      ip_origem: apontamento.ip_origem ?? undefined,
      user_agent: apontamento.user_agent ?? undefined,
      criado_em: apontamento.criado_em,
    };
  }
}
