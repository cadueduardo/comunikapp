import {
  devePularExpedicao,
  devePularPcp,
  materiaisDisponiveisParaFluxo,
  TIPO_VINCULO_OS_ADITIVA_INSTALACAO,
} from './os-pular-fluxo.util';

describe('os-pular-fluxo.util', () => {
  it('identifica OS que deve pular PCP', () => {
    expect(devePularPcp({ pular_pcp: true })).toBe(true);
    expect(devePularPcp({ pular_pcp: false })).toBe(false);
    expect(
      devePularPcp({
        tipo_vinculo_os: TIPO_VINCULO_OS_ADITIVA_INSTALACAO,
      }),
    ).toBe(true);
  });

  it('identifica OS que deve pular expedição', () => {
    expect(devePularExpedicao({ pular_expedicao: true })).toBe(true);
    expect(
      devePularExpedicao({
        tipo_vinculo_os: TIPO_VINCULO_OS_ADITIVA_INSTALACAO,
      }),
    ).toBe(true);
    expect(devePularExpedicao({})).toBe(false);
  });

  it('trata materiais como disponíveis quando pular_validacao_estoque', () => {
    expect(
      materiaisDisponiveisParaFluxo({
        pular_validacao_estoque: true,
        materiais_disponivel: false,
      }),
    ).toBe(true);
    expect(
      materiaisDisponiveisParaFluxo({
        materiais_disponivel: false,
      }),
    ).toBe(false);
  });
});
