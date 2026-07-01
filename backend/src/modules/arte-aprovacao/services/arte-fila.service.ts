import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AutorTipo } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  RESPONSABILIDADES_FILA_ARTE,
  STATUS_ARTE_FILA_PENDENTES,
  STATUS_ARTE_KANBAN,
  StatusArte,
} from '../constants/arte.enums';
import { FilaArteQueryDto } from '../dto/fila-arte-query.dto';

@Injectable()
export class ArteFilaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(lojaId: string, query: FilaArteQueryDto, usuarioId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(lojaId, query, usuarioId);

    const [total, itens] = await Promise.all([
      this.prisma.itemOS.count({ where }),
      this.prisma.itemOS.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ arte_fila_desde: 'asc' }, { criado_em: 'asc' }],
        include: {
          os: {
            select: {
              id: true,
              numero: true,
              nome_servico: true,
              data_prazo: true,
              prioridade: true,
              cliente: { select: { nome: true } },
            },
          },
          designer_atribuido: {
            select: { id: true, nome_completo: true },
          },
        },
      }),
    ]);

    const contagens = await this.contarMensagensNaoLidasItens(
      lojaId,
      itens.map((item) => ({ os_id: item.os_id, item_id: item.id })),
    );
    const contagemPorItem = new Map(
      contagens.map((c) => [
        `${c.os_id}:${c.produto_id}`,
        c.mensagens_nao_lidas,
      ]),
    );

    return {
      data: itens.map((item) =>
        this.formatarItem(
          item,
          contagemPorItem.get(`${item.os_id}:${item.id}`) ?? 0,
        ),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async contarPendentes(lojaId: string): Promise<number> {
    return this.prisma.itemOS.count({
      where: this.buildWhere(lojaId, {}, undefined, STATUS_ARTE_FILA_PENDENTES),
    });
  }

  /** Itens que entraram na fila de arte após o instante informado (badge do menu). */
  async contarNovosDesde(lojaId: string, desde: Date): Promise<number> {
    return this.prisma.itemOS.count({
      where: {
        ...this.buildWhere(lojaId, {}, undefined, STATUS_ARTE_FILA_PENDENTES),
        arte_fila_desde: { gte: desde },
      },
    });
  }

  /** Contexto de arte dos itens de uma OS (referências herdadas do orçamento). */
  async listarContextoPorOs(lojaId: string, osId: string) {
    const itens = await this.prisma.itemOS.findMany({
      where: {
        os_id: osId,
        os: { loja_id: lojaId, ativo: true },
      },
      orderBy: [{ ordem_producao: 'asc' }, { criado_em: 'asc' }],
      select: {
        id: true,
        produto_servico: true,
        responsabilidade_arte: true,
        politica_cobranca_arte: true,
        finalidade_anexo: true,
        status_arte: true,
        data_prazo_arte: true,
        arquivo_geometria_url: true,
        geometria_origem: true,
        designer_atribuido: {
          select: { id: true, nome_completo: true },
        },
      },
    });

    const itemIds = itens.map((i) => i.id);
    const versoesProducao =
      itemIds.length === 0
        ? []
        : await this.prisma.arteVersao.findMany({
            where: {
              os_id: osId,
              servico_id: { in: itemIds },
              loja_id: lojaId,
              deletado: false,
              OR: [{ status: 'APROVADA' }, { liberado_para_pcp: true }],
            },
            include: {
              arquivos: {
                orderBy: { data_upload: 'desc' },
                take: 1,
              },
            },
            orderBy: { data_criacao: 'desc' },
          });

    const producaoPorItem = new Map<
      string,
      {
        versao_id: string;
        versao: string;
        arquivo_id: string;
        nome_arquivo: string;
        nome_original: string;
        url_arquivo: string;
        storage_provider: string;
      }
    >();

    for (const versao of versoesProducao) {
      if (!versao.servico_id || producaoPorItem.has(versao.servico_id)) {
        continue;
      }
      const arquivo = versao.arquivos[0];
      if (!arquivo) continue;

      producaoPorItem.set(versao.servico_id, {
        versao_id: versao.id,
        versao: versao.versao,
        arquivo_id: arquivo.id,
        nome_arquivo: arquivo.nome_arquivo,
        nome_original: arquivo.nome_original,
        url_arquivo: arquivo.url_arquivo,
        storage_provider: arquivo.storage_provider,
      });
    }

    return itens.map((item) => ({
      item_id: item.id,
      produto_nome: item.produto_servico,
      responsabilidade_arte: item.responsabilidade_arte,
      politica_cobranca_arte: item.politica_cobranca_arte,
      finalidade_anexo: item.finalidade_anexo,
      status_arte: item.status_arte,
      data_prazo_arte: item.data_prazo_arte?.toISOString?.() ?? null,
      referencia_url: item.arquivo_geometria_url,
      geometria_origem: item.geometria_origem,
      designer_atribuido: item.designer_atribuido
        ? {
            id: item.designer_atribuido.id,
            nome: item.designer_atribuido.nome_completo,
          }
        : null,
      arte_producao: producaoPorItem.get(item.id) ?? null,
    }));
  }

  async atualizarPrazoArteItem(
    lojaId: string,
    osId: string,
    itemId: string,
    dataPrazoArte: Date | null,
  ) {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os_id: osId,
        os: { loja_id: lojaId, ativo: true },
      },
      select: {
        id: true,
        responsabilidade_arte: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item da OS não encontrado');
    }

    const interno = ['EMPRESA_CRIA', 'EMPRESA_ADAPTA'].includes(
      item.responsabilidade_arte,
    );
    if (!interno) {
      throw new ConflictException(
        'Prazo de arte só se aplica a produtos com arte produzida pela empresa',
      );
    }

    return this.prisma.itemOS.update({
      where: { id: itemId },
      data: { data_prazo_arte: dataPrazoArte },
      select: {
        id: true,
        data_prazo_arte: true,
        status_arte: true,
      },
    });
  }

  private buildWhere(
    lojaId: string,
    query: FilaArteQueryDto,
    usuarioId?: string,
    statusOverride?: StatusArte[],
  ) {
    const statusFiltro =
      statusOverride ?? (query.status ? [query.status] : STATUS_ARTE_KANBAN);

    let designerId = query.designer_id;
    if (query.modo === 'me' && usuarioId) {
      designerId = usuarioId;
    }

    return {
      responsabilidade_arte: { in: RESPONSABILIDADES_FILA_ARTE },
      status_arte: { in: statusFiltro },
      ...(designerId ? { designer_atribuido_id: designerId } : {}),
      os: {
        loja_id: lojaId,
        ativo: true,
      },
    };
  }

  private formatarItem(item: any, mensagensNaoLidas = 0) {
    return {
      os_id: item.os_id,
      os_numero: item.os?.numero,
      os_nome_servico: item.os?.nome_servico,
      item_id: item.id,
      produto_nome: item.produto_servico,
      cliente_nome: item.os?.cliente?.nome ?? null,
      responsabilidade_arte: item.responsabilidade_arte,
      politica_cobranca_arte: item.politica_cobranca_arte,
      status_arte: item.status_arte,
      prazo_os: item.os?.data_prazo?.toISOString?.() ?? null,
      prioridade_os: item.os?.prioridade ?? null,
      referencia_url: item.arquivo_geometria_url,
      geometria_origem: item.geometria_origem ?? null,
      finalidade_anexo: item.finalidade_anexo,
      designer_atribuido: item.designer_atribuido
        ? {
            id: item.designer_atribuido.id,
            nome: item.designer_atribuido.nome_completo,
          }
        : null,
      arte_fila_desde: item.arte_fila_desde?.toISOString?.() ?? null,
      arte_assumido_em: item.arte_assumido_em?.toISOString?.() ?? null,
      mensagens_nao_lidas: mensagensNaoLidas,
    };
  }

  private async contarMensagensNaoLidasItens(
    lojaId: string,
    pares: Array<{ os_id: string; item_id: string }>,
  ) {
    if (pares.length === 0) return [];

    const itemIds = [...new Set(pares.map((p) => p.item_id))];
    const osIds = [...new Set(pares.map((p) => p.os_id))];

    const agrupado = await this.prisma.arteMensagem.groupBy({
      by: ['os_id', 'produto_id'],
      where: {
        loja_id: lojaId,
        lida: false,
        autor_tipo: AutorTipo.CLIENTE,
        produto_id: { in: itemIds },
        os_id: { in: osIds },
      },
      _count: { id: true },
    });

    return agrupado.map((row) => ({
      os_id: row.os_id,
      produto_id: row.produto_id,
      mensagens_nao_lidas: row._count.id,
    }));
  }
}
