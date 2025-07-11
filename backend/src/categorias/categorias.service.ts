import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Loja } from '@prisma/client';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  create(createCategoriaDto: CreateCategoriaDto, loja: Loja) {
    return this.prisma.categoria.create({
      data: {
        nome: createCategoriaDto.nome,
        loja_id: loja.id,
      },
    });
  }

  findAll(loja: Loja) {
    return this.prisma.categoria.findMany({
      where: { loja_id: loja.id },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, loja: Loja) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
    });

    if (!categoria || categoria.loja_id !== loja.id) {
      throw new NotFoundException(`Categoria com ID "${id}" não encontrada.`);
    }
    return categoria;
  }

  async update(id: string, updateCategoriaDto: UpdateCategoriaDto, loja: Loja) {
    await this.findOne(id, loja);
    return this.prisma.categoria.update({
      where: { id },
      data: { nome: updateCategoriaDto.nome },
    });
  }

  async remove(id: string, loja: Loja) {
    await this.findOne(id, loja);
    // TODO: Adicionar verificação se a categoria está em uso por algum insumo antes de deletar
    await this.prisma.categoria.delete({ where: { id } });
    return { message: `Categoria com ID "${id}" foi removida com sucesso.` };
  }
} 