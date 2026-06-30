import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaProdutoFinitoDto } from './dto/create-categoria-produto-finito.dto';
import { CreateProdutoFinitoDto } from './dto/create-produto-finito.dto';
import { ListProdutosFinitosQueryDto } from './dto/list-produtos-finitos-query.dto';
import { UpdateProdutoFinitoDto } from './dto/update-produto-finito.dto';
import { resolverPrecoUnitarioProdutoFinito } from './utils/preco-produto-finito.util';
import {
  assertEstampasAtivasDaLoja,
  assertProcessosAtivosDaLoja,
  includePersonalizacaoParaOrcamento,
  mapearPersonalizacaoParaOrcamento,
  normalizarModosPersonalizacao,
} from './utils/produto-finito-personalizacao.util';

@Injectable()
export class ProdutosFinitosService {
  private readonly logger = new Logger(ProdutosFinitosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listarCategorias(lojaId: string, ativo?: boolean) {
    const where: Prisma.CategoriaProdutoFinitoWhereInput = { loja_id: lojaId };
    if (typeof ativo === 'boolean') {
      where.ativo = ativo;
    }

    return this.prisma.categoriaProdutoFinito.findMany({
      where,
      select: { id: true, nome: true, ativo: true },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  async criarCategoria(lojaId: string, dto: CreateCategoriaProdutoFinitoDto) {
    const nome = dto.nome.trim();
    await this.validarNomeCategoriaDisponivel(lojaId, nome);

    return this.prisma.categoriaProdutoFinito.create({
      data: {
        loja_id: lojaId,
        nome,
        ativo: true,
      },
      select: { id: true, nome: true, ativo: true },
    });
  }

  async listar(lojaId: string, query: ListProdutosFinitosQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProdutoFinitoWhereInput = { loja_id: lojaId };

    if (typeof query.ativo === 'boolean') {
      where.ativo = query.ativo;
    }

    if (query.categoria_id) {
      where.categoria_id = query.categoria_id;
    }

    if (query.busca?.trim()) {
      const termo = query.busca.trim();
      where.OR = [
        { nome: { contains: termo } },
        { sku: { contains: termo } },
        { ean: { contains: termo } },
        { descricao: { contains: termo } },
        { descricao_resumida: { contains: termo } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.produtoFinito.findMany({
        where,
        include: {
          categoria: { select: { id: true, nome: true } },
          imagens: { orderBy: { ordem: 'asc' }, take: 1 },
        },
        orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.produtoFinito.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async obterPorId(id: string, lojaId: string) {
    const produto = await this.prisma.produtoFinito.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        categoria: { select: { id: true, nome: true } },
        imagens: { orderBy: { ordem: 'asc' } },
        modos: { where: { habilitado: true }, select: { modo: true } },
        estampas: {
          include: {
            estampa: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                arte_mestra_url: true,
                thumb_url: true,
              },
            },
          },
        },
        processos: {
          include: {
            processo: { select: { id: true, nome: true, codigo: true } },
          },
        },
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return produto;
  }

  async criar(lojaId: string, dto: CreateProdutoFinitoDto) {
    const sku = dto.sku.trim();
    await this.validarSkuDisponivel(lojaId, sku);

    const categoriaId = await this.resolverCategoriaId(lojaId, dto);

    if (dto.preco_promocional != null) {
      this.validarPrecoPromocional(dto.preco_venda, dto.preco_promocional);
    }

    return this.prisma.produtoFinito.create({
      data: {
        loja_id: lojaId,
        categoria_id: categoriaId,
        sku,
        ean: dto.ean?.trim() || null,
        nome: dto.nome.trim(),
        descricao_resumida: dto.descricao_resumida?.trim() || null,
        descricao: dto.descricao?.trim() || null,
        preco_venda: dto.preco_venda,
        preco_promocional: dto.preco_promocional ?? null,
        preco_custo: dto.preco_custo ?? null,
        peso_kg: dto.peso_kg ?? 0,
        largura_cm: dto.largura_cm ?? 0,
        altura_cm: dto.altura_cm ?? 0,
        profundidade_cm: dto.profundidade_cm ?? 0,
        estoque_atual: dto.estoque_atual ?? 0,
        estoque_minimo: dto.estoque_minimo ?? 0,
        ativo: dto.ativo ?? true,
      },
      include: {
        categoria: { select: { id: true, nome: true } },
        imagens: { orderBy: { ordem: 'asc' } },
      },
    });
  }

  async atualizar(id: string, lojaId: string, dto: UpdateProdutoFinitoDto) {
    await this.obterPorId(id, lojaId);

    if (dto.sku) {
      await this.validarSkuDisponivel(lojaId, dto.sku.trim(), id);
    }

    let categoriaId: string | null | undefined = undefined;
    if (dto.categoria_id !== undefined || dto.categoria_nome) {
      categoriaId = await this.resolverCategoriaId(lojaId, dto);
    }

    const precoVenda =
      dto.preco_venda ??
      Number((await this.obterPorId(id, lojaId)).preco_venda);
    if (dto.preco_promocional != null) {
      this.validarPrecoPromocional(precoVenda, dto.preco_promocional);
    }

    const vinculosPersonalizacao = this.resolverVinculosPersonalizacao(dto);

    if (vinculosPersonalizacao.estampaIds) {
      await assertEstampasAtivasDaLoja(
        this.prisma,
        vinculosPersonalizacao.estampaIds,
        lojaId,
      );
    }

    if (vinculosPersonalizacao.processoIds) {
      await assertProcessosAtivosDaLoja(
        this.prisma,
        vinculosPersonalizacao.processoIds,
        lojaId,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.produtoFinito.update({
        where: { id },
        data: {
          categoria_id: categoriaId,
          sku: dto.sku?.trim(),
          ean: dto.ean !== undefined ? dto.ean?.trim() || null : undefined,
          nome: dto.nome?.trim(),
          descricao_resumida:
            dto.descricao_resumida !== undefined
              ? dto.descricao_resumida?.trim() || null
              : undefined,
          descricao:
            dto.descricao !== undefined
              ? dto.descricao?.trim() || null
              : undefined,
          preco_venda: dto.preco_venda,
          preco_promocional:
            dto.preco_promocional !== undefined
              ? dto.preco_promocional
              : undefined,
          preco_custo:
            dto.preco_custo !== undefined ? dto.preco_custo : undefined,
          peso_kg: dto.peso_kg,
          largura_cm: dto.largura_cm,
          altura_cm: dto.altura_cm,
          profundidade_cm: dto.profundidade_cm,
          estoque_atual: dto.estoque_atual,
          estoque_minimo: dto.estoque_minimo,
          ativo: dto.ativo,
          personalizavel: dto.personalizavel,
          fulfillment_padrao: dto.fulfillment_padrao,
        },
      });

      if (vinculosPersonalizacao.limparVinculos) {
        await tx.produtoFinitoModo.deleteMany({
          where: { produto_finito_id: id },
        });
        await tx.produtoFinitoEstampa.deleteMany({
          where: { produto_finito_id: id },
        });
        await tx.produtoFinitoProcesso.deleteMany({
          where: { produto_finito_id: id },
        });
      } else {
        if (vinculosPersonalizacao.modos !== undefined) {
          await tx.produtoFinitoModo.deleteMany({
            where: { produto_finito_id: id },
          });
          if (vinculosPersonalizacao.modos.length > 0) {
            await tx.produtoFinitoModo.createMany({
              data: vinculosPersonalizacao.modos.map((modo) => ({
                loja_id: lojaId,
                produto_finito_id: id,
                modo,
                habilitado: true,
              })),
            });
          }
        }

        if (vinculosPersonalizacao.estampaIds !== undefined) {
          await tx.produtoFinitoEstampa.deleteMany({
            where: { produto_finito_id: id },
          });
          if (vinculosPersonalizacao.estampaIds.length > 0) {
            await tx.produtoFinitoEstampa.createMany({
              data: vinculosPersonalizacao.estampaIds.map((estampaId) => ({
                loja_id: lojaId,
                produto_finito_id: id,
                estampa_id: estampaId,
              })),
            });
          }
        }

        if (vinculosPersonalizacao.processoIds !== undefined) {
          await tx.produtoFinitoProcesso.deleteMany({
            where: { produto_finito_id: id },
          });
          if (vinculosPersonalizacao.processoIds.length > 0) {
            await tx.produtoFinitoProcesso.createMany({
              data: vinculosPersonalizacao.processoIds.map((processoId) => ({
                loja_id: lojaId,
                produto_finito_id: id,
                processo_id: processoId,
              })),
            });
          }
        }
      }

      return tx.produtoFinito.findFirstOrThrow({
        where: { id, loja_id: lojaId },
        include: {
          categoria: { select: { id: true, nome: true } },
          imagens: { orderBy: { ordem: 'asc' } },
          modos: { where: { habilitado: true }, select: { modo: true } },
          estampas: {
            include: {
              estampa: { select: { id: true, nome: true, codigo: true } },
            },
          },
          processos: {
            include: {
              processo: { select: { id: true, nome: true, codigo: true } },
            },
          },
        },
      });
    });
  }

  async remover(id: string, lojaId: string) {
    await this.obterPorId(id, lojaId);

    return this.prisma.produtoFinito.update({
      where: { id },
      data: { ativo: false },
      select: { id: true, ativo: true },
    });
  }

  async obterParaOrcamento(id: string, lojaId: string) {
    const produto = await this.prisma.produtoFinito.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        categoria: { select: { id: true, nome: true } },
        imagens: { orderBy: { ordem: 'asc' } },
        ...includePersonalizacaoParaOrcamento,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    if (!produto.ativo) {
      throw new BadRequestException('Produto indisponível no catálogo.');
    }

    const preco_unitario = resolverPrecoUnitarioProdutoFinito(produto);
    const personalizacao = mapearPersonalizacaoParaOrcamento(produto);

    return {
      ...produto,
      preco_unitario,
      preco_efetivo: preco_unitario,
      personalizacao,
    };
  }

  private resolverVinculosPersonalizacao(dto: UpdateProdutoFinitoDto) {
    if (dto.personalizavel === false) {
      return {
        limparVinculos: true as const,
        modos: undefined,
        estampaIds: undefined,
        processoIds: undefined,
      };
    }

    return {
      limparVinculos: false as const,
      modos:
        dto.modos_personalizacao !== undefined
          ? normalizarModosPersonalizacao(dto.modos_personalizacao)
          : undefined,
      estampaIds: dto.estampa_ids,
      processoIds: dto.processo_ids,
    };
  }

  private async resolverCategoriaId(
    lojaId: string,
    dto: Pick<CreateProdutoFinitoDto, 'categoria_id' | 'categoria_nome'>,
  ): Promise<string | null> {
    if (dto.categoria_id) {
      const categoria = await this.prisma.categoriaProdutoFinito.findFirst({
        where: { id: dto.categoria_id, loja_id: lojaId, ativo: true },
      });
      if (!categoria) {
        throw new BadRequestException('Categoria de produto inválida.');
      }
      return categoria.id;
    }

    if (dto.categoria_nome?.trim()) {
      const nome = dto.categoria_nome.trim();
      const existente = await this.prisma.categoriaProdutoFinito.findFirst({
        where: { loja_id: lojaId, nome },
      });
      if (existente) {
        return existente.id;
      }
      const criada = await this.criarCategoria(lojaId, { nome });
      return criada.id;
    }

    return null;
  }

  private validarPrecoPromocional(
    precoVenda: number,
    precoPromocional: number,
  ) {
    if (precoPromocional > 0 && precoPromocional >= precoVenda) {
      throw new BadRequestException(
        'Preço promocional deve ser maior que zero e menor que o preço de venda.',
      );
    }
  }

  private async validarSkuDisponivel(
    lojaId: string,
    sku: string,
    ignorarId?: string,
  ) {
    const existente = await this.prisma.produtoFinito.findFirst({
      where: {
        loja_id: lojaId,
        sku,
        ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (existente) {
      throw new BadRequestException('SKU já cadastrado para esta loja.');
    }
  }

  private async validarNomeCategoriaDisponivel(
    lojaId: string,
    nome: string,
    ignorarId?: string,
  ) {
    const existente = await this.prisma.categoriaProdutoFinito.findFirst({
      where: {
        loja_id: lojaId,
        nome,
        ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (existente) {
      throw new BadRequestException(
        'Já existe uma categoria de produto com este nome.',
      );
    }
  }
}
