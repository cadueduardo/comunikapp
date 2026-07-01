import { Injectable } from '@nestjs/common';
import { StatusFinanceiroOcorrencia, TipoOcorrencia } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SplitFiscalDetalhe,
  SplitFiscalResultado,
  arredondarMoeda,
  formatarMoedaBrl,
  tipoFaturamentoOcorrencia,
} from '../utils/split-fiscal.util';

@Injectable()
export class InstalacaoSplitFiscalService {
  constructor(private readonly prisma: PrismaService) {}

  async calcularSplitFiscalOs(
    osId: string,
    lojaId: string,
  ): Promise<SplitFiscalResultado> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        id: true,
        orcamento_id: true,
      },
    });

    if (!os?.orcamento_id) {
      return this.resultadoVazio(osId);
    }

    const produtos = await this.prisma.produtoOrcamento.findMany({
      where: { orcamento_id: os.orcamento_id, ativo: true },
      include: {
        insumos: true,
        servicos_manuais: true,
        maquinas: true,
        funcoes: true,
      },
      orderBy: { ordem: 'asc' },
    });

    const ocorrencias = await this.prisma.ocorrenciaInstalacao.findMany({
      where: {
        os_id: osId,
        loja_id: lojaId,
        status_financeiro: {
          notIn: [StatusFinanceiroOcorrencia.FATURADO],
        },
      },
      orderBy: { criado_em: 'asc' },
    });

    const detalhes: SplitFiscalDetalhe[] = [];
    let totalNfe = 0;
    let totalNfs = 0;

    for (const produto of produtos) {
      const nome = produto.nome_servico || produto.nome || 'Item do orçamento';
      const insumosTotal = produto.insumos.reduce(
        (acc, item) => acc + Number(item.preco_total),
        0,
      );
      const servicosManuais = produto.servicos_manuais.reduce(
        (acc, item) => acc + Number(item.custo_total),
        0,
      );
      const maquinasTotal = produto.maquinas.reduce(
        (acc, item) => acc + Number(item.custo_total),
        0,
      );
      const funcoesTotal = produto.funcoes.reduce(
        (acc, item) => acc + Number(item.custo_total),
        0,
      );
      const instalacao = Number(produto.instalacao_preco_cobrado ?? 0);
      const precoTotal = Number(produto.preco_total);

      const servicosLinha = servicosManuais + maquinasTotal + funcoesTotal + instalacao;
      let produtoLinha = insumosTotal;

      if (produtoLinha <= 0 && precoTotal > servicosLinha) {
        produtoLinha = precoTotal - servicosLinha;
      } else if (produtoLinha + servicosLinha < precoTotal) {
        produtoLinha += precoTotal - produtoLinha - servicosLinha;
      }

      if (produtoLinha > 0.01) {
        detalhes.push({
          origem: 'ORCAMENTO',
          descricao: `${nome} — materiais/produto`,
          tipo_faturamento: 'PRODUTO',
          valor: arredondarMoeda(produtoLinha),
        });
        totalNfe += produtoLinha;
      }

      if (servicosLinha > 0.01) {
        detalhes.push({
          origem: 'ORCAMENTO',
          descricao: `${nome} — serviços/instalação`,
          tipo_faturamento: 'SERVICO',
          valor: arredondarMoeda(servicosLinha),
        });
        totalNfs += servicosLinha;
      }
    }

    for (const ocorrencia of ocorrencias) {
      const valor = Number(ocorrencia.preco_cliente);
      if (valor <= 0.01) continue;

      const tipo = tipoFaturamentoOcorrencia(ocorrencia.tipo);
      detalhes.push({
        origem: 'OCORRENCIA',
        descricao: `${this.rotuloOcorrencia(ocorrencia.tipo)} — ${ocorrencia.descricao.slice(0, 120)}`,
        tipo_faturamento: tipo,
        valor: arredondarMoeda(valor),
      });

      if (tipo === 'PRODUTO') {
        totalNfe += valor;
      } else {
        totalNfs += valor;
      }
    }

    totalNfe = arredondarMoeda(totalNfe);
    totalNfs = arredondarMoeda(totalNfs);

    return {
      os_id: osId,
      total_nfe: totalNfe,
      total_nfs: totalNfs,
      total_geral: arredondarMoeda(totalNfe + totalNfs),
      detalhes,
      instrucao_nfe: `Emitir ${formatarMoedaBrl(totalNfe)} em NF-e`,
      instrucao_nfs: `Emitir ${formatarMoedaBrl(totalNfs)} em NFS-e`,
    };
  }

  private resultadoVazio(osId: string): SplitFiscalResultado {
    return {
      os_id: osId,
      total_nfe: 0,
      total_nfs: 0,
      total_geral: 0,
      detalhes: [],
      instrucao_nfe: 'Emitir R$ 0,00 em NF-e',
      instrucao_nfs: 'Emitir R$ 0,00 em NFS-e',
    };
  }

  private rotuloOcorrencia(tipo: TipoOcorrencia): string {
    const mapa: Record<TipoOcorrencia, string> = {
      VISITA_IMPRODUTIVA: 'Visita improdutiva',
      MATERIAL_EXTRA: 'Material extra',
      SERVICO_ADICIONAL: 'Serviço adicional',
      RETRABALHO: 'Retrabalho',
    };
    return mapa[tipo] ?? tipo;
  }
}
