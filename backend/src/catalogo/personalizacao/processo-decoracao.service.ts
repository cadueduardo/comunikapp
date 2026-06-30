import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertProcessoDecoracaoDaLoja } from '../common/utils/catalogo-tenant.util';
import { CreateProcessoDecoracaoDto } from './dto/create-processo-decoracao.dto';
import { ListProcessosDecoracaoQueryDto } from './dto/list-processos-decoracao-query.dto';
import { UpdateProcessoDecoracaoDto } from './dto/update-processo-decoracao.dto';

@Injectable()
export class ProcessoDecoracaoService {
  private readonly logger = new Logger(ProcessoDecoracaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(lojaId: string, dto: CreateProcessoDecoracaoDto) {
    const codigo = dto.codigo?.trim() || null;
    if (codigo) {
      await this.validarCodigoDisponivel(lojaId, codigo);
    }

    return this.prisma.processoDecoracao.create({
      data: {
        loja_id: lojaId,
        codigo,
        nome: dto.nome.trim(),
        descricao: dto.descricao?.trim() || null,
        exige_arte_aprovada: dto.exige_arte_aprovada ?? false,
        insumos_aceitos: dto.insumos_aceitos as Prisma.InputJsonValue,
        preco_base: dto.preco_base ?? null,
        custo_setup: dto.custo_setup ?? 0,
        faixas_preco: (dto.faixas_preco ??
          []) as unknown as Prisma.InputJsonValue,
        setor_pcp_sugerido: dto.setor_pcp_sugerido?.trim() || null,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAll(lojaId: string, query: ListProcessosDecoracaoQueryDto) {
    const where: Prisma.ProcessoDecoracaoWhereInput = {
      loja_id: lojaId,
    };

    if (typeof query.ativo === 'boolean') {
      where.ativo = query.ativo;
    }

    return this.prisma.processoDecoracao.findMany({
      where,
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string, lojaId: string) {
    return assertProcessoDecoracaoDaLoja(this.prisma, id, lojaId);
  }

  async update(id: string, lojaId: string, dto: UpdateProcessoDecoracaoDto) {
    await assertProcessoDecoracaoDaLoja(this.prisma, id, lojaId);

    if (dto.codigo !== undefined) {
      const codigo = dto.codigo?.trim() || null;
      if (codigo) {
        await this.validarCodigoDisponivel(lojaId, codigo, id);
      }
    }

    const data: Prisma.ProcessoDecoracaoUpdateInput = {};

    if (dto.nome !== undefined) data.nome = dto.nome.trim();
    if (dto.codigo !== undefined) data.codigo = dto.codigo?.trim() || null;
    if (dto.descricao !== undefined) {
      data.descricao = dto.descricao?.trim() || null;
    }
    if (dto.exige_arte_aprovada !== undefined) {
      data.exige_arte_aprovada = dto.exige_arte_aprovada;
    }
    if (dto.insumos_aceitos !== undefined) {
      data.insumos_aceitos = dto.insumos_aceitos as Prisma.InputJsonValue;
    }
    if (dto.preco_base !== undefined) data.preco_base = dto.preco_base;
    if (dto.custo_setup !== undefined) data.custo_setup = dto.custo_setup;
    if (dto.faixas_preco !== undefined) {
      data.faixas_preco = dto.faixas_preco as unknown as Prisma.InputJsonValue;
    }
    if (dto.setor_pcp_sugerido !== undefined) {
      data.setor_pcp_sugerido = dto.setor_pcp_sugerido?.trim() || null;
    }
    if (dto.ativo !== undefined) data.ativo = dto.ativo;

    return this.prisma.processoDecoracao
      .updateMany({
        where: { id, loja_id: lojaId },
        data,
      })
      .then(async (result) => {
        if (result.count === 0) {
          await assertProcessoDecoracaoDaLoja(this.prisma, id, lojaId);
        }
        return this.findOne(id, lojaId);
      });
  }

  async remove(id: string, lojaId: string) {
    await assertProcessoDecoracaoDaLoja(this.prisma, id, lojaId);

    const result = await this.prisma.processoDecoracao.updateMany({
      where: { id, loja_id: lojaId },
      data: { ativo: false },
    });

    if (result.count === 0) {
      await assertProcessoDecoracaoDaLoja(this.prisma, id, lojaId);
    }

    this.logger.log(`Processo de decoração inativado: id=${id} loja=${lojaId}`);

    return { id, ativo: false };
  }

  private async validarCodigoDisponivel(
    lojaId: string,
    codigo: string,
    ignorarId?: string,
  ) {
    const existente = await this.prisma.processoDecoracao.findFirst({
      where: {
        loja_id: lojaId,
        codigo,
        ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (existente) {
      throw new BadRequestException(
        'Código interno já cadastrado para esta loja.',
      );
    }
  }
}
