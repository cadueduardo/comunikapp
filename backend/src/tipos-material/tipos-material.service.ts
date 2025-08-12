import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTipoMaterialDto } from './dto/create-tipo-material.dto';
import { UpdateTipoMaterialDto } from './dto/update-tipo-material.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Loja } from '@prisma/client';

@Injectable()
export class TiposMaterialService {
  constructor(private prisma: PrismaService) {}

  create(createTipoMaterialDto: CreateTipoMaterialDto, loja: Loja) {
    return this.prisma.tipoMaterial.create({
      data: {
        nome: createTipoMaterialDto.nome,
        descricao: createTipoMaterialDto.descricao,
        logica_consumo: createTipoMaterialDto.logica_consumo,
        parametros_padrao: createTipoMaterialDto.parametros_padrao,
        loja_id: loja.id,
      },
    });
  }

  findAll(loja: Loja) {
    return this.prisma.tipoMaterial.findMany({
      where: {
        loja_id: loja.id,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findOne(id: string, loja: Loja) {
    const tipoMaterial = await this.prisma.tipoMaterial.findFirst({
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
    loja: Loja,
  ) {
    // Verificar se o tipo de material existe e pertence à loja
    await this.findOne(id, loja);

    return this.prisma.tipoMaterial.update({
      where: { id },
      data: updateTipoMaterialDto,
    });
  }

  async remove(id: string, loja: Loja) {
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

    return this.prisma.tipoMaterial.delete({
      where: { id },
    });
  }
}
