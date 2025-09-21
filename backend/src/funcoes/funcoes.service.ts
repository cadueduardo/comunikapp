import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncaoDto } from './dto/create-funcao.dto';
import { UpdateFuncaoDto } from './dto/update-funcao.dto';
import { loja } from '@prisma/client';

@Injectable()
export class FuncoesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFuncaoDto, loja: loja) {
    const { maquina_id, ...dataWithoutMaquinaId } = data;
    
    return this.prisma.funcao.create({
      data: {
        ...dataWithoutMaquinaId,
        loja: {
          connect: { id: loja.id }
        },
        ...(maquina_id && {
          maquina: {
            connect: { id: maquina_id }
          }
        }),
        atualizado_em: new Date(),
      },
    });
  }

  async findAll(loja: loja) {
    return this.prisma.funcao.findMany({
      where: { 
        loja: { id: loja.id }
      },
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

  async findOne(id: string, loja: loja) {
    return this.prisma.funcao.findFirst({
      where: { id, loja: { id: loja.id } },
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

  async update(id: string, data: UpdateFuncaoDto, loja: loja) {
    return this.prisma.funcao.update({
      where: { id },
      data: {
        ...data,
        atualizado_em: new Date(),
      },
    });
  }

  async remove(id: string, loja: loja) {
    const funcao = await this.findOne(id, loja);

    if (!funcao) {
      throw new NotFoundException('Função não encontrada.');
    }

    // Verifica se a função está sendo usada em orçamentos
    const funcaoEmUso = await this.prisma.funcaoorcamento.findFirst({
      where: { funcao_id: id },
      include: {
        orcamento: true,
      },
    });

    if (funcaoEmUso) {
      throw new BadRequestException(
        `Não é possível excluir esta função pois ela está sendo usada no orçamento #${funcaoEmUso.orcamento.numero} - ${funcaoEmUso.orcamento.nome_servico}. ` +
          'Remova a função do orçamento antes de excluí-la.',
      );
    }

    await this.prisma.funcao.delete({
      where: { id },
    });

    return { message: `Função "${funcao.nome}" foi removida com sucesso.` };
  }
}
