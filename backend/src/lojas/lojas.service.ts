import { Injectable } from '@nestjs/common';
import { CreateOnboardingDto } from './dto/create-onboarding.dto'; // Alterado
import { UpdateLojaDto } from './dto/update-loja.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class LojasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOnboardingDto: CreateOnboardingDto) {
    const { storeName, name, email, phone, tipoPessoa, documento, password } =
      createOnboardingDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    return this.prisma.$transaction(async (tx) => {
      const loja = await tx.loja.create({
        data: {
          name: storeName,
          email: email,
          phone: phone,
          tipo_pessoa: tipoPessoa,
          documento: documento,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          name: name,
          email: email,
          phone: phone,
          password: hashedPassword,
          role: UserRole.ADMINISTRADOR,
          lojaId: loja.id,
        },
      });

      // Não retornar a senha no resultado
      const { password: _, ...result } = usuario;
      return result;
    });
  }

  findAll() {
    return this.prisma.loja.findMany();
  }

  findOne(id: string) {
    return this.prisma.loja.findUnique({
      where: { id },
    });
  }

  update(id: string, updateLojaDto: UpdateLojaDto) {
    return this.prisma.loja.update({
      where: { id },
      data: updateLojaDto,
    });
  }

  remove(id: string) {
    return this.prisma.loja.delete({
      where: { id },
    });
  }
}
