import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CatalogoInsumosPrismaService } from '../prisma/catalogo-insumos-prisma.service';
import { CreateCatalogoInsumoDto, UpdateCatalogoInsumoDto, BuscarInsumosDto } from '../dto';
import { CatalogoInsumo, PaginatedResult } from '../interfaces';

@Injectable()
export class CatalogoInsumosService {
  private readonly logger = new Logger(CatalogoInsumosService.name);

  constructor(
    private readonly prisma: CatalogoInsumosPrismaService,
  ) {}

  /**
   * Criar novo insumo no catálogo
   */
  async createInsumo(dto: CreateCatalogoInsumoDto): Promise<CatalogoInsumo> {
    try {
      this.logger.log(`Criando insumo: ${dto.nome}`);

      // Verificar se código já existe
      const existingInsumo = await (this.prisma as any).catalogoInsumo.findUnique({
        where: { codigo_catalogo: dto.codigo_catalogo },
      });

      if (existingInsumo) {
        throw new BadRequestException(`Código ${dto.codigo_catalogo} já existe no catálogo`);
      }

      // Criar insumo
      const insumo = await (this.prisma as any).catalogoInsumo.create({
        data: {
          ...dto,
          data_coleta: dto.data_coleta ? new Date(dto.data_coleta) : new Date(),
        },
        include: {
          categoria_global: true,
        },
      });

      this.logger.log(`Insumo criado com sucesso: ${insumo.id}`);
      return this.convertPrismaToInterface(insumo);
    } catch (error) {
      this.logger.error(`Erro ao criar insumo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar insumo por ID
   */
  async findInsumoById(id: string): Promise<CatalogoInsumo> {
    try {
      const insumo = await (this.prisma as any).catalogoInsumo.findUnique({
        where: { id },
        include: {
          categoria_global: true,
        },
      });

      if (!insumo) {
        throw new NotFoundException(`Insumo com ID ${id} não encontrado`);
      }

      return this.convertPrismaToInterface(insumo);
    } catch (error) {
      this.logger.error(`Erro ao buscar insumo por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar insumos com filtros e paginação
   */
  async buscarInsumos(filtros: BuscarInsumosDto): Promise<PaginatedResult<CatalogoInsumo>> {
    try {
      const { page = 1, limit = 20, nome, categoria_id, marca, ativo, disponibilidade, orderBy = 'nome', orderDirection = 'asc' } = filtros;

      // Construir filtros
      const where: any = {};
      
      if (nome) {
        where.nome = { contains: nome };
      }
      
      if (categoria_id) {
        where.categoria_global_id = categoria_id;
      }
      
      if (marca) {
        where.marca = { contains: marca };
      }
      
      if (ativo !== undefined) {
        where.ativo = ativo;
      }
      
      if (disponibilidade !== undefined) {
        where.disponibilidade = disponibilidade;
      }

      // Contar total
      const total = await (this.prisma as any).catalogoInsumo.count({ where });

      // Buscar dados
      const data = await (this.prisma as any).catalogoInsumo.findMany({
        where,
        include: {
          categoria_global: true,
        },
        orderBy: { [orderBy]: orderDirection },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: data.map(item => this.convertPrismaToInterface(item)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar insumos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualizar insumo
   */
  async updateInsumo(id: string, dto: UpdateCatalogoInsumoDto): Promise<CatalogoInsumo> {
    try {
      this.logger.log(`Atualizando insumo: ${id}`);

      // Verificar se insumo existe
      const existingInsumo = await this.findInsumoById(id);

      // Verificar se código já existe (se foi alterado)
      if (dto.codigo_catalogo && dto.codigo_catalogo !== existingInsumo.codigo_catalogo) {
        const duplicateInsumo = await (this.prisma as any).catalogoInsumo.findUnique({
          where: { codigo_catalogo: dto.codigo_catalogo },
        });

        if (duplicateInsumo) {
          throw new BadRequestException(`Código ${dto.codigo_catalogo} já existe no catálogo`);
        }
      }

      // Atualizar insumo
      const updatedInsumo = await (this.prisma as any).catalogoInsumo.update({
        where: { id },
        data: {
          ...dto,
          data_atualizacao: new Date(),
        },
        include: {
          categoria_global: true,
        },
      });

      this.logger.log(`Insumo atualizado com sucesso: ${id}`);
      return this.convertPrismaToInterface(updatedInsumo);
    } catch (error) {
      this.logger.error(`Erro ao atualizar insumo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desativar insumo (soft delete)
   */
  async deactivateInsumo(id: string): Promise<CatalogoInsumo> {
    try {
      this.logger.log(`Desativando insumo: ${id}`);

      const insumo = await (this.prisma as any).catalogoInsumo.update({
        where: { id },
        data: { ativo: false },
        include: {
          categoria_global: true,
        },
      });

      this.logger.log(`Insumo desativado com sucesso: ${id}`);
      return this.convertPrismaToInterface(insumo);
    } catch (error) {
      this.logger.error(`Erro ao desativar insumo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ativar insumo
   */
  async activateInsumo(id: string): Promise<CatalogoInsumo> {
    try {
      this.logger.log(`Ativando insumo: ${id}`);

      const insumo = await (this.prisma as any).catalogoInsumo.update({
        where: { id },
        data: { ativo: true },
        include: {
          categoria_global: true,
        },
      });

      this.logger.log(`Insumo ativado com sucesso: ${id}`);
      return this.convertPrismaToInterface(insumo);
    } catch (error) {
      this.logger.error(`Erro ao ativar insumo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar insumos por categoria
   */
  async findInsumosByCategoria(categoriaId: string): Promise<CatalogoInsumo[]> {
    try {
      const insumos = await (this.prisma as any).catalogoInsumo.findMany({
        where: {
          categoria_global_id: categoriaId,
          ativo: true,
        },
        include: {
          categoria_global: true,
        },
        orderBy: { nome: 'asc' },
      });

      return insumos.map(item => this.convertPrismaToInterface(item));
    } catch (error) {
      this.logger.error(`Erro ao buscar insumos por categoria: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar insumos por marca
   */
  async findInsumosByMarca(marca: string): Promise<CatalogoInsumo[]> {
    try {
      const insumos = await (this.prisma as any).catalogoInsumo.findMany({
        where: {
          marca: { contains: marca },
          ativo: true,
        },
        include: {
          categoria_global: true,
        },
        orderBy: { nome: 'asc' },
      });

      return insumos.map(item => this.convertPrismaToInterface(item));
    } catch (error) {
      this.logger.error(`Erro ao buscar insumos por marca: ${error.message}`);
      throw error;
    }
  }

  /**
   * Converter resultado do Prisma para interface
   */
  private convertPrismaToInterface(prismaResult: any): CatalogoInsumo {
    return {
      ...prismaResult,
      fator_conversao: Number(prismaResult.fator_conversao),
      largura: prismaResult.largura ? Number(prismaResult.largura) : undefined,
      altura: prismaResult.altura ? Number(prismaResult.altura) : undefined,
      gramatura: prismaResult.gramatura ? Number(prismaResult.gramatura) : undefined,
    };
  }
}
