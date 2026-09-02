import {
  alertaPermitido,
  colunaFluxoPermitida,
  deveAchatarModulo,
  kpiPermitido,
  moduloDeOrigemAlerta,
  ONBOARDING_DESABILITADO,
  podeModulo,
} from './home-visibilidade';

describe('HomeVisibilidade', () => {
  const vendas = { vendas: true } as const;
  const admin = {
    vendas: true,
    os: true,
    pcp: true,
    estoque: true,
    financeiro: true,
    configuracoes: true,
  };

  it('alerta de estoque exige estoque.acessar', () => {
    expect(alertaPermitido('estoque', vendas)).toBe(false);
    expect(alertaPermitido('estoque', { estoque: true })).toBe(true);
    expect(moduloDeOrigemAlerta('orcamentos')).toBe('vendas');
  });

  it('KPI de orçamento some sem vendas; OS aparece com os ou pcp', () => {
    expect(kpiPermitido('orcamentos_abertos', vendas)).toBe(true);
    expect(kpiPermitido('orcamentos_abertos', { os: true })).toBe(false);
    expect(kpiPermitido('os_em_producao', { os: true })).toBe(true);
    expect(kpiPermitido('os_em_producao', { pcp: true })).toBe(true);
    expect(kpiPermitido('os_em_producao', vendas)).toBe(false);
    expect(kpiPermitido('alertas_criticos', vendas)).toBe(true);
    expect(kpiPermitido('alertas_criticos', { usuarios: true })).toBe(false);
  });

  it('fluxo de produção exige pcp; a receber exige financeiro', () => {
    expect(colunaFluxoPermitida('producao', vendas)).toBe(false);
    expect(colunaFluxoPermitida('producao', { pcp: true })).toBe(true);
    expect(colunaFluxoPermitida('a_receber', { financeiro: true })).toBe(true);
    expect(colunaFluxoPermitida('orcamentos', vendas)).toBe(true);
  });

  it('onboarding desabilitado não traz etapas', () => {
    expect(ONBOARDING_DESABILITADO.habilitado).toBe(false);
    expect(ONBOARDING_DESABILITADO.etapas).toEqual([]);
    expect(podeModulo(admin, 'configuracoes')).toBe(true);
    expect(podeModulo(vendas, 'configuracoes')).toBe(false);
  });

  it('achatamento: único módulo explode; admin não', () => {
    expect(deveAchatarModulo(7, 1)).toBe(true);
    expect(deveAchatarModulo(7, 8)).toBe(false);
    expect(deveAchatarModulo(3, 3)).toBe(false);
    expect(deveAchatarModulo(0, 1)).toBe(false);
  });
});
