import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustoIndiretoDto } from './dto/create-custo-indireto.dto';
import { UpdateCustoIndiretoDto } from './dto/update-custo-indireto.dto';
import { loja } from '@prisma/client';

@Injectable()
export class CustosIndiretosService {
  constructor(private prisma: PrismaService) {}

  async create(createCustoIndiretoDto: CreateCustoIndiretoDto, loja: loja) {
    return this.prisma.custoindireto.create({
      data: {
        nome: createCustoIndiretoDto.nome,
        categoria: createCustoIndiretoDto.categoria,
        valor_mensal: createCustoIndiretoDto.valor_mensal,
        observacoes: createCustoIndiretoDto.descricao,
        loja: {
          connect: { id: loja.id }
        },
        atualizado_em: new Date(),
      },
    });
  }

  async findAll(loja: loja) {
    return this.prisma.custoindireto.findMany({
      where: {
        loja: { id: loja.id }
      },
      orderBy: {
        criado_em: 'desc',
      },
    });
  }

  async findOne(id: string, loja: loja) {
    const custoIndireto = await this.prisma.custoindireto.findFirst({
      where: {
        id,
        loja: { id: loja.id }
      },
    });

    if (!custoIndireto) {
      throw new NotFoundException('Custo indireto não encontrado');
    }

    return custoIndireto;
  }

  async update(
    id: string,
    updateCustoIndiretoDto: UpdateCustoIndiretoDto,
    loja: loja,
  ) {
    await this.findOne(id, loja);

    const updateData: any = {};
    if (updateCustoIndiretoDto.nome)
      updateData.nome = updateCustoIndiretoDto.nome;
    if (updateCustoIndiretoDto.categoria)
      updateData.categoria = updateCustoIndiretoDto.categoria;
    if (updateCustoIndiretoDto.valor_mensal)
      updateData.valor_mensal = updateCustoIndiretoDto.valor_mensal;
    if (updateCustoIndiretoDto.descricao)
      updateData.observacoes = updateCustoIndiretoDto.descricao;

    return this.prisma.custoindireto.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, loja: loja) {
    await this.findOne(id, loja);

    return this.prisma.custoindireto.delete({
      where: { id },
    });
  }
}
