import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncaoDto } from './dto/create-funcao.dto';
import { UpdateFuncaoDto } from './dto/update-funcao.dto';

@Injectable()
export class FuncoesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFuncaoDto, lojaId: string) {
    return this.prisma.funcao.create({
      data: {
        ...data,
        loja_id: lojaId,
      },
    });
  }

  async findAll(lojaId: string) {
    return this.prisma.funcao.findMany({
      where: { loja_id: lojaId },
      include: {
        maquina: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, lojaId: string) {
    return this.prisma.funcao.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        maquina: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateFuncaoDto, lojaId: string) {
    return this.prisma.funcao.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, lojaId: string) {
    const funcao = await this.findOne(id, lojaId);
    
    if (!funcao) {
      throw new NotFoundException('Função não encontrada.');
    }

    // Verifica se a função está sendo usada em orçamentos
    const funcaoEmUso = await this.prisma.funcaoOrcamento.findFirst({
      where: { funcao_id: id },
      include: {
        orcamento: true,
      },
    });

    if (funcaoEmUso) {
      throw new BadRequestException(
        `Não é possível excluir esta função pois ela está sendo usada no orçamento #${funcaoEmUso.orcamento.numero} - ${funcaoEmUso.orcamento.nome_servico}. ` +
        'Remova a função do orçamento antes de excluí-la.'
      );
    }

    await this.prisma.funcao.delete({
      where: { id },
    });

    return { message: `Função "${funcao.nome}" foi removida com sucesso.` };
  }
} 