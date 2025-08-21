import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateFornecedoreDto } from './dto/create-fornecedore.dto';
import { UpdateFornecedoreDto } from './dto/update-fornecedore.dto';
import { PrismaService } from '../prisma/prisma.service';
import { loja } from '@prisma/client';

@Injectable()
export class FornecedoresService {
  constructor(private prisma: PrismaService) {}

  async create(createFornecedoreDto: CreateFornecedoreDto, loja: loja) {
    // Verificar se já existe um fornecedor com o mesmo nome na mesma loja
    const fornecedorExistente = await this.prisma.fornecedor.findFirst({
      where: {
        nome: createFornecedoreDto.nome,
        loja_id: loja.id,
      },
    });

    if (fornecedorExistente) {
      throw new BadRequestException(
        `Já existe um fornecedor com o nome "${createFornecedoreDto.nome}" cadastrado. ` +
        'Por favor, use um nome diferente ou edite o fornecedor existente.'
      );
    }

    return this.prisma.fornecedor.create({
      data: {
        nome: createFornecedoreDto.nome,
        loja_id: loja.id,
      },
    });
  }

  findAll(loja: loja) {
    return this.prisma.fornecedor.findMany({
      where: { loja_id: loja.id },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, loja: loja) {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id },
    });

    if (!fornecedor || fornecedor.loja_id !== loja.id) {
      throw new NotFoundException(`Fornecedor com ID "${id}" não encontrado.`);
    }
    return fornecedor;
  }

  async update(
    id: string,
    updateFornecedoreDto: UpdateFornecedoreDto,
    loja: loja,
  ) {
    await this.findOne(id, loja);
    
    // Verificar se já existe outro fornecedor com o mesmo nome na mesma loja
    const fornecedorExistente = await this.prisma.fornecedor.findFirst({
      where: {
        nome: updateFornecedoreDto.nome,
        loja_id: loja.id,
        id: { not: id }, // Excluir o próprio fornecedor da busca
      },
    });

    if (fornecedorExistente) {
      throw new BadRequestException(
        `Já existe um fornecedor com o nome "${updateFornecedoreDto.nome}" cadastrado. ` +
        'Por favor, use um nome diferente.'
      );
    }

    return this.prisma.fornecedor.update({
      where: { id },
      data: { nome: updateFornecedoreDto.nome },
    });
  }

  async remove(id: string, loja: loja) {
    const fornecedor = await this.findOne(id, loja);

    // Verifica se o fornecedor está sendo usado por insumos
    const insumosUsando = await this.prisma.insumo.findMany({
      where: { fornecedorId: id },
      select: {
        nome: true,
      },
    });

    if (insumosUsando.length > 0) {
      const nomesInsumos = insumosUsando
        .map((insumo) => insumo.nome)
        .join(', ');
      throw new BadRequestException(
        `Não é possível excluir este fornecedor pois ele está sendo usado pelos seguintes insumos: ${nomesInsumos}. ` +
          'Remova ou altere os insumos antes de excluir o fornecedor.',
      );
    }

    await this.prisma.fornecedor.delete({ where: { id } });
    return {
      message: `Fornecedor "${fornecedor.nome}" foi removido com sucesso.`,
    };
  }
}
