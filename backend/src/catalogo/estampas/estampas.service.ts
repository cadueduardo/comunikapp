import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertConjuntoCamposDaLoja,
  assertEstampaDaLoja,
  assertProcessoDecoracaoDaLoja,
} from '../common/utils/catalogo-tenant.util';
import { CreateEstampaDto } from './dto/create-estampa.dto';
import { ListEstampasQueryDto } from './dto/list-estampas-query.dto';
import { UpdateEstampaDto } from './dto/update-estampa.dto';

const includePadrao = {
  processo: {
    select: { id: true, nome: true, codigo: true, ativo: true },
  },
  conjunto_campos: {
    select: {
      id: true,
      nome: true,
      ativo: true,
      campos: { orderBy: { ordem: 'asc' as const } },
    },
  },
};

@Injectable()
export class EstampasService {
  private readonly logger = new Logger(EstampasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(lojaId: string, dto: CreateEstampaDto) {
    const codigo = dto.codigo?.trim() || null;
    if (codigo) {
      await this.validarCodigoDisponivel(lojaId, codigo);
    }

    await assertProcessoDecoracaoDaLoja(
      this.prisma,
      dto.processo_id,
      lojaId,
    );

    if (dto.conjunto_campos_id) {
      await assertConjuntoCamposDaLoja(
        this.prisma,
        dto.conjunto_campos_id,
        lojaId,
      );
      await this.validarMetadadosConjunto(
        dto.conjunto_campos_id,
        dto.metadados,
      );
    } else if (dto.metadados?.length) {
      throw new BadRequestException(
        'Metadados de âncoras exigem conjunto_campos_id vinculado.',
      );
    }

    return this.prisma.estampa.create({
      data: {
        loja_id: lojaId,
        codigo,
        nome: dto.nome.trim(),
        processo_id: dto.processo_id,
        conjunto_campos_id: dto.conjunto_campos_id ?? null,
        preco_adicional: dto.preco_adicional ?? 0,
        metadados: dto.metadados
          ? (dto.metadados as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ativo: dto.ativo ?? true,
      },
      include: includePadrao,
    });
  }

  async findAll(lojaId: string, query: ListEstampasQueryDto) {
    const where: Prisma.EstampaWhereInput = { loja_id: lojaId };

    if (typeof query.ativo === 'boolean') {
      where.ativo = query.ativo;
    }

    if (query.produto_finito_id) {
      const produto = await this.prisma.produtoFinito.findFirst({
        where: { id: query.produto_finito_id, loja_id: lojaId },
        select: { id: true },
      });

      if (!produto) {
        throw new NotFoundException('Produto finito não encontrado.');
      }

      where.produtos = {
        some: {
          produto_finito_id: query.produto_finito_id,
          loja_id: lojaId,
        },
      };
    }

    return this.prisma.estampa.findMany({
      where,
      include: includePadrao,
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string, lojaId: string) {
    const estampa = await this.prisma.estampa.findFirst({
      where: { id, loja_id: lojaId },
      include: includePadrao,
    });

    if (!estampa) {
      throw new NotFoundException('Estampa não encontrada.');
    }

    return estampa;
  }

  async update(id: string, lojaId: string, dto: UpdateEstampaDto) {
    const atual = await assertEstampaDaLoja(this.prisma, id, lojaId);

    if (dto.codigo !== undefined) {
      const codigo = dto.codigo?.trim() || null;
      if (codigo) {
        await this.validarCodigoDisponivel(lojaId, codigo, id);
      }
    }

    if (dto.processo_id !== undefined) {
      await assertProcessoDecoracaoDaLoja(
        this.prisma,
        dto.processo_id,
        lojaId,
      );
    }

    const conjuntoId =
      dto.conjunto_campos_id !== undefined
        ? dto.conjunto_campos_id
        : atual.conjunto_campos_id;

    if (dto.conjunto_campos_id) {
      await assertConjuntoCamposDaLoja(
        this.prisma,
        dto.conjunto_campos_id,
        lojaId,
      );
    }

    if (dto.metadados !== undefined) {
      if (dto.metadados.length > 0 && !conjuntoId) {
        throw new BadRequestException(
          'Metadados de âncoras exigem conjunto_campos_id vinculado.',
        );
      }
      if (conjuntoId) {
        await this.validarMetadadosConjunto(conjuntoId, dto.metadados);
      }
    }

    const data: Prisma.EstampaUncheckedUpdateInput = {};

    if (dto.nome !== undefined) data.nome = dto.nome.trim();
    if (dto.codigo !== undefined) data.codigo = dto.codigo?.trim() || null;
    if (dto.processo_id !== undefined) {
      data.processo_id = dto.processo_id;
    }
    if (dto.conjunto_campos_id !== undefined) {
      data.conjunto_campos_id = dto.conjunto_campos_id ?? null;
    }
    if (dto.preco_adicional !== undefined) {
      data.preco_adicional = dto.preco_adicional;
    }
    if (dto.metadados !== undefined) {
      data.metadados =
        dto.metadados.length > 0
          ? (dto.metadados as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull;
    }
    if (dto.ativo !== undefined) data.ativo = dto.ativo;

    const result = await this.prisma.estampa.updateMany({
      where: { id, loja_id: lojaId },
      data,
    });

    if (result.count === 0) {
      throw new NotFoundException('Estampa não encontrada.');
    }

    return this.findOne(id, lojaId);
  }

  async remove(id: string, lojaId: string) {
    await assertEstampaDaLoja(this.prisma, id, lojaId);

    const result = await this.prisma.estampa.updateMany({
      where: { id, loja_id: lojaId },
      data: { ativo: false },
    });

    if (result.count === 0) {
      throw new NotFoundException('Estampa não encontrada.');
    }

    this.logger.log(`Estampa inativada: id=${id} loja=${lojaId}`);

    return { id, ativo: false };
  }

  private async validarCodigoDisponivel(
    lojaId: string,
    codigo: string,
    ignorarId?: string,
  ) {
    const existente = await this.prisma.estampa.findFirst({
      where: {
        loja_id: lojaId,
        codigo,
        ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (existente) {
      throw new BadRequestException(
        'Código já cadastrado para uma estampa nesta loja.',
      );
    }
  }

  private async validarMetadadosConjunto(
    conjuntoId: string,
    metadados?: { campoDefId: string }[] | null,
  ) {
    if (!metadados?.length) {
      return;
    }

    const campos = await this.prisma.campoVariavelDef.findMany({
      where: { conjunto_id: conjuntoId },
      select: { id: true },
    });

    const idsValidos = new Set(campos.map((c) => c.id));

    for (const ancora of metadados) {
      if (!idsValidos.has(ancora.campoDefId)) {
        throw new BadRequestException(
          `campoDefId "${ancora.campoDefId}" não pertence ao conjunto de campos da estampa.`,
        );
      }
    }
  }
}
