import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { loja, TipoFornecedor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFornecedoreDto } from './dto/create-fornecedore.dto';
import { UpdateFornecedoreDto } from './dto/update-fornecedore.dto';

@Injectable()
export class FornecedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFornecedoreDto, lojaAtual: loja) {
    const nome = dto.nome.trim();
    await this.validarNomeDuplicado(nome, lojaAtual.id);

    return this.prisma.fornecedor.create({
      data: {
        ...dto,
        nome,
        estado: dto.estado?.toUpperCase(),
        loja_id: lojaAtual.id,
      },
    });
  }

  findAll(lojaAtual: loja, finalidade?: 'INSUMO' | 'TERCEIRIZACAO') {
    const tipos =
      finalidade === 'INSUMO'
        ? [TipoFornecedor.INSUMO, TipoFornecedor.AMBOS]
        : finalidade === 'TERCEIRIZACAO'
          ? [TipoFornecedor.TERCEIRIZADO, TipoFornecedor.AMBOS]
          : undefined;
    return this.prisma.fornecedor.findMany({
      where: {
        loja_id: lojaAtual.id,
        ...(tipos ? { tipo: { in: tipos } } : {}),
        ...(finalidade ? { ativo: true } : {}),
      },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
      include: {
        _count: {
          select: {
            insumos: true,
            insumos_associados: true,
            itens_terceirizados: true,
            produtos_orcados_terceirizados: true,
          },
        },
      },
    });
  }

  async findOne(id: string, lojaAtual: loja) {
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: {
        _count: {
          select: {
            insumos: true,
            insumos_associados: true,
            itens_terceirizados: true,
            produtos_orcados_terceirizados: true,
          },
        },
      },
    });

    if (!fornecedor) {
      throw new NotFoundException(`Fornecedor com ID "${id}" não encontrado.`);
    }

    return fornecedor;
  }

  async update(id: string, dto: UpdateFornecedoreDto, lojaAtual: loja) {
    await this.findOne(id, lojaAtual);

    const nome = dto.nome?.trim();
    if (nome) {
      await this.validarNomeDuplicado(nome, lojaAtual.id, id);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.ativo === false || dto.tipo === TipoFornecedor.TERCEIRIZADO) {
        const vinculos = await tx.insumoFornecedor.count({
          where: { fornecedor_id: id, loja_id: lojaAtual.id },
        });
        if (vinculos > 0) {
          throw new BadRequestException(
            `Não é possível inativar ou tornar este fornecedor exclusivamente terceirizado: existem ${vinculos} vínculo(s) na matriz de insumos. Reatribua esses insumos antes.`,
          );
        }
      }

      return tx.fornecedor.update({
        where: { id },
        data: {
          ...dto,
          ...(nome ? { nome } : {}),
          ...(dto.estado ? { estado: dto.estado.toUpperCase() } : {}),
        },
      });
    });
  }

  async remove(id: string, lojaAtual: loja) {
    const fornecedor = await this.findOne(id, lojaAtual);

    const vinculosMatriz = await this.prisma.insumoFornecedor.findMany({
      where: { fornecedor_id: id, loja_id: lojaAtual.id },
      select: { insumo: { select: { nome: true } } },
      take: 6,
      orderBy: { insumo_id: 'asc' },
    });
    if (vinculosMatriz.length > 0) {
      const nomes = vinculosMatriz
        .slice(0, 5)
        .map((vinculo) => vinculo.insumo.nome)
        .join(', ');
      const complemento = vinculosMatriz.length > 5 ? ' e outros insumos' : '';
      throw new BadRequestException(
        `Não é possível excluir este fornecedor porque ele está associado na matriz de: ${nomes}${complemento}. Remova as associações antes.`,
      );
    }

    const insumos = await this.prisma.insumo.findMany({
      where: { fornecedorId: id },
      select: { nome: true },
    });

    if (insumos.length > 0) {
      throw new BadRequestException(
        `Não é possível excluir este fornecedor porque ele está sendo usado pelos insumos: ${insumos.map((insumo) => insumo.nome).join(', ')}. Inative o cadastro para preservar o histórico.`,
      );
    }

    const itensTerceirizados = await this.prisma.itemOS.count({
      where: { fornecedor_id: id },
    });

    if (itensTerceirizados > 0) {
      throw new BadRequestException(
        `Não é possível excluir este fornecedor porque ele está vinculado a ${itensTerceirizados} item(ns) de ordem de serviço. Inative o cadastro para preservar o histórico.`,
      );
    }

    const produtosOrcados = await this.prisma.produtoOrcamento.count({
      where: { fornecedor_terceirizado_id: id },
    });

    if (produtosOrcados > 0) {
      throw new BadRequestException(
        `Não é possível excluir este fornecedor porque ele está vinculado a ${produtosOrcados} produto(s) de orçamento. Inative o cadastro para preservar o histórico.`,
      );
    }

    await this.prisma.fornecedor.delete({ where: { id } });
    return { message: `Fornecedor "${fornecedor.nome}" removido com sucesso.` };
  }

  private async validarNomeDuplicado(
    nome: string,
    lojaId: string,
    ignorarId?: string,
  ) {
    const existente = await this.prisma.fornecedor.findFirst({
      where: {
        loja_id: lojaId,
        nome,
        ...(ignorarId ? { id: { not: ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (existente) {
      throw new BadRequestException(
        `Já existe um fornecedor com o nome "${nome}" cadastrado.`,
      );
    }
  }
}
