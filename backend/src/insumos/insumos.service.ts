import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { Loja } from '@prisma/client';

@Injectable()
export class InsumosService {
  constructor(private prisma: PrismaService) {}

  async create(createInsumoDto: CreateInsumoDto, loja: Loja) {
    // Verificar unicidade por fornecedor
    const existingInsumo = await this.prisma.insumo.findFirst({
      where: {
        loja_id: loja.id,
        nome: createInsumoDto.nome,
        fornecedorId: createInsumoDto.fornecedorId,
      },
    });

    if (existingInsumo) {
      throw new ConflictException(
        `Já existe um insumo com o nome "${createInsumoDto.nome}" para este fornecedor.`
      );
    }

    // Verificar se categoria e fornecedor pertencem à mesma loja
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: createInsumoDto.categoriaId, loja_id: loja.id },
    });

    if (!categoria) {
      throw new BadRequestException('Categoria não encontrada ou não pertence à sua loja.');
    }

    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id: createInsumoDto.fornecedorId, loja_id: loja.id },
    });

    if (!fornecedor) {
      throw new BadRequestException('Fornecedor não encontrado ou não pertence à sua loja.');
    }

    const insumo = await this.prisma.insumo.create({
      data: {
        ...createInsumoDto,
        loja_id: loja.id,
        ativo: createInsumoDto.ativo ?? true,
      },
      include: {
        categoria: true,
        fornecedor: true,
      },
    });

    // Converter valores Decimal para números
    return {
      ...insumo,
      custo_unitario: Number(insumo.custo_unitario),
      quantidade_compra: Number(insumo.quantidade_compra),
      fator_conversao: Number(insumo.fator_conversao),
      largura: insumo.largura ? Number(insumo.largura) : null,
      altura: insumo.altura ? Number(insumo.altura) : null,
      gramatura: insumo.gramatura ? Number(insumo.gramatura) : null,
    };
  }

  async findAll(loja: Loja) {
    const insumos = await this.prisma.insumo.findMany({
      where: { loja_id: loja.id },
      include: {
        categoria: true,
        fornecedor: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    // Converter valores Decimal para números
    return insumos.map(insumo => ({
      ...insumo,
      custo_unitario: Number(insumo.custo_unitario),
      quantidade_compra: Number(insumo.quantidade_compra),
      fator_conversao: Number(insumo.fator_conversao),
      largura: insumo.largura ? Number(insumo.largura) : null,
      altura: insumo.altura ? Number(insumo.altura) : null,
      gramatura: insumo.gramatura ? Number(insumo.gramatura) : null,
    }));
  }

  async findOne(id: string, loja: Loja) {
    const insumo = await this.prisma.insumo.findUnique({
      where: { id },
      include: {
        categoria: true,
        fornecedor: true,
      },
    });

    if (!insumo) {
      throw new NotFoundException(`Insumo com ID "${id}" não encontrado.`);
    }

    if (insumo.loja_id !== loja.id) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso.');
    }

    // Converter valores Decimal para números
    return {
      ...insumo,
      custo_unitario: Number(insumo.custo_unitario),
      quantidade_compra: Number(insumo.quantidade_compra),
      fator_conversao: Number(insumo.fator_conversao),
      largura: insumo.largura ? Number(insumo.largura) : null,
      altura: insumo.altura ? Number(insumo.altura) : null,
      gramatura: insumo.gramatura ? Number(insumo.gramatura) : null,
    };
  }

  async update(id: string, updateInsumoDto: UpdateInsumoDto, loja: Loja) {
    const existingInsumo = await this.findOne(id, loja);

    // TODO: Implementar histórico de preços após migração
    // Se o custo unitário foi alterado, registrar no histórico
    // if (updateInsumoDto.custo_unitario && updateInsumoDto.custo_unitario !== Number(insumo.custo_unitario)) {
    //   await this.prisma.historicoPrecoInsumo.create({
    //     data: {
    //       insumo_id: id,
    //       custo_anterior: insumo.custo_unitario,
    //       custo_novo: updateInsumoDto.custo_unitario,
    //       motivo: updateInsumoDto.motivo_alteracao_preco || 'Alteração de preço',
    //     },
    //   });
    // }

    // Verificar unicidade se o nome foi alterado
    if (updateInsumoDto.nome && updateInsumoDto.nome !== existingInsumo.nome) {
      const existingInsumoWithSameName = await this.prisma.insumo.findFirst({
        where: {
          loja_id: loja.id,
          nome: updateInsumoDto.nome,
          fornecedorId: existingInsumo.fornecedorId,
          id: { not: id },
        },
      });

      if (existingInsumoWithSameName) {
        throw new ConflictException(
          `Já existe um insumo com o nome "${updateInsumoDto.nome}" para este fornecedor.`
        );
      }
    }

    const insumo = await this.prisma.insumo.update({
      where: { id },
      data: updateInsumoDto,
      include: {
        categoria: true,
        fornecedor: true,
      },
    });

    // Converter valores Decimal para números
    return {
      ...insumo,
      custo_unitario: Number(insumo.custo_unitario),
      quantidade_compra: Number(insumo.quantidade_compra),
      fator_conversao: Number(insumo.fator_conversao),
      largura: insumo.largura ? Number(insumo.largura) : null,
      altura: insumo.altura ? Number(insumo.altura) : null,
      gramatura: insumo.gramatura ? Number(insumo.gramatura) : null,
    };
  }

  async remove(id: string, loja: Loja) {
    const existingInsumo = await this.findOne(id, loja);
    
    // Verifica se o insumo está sendo usado em orçamentos
    const itensOrcamento = await this.prisma.itemOrcamento.findMany({
      where: { insumo_id: id },
      include: {
        orcamento: true,
      },
    });

    if (itensOrcamento.length > 0) {
      const orcamentosUsando = itensOrcamento.map(item => 
        `Orçamento #${item.orcamento.numero} - ${item.orcamento.nome_servico}`
      ).join(', ');
      
      throw new BadRequestException(
        `Não é possível excluir este insumo pois ele está sendo usado nos seguintes orçamentos: ${orcamentosUsando}. ` +
        'Remova o insumo dos orçamentos antes de excluí-lo.'
      );
    }

    await this.prisma.insumo.delete({
      where: { id },
    });

    return { message: `Insumo "${existingInsumo.nome}" foi removido com sucesso.` };
  }

  // TODO: Implementar após migração
  // Novo método para buscar insumos com filtros
  // async search(query: string, loja: Loja) {
  //   return this.prisma.insumo.findMany({
  //     where: {
  //       loja_id: loja.id,
  //       OR: [
  //         { nome: { contains: query, mode: 'insensitive' } },
  //         { codigo_interno: { contains: query, mode: 'insensitive' } },
  //         { descricao_tecnica: { contains: query, mode: 'insensitive' } },
  //       ],
  //     },
  //     include: {
  //       categoria: true,
  //       fornecedor: true,
  //     },
  //     orderBy: { nome: 'asc' },
  //   });
  // }

  // TODO: Implementar após migração
  // Novo método para buscar insumos ativos
  // async findActive(loja: Loja) {
  //   return this.prisma.insumo.findMany({
  //     where: { 
  //       loja_id: loja.id,
  //       ativo: true,
  //     },
  //     include: {
  //       categoria: true,
  //       fornecedor: true,
  //     },
  //     orderBy: { nome: 'asc' },
  //   });
  // }
} 