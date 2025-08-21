import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTipoMaterialDto } from './dto/create-tipo-material.dto';
import { UpdateTipoMaterialDto } from './dto/update-tipo-material.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TiposMaterialService {
  constructor(private prisma: PrismaService) {}

  create(createTipoMaterialDto: CreateTipoMaterialDto, loja: { id: string }) {
    return this.prisma.tipomaterial.create({
      data: {
        nome: createTipoMaterialDto.nome,
        descricao: createTipoMaterialDto.descricao,
        logica_consumo: createTipoMaterialDto.logica_consumo,
        parametros_padrao: createTipoMaterialDto.parametros_padrao
          ? JSON.stringify(createTipoMaterialDto.parametros_padrao)
          : null,
        atualizado_em: new Date(),
        loja: {
          connect: { id: loja.id },
        },
      },
    });
  }

  findAll(loja: { id: string }) {
    return this.prisma.tipomaterial.findMany({
      where: {
        loja_id: loja.id,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findOne(id: string, loja: { id: string }) {
    const tipoMaterial = await this.prisma.tipomaterial.findFirst({
      where: {
        id,
        loja_id: loja.id,
      },
    });

    if (!tipoMaterial) {
      throw new NotFoundException('Tipo de material não encontrado');
    }

    return tipoMaterial;
  }

  async update(
    id: string,
    updateTipoMaterialDto: UpdateTipoMaterialDto,
    loja: { id: string },
  ) {
    // Verificar se o tipo de material existe e pertence à loja
    await this.findOne(id, loja);

    // Preparar dados para atualização, convertendo parametros_padrao se necessário
    const updateData = { ...updateTipoMaterialDto };
    if (updateTipoMaterialDto.parametros_padrao !== undefined) {
      updateData.parametros_padrao = updateTipoMaterialDto.parametros_padrao
        ? JSON.stringify(updateTipoMaterialDto.parametros_padrao)
        : null;
    }

    return this.prisma.tipomaterial.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, loja: { id: string }) {
    // Verificar se o tipo de material existe e pertence à loja
    await this.findOne(id, loja);

    // Verificar se há insumos usando este tipo de material
    const insumosComTipo = await this.prisma.insumo.findMany({
      where: {
        tipoMaterialId: id,
      },
    });

    if (insumosComTipo.length > 0) {
      throw new ForbiddenException(
        'Não é possível excluir este tipo de material pois existem insumos associados a ele.',
      );
    }

    return this.prisma.tipomaterial.delete({
      where: { id },
    });
  }
}
