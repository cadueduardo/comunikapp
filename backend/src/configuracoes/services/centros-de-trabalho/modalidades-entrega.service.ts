import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateModalidadeEntregaDto,
  UpdateModalidadeEntregaDto,
} from '../../dto/centros-de-trabalho/modalidades-entrega.dto';

@Injectable()
export class ModalidadesEntregaService {
  private readonly logger = new Logger(ModalidadesEntregaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async criar(lojaId: string, dto: CreateModalidadeEntregaDto) {
    await this.validarNomeDisponivel(lojaId, dto.nome);

    return (this.prisma as any).modalidadeEntrega.create({
      data: {
        loja_id: lojaId,
        nome: dto.nome.trim(),
        descricao: dto.descricao?.trim() || null,
        ativo: dto.ativo ?? true,
        exige_endereco: dto.exige_endereco ?? false,
        exige_valor: dto.exige_valor ?? false,
        valor_padrao: dto.valor_padrao ?? null,
        custo_padrao: dto.custo_padrao ?? null,
        prazo_padrao_dias: dto.prazo_padrao_dias ?? null,
        permite_retirada: dto.permite_retirada ?? false,
        observacoes_padrao: dto.observacoes_padrao?.trim() || null,
      },
    });
  }

  async listar(lojaId: string, ativo?: boolean) {
    const where: Record<string, unknown> = { loja_id: lojaId };
    if (typeof ativo === 'boolean') {
      where.ativo = ativo;
    }

    return (this.prisma as any).modalidadeEntrega.findMany({
      where,
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  async obterPorId(id: string, lojaId: string) {
    const modalidade = await (this.prisma as any).modalidadeEntrega.findFirst({
      where: { id, loja_id: lojaId },
    });

    if (!modalidade) {
      throw new NotFoundException('Modalidade de entrega nao encontrada.');
    }

    return modalidade;
  }

  async atualizar(id: string, lojaId: string, dto: UpdateModalidadeEntregaDto) {
    await this.obterPorId(id, lojaId);

    if (dto.nome) {
      await this.validarNomeDisponivel(lojaId, dto.nome, id);
    }

    return (this.prisma as any).modalidadeEntrega.update({
      where: { id },
      data: {
        nome: dto.nome?.trim(),
        descricao:
          dto.descricao !== undefined
            ? dto.descricao?.trim() || null
            : undefined,
        ativo: dto.ativo,
        exige_endereco: dto.exige_endereco,
        exige_valor: dto.exige_valor,
        valor_padrao: dto.valor_padrao,
        custo_padrao: dto.custo_padrao,
        prazo_padrao_dias: dto.prazo_padrao_dias,
        permite_retirada: dto.permite_retirada,
        observacoes_padrao:
          dto.observacoes_padrao !== undefined
            ? dto.observacoes_padrao?.trim() || null
            : undefined,
      },
    });
  }

  async remover(id: string, lojaId: string) {
    await this.obterPorId(id, lojaId);

    const vinculos = await (this.prisma as any).orcamento.count({
      where: { loja_id: lojaId, entrega_modalidade_id: id },
    });

    if (vinculos > 0) {
      this.logger.warn(
        `Modalidade de entrega ${id} inativada; existem ${vinculos} orcamentos vinculados.`,
      );
      return (this.prisma as any).modalidadeEntrega.update({
        where: { id },
        data: { ativo: false },
      });
    }

    await (this.prisma as any).modalidadeEntrega.delete({ where: { id } });
    return { ok: true };
  }

  private async validarNomeDisponivel(
    lojaId: string,
    nome: string,
    ignoreId?: string,
  ) {
    const existente = await (this.prisma as any).modalidadeEntrega.findFirst({
      where: {
        loja_id: lojaId,
        nome: nome.trim(),
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
    });

    if (existente) {
      throw new BadRequestException(
        'Ja existe uma modalidade de entrega com este nome nesta loja.',
      );
    }
  }
}
