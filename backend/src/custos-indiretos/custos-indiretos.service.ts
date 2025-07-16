import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustoIndiretoDto } from './dto/create-custo-indireto.dto';
import { UpdateCustoIndiretoDto } from './dto/update-custo-indireto.dto';
import { Loja } from '@prisma/client';

@Injectable()
export class CustosIndiretosService {
  constructor(private prisma: PrismaService) {}

  async create(createCustoIndiretoDto: CreateCustoIndiretoDto, loja: Loja) {
    return this.prisma.custoIndireto.create({
      data: {
        ...createCustoIndiretoDto,
        loja_id: loja.id,
      },
    });
  }

  async findAll(loja: Loja) {
    return this.prisma.custoIndireto.findMany({
      where: { loja_id: loja.id },
      orderBy: [
        { categoria: 'asc' },
        { nome: 'asc' },
      ],
    });
  }

  async findOne(id: string, loja: Loja) {
    const custoIndireto = await this.prisma.custoIndireto.findUnique({
      where: { id },
    });

    if (!custoIndireto) {
      throw new NotFoundException(`Custo indireto com ID "${id}" não encontrado.`);
    }

    if (custoIndireto.loja_id !== loja.id) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso.');
    }

    return custoIndireto;
  }

  async update(id: string, updateCustoIndiretoDto: UpdateCustoIndiretoDto, loja: Loja) {
    await this.findOne(id, loja); // Garante que o custo indireto existe e pertence à loja

    return this.prisma.custoIndireto.update({
      where: { id },
      data: updateCustoIndiretoDto,
    });
  }

  async remove(id: string, loja: Loja) {
    const custoIndireto = await this.findOne(id, loja); // Garante que o custo indireto existe e pertence à loja
    
    // Verifica se o custo indireto está sendo usado em orçamentos
    // Por enquanto, vamos permitir a exclusão, mas podemos implementar verificação futuramente
    // quando integrarmos com o motor de cálculo

    await this.prisma.custoIndireto.delete({
      where: { id },
    });

    return { message: `Custo indireto "${custoIndireto.nome}" foi removido com sucesso.` };
  }

  async getByCategoria(categoria: string, loja: Loja) {
    return this.prisma.custoIndireto.findMany({
      where: { 
        loja_id: loja.id,
        categoria: categoria,
        ativo: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async getTotalMensal(loja: Loja) {
    const custosIndiretos = await this.prisma.custoIndireto.findMany({
      where: { 
        loja_id: loja.id,
        ativo: true,
      },
      select: { valor_mensal: true },
    });

    return custosIndiretos.reduce((total, custo) => total + Number(custo.valor_mensal), 0);
  }
} 