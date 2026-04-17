import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoMaterialDto } from './dto/create-tipo-material.dto';
import { UpdateTipoMaterialDto } from './dto/update-tipo-material.dto';

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

  findOne(id: string, loja: { id: string }) {
    return this.prisma.tipomaterial.findFirst({
      where: {
        id,
        loja_id: loja.id,
      },
    });
  }

  update(
    id: string,
    updateTipoMaterialDto: UpdateTipoMaterialDto,
    loja: { id: string },
  ) {
    return this.prisma.tipomaterial.update({
      where: {
        id,
        loja_id: loja.id,
      },
      data: {
        ...updateTipoMaterialDto,
        parametros_padrao: updateTipoMaterialDto.parametros_padrao
          ? JSON.stringify(updateTipoMaterialDto.parametros_padrao)
          : undefined,
        atualizado_em: new Date(),
      },
    });
  }

  remove(id: string, loja: { id: string }) {
    return this.prisma.tipomaterial.delete({
      where: {
        id,
        loja_id: loja.id,
      },
    });
  }

  /**
   * Método para criar ou corrigir o tipo de material "Ilhós"
   */
  async criarOuCorrigirTipoMaterialIlhos(loja: { id: string }) {
    // Buscar tipos de material que contenham "ilhós" ou "ilhos" no nome
    const tiposExistentes = await this.prisma.tipomaterial.findMany({
      where: {
        loja_id: loja.id,
        OR: [
          { nome: { contains: 'ilhós' } },
          { nome: { contains: 'ilhos' } },
          { nome: { contains: 'ilhó' } },
          { nome: { contains: 'ilho' } },
        ],
      },
    });

    const parametrosCorretos = {
      tipo_calculo: 'espacamento',
      espacamento: 15, // a cada 15cm
    };

    if (tiposExistentes.length === 0) {
      const novoTipoMaterial = await this.prisma.tipomaterial.create({
        data: {
          nome: 'Ilhós',
          descricao:
            'Ilhós para banners e lonas - aplicação a cada 15cm do perímetro',
          logica_consumo: 'custom',
          parametros_padrao: JSON.stringify(parametrosCorretos),
          atualizado_em: new Date(),
          loja: {
            connect: { id: loja.id },
          },
        },
      });

      return novoTipoMaterial;
    } else {
      for (const tipo of tiposExistentes) {
        let precisaCorrecao = false;
        let novosParametros = parametrosCorretos;

        if (!tipo.parametros_padrao) {
          precisaCorrecao = true;
        } else {
          try {
            const parametros = JSON.parse(tipo.parametros_padrao);
            if (!parametros.tipo_calculo || parametros.tipo_calculo === '') {
              precisaCorrecao = true;
              novosParametros = {
                ...parametros,
                tipo_calculo: 'espacamento',
                espacamento: parametros.espacamento || 15,
              };
            }
          } catch (e) {
            precisaCorrecao = true;
          }
        }

        if (precisaCorrecao) {
          await this.prisma.tipomaterial.update({
            where: { id: tipo.id },
            data: {
              logica_consumo: 'custom',
              parametros_padrao: JSON.stringify(novosParametros),
              atualizado_em: new Date(),
            },
          });
        }
      }

      return tiposExistentes[0]; // Retornar o primeiro tipo encontrado
    }
  }
}
