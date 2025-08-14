import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.usuario.findMany({
      select: { id: true, nome_completo: true, email: true, funcao: true, loja_id: true, status: true },
    });
  }

  async obter(id: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async criar(dto: CreateUsuarioDto) {
    // Placeholder mínimo: garantir unicidade de email por loja
    const exists = await this.prisma.usuario.findFirst({ where: { email: dto.email, loja_id: dto.loja_id } });
    if (exists) throw new BadRequestException('E-mail já cadastrado para esta loja');
    return this.prisma.usuario.create({ data: dto as any });
  }

  async atualizar(id: string, dto: UpdateUsuarioDto) {
    return this.prisma.usuario.update({ where: { id }, data: dto as any });
  }
}


