import type { OrigemAlerta } from './interfaces/alerta.interface';
import type { KPI } from './interfaces/kpi.interface';

export type AcessoModulos = Record<string, boolean>;

export function podeModulo(acesso: AcessoModulos, chave: string): boolean {
  return acesso[chave] === true;
}

export function moduloDeOrigemAlerta(origem: OrigemAlerta): string {
  if (origem === 'orcamentos') return 'vendas';
  return origem;
}

export function colunaFluxoExigeModulo(colunaId: string): string {
  switch (colunaId) {
    case 'orcamentos':
    case 'aprovados':
      return 'vendas';
    case 'revisao_tecnica':
    case 'prontos':
      return 'os';
    case 'producao':
      return 'pcp';
    case 'a_receber':
    case 'concluidos':
      return 'financeiro';
    default:
      return colunaId;
  }
}

export function kpiExigeModulo(id: KPI['id']): string | 'os_ou_pcp' | 'alertas' {
  switch (id) {
    case 'orcamentos_abertos':
    case 'total_orcado_mes':
      return 'vendas';
    case 'os_em_producao':
      return 'os_ou_pcp';
    case 'alertas_criticos':
      return 'alertas';
    default:
      return 'vendas';
  }
}

export function kpiPermitido(id: KPI['id'], acesso: AcessoModulos): boolean {
  const exigencia = kpiExigeModulo(id);
  if (exigencia === 'os_ou_pcp') {
    return podeModulo(acesso, 'os') || podeModulo(acesso, 'pcp');
  }
  if (exigencia === 'alertas') {
    return algumaOrigemAlertaPermitida(acesso);
  }
  return podeModulo(acesso, exigencia);
}

export function algumaOrigemAlertaPermitida(acesso: AcessoModulos): boolean {
  return ['vendas', 'os', 'pcp', 'estoque', 'financeiro'].some((chave) =>
    podeModulo(acesso, chave),
  );
}

export function alertaPermitido(
  origem: OrigemAlerta,
  acesso: AcessoModulos,
): boolean {
  return podeModulo(acesso, moduloDeOrigemAlerta(origem));
}

export function colunaFluxoPermitida(
  colunaId: string,
  acesso: AcessoModulos,
): boolean {
  return podeModulo(acesso, colunaFluxoExigeModulo(colunaId));
}

/**
 * Só explode seções na sidebar quando o perfil vê um único módulo
 * funcional. Admin e gestor com vários módulos permanecem com hub.
 */
export function deveAchatarModulo(
  secoesAlemDaHome: number,
  modulosFuncionais: number,
): boolean {
  if (secoesAlemDaHome < 1) return false;
  return modulosFuncionais === 1;
}

export const ONBOARDING_DESABILITADO = {
  habilitado: false,
  progresso_pct: 0,
  total_etapas: 0,
  total_obrigatorias: 0,
  obrigatorias_concluidas: 0,
  etapas: [],
} as const;
