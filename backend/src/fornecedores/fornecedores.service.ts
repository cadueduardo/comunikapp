import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateFornecedoreDto } from './dto/create-fornecedore.dto';
import { UpdateFornecedoreDto } from './dto/update-fornecedore.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Loja } from '@prisma/client';

@Injectable()
export class FornecedoresService {
  constructor(private prisma: PrismaService) {}

  create(createFornecedoreDto: CreateFornecedoreDto, loja: Loja) {
    return this.prisma.fornecedor.create({
      data: {
        nome: createFornecedoreDto.nome,
        loja_id: loja.id,
      },
    });
  }

  findAll(loja: Loja) {
    return this.prisma.fornecedor.findMany({
      where: { loja_id: loja.id },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, loja: Loja) {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id },
    });

    if (!fornecedor || fornecedor.loja_id !== loja.id) {
      throw new NotFoundException(`Fornecedor com ID "${id}" não encontrado.`);
    }
    return fornecedor;
  }

  async update(id: string, updateFornecedoreDto: UpdateFornecedoreDto, loja: Loja) {
    await this.findOne(id, loja);
    return this.prisma.fornecedor.update({
      where: { id },
      data: { nome: updateFornecedoreDto.nome },
    });
  }

  async remove(id: string, loja: Loja) {
    const fornecedor = await this.findOne(id, loja);
    
    // Verifica se o fornecedor está sendo usado por insumos
    const insumosUsando = await this.prisma.insumo.findMany({
      where: { fornecedorId: id },
      select: {
        nome: true,
      },
    });

    if (insumosUsando.length > 0) {
      const nomesInsumos = insumosUsando.map(insumo => insumo.nome).join(', ');
      throw new BadRequestException(
        `Não é possível excluir este fornecedor pois ele está sendo usado pelos seguintes insumos: ${nomesInsumos}. ` +
        'Remova ou altere os insumos antes de excluir o fornecedor.'
      );
    }

    await this.prisma.fornecedor.delete({ where: { id } });
    return { message: `Fornecedor "${fornecedor.nome}" foi removido com sucesso.` };
  }
} 