import {
  MotivoForcarLiberacaoFinanceira,
  montarObsForcarLiberacaoFinanceira,
  validarPayloadForcarLiberacaoFinanceira,
} from './forcar-liberacao-financeira.constants';

describe('forcar-liberacao-financeira.constants', () => {
  it('exige forcar + motivo válido', () => {
    expect(
      validarPayloadForcarLiberacaoFinanceira({ forcar: false }).ok,
    ).toBe(false);

    expect(
      validarPayloadForcarLiberacaoFinanceira({
        forcar: true,
        motivo: 'INVALIDO',
      }).ok,
    ).toBe(false);

    const ok = validarPayloadForcarLiberacaoFinanceira({
      forcar: true,
      motivo: MotivoForcarLiberacaoFinanceira.URGENCIA_PRAZO,
      detalhe: 'Cliente precisa para evento',
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.motivo).toBe(MotivoForcarLiberacaoFinanceira.URGENCIA_PRAZO);
      expect(ok.detalhe).toBe('Cliente precisa para evento');
    }
  });

  it('exige detalhe mínimo quando motivo é OUTRO', () => {
    expect(
      validarPayloadForcarLiberacaoFinanceira({
        forcar: true,
        motivo: MotivoForcarLiberacaoFinanceira.OUTRO,
        detalhe: 'curto',
      }).ok,
    ).toBe(false);

    const ok = validarPayloadForcarLiberacaoFinanceira({
      forcar: true,
      motivo: MotivoForcarLiberacaoFinanceira.OUTRO,
      detalhe: 'Motivo excepcional com mais de dez caracteres',
    });
    expect(ok.ok).toBe(true);
  });

  it('monta observação de auditoria legível', () => {
    const obs = montarObsForcarLiberacaoFinanceira(
      MotivoForcarLiberacaoFinanceira.ACORDO_COMERCIAL,
      'Combinado com o gerente',
      'Aprovada via grid',
    );
    expect(obs).toContain('[FORÇADO — pendência financeira]');
    expect(obs).toContain('Acordo comercial');
    expect(obs).toContain('Combinado com o gerente');
    expect(obs).toContain('Aprovada via grid');
  });
});
