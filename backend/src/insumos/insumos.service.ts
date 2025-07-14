import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    const insumo = await this.findOne(id, loja); // Garante que o insumo existe e pertence à loja
    
    // Verifica se o insumo está sendo usado em orçamentos
    const itensOrcamento = await this.prisma.itemOrcamento.findMany({
      where: { insumo_id: id },
      include: {
        orcamento: {
          select: {
            numero: true,
            nome_servico: true,
          },
        },
      },
    });

    if (itensOrcamento.length > 0) {
      const orcamentosUsando = itensOrcamento.map(item => 
        `Orçamento #${item.orcamento.numero} - ${item.orcamento.nome_servico}`
      ).join(', ');
      
      throw new BadRequestException(
        `Não é possível excluir este insumo pois ele está sendo usado nos seguintes orçamentos: ${orcamentosUsando}. ` +
        'Remova o insumo dos orçamentos antes de excluí-lo.'
      );
    }

    await this.prisma.insumo.delete({
      where: { id },
    });

    return { message: `Insumo "${insumo.nome}" foi removido com sucesso.` };
  }
} 