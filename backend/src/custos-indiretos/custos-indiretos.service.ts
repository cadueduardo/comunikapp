import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustoIndiretoDto } from './dto/create-custo-indireto.dto';
import { UpdateCustoIndiretoDto } from './dto/update-custo-indireto.dto';

@Injectable()
export class CustosIndiretosService {
  constructor(private prisma: PrismaService) {}

  async create(createCustoIndiretoDto: CreateCustoIndiretoDto, lojaId: string) {
    return this.prisma.custoIndireto.create({
      data: {
        nome: createCustoIndiretoDto.nome,
        categoria: createCustoIndiretoDto.categoria,
        valor_mensal: createCustoIndiretoDto.valor_mensal,
        observacoes: createCustoIndiretoDto.descricao,
        loja_id: lojaId,
      },
    });
  }

  async findAll(lojaId: string) {
    return this.prisma.custoIndireto.findMany({
      where: {
        loja_id: lojaId,
      },
      orderBy: {
        criado_em: 'desc',
      },
    });
  }

  async findOne(id: string, lojaId: string) {
    const custoIndireto = await this.prisma.custoIndireto.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    if (!custoIndireto) {
      throw new NotFoundException('Custo indireto não encontrado');
    }

    return custoIndireto;
  }

  async update(id: string, updateCustoIndiretoDto: UpdateCustoIndiretoDto, lojaId: string) {
    await this.findOne(id, lojaId);

    const updateData: any = {};
    if (updateCustoIndiretoDto.nome) updateData.nome = updateCustoIndiretoDto.nome;
    if (updateCustoIndiretoDto.categoria) updateData.categoria = updateCustoIndiretoDto.categoria;
    if (updateCustoIndiretoDto.valor_mensal) updateData.valor_mensal = updateCustoIndiretoDto.valor_mensal;
    if (updateCustoIndiretoDto.descricao) updateData.observacoes = updateCustoIndiretoDto.descricao;

    return this.prisma.custoIndireto.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, lojaId: string) {
    await this.findOne(id, lojaId);

    return this.prisma.custoIndireto.delete({
      where: { id },
    });
  }
} 