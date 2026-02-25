import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { UpdateMaquinaDto } from './dto/update-maquina.dto';
import { loja } from '@prisma/client';

@Injectable()
export class MaquinasService {
  constructor(private prisma: PrismaService) {}

  async create(createMaquinaDto: CreateMaquinaDto, loja: loja) {
    const { setor_id, ...rest } = createMaquinaDto;
    const data: any = {
      ...rest,
      loja: { connect: { id: loja.id } },
      status: createMaquinaDto.status || 'ATIVA',
      atualizado_em: new Date(),
    };
    if (setor_id) data.setor = { connect: { id: setor_id } };
    return this.prisma.maquina.create({ data });
  }

  async findAll(loja: loja) {
    return this.prisma.maquina.findMany({
      where: {
        loja: { id: loja.id },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, loja: loja) {
    const maquina = await this.prisma.maquina.findUnique({
      where: { id },
      include: {
        funcao: true,
      },
    });

    if (!maquina) {
      throw new NotFoundException(`Máquina com ID "${id}" não encontrada.`);
    }

    if (maquina.loja_id !== loja.id) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    return maquina;
  }

  async update(id: string, updateMaquinaDto: UpdateMaquinaDto, loja: loja) {
    await this.findOne(id, loja); // Garante que a máquina existe e pertence à loja

    const { setor_id, ...rest } = updateMaquinaDto;
    const dataToUpdate: any = {
      ...rest,
      atualizado_em: new Date(),
    };
    if (setor_id !== undefined) {
      dataToUpdate.setor = setor_id
        ? { connect: { id: setor_id } }
        : { disconnect: true };
    }

    return this.prisma.maquina.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string, loja: loja) {
    await this.findOne(id, loja); // Garante que a máquina existe e pertence à loja

    // Verificar se a máquina está sendo usada em algum orçamento
    const maquinaEmUso = await this.prisma.maquinaorcamento.findFirst({
      where: { maquina_id: id },
    });

    if (maquinaEmUso) {
      throw new ForbiddenException(
        'Não é possível excluir uma máquina que está sendo usada em orçamentos.',
      );
    }

    await this.prisma.maquina.delete({
      where: { id },
    });

    return { message: `Máquina com ID "${id}" foi removida com sucesso.` };
  }

  async findByTipo(tipo: string, loja: loja) {
    return this.prisma.maquina.findMany({
      where: {
        loja: { id: loja.id },
        tipo: tipo,
        status: 'ATIVA',
      },
      orderBy: { nome: 'asc' },
    });
  }
}
