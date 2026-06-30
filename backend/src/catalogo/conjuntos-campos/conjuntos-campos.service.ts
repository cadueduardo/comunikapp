import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertConjuntoCamposDaLoja } from '../common/utils/catalogo-tenant.util';
import { CampoVariavelDefDto } from './dto/campo-variavel-def.dto';
import { CreateConjuntoCamposDto } from './dto/create-conjunto-campos.dto';
import { ListConjuntosCamposQueryDto } from './dto/list-conjuntos-campos-query.dto';
import { UpdateConjuntoCamposDto } from './dto/update-conjunto-campos.dto';

@Injectable()
export class ConjuntosCamposService {
  private readonly logger = new Logger(ConjuntosCamposService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(lojaId: string, dto: CreateConjuntoCamposDto) {
    const nome = dto.nome.trim();
    await this.validarNomeDisponivel(lojaId, nome);
    this.validarChavesUnicas(dto.campos);

    return this.prisma.$transaction(async (tx) => {
      const conjunto = await tx.conjuntoCampos.create({
        data: {
          loja_id: lojaId,
          nome,
          descricao: dto.descricao?.trim() || null,
          ativo: dto.ativo ?? true,
        },
      });

      await tx.campoVariavelDef.createMany({
        data: dto.campos.map((campo, index) =>
          this.mapCampoParaCreate(conjunto.id, campo, index),
        ),
      });

      return tx.conjuntoCampos.findFirst({
        where: { id: conjunto.id, loja_id: lojaId },
        include: {
          campos: { orderBy: { ordem: 'asc' } },
        },
      });
    });
  }

  async findAll(lojaId: string, query: ListConjuntosCamposQueryDto) {
    const where: Prisma.ConjuntoCamposWhereInput = { loja_id: lojaId };

    if (typeof query.ativo === 'boolean') {
      where.ativo = query.ativo;
    }

    return this.prisma.conjuntoCampos.findMany({
      where,
      include: {
        campos: { orderBy: { ordem: 'asc' } },
        _count: { select: { estampas: true } },
      },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string, lojaId: string) {
    const conjunto = await this.prisma.conjuntoCampos.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        campos: { orderBy: { ordem: 'asc' } },
        _count: { select: { estampas: true } },
      },
    });

    if (!conjunto) {
      throw new NotFoundException('Conjunto de campos não encontrado.');
    }

    return conjunto;
  }

  async update(id: string, lojaId: string, dto: UpdateConjuntoCamposDto) {
    await assertConjuntoCamposDaLoja(this.prisma, id, lojaId);

    if (dto.nome !== undefined) {
      const nome = dto.nome.trim();
      await this.validarNomeDisponivel(lojaId, nome, id);
    }

    if (dto.campos !== undefined) {
      this.validarChavesUnicas(dto.campos);
    }

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.ConjuntoCamposUpdateInput = {};

      if (dto.nome !== undefined) data.nome = dto.nome.trim();
      if (dto.descricao !== undefined) {
        data.descricao = dto.descricao?.trim() || null;
      }
      if (dto.ativo !== undefined) data.ativo = dto.ativo;

      if (Object.keys(data).length > 0) {
        const updated = await tx.conjuntoCampos.updateMany({
          where: { id, loja_id: lojaId },
          data,
        });
        if (updated.count === 0) {
          throw new NotFoundException('Conjunto de campos não encontrado.');
        }
      }

      if (dto.campos !== undefined) {
        await tx.campoVariavelDef.deleteMany({ where: { conjunto_id: id } });
        if (dto.campos.length > 0) {
          await tx.campoVariavelDef.createMany({
            data: dto.campos.map((campo, index) =>
              this.mapCampoParaCreate(id, campo, index),
            ),
          });
        }
      }

      return tx.conjuntoCampos.findFirst({
        where: { id, loja_id: lojaId },
        include: {
          campos: { orderBy: { ordem: 'asc' } },
          _count: { select: { estampas: true } },
        },
      });
    });
  }

  async remove(id: string, lojaId: string) {
    await assertConjuntoCamposDaLoja(this.prisma, id, lojaId);

    const result = await this.prisma.conjuntoCampos.updateMany({
      where: { id, loja_id: lojaId },
      data: { ativo: false },
    });

    if (result.count === 0) {
      await assertConjuntoCamposDaLoja(this.prisma, id, lojaId);
    }

    this.logger.log(`Conjunto de campos inativado: id=${id} loja=${lojaId}`);

    return { id, ativo: false };
  }

  private mapCampoParaCreate(
    conjuntoId: string,
    campo: CampoVariavelDefDto,
    index: number,
  ): Prisma.CampoVariavelDefCreateManyInput {
    return {
      conjunto_id: conjuntoId,
      chave: campo.chave.trim(),
      label: campo.label.trim(),
      tipo: campo.tipo,
      obrigatorio: campo.obrigatorio ?? true,
      max_caracteres: campo.max_caracteres ?? null,
      fonte_sugerida: campo.fonte_sugerida?.trim() || null,
      ordem: campo.ordem ?? index,
      placeholder: campo.placeholder?.trim() || null,
    };
  }

  private validarChavesUnicas(campos: CampoVariavelDefDto[]) {
    const chaves = campos.map((c) => c.chave.trim());
    const unicas = new Set(chaves);
    if (unicas.size !== chaves.length) {
      throw new BadRequestException(
        'Chaves dos campos devem ser únicas dentro do conjunto.',
      );
    }
  }

  private async validarNomeDisponivel(
    lojaId: string,
    nome: string,
    ignorarId?: string,
  ) {
    const existente = await this.prisma.conjuntoCampos.findFirst({
      where: {
        loja_id: lojaId,
        nome,
        ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (existente) {
      throw new BadRequestException(
        'Já existe um conjunto de campos com este nome nesta loja.',
      );
    }
  }
}
