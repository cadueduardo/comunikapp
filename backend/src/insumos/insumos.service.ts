import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { Loja } from '@prisma/client';

@Injectable()
export class InsumosService {
  constructor(private prisma: PrismaService) {}

  async create(createInsumoDto: CreateInsumoDto, loja: Loja) {
    // TODO: Adicionar verificação se a categoria e fornecedor pertencem à mesma loja
    return this.prisma.insumo.create({
      data: {
        ...createInsumoDto,
        loja_id: loja.id,
      },
    });
  }

  async findAll(loja: Loja) {
    return this.prisma.insumo.findMany({
      where: { loja_id: loja.id },
      include: {
        categoria: true,
        fornecedor: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findOne(id: string, loja: Loja) {
    const insumo = await this.prisma.insumo.findUnique({
      where: { id },
      include: {
        categoria: true,
        fornecedor: true,
      },
    });

    if (!insumo) {
      throw new NotFoundException(`Insumo com ID "${id}" não encontrado.`);
    }

    if (insumo.loja_id !== loja.id) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso.');
    }

    return insumo;
  }

  async update(id: string, updateInsumoDto: UpdateInsumoDto, loja: Loja) {
    await this.findOne(id, loja); // Garante que o insumo existe e pertence à loja

    return this.prisma.insumo.update({
      where: { id },
      data: updateInsumoDto,
    });
  }

  async remove(id: string, loja: Loja) {
    await this.findOne(id, loja); // Garante que o insumo existe e pertence à loja
    
    await this.prisma.insumo.delete({
      where: { id },
    });

    return { message: `Insumo com ID "${id}" foi removido com sucesso.` };
  }
} 