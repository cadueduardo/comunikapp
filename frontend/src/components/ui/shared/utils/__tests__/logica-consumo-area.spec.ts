import {
  calcularQuantidadeConsumoGeometrico,
  resolverDimensaoConsumoMaterial,
  insumoQuantidadeJaIncluiProduto,
  labelUnidadeCustoInsumo,
} from '../calculo.utils';
import { calcularProdutosPreview } from '../preview-calculo.helpers';
import type { Insumo } from '../../types/common.types';

describe('logica_consumo area vs unidade_uso M', () => {
  const insumoChapa: Insumo = {
    id: 'ps-2mm',
    nome: 'PS 2mm Branco',
    unidade_compra: 'CHAPA',
    custo_unitario: 100,
    quantidade_compra: 1,
    unidade_uso: 'M',
    fator_conversao: 1,
    logica_consumo: 'area',
    categoria: { nome: 'Comunicação Visual' },
    largura: 100,
    altura: 200,
    unidade_dimensao: 'CM',
    tipo_calculo: 'AREA',
  };

  it('prioriza logica_consumo area sobre unidade_uso M', () => {
    expect(resolverDimensaoConsumoMaterial(insumoChapa)).toBe('area');
    expect(labelUnidadeCustoInsumo(insumoChapa)).toBe('m²');
  });

  it('calcula quantidade como area_total (qty x area_unitária)', () => {
    const areaUnitaria = 0.0225; // 0.15m x 0.15m
    const quantidadeProduto = 8;
    const total = calcularQuantidadeConsumoGeometrico('area', {
      areaM2: areaUnitaria,
      perimetroM: 0.6,
      volumeM3: 0,
      areaLateralM2: 0,
      quantidadeProduto,
    });
    expect(total).toBeCloseTo(0.18, 4);
  });

  it('nao multiplica novamente no preview quando consumo e por area', () => {
    const insumos = [
      {
        ...insumoChapa,
        custo_unitario: 27.78,
        quantidade_compra: 1,
        fator_conversao: 1,
      },
    ];

    const resultado = calcularProdutosPreview(
      [
        {
          nome_servico: 'Placas Comunicado',
          quantidade_produto: 8,
          area_produto: 0.0225,
          materiais: [{ insumo_id: 'ps-2mm', quantidade: 0.18 }],
          maquinas: [],
          funcoes: [],
          servicos: [],
        },
      ],
      { insumos, maquinas: [], funcoes: [], servicos: [], custosIndiretos: [] },
      15,
      30,
      6,
      0,
    );

    const material = resultado.produtos[0].materiais[0];
    expect(material.quantidade).toBeCloseTo(0.18, 4);
    expect(insumoQuantidadeJaIncluiProduto(insumoChapa)).toBe(true);
  });

  it('mantem perimetro quando logica_consumo e perimetro', () => {
    const cordao: Insumo = {
      ...insumoChapa,
      id: 'perfil',
      logica_consumo: 'perimetro',
      unidade_uso: 'M',
    };
    expect(resolverDimensaoConsumoMaterial(cordao)).toBe('perimetro');
    const total = calcularQuantidadeConsumoGeometrico('perimetro', {
      areaM2: 0.0225,
      perimetroM: 0.6,
      volumeM3: 0,
      areaLateralM2: 0,
      quantidadeProduto: 8,
    });
    expect(total).toBeCloseTo(4.8, 4);
  });
});
