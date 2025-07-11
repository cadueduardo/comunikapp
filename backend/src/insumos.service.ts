import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInsumoDto } from './insumos/dto/create-insumo.dto';
import { UpdateInsumoDto } from './insumos/dto/update-insumo.dto';

@Injectable()
export class InsumosService {
  constructor(private readonly prisma: PrismaService) {}

  create(createInsumoDto: CreateInsumoDto, lojaId: string) {
    return this.prisma.insumo.create({
      data: {
        ...createInsumoDto,
        loja_id: lojaId,
      },
    });
  }

  findAll(lojaId: string) {
    return this.prisma.insumo.findMany({
      where: { loja_id: lojaId },
      orderBy: { criado_em: 'desc' },
    });
  }

  async findOne(id: string, lojaId: string) {
    const insumo = await this.prisma.insumo.findUnique({
      where: { id },
    });

    if (!insumo || insumo.loja_id !== lojaId) {
      throw new NotFoundException('Insumo não encontrado.');
    }

    return insumo;
  }

  async update(id: string, updateInsumoDto: UpdateInsumoDto, lojaId: string) {
    // Primeiro, verifica se o insumo pertence à loja
    await this.findOne(id, lojaId);

    return this.prisma.insumo.update({
      where: { id },
      data: updateInsumoDto,
    });
  }

  async remove(id: string, lojaId: string) {
    // Primeiro, verifica se o insumo pertence à loja
    await this.findOne(id, lojaId);

    return this.prisma.insumo.delete({
      where: { id },
    });
  }
}
