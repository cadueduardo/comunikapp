import { Injectable, Logger } from '@nestjs/common';
import { TurnoPrevisaoInstalacao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';
import { InstalacaoAgendaSyncService } from './instalacao-agenda-sync.service';
import { InstalacaoExecucaoSyncService } from './instalacao-execucao-sync.service';
import { montarEnderecoInstalacaoDoProduto, enderecoInstalacaoPrecisaConfirmacao } from '../utils/endereco-instalacao.util';

export interface ProcessarBaixaProducaoParams {
  lojaId: string;
  itemOsId: string;
  quantidadeProduzida?: number;
}

export type MotivoSkipLoteInstalacao =
  | 'SEM_INSTALACAO'
  | 'ITEM_NAO_ENCONTRADO'
  | 'SEM_SALDO'
  | 'PRODUCAO_INCOMPLETA'
  | 'SEM_ORCAMENTO'
  | 'ENDERECO_PENDENTE'
  | 'AGUARDANDO_PRODUCAO';

export interface ResultadoCriacaoLoteInstalacao {
  criado: boolean;
  item_os_id?: string;
  item_instalacao_id?: string;
  quantidade_alocada?: number;
  motivo_skip?: MotivoSkipLoteInstalacao;
}

export interface ResumoSincronizacaoInstalacaoOs {
  lotes_criados: number;
  resultados: ResultadoCriacaoLoteInstalacao[];
}

/**
 * Injeta lotes na fila de instalações após baixa parcial ou total no PCP.
 */
@Injectable()
export class ItemOSInstalacaoCriacaoService {
  private readonly logger = new Logger(ItemOSInstalacaoCriacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly instalacaoAgendaSyncService: InstalacaoAgendaSyncService,
    private readonly instalacaoExecucaoSyncService: InstalacaoExecucaoSyncService,
    private readonly homeCacheService: HomeCacheService,
  ) {}

  async processarBaixaProducao(
    params: ProcessarBaixaProducaoParams,
  ): Promise<ResultadoCriacaoLoteInstalacao> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: params.itemOsId,
        os: { loja_id: params.lojaId },
      },
      include: {
        os: { select: { orcamento_id: true, id: true } },
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

    if (enderecoInstalacaoPrecisaConfirmacao(endereco)) {
      return { criado: false, motivo_skip: 'ENDERECO_PENDENTE' };
    }

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

    const osId = item.os.id;
    await this.instalacaoExecucaoSyncService.sincronizarAposMudancaLotes(
      params.lojaId,
      osId,
    );

    this.logger.log(
      `Lote de instalação criado (${quantidadeAlocar} un.) para item ${params.itemOsId} — lote ${lote.id}`,
    );

    this.invalidarCacheBadgesMenu(params.lojaId);

    return {
      criado: true,
      item_os_id: params.itemOsId,
      item_instalacao_id: lote.id,
      quantidade_alocada: quantidadeAlocar,
    };
  }

  /**
   * Processa todos os itens da OS após conclusão de produção (qualquer caminho).
   * Idempotente: itens já alocados retornam SEM_SALDO ou SEM_INSTALACAO.
   */
  async processarBaixaProducaoOs(
    lojaId: string,
    osId: string,
  ): Promise<ResumoSincronizacaoInstalacaoOs> {
    const itens = await this.prisma.itemOS.findMany({
      where: { os_id: osId, os: { loja_id: lojaId } },
      select: { id: true },
    });

    const resultados: ResultadoCriacaoLoteInstalacao[] = [];

    for (const item of itens) {
      const resultado = await this.processarBaixaProducao({
        lojaId,
        itemOsId: item.id,
      });
      resultados.push({ ...resultado, item_os_id: item.id });
    }

    const lotesCriados = resultados.filter((r) => r.criado).length;

    if (lotesCriados > 0) {
      this.logger.log(
        `${lotesCriados} lote(s) de instalação criado(s) para OS ${osId}`,
      );
    }

    await this.instalacaoExecucaoSyncService.sincronizarAposMudancaLotes(
      lojaId,
      osId,
    );

    return { lotes_criados: lotesCriados, resultados };
  }

  /**
   * Gestor cria ou divide lote manualmente (rollout multi-endereço).
   */
  async criarLoteManual(params: {
    lojaId: string;
    itemOsId: string;
    quantidadeAlocada: number;
    endereco: {
      cep?: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
    };
    dataPrevisao?: Date;
    turnoPrevisao?: TurnoPrevisaoInstalacao;
    equipeInstalacao?: string;
    responsavelLocal?: string;
    informarEquipe?: boolean;
  }): Promise<ResultadoCriacaoLoteInstalacao> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: params.itemOsId,
        os: { loja_id: params.lojaId },
      },
      include: {
        os: { select: { id: true, orcamento_id: true, status: true } },
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
      select: { instalacao_necessaria: true },
    });

    if (!produto?.instalacao_necessaria) {
      return { criado: false, motivo_skip: 'SEM_INSTALACAO' };
    }

    // Guardrail de fluxo: a OS só entra no módulo de instalação depois que a
    // produção baixa (parcial ou total). Antes disso, nenhum lote manual.
    const liberado = await this.itemLiberadoParaInstalacao(
      params.lojaId,
      params.itemOsId,
      item.os.status,
      item.status_liberacao_pcp,
    );

    if (!liberado) {
      return { criado: false, motivo_skip: 'AGUARDANDO_PRODUCAO' };
    }

    const saldo = await this.calcularSaldoInstalacao(
      params.itemOsId,
      params.lojaId,
      Number(item.quantidade),
    );

    const quantidade = Math.floor(params.quantidadeAlocada);

    if (quantidade <= 0 || quantidade > saldo) {
      return { criado: false, motivo_skip: 'SEM_SALDO' };
    }

    const osId = item.os.id;

    const lote = await this.prisma.$transaction(async (tx) => {
      const criado = await tx.itemOSInstalacao.create({
        data: {
          loja_id: params.lojaId,
          item_os_id: params.itemOsId,
          cep: params.endereco.cep?.replace(/\D/g, '') || null,
          logradouro: params.endereco.logradouro.trim(),
          numero: params.endereco.numero.trim(),
          complemento: params.endereco.complemento?.trim() || null,
          bairro: params.endereco.bairro.trim(),
          cidade: params.endereco.cidade.trim(),
          uf: params.endereco.uf.trim().toUpperCase().slice(0, 2),
          quantidade_alocada: quantidade,
          data_previsao: params.dataPrevisao ?? null,
          turno_previsao: params.turnoPrevisao ?? null,
          equipe_instalacao: params.equipeInstalacao?.trim() || null,
          responsavel_local: params.responsavelLocal?.trim() || null,
          informar_equipe: params.informarEquipe ?? false,
        },
      });

      await this.instalacaoAgendaSyncService.sincronizarDataOs(
        tx,
        params.lojaId,
        osId,
      );

      return criado;
    });

    this.logger.log(
      `Lote manual criado (${quantidade} un.) para item ${params.itemOsId} — lote ${lote.id}`,
    );

    this.invalidarCacheBadgesMenu(params.lojaId);

    await this.instalacaoExecucaoSyncService.sincronizarAposMudancaLotes(
      params.lojaId,
      osId,
    );

    await this.instalacaoExecucaoSyncService.promoverLoteSeAgendado(
      params.lojaId,
      lote.id,
      osId,
    );

    return {
      criado: true,
      item_os_id: params.itemOsId,
      item_instalacao_id: lote.id,
      quantidade_alocada: quantidade,
    };
  }

  /**
   * Item está liberado para gestão de lotes no módulo de instalação?
   *
   * Fluxo oficial (modulo.md § 2.1): a instalação só recebe o item após a
   * baixa de produção no PCP (parcial ou total). Casos aceitos:
   *  1. OS já finalizada (produção encerrada por qualquer caminho);
   *  2. Já existe lote do item (baixa parcial anterior — gestor fraciona rollout);
   *  3. Item não passa pelo PCP (`status_liberacao_pcp = NAO_APLICA`, marcado
   *     na aprovação técnica da OS);
   *  4. Todos os setores de produção do item concluídos/cancelados.
   */
  private async itemLiberadoParaInstalacao(
    lojaId: string,
    itemOsId: string,
    osStatus: string,
    statusLiberacaoPcp: string | null,
  ): Promise<boolean> {
    if (String(osStatus).toUpperCase() === 'FINALIZADA') {
      return true;
    }

    const loteExistente = await this.prisma.itemOSInstalacao.findFirst({
      where: { item_os_id: itemOsId, loja_id: lojaId },
      select: { id: true },
    });

    if (loteExistente) {
      return true;
    }

    if ((statusLiberacaoPcp || '').toUpperCase() === 'NAO_APLICA') {
      return true;
    }

    return this.itemProducaoTotalmenteConcluido({ lojaId, itemOsId });
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

  private invalidarCacheBadgesMenu(lojaId: string): void {
    this.homeCacheService.invalidarPorPrefixo(`${lojaId}:`);
  }
}
