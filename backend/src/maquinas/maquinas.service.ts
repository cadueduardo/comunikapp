import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';
import { Loja } from '@prisma/client';

@Injectable()
export class MaquinasService {
  constructor(private prisma: PrismaService) {}

  async create(createMaquinaDto: CreateMaquinaDto, loja: Loja) {
    return this.prisma.maquina.create({
      data: {
        ...createMaquinaDto,
        loja_id: loja.id,
        status: createMaquinaDto.status || 'ATIVA',
      },
    });
  }

  async findAll(loja: Loja) {
    return this.prisma.maquina.findMany({
      where: { loja_id: loja.id },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, loja: Loja) {
    const maquina = await this.prisma.maquina.findUnique({
      where: { id },
      include: {
        funcoes: true,
      },
    });

    if (!maquina) {
      throw new NotFoundException(`Máquina com ID "${id}" não encontrada.`);
    }

    if (maquina.loja_id !== loja.id) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso.');
    }

    return maquina;
  }

  async update(id: string, updateMaquinaDto: UpdateMaquinaDto, loja: Loja) {
    await this.findOne(id, loja); // Garante que a máquina existe e pertence à loja

    return this.prisma.maquina.update({
      where: { id },
      data: updateMaquinaDto,
    });
  }

  async remove(id: string, loja: Loja) {
    await this.findOne(id, loja); // Garante que a máquina existe e pertence à loja
    
    // Verificar se a máquina está sendo usada em algum orçamento
    const maquinaEmUso = await this.prisma.maquinaOrcamento.findFirst({
      where: { maquina_id: id },
    });

    if (maquinaEmUso) {
      throw new ForbiddenException('Não é possível excluir uma máquina que está sendo usada em orçamentos.');
    }

    await this.prisma.maquina.delete({
      where: { id },
    });

    return { message: `Máquina com ID "${id}" foi removida com sucesso.` };
  }

  async findByTipo(tipo: string, loja: Loja) {
    return this.prisma.maquina.findMany({
      where: { 
        loja_id: loja.id,
        tipo: tipo,
        status: 'ATIVA',
      },
      orderBy: { nome: 'asc' },
    });
  }
} 