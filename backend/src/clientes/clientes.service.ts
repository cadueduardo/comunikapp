import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClienteDto: CreateClienteDto, lojaId: string) {
    return this.prisma.cliente.create({
      data: {
        ...createClienteDto,
        loja_id: lojaId,
      },
    });
  }

  async findAll(lojaId: string) {
    return this.prisma.cliente.findMany({
      where: { loja_id: lojaId },
      orderBy: { criado_em: 'desc' },
    });
  }

  async findOne(id: string, lojaId: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { 
        id,
        loja_id: lojaId 
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return cliente;
  }

  async update(id: string, updateClienteDto: UpdateClienteDto, lojaId: string) {
    // Verificar se o cliente existe e pertence à loja
    await this.findOne(id, lojaId);

    return this.prisma.cliente.update({
      where: { id },
      data: updateClienteDto,
    });
  }

  async remove(id: string, lojaId: string) {
    // Verificar se o cliente existe e pertence à loja
    await this.findOne(id, lojaId);

    return this.prisma.cliente.delete({
      where: { id },
    });
  }

  async search(query: string, lojaId: string) {
    return this.prisma.cliente.findMany({
      where: {
        loja_id: lojaId,
        OR: [
          { nome: { contains: query } },
          { documento: { contains: query } },
          { email: { contains: query } },
          { telefone: { contains: query } },
          { razao_social: { contains: query } },
          { nome_fantasia: { contains: query } },
        ],
      },
      orderBy: { criado_em: 'desc' },
    });
  }
}
