import {
  calcularHorasMaquina,
  calcularHorasFuncao,
  MaquinaParametros,
  FuncaoParametros,
} from '../calculo-automacao';

describe('calculo-automacao', () => {
  describe('calcularHorasMaquina', () => {
    it('M2_H: calcula horas por área/velocidade', () => {
      const params: MaquinaParametros = {
        modoProducao: 'M2_H',
        areaTotalM2: 100,
        velocidadeM2PorHora: 50,
      };
      const horas = calcularHorasMaquina(params);
      // 100 / 50 = 2h
      expect(horas).toBeCloseTo(2, 5);
    });

    it('M2_H: aplica eficiência (80% => 1.25x) e setup', () => {
      const params: MaquinaParametros = {
        modoProducao: 'M2_H',
        areaTotalM2: 60,
        velocidadeM2PorHora: 60, // 1h base
        eficienciaPercent: 80, // 1.25h
        setupMin: 30, // +0.5h
      };
      const horas = calcularHorasMaquina(params);
      expect(horas).toBeCloseTo(1.75, 5);
    });

    it('MANUAL: usa horasManuais + setup', () => {
      const params: MaquinaParametros = {
        modoProducao: 'MANUAL',
        horasManuais: 1.2,
        setupMin: 15, // +0.25h
      };
      const horas = calcularHorasMaquina(params);
      expect(horas).toBeCloseTo(1.45, 5);
    });

    it('fallback quando parâmetros insuficientes: retorna horasManuais', () => {
      const params: MaquinaParametros = {
        modoProducao: 'M2_H',
        areaTotalM2: 100,
        // velocidade ausente => fallback
        horasManuais: 0.75,
      };
      const horas = calcularHorasMaquina(params);
      expect(horas).toBeCloseTo(0.75, 5);
    });
  });

  describe('calcularHorasFuncao', () => {
    it('POR_M2: horas = area * horas_por_m2', () => {
      const params: FuncaoParametros = {
        tipoCalculo: 'POR_M2',
        areaTotalM2: 40,
        horasPorM2: 0.1,
      };
      const horas = calcularHorasFuncao(params);
      // 40 * 0.1 = 4h
      expect(horas).toBeCloseTo(4, 5);
    });

    it('POR_UNIDADE: horas = qtd * horas_por_unidade + setup', () => {
      const params: FuncaoParametros = {
        tipoCalculo: 'POR_UNIDADE',
        quantidade: 10,
        horasPorUnidade: 0.2, // 2h
        setupMin: 30, // +0.5h
      };
      const horas = calcularHorasFuncao(params);
      expect(horas).toBeCloseTo(2.5, 5);
    });

    it('ACOMPANHA_MAQUINA: aplica fator sobre horas da máquina', () => {
      const params: FuncaoParametros = {
        tipoCalculo: 'ACOMPANHA_MAQUINA',
        horasMaquina: 3,
        fatorAcompanhamento: 0.5,
      };
      const horas = calcularHorasFuncao(params);
      expect(horas).toBeCloseTo(1.5, 5);
    });

    it('Eficiência reduz produtividade (80% => 1.25x horas)', () => {
      const params: FuncaoParametros = {
        tipoCalculo: 'POR_M2',
        areaTotalM2: 10,
        horasPorM2: 0.2, // 2h base
        eficienciaPercent: 80, // 2.5h
      };
      const horas = calcularHorasFuncao(params);
      expect(horas).toBeCloseTo(2.5, 5);
    });

    it('MANUAL: usa horasManuais + setup', () => {
      const params: FuncaoParametros = {
        tipoCalculo: 'MANUAL',
        horasManuais: 1.1,
        setupMin: 12, // +0.2h
      };
      const horas = calcularHorasFuncao(params);
      expect(horas).toBeCloseTo(1.3, 5);
    });
  });
});


