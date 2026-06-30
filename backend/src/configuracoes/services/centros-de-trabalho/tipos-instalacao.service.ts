import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateTipoInstalacaoDto,
  UpdateTipoInstalacaoDto,
} from '../../dto/centros-de-trabalho/tipos-instalacao.dto';

@Injectable()
export class TiposInstalacaoService {
  private readonly logger = new Logger(TiposInstalacaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async criar(lojaId: string, dto: CreateTipoInstalacaoDto) {
    await this.validarNomeDisponivel(lojaId, dto.nome);

    return (this.prisma as any).tipoInstalacao.create({
      data: {
        loja_id: lojaId,
        nome: dto.nome.trim(),
        descricao: dto.descricao?.trim() || null,
        ativo: dto.ativo ?? true,
        regra_cobranca: dto.regra_cobranca || 'FIXO',
        preco_padrao: dto.preco_padrao ?? null,
        custo_mao_obra_padrao: dto.custo_mao_obra_padrao ?? null,
        custo_deslocamento_padrao: dto.custo_deslocamento_padrao ?? null,
        tempo_estimado_min: dto.tempo_estimado_min ?? null,
        quantidade_pessoas_padrao: dto.quantidade_pessoas_padrao ?? null,
        exige_endereco: dto.exige_endereco ?? true,
        exige_agendamento: dto.exige_agendamento ?? false,
        observacoes_padrao: dto.observacoes_padrao?.trim() || null,
      },
    });
  }

  async listar(lojaId: string, ativo?: boolean) {
    const where: Record<string, unknown> = { loja_id: lojaId };
    if (typeof ativo === 'boolean') {
      where.ativo = ativo;
    }

    return (this.prisma as any).tipoInstalacao.findMany({
      where,
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  async obterPorId(id: string, lojaId: string) {
    const tipo = await (this.prisma as any).tipoInstalacao.findFirst({
      where: { id, loja_id: lojaId },
    });

    if (!tipo) {
      throw new NotFoundException('Tipo de instalacao nao encontrado.');
    }

    return tipo;
  }

  async atualizar(id: string, lojaId: string, dto: UpdateTipoInstalacaoDto) {
    await this.obterPorId(id, lojaId);

    if (dto.nome) {
      await this.validarNomeDisponivel(lojaId, dto.nome, id);
    }

    return (this.prisma as any).tipoInstalacao.update({
      where: { id },
      data: {
        nome: dto.nome?.trim(),
        descricao:
          dto.descricao !== undefined
            ? dto.descricao?.trim() || null
            : undefined,
        ativo: dto.ativo,
        regra_cobranca: dto.regra_cobranca,
        preco_padrao: dto.preco_padrao,
        custo_mao_obra_padrao: dto.custo_mao_obra_padrao,
        custo_deslocamento_padrao: dto.custo_deslocamento_padrao,
        tempo_estimado_min: dto.tempo_estimado_min,
        quantidade_pessoas_padrao: dto.quantidade_pessoas_padrao,
        exige_endereco: dto.exige_endereco,
        exige_agendamento: dto.exige_agendamento,
        observacoes_padrao:
          dto.observacoes_padrao !== undefined
            ? dto.observacoes_padrao?.trim() || null
            : undefined,
      },
    });
  }

  async remover(id: string, lojaId: string) {
    await this.obterPorId(id, lojaId);

    const vinculos = await (this.prisma as any).produtoOrcamento.count({
      where: {
        instalacao_tipo_id: id,
        orcamento: { loja_id: lojaId },
      },
    });

    if (vinculos > 0) {
      this.logger.warn(
        `Tipo de instalacao ${id} inativado; existem ${vinculos} produtos vinculados.`,
      );
      return (this.prisma as any).tipoInstalacao.update({
        where: { id },
        data: { ativo: false },
      });
    }

    await (this.prisma as any).tipoInstalacao.delete({ where: { id } });
    return { ok: true };
  }

  private async validarNomeDisponivel(
    lojaId: string,
    nome: string,
    ignoreId?: string,
  ) {
    const existente = await (this.prisma as any).tipoInstalacao.findFirst({
      where: {
        loja_id: lojaId,
        nome: nome.trim(),
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
    });

    if (existente) {
      throw new BadRequestException(
        'Ja existe um tipo de instalacao com este nome nesta loja.',
      );
    }
  }
}
