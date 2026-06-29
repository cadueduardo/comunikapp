import { Injectable } from '@nestjs/common';
import {
  OrigemItemServicoManual,
  PoliticaCobrancaArte,
  ResponsabilidadeArte,
  DESCRICAO_SERVICO_ARTE_AUTOMATICA,
} from '../constants/arte.enums';
import { ARTE_MSG } from '../constants/arte-mensagens';
import { ConfiguracaoArteService } from './configuracao-arte.service';
import { arteRequerTrabalhoInterno } from '../utils/arte-os-propagacao.util';

export interface SyncProdutoArteResult {
  alertas: string[];
  arte_custo_automatico: boolean;
  arte_horas_calculadas: number | null;
  arte_custo_calculado: number | null;
  arte_referencia_servico_id: string | null;
}

@Injectable()
export class ArteOrcamentoInjecaoService {
  constructor(private readonly configuracaoArteService: ConfiguracaoArteService) {}

  /**
   * Sincroniza linha de serviço automática de arte no produto (mutação in-place).
   * Deve ser chamado antes do motor de cálculo V2.
   */
  async syncProduto(
    produto: Record<string, any>,
    lojaId: string,
  ): Promise<SyncProdutoArteResult> {
    const alertas: string[] = [];
    const responsabilidade = (produto.responsabilidade_arte ||
      ResponsabilidadeArte.NAO_APLICAVEL) as ResponsabilidadeArte;

    const servicos: any[] = Array.isArray(produto.servicos_manuais)
      ? produto.servicos_manuais
      : Array.isArray(produto.servicos)
        ? produto.servicos
        : [];

    const semAutomatico = servicos.filter(
      (s) => s.origem !== OrigemItemServicoManual.ARTE_AUTOMATICA,
    );

    if (!arteRequerTrabalhoInterno(responsabilidade)) {
      produto.servicos_manuais = semAutomatico;
      produto.servicos = semAutomatico;
      produto.arte_custo_automatico = false;
      produto.arte_horas_calculadas = null;
      produto.arte_custo_calculado = null;
      produto.arte_referencia_servico_id = null;
      return {
        alertas,
        arte_custo_automatico: false,
        arte_horas_calculadas: null,
        arte_custo_calculado: null,
        arte_referencia_servico_id: null,
      };
    }

    const config = await this.configuracaoArteService.getOrCreate(lojaId);
    const servico = config.servico_arte;

    const politica = (produto.politica_cobranca_arte ||
      config.cobranca_padrao ||
      PoliticaCobrancaArte.NAO_APLICAVEL) as PoliticaCobrancaArte;

    let horas = Number(
      responsabilidade === ResponsabilidadeArte.EMPRESA_ADAPTA
        ? config.horas_padrao_adaptacao
        : config.horas_padrao_criacao,
    );
    if (!Number.isFinite(horas) || horas < 0) {
      horas = 0;
    }

    const configurado = this.configuracaoArteService.isConfigurado(
      config,
      servico,
    );

    let custoHora = 0;
    let custoTotal = 0;

    if (!configurado || !servico) {
      alertas.push(ARTE_MSG.ALERTA_CUSTO_ZERO);
      horas = 0;
      custoHora = 0;
      custoTotal = 0;
    } else {
      custoHora = Number(servico.custo_hora);
      custoTotal = horas * custoHora;
      if (politica === PoliticaCobrancaArte.SEM_CUSTO) {
        custoTotal = 0;
      }
    }

    const exibirNoPdf = this.resolverExibirNoPdf(politica, config.exibir_linha_pdf);

    const linhaAutomatica = {
      servico_id: servico?.id ?? config.servico_arte_id,
      tempo_horas: horas,
      horas_trabalhadas: horas,
      custo_hora: custoHora,
      custo_total: custoTotal,
      descricao: DESCRICAO_SERVICO_ARTE_AUTOMATICA,
      origem: OrigemItemServicoManual.ARTE_AUTOMATICA,
      exibir_no_pdf: exibirNoPdf,
    };

    const merged = [...semAutomatico, linhaAutomatica];
    produto.servicos_manuais = merged;
    produto.servicos = merged;
    produto.arte_custo_automatico = true;
    produto.arte_horas_calculadas = horas;
    produto.arte_custo_calculado = custoTotal;
    produto.arte_referencia_servico_id = servico?.id ?? config.servico_arte_id;

    return {
      alertas,
      arte_custo_automatico: true,
      arte_horas_calculadas: horas,
      arte_custo_calculado: custoTotal,
      arte_referencia_servico_id: produto.arte_referencia_servico_id,
    };
  }

  private resolverExibirNoPdf(
    politica: PoliticaCobrancaArte,
    exibirLinhaPdfConfig: boolean,
  ): boolean {
    if (politica === PoliticaCobrancaArte.INCLUIDA_NO_PRODUTO) {
      return false;
    }
    if (politica === PoliticaCobrancaArte.COBRADA_A_PARTE) {
      return true;
    }
    if (politica === PoliticaCobrancaArte.SEM_CUSTO) {
      return false;
    }
    return exibirLinhaPdfConfig;
  }
}
