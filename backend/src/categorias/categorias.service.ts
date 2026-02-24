import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { PrismaService } from '../prisma/prisma.service';
import { loja } from '@prisma/client';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoriaDto: CreateCategoriaDto, loja: loja) {
    // Verificar se já existe uma categoria com o mesmo nome na mesma loja
    const categoriaExistente = await this.prisma.categoria.findFirst({
      where: {
        nome: createCategoriaDto.nome,
        loja_id: loja.id,
      },
    });

    if (categoriaExistente) {
      throw new BadRequestException(
        `Já existe uma categoria com o nome "${createCategoriaDto.nome}" cadastrada. ` +
          'Por favor, use um nome diferente ou edite a categoria existente.',
      );
    }

    return this.prisma.categoria.create({
      data: {
        nome: createCategoriaDto.nome,
        loja_id: loja.id,
      },
    });
  }

  findAll(loja: loja) {
    return this.prisma.categoria.findMany({
      where: { loja_id: loja.id },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, loja: loja) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
    });

    if (!categoria || categoria.loja_id !== loja.id) {
      throw new NotFoundException(`Categoria com ID "${id}" não encontrada.`);
    }
    return categoria;
  }

  async update(id: string, updateCategoriaDto: UpdateCategoriaDto, loja: loja) {
    await this.findOne(id, loja);

    // Verificar se já existe outra categoria com o mesmo nome na mesma loja
    const categoriaExistente = await this.prisma.categoria.findFirst({
      where: {
        nome: updateCategoriaDto.nome,
        loja_id: loja.id,
        id: { not: id }, // Excluir a própria categoria da busca
      },
    });

    if (categoriaExistente) {
      throw new BadRequestException(
        `Já existe uma categoria com o nome "${updateCategoriaDto.nome}" cadastrada. ` +
          'Por favor, use um nome diferente.',
      );
    }

    return this.prisma.categoria.update({
      where: { id },
      data: { nome: updateCategoriaDto.nome },
    });
  }

  async remove(id: string, loja: loja) {
    const categoria = await this.findOne(id, loja);

    // Verifica se a categoria está sendo usada por insumos
    const insumosUsando = await this.prisma.insumo.findMany({
      where: { categoriaId: id },
      select: {
        nome: true,
      },
    });

    if (insumosUsando.length > 0) {
      const nomesInsumos = insumosUsando
        .map((insumo) => insumo.nome)
        .join(', ');
      throw new BadRequestException(
        `Não é possível excluir esta categoria pois ela está sendo usada pelos seguintes insumos: ${nomesInsumos}. ` +
          'Remova ou altere os insumos antes de excluir a categoria.',
      );
    }

    await this.prisma.categoria.delete({ where: { id } });
    return {
      message: `Categoria "${categoria.nome}" foi removida com sucesso.`,
    };
  }
}
