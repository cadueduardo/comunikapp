import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { resolverMedidasComerciaisInsumo } from '../../common/calculo-chapa/calculo-chapa.util';

export interface OrcamentoOrigemSobraResumo {
  id: string;
  numero: string;
  titulo: string;
  cliente_nome: string;
  status: string;
  data_criacao: string;
}

export interface CandidatoSobraOrcamento {
  item_insumo_id: string;
  insumo_id: string;
  insumo_nome: string;
  produto_id: string;
  produto_nome: string;
  quantidade_material: number;
  unidade_material: string;
  permite_registrar_sobra: boolean;
  calculo_chapa: Record<string, unknown> | null;
  sobra_estimada_m2: number | null;
  largura_comercial: number | null;
  altura_comercial: number | null;
  comprimento_comercial: number | null;
  formato_material: string | null;
  unidade_dimensao: string | null;
  sugestao: {
    descricao: string;
    dimensoes: string | null;
    area: number | null;
    quantidade: number;
    unidade_medida: string;
    material: string;
    orcamento_origem: string;
    orcamento_numero: string;
  };
}

@Injectable()
export class OrcamentoOrigemSobraService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarOrcamentos(lojaId: string, termo?: string, limite = 20) {
    const q = (termo || '').trim();
    const take = Math.min(Math.max(limite, 1), 50);

    const orcamentos = await this.prisma.orcamento.findMany({
      where: {
        loja_id: lojaId,
        excluido_em: null,
        ...(q
          ? {
              OR: [
                { numero: { contains: q } },
                { titulo: { contains: q } },
                { descricao: { contains: q } },
                {
                  cliente: {
                    nome: { contains: q },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        numero: true,
        titulo: true,
        status: true,
        data_criacao: true,
        cliente: { select: { nome: true } },
      },
      orderBy: { data_criacao: 'desc' },
      take,
    });

    return orcamentos.map(
      (o): OrcamentoOrigemSobraResumo => ({
        id: o.id,
        numero: o.numero,
        titulo: o.titulo,
        cliente_nome: o.cliente?.nome ?? '—',
        status: o.status,
        data_criacao: o.data_criacao.toISOString(),
      }),
    );
  }

  async listarCandidatosSobra(
    lojaId: string,
    orcamentoId: string,
  ): Promise<{
    orcamento: OrcamentoOrigemSobraResumo;
    candidatos: CandidatoSobraOrcamento[];
  }> {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId, excluido_em: null },
      select: {
        id: true,
        numero: true,
        titulo: true,
        status: true,
        data_criacao: true,
        cliente: { select: { nome: true } },
        produtos: {
          select: {
            id: true,
            nome: true,
            nome_servico: true,
            insumos: {
              include: {
                insumo: {
                  select: {
                    id: true,
                    nome: true,
                    unidade_uso: true,
                    unidade_dimensao: true,
                    formato_material: true,
                    largura: true,
                    altura: true,
                    largura_comercial: true,
                    altura_comercial: true,
                    comprimento_comercial: true,
                    permite_registrar_sobra: true,
                    permite_simulacao_chapa: true,
                    categoria: { select: { nome: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado.');
    }

    const resumo: OrcamentoOrigemSobraResumo = {
      id: orcamento.id,
      numero: orcamento.numero,
      titulo: orcamento.titulo,
      cliente_nome: orcamento.cliente?.nome ?? '—',
      status: orcamento.status,
      data_criacao: orcamento.data_criacao.toISOString(),
    };

    const candidatos: CandidatoSobraOrcamento[] = [];

    for (const produto of orcamento.produtos) {
      const produtoNome = produto.nome_servico || produto.nome || 'Produto';

      for (const item of produto.insumos) {
        const insumo = item.insumo;
        if (!insumo) continue;

        const calculoChapa = this.parseCalculoChapa(item.calculo_chapa);
        const sobraM2 = this.extrairSobraM2(calculoChapa);
        const medidas = resolverMedidasComerciaisInsumo(insumo);
        const unidadeDim = insumo.unidade_dimensao || 'm';
        const largura = medidas.largura || null;
        const altura = medidas.alturaChapa || null;

        const dimensoes =
          largura && altura ? `${largura} × ${altura} ${unidadeDim}` : null;

        const areaSugestao = sobraM2 ?? null;
        const unidadeMedida =
          insumo.unidade_uso === 'M2' || insumo.unidade_uso === 'METRO QUADRADO'
            ? 'm²'
            : insumo.unidade_uso?.toLowerCase() || 'm²';

        candidatos.push({
          item_insumo_id: item.id,
          insumo_id: insumo.id,
          insumo_nome: insumo.nome,
          produto_id: produto.id,
          produto_nome: produtoNome,
          quantidade_material: Number(item.quantidade ?? 0),
          unidade_material: item.unidade || unidadeMedida,
          permite_registrar_sobra: Boolean(insumo.permite_registrar_sobra),
          calculo_chapa: calculoChapa,
          sobra_estimada_m2: sobraM2,
          largura_comercial: largura,
          altura_comercial:
            insumo.formato_material === 'ROLO' ||
            insumo.formato_material === 'METRO_LINEAR' ||
            insumo.formato_material === 'BARRA'
              ? null
              : altura,
          comprimento_comercial:
            insumo.formato_material === 'ROLO' ||
            insumo.formato_material === 'METRO_LINEAR' ||
            insumo.formato_material === 'BARRA'
              ? altura
              : null,
          formato_material: insumo.formato_material,
          unidade_dimensao: unidadeDim,
          sugestao: {
            descricao: `Retalho — ${insumo.nome} (${produtoNome}) · Orç. ${orcamento.numero}`,
            dimensoes,
            area: areaSugestao,
            quantidade: areaSugestao ?? Number(item.quantidade ?? 1),
            unidade_medida: unidadeMedida,
            material: insumo.categoria?.nome || insumo.nome,
            orcamento_origem: orcamento.id,
            orcamento_numero: orcamento.numero,
          },
        });
      }
    }

    return { orcamento: resumo, candidatos };
  }

  private parseCalculoChapa(valor: unknown): Record<string, unknown> | null {
    if (!valor) return null;
    if (typeof valor === 'object') return valor as Record<string, unknown>;
    if (typeof valor !== 'string') return null;
    try {
      return JSON.parse(valor) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private extrairSobraM2(
    calculo: Record<string, unknown> | null,
  ): number | null {
    if (!calculo) return null;
    const v =
      calculo.sobra_area_m2 ?? calculo.sobraAreaM2 ?? calculo.sobra_estimada_m2;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
}
