import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { montarEnderecoInstalacaoDoProduto } from '../utils/endereco-instalacao.util';

export interface ProcessarBaixaProducaoParams {
  lojaId: string;
  itemOsId: string;
  quantidadeProduzida?: number;
}

export interface ResultadoCriacaoLoteInstalacao {
  criado: boolean;
  item_instalacao_id?: string;
  quantidade_alocada?: number;
  motivo_skip?:
    | 'SEM_INSTALACAO'
    | 'ITEM_NAO_ENCONTRADO'
    | 'SEM_SALDO'
    | 'PRODUCAO_INCOMPLETA'
    | 'SEM_ORCAMENTO';
}

/**
 * Injeta lotes na fila de instalações após baixa parcial ou total no PCP.
 */
@Injectable()
export class ItemOSInstalacaoCriacaoService {
  private readonly logger = new Logger(ItemOSInstalacaoCriacaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processarBaixaProducao(
    params: ProcessarBaixaProducaoParams,
  ): Promise<ResultadoCriacaoLoteInstalacao> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: params.itemOsId,
        os: { loja_id: params.lojaId },
      },
      include: {
        os: { select: { orcamento_id: true } },
      },
    });

    if (!item) {
      return { criado: false, motivo_skip: 'ITEM_NAO_ENCONTRADO' };
    }

    if (!item.os.orcamento_id) {
      return { criado: false, motivo_skip: 'SEM_ORCAMENTO' };
    }

    const produto = await this.prisma.produtoOrcamento.findFirst({
      where: {
        id: params.itemOsId,
        orcamento_id: item.os.orcamento_id,
        orcamento: { loja_id: params.lojaId },
      },
      select: {
        instalacao_necessaria: true,
        instalacao_cep: true,
        instalacao_logradouro: true,
        instalacao_numero: true,
        instalacao_complemento: true,
        instalacao_bairro: true,
        instalacao_cidade: true,
        instalacao_estado: true,
        instalacao_endereco_snapshot: true,
      },
    });

    if (!produto?.instalacao_necessaria) {
      return { criado: false, motivo_skip: 'SEM_INSTALACAO' };
    }

    const saldo = await this.calcularSaldoInstalacao(
      params.itemOsId,
      params.lojaId,
      Number(item.quantidade),
    );

    if (saldo <= 0) {
      return { criado: false, motivo_skip: 'SEM_SALDO' };
    }

    let quantidadeAlocar = 0;

    if (params.quantidadeProduzida != null && params.quantidadeProduzida > 0) {
      quantidadeAlocar = Math.min(
        Math.floor(params.quantidadeProduzida),
        saldo,
      );
    } else if (await this.itemProducaoTotalmenteConcluido(params)) {
      quantidadeAlocar = saldo;
    } else {
      return { criado: false, motivo_skip: 'PRODUCAO_INCOMPLETA' };
    }

    if (quantidadeAlocar <= 0) {
      return { criado: false, motivo_skip: 'SEM_SALDO' };
    }

    const endereco = montarEnderecoInstalacaoDoProduto(produto);

    const lote = await this.prisma.itemOSInstalacao.create({
      data: {
        loja_id: params.lojaId,
        item_os_id: params.itemOsId,
        cep: endereco.cep,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf,
        quantidade_alocada: quantidadeAlocar,
      },
    });

    this.logger.log(
      `Lote de instalação criado (${quantidadeAlocar} un.) para item ${params.itemOsId} — lote ${lote.id}`,
    );

    return {
      criado: true,
      item_instalacao_id: lote.id,
      quantidade_alocada: quantidadeAlocar,
    };
  }

  private async calcularSaldoInstalacao(
    itemOsId: string,
    lojaId: string,
    quantidadeTotal: number,
  ): Promise<number> {
    const agregado = await this.prisma.itemOSInstalacao.aggregate({
      where: { item_os_id: itemOsId, loja_id: lojaId },
      _sum: { quantidade_alocada: true },
    });

    const alocado = agregado._sum.quantidade_alocada ?? 0;
    return Math.max(0, Math.floor(quantidadeTotal) - alocado);
  }

  private async itemProducaoTotalmenteConcluido(
    params: ProcessarBaixaProducaoParams,
  ): Promise<boolean> {
    const setores = await this.prisma.workflowInstanciaSetor.findMany({
      where: {
        item_os_id: params.itemOsId,
        workflow_instancia: {
          os: { loja_id: params.lojaId },
        },
      },
      select: { status: true },
    });

    if (setores.length === 0) {
      return false;
    }

    return setores.every((setor) => {
      const status = setor.status.toUpperCase();
      return status === 'CONCLUIDA' || status === 'CANCELADA';
    });
  }
}
