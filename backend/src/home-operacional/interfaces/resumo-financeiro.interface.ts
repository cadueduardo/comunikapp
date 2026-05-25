/**
 * Resposta do endpoint GET /home-operacional/resumo-financeiro
 * (Fase 6.C - Bloco 4 do dashboard).
 *
 * Decisao Fase 0 (doc 07-permissoes-home.md):
 * Este bloco so e renderizado pelo front quando o usuario tem a permissao
 * `home-operacional.ver_resumo_financeiro`. O backend retorna o dado
 * apenas para usuario autenticado; a permissao fina e validada no
 * front por enquanto (TODO: conectar com `perfil_permissao` quando o
 * sistema de perfis estiver populado por padrao em todas as lojas).
 *
 * Valores `null` indicam "dado nao disponivel/sem registro" e o front
 * deve esconder o indicador correspondente (regra: nao inventar projecao).
 */
export interface ResumoFinanceiroResponse {
  data: {
    /** Loja a que o resumo se refere. */
    loja_id: string;
    /** Periodo de referencia (mes corrente, formato YYYY-MM). */
    periodo: string;
    /** Soma de orcamentos criados no mes, em qualquer status. */
    total_orcado_mes: number | null;
    /** Soma de orcamentos com status `aprovado` ou superior no mes. */
    total_aprovado_mes: number | null;
    /** Valor de cobrancas (valor_total) com OS em producao/acabamento. */
    valor_em_producao: number | null;
    /** Valor de cobrancas (valor_saldo) com OS finalizada e ainda nao liquidada. */
    valor_pronto_a_receber: number | null;
    /** Soma de cobranca_recebimentos no mes corrente. */
    valor_recebido_mes: number | null;
    /** Numero total de cobrancas em VENCIDO. */
    cobrancas_vencidas: number;
    /** Soma de valor_saldo das cobrancas em VENCIDO. */
    valor_vencido: number;
  };
  meta: {
    calculado_em: string; // ISO timestamp
    cached: boolean;
  };
}
