'use client';

import { useMemo } from 'react';
import {
  calcularChapa,
  type MetodoCobrancaChapa,
} from '@/lib/calculo-chapa';
import { calcularCustoPorUnidadeUso } from '@/components/ui/shared/utils/calculo.utils';
import type { Insumo } from '@/components/ui/shared/types/common.types';
import { SobrasRetalhosSugestaoPanel } from '@/components/orcamentos-v2/SobrasRetalhosSugestaoPanel';

export interface InsumoChapaInfo extends Insumo {
  formato_material?: string | null;
  permite_simulacao_chapa?: boolean;
  largura_comercial?: number | null;
  altura_comercial?: number | null;
  comprimento_comercial?: number | null;
  perda_padrao_percent?: number | null;
  metodo_cobranca_padrao?: string | null;
}

interface CalculoChapaMaterialPanelProps {
  insumo?: InsumoChapaInfo | null;
  larguraPeca?: string | number;
  alturaPeca?: string | number;
  quantidadePeca?: string | number;
  unidadeGeometria?: string;
}

function parseNumero(valor: unknown): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  return Number(String(valor ?? '').replace(',', '.')) || 0;
}

function normalizarUnidade(unidade?: string): 'mm' | 'cm' | 'm' {
  const u = (unidade || 'm').toLowerCase();
  if (u === 'mm' || u === 'cm') return u;
  return 'm';
}

function isFormatoLinear(formato?: string | null): boolean {
  return formato === 'ROLO' || formato === 'METRO_LINEAR' || formato === 'BARRA';
}

function resolverMedidasInsumo(insumo: InsumoChapaInfo) {
  const linear = isFormatoLinear(insumo.formato_material);
  const largura =
    parseNumero(insumo.largura_comercial) || parseNumero(insumo.largura) || 0;
  const comprimento =
    parseNumero(insumo.comprimento_comercial) ||
    (linear ? parseNumero(insumo.altura) : 0);
  const alturaChapa =
    parseNumero(insumo.altura_comercial) ||
    (linear ? 0 : parseNumero(insumo.altura)) ||
    0;

  return {
    linear,
    largura,
    alturaChapa: linear ? comprimento : alturaChapa,
    formatoLabel: linear
      ? 'Rolo / bobina'
      : insumo.formato_material === 'CHAPA'
        ? 'Chapa'
        : insumo.formato_material || 'Material',
    unidadeComercialLabel: linear
      ? 'Rolo/bobina'
      : insumo.formato_material === 'CHAPA'
        ? 'Chapa'
        : 'Unidade comercial',
    unidadeComercialLabelMinuscula: linear
      ? 'rolo/bobina'
      : insumo.formato_material === 'CHAPA'
        ? 'chapa'
        : 'unidade comercial',
  };
}

const LABEL_METODO_COBRANCA: Record<string, string> = {
  AREA_LIQUIDA: 'Área líquida da peça',
  AREA_COM_PERDA: 'Área usada + perda padrão',
  CHAPA_INTEIRA: 'Unidade comercial inteira',
  MANUAL: 'Manual',
};

export function CalculoChapaMaterialPanel({
  insumo,
  larguraPeca,
  alturaPeca,
  quantidadePeca,
  unidadeGeometria,
}: CalculoChapaMaterialPanelProps) {
  const medidasInsumo = useMemo(
    () => (insumo ? resolverMedidasInsumo(insumo) : null),
    [insumo],
  );

  const unidadePeca = useMemo(
    () => normalizarUnidade(unidadeGeometria || 'm'),
    [unidadeGeometria],
  );

  const unidadeChapa = useMemo(
    () => normalizarUnidade(insumo?.unidade_dimensao || 'm'),
    [insumo?.unidade_dimensao],
  );

  const metodo = (insumo?.metodo_cobranca_padrao ||
    'AREA_LIQUIDA') as MetodoCobrancaChapa;

  const perda = parseNumero(insumo?.perda_padrao_percent);

  const custoM2 = useMemo(
    () => (insumo ? calcularCustoPorUnidadeUso(insumo) : 0),
    [insumo],
  );

  const resultado = useMemo(() => {
    if (!insumo?.permite_simulacao_chapa || !medidasInsumo) return null;
    if (medidasInsumo.largura <= 0 || medidasInsumo.alturaChapa <= 0) return null;
    if (parseNumero(larguraPeca) <= 0 || parseNumero(alturaPeca) <= 0) return null;

    try {
      return calcularChapa({
        larguraPeca: parseNumero(larguraPeca),
        alturaPeca: parseNumero(alturaPeca),
        quantidade: parseNumero(quantidadePeca) || 1,
        larguraChapa: medidasInsumo.largura,
        alturaChapa: medidasInsumo.alturaChapa,
        perdaPercent: perda,
        metodoCobranca: metodo,
        unidadeDimensaoPeca: unidadePeca,
        unidadeDimensaoChapa: unidadeChapa,
        custoM2,
      }) as unknown as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [
    insumo,
    medidasInsumo,
    larguraPeca,
    alturaPeca,
    quantidadePeca,
    perda,
    metodo,
    unidadePeca,
    unidadeChapa,
    custoM2,
  ]);

  if (!insumo?.permite_simulacao_chapa) {
    return null;
  }

  const areaComercialTotal =
    medidasInsumo && medidasInsumo.largura > 0 && medidasInsumo.alturaChapa > 0
      ? medidasInsumo.largura * medidasInsumo.alturaChapa
      : 0;

  const segundaDimLabel = medidasInsumo?.linear ? 'Comprimento' : 'Altura';

  return (
    <div className="rounded-md border border-dashed bg-muted/20 p-3 space-y-2 text-sm">
      <div className="font-medium text-sm">Aproveitamento do material</div>

      {medidasInsumo && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            <span className="font-medium text-foreground">
              {medidasInsumo.formatoLabel} (cadastro):
            </span>{' '}
            {medidasInsumo.largura > 0 && (
              <>
                largura {medidasInsumo.largura} {unidadeChapa}
                {medidasInsumo.alturaChapa > 0 && (
                  <>
                    {' '}
                    · {segundaDimLabel.toLowerCase()} {medidasInsumo.alturaChapa}{' '}
                    {unidadeChapa}
                  </>
                )}
              </>
            )}
            {areaComercialTotal > 0 && (
              <> · área comercial ≈ {areaComercialTotal.toFixed(2)} m²</>
            )}
          </div>
          <div>
            Perda padrão: {perda > 0 ? `${perda}%` : '—'} · Cobrança:{' '}
            {LABEL_METODO_COBRANCA[metodo] ?? metodo}
          </div>
        </div>
      )}

      {resultado ? (
        <div className="text-xs space-y-1 text-muted-foreground border-t pt-2">
          {(() => {
            const areaPecas = Number(
              resultado.area_pecas_m2 ?? resultado.areaPecasM2 ?? 0,
            );
            const areaComPerda = Number(
              resultado.area_com_perda_m2 ?? resultado.areaComPerdaM2 ?? areaPecas,
            );
            const areaUnidadeComercial = Number(
              resultado.area_chapa_m2 ?? resultado.areaChapaM2 ?? 0,
            );
            const unidades =
              resultado.chapas_necessarias ?? resultado.chapasNecessarias ?? 1;
            const areaUnidadeComercialTotal =
              areaUnidadeComercial * Number(unidades);
            const custoTotal = Number(
              resultado.custo_material ?? resultado.custoMaterial ?? 0,
            );
            const unidadeComercialLabel =
              medidasInsumo?.unidadeComercialLabel ?? 'Unidade comercial';
            const unidadeComercialLabelMinuscula =
              medidasInsumo?.unidadeComercialLabelMinuscula ?? 'unidade comercial';

            return (
              <>
                <div>
                  <span className="font-medium text-foreground">Área a imprimir:</span>{' '}
                  {areaPecas.toFixed(2)} m²
                  {perda > 0 && areaComPerda > areaPecas && (
                    <> (com {perda}% de perda: {areaComPerda.toFixed(2)} m²)</>
                  )}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {unidadeComercialLabel} considerada:
                  </span>{' '}
                  {Number(unidades)} x {areaUnidadeComercial.toFixed(2)} m² ={' '}
                  {areaUnidadeComercialTotal.toFixed(2)}
                  m²
                </div>
                <div>
                  Aproveitamento da {unidadeComercialLabelMinuscula}:{' '}
                  {Number(
                    resultado.aproveitamento_percent ??
                      resultado.aproveitamentoPercent ??
                      0,
                  ).toFixed(1)}
                  % · Sobra na {unidadeComercialLabelMinuscula}:{' '}
                  {Number(resultado.sobra_area_m2 ?? resultado.sobraAreaM2 ?? 0).toFixed(2)}{' '}
                  m²
                </div>
                <div>
                  <span className="font-medium text-foreground">Custo do material:</span>{' '}
                  {custoTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                  {custoM2 > 0 && areaPecas > 0 && (
                    <>
                      {' '}
                      = {areaPecas.toFixed(2)} m² ×{' '}
                      {custoM2.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      por m²
                    </>
                  )}
                </div>
              </>
            );
          })()}
          <div>
            {(resultado.peca_cabe_na_chapa ?? resultado.pecaCabeNaChapa)
              ? `Cada peça cabe na ${medidasInsumo?.unidadeComercialLabelMinuscula ?? 'unidade comercial'}.`
              : `Alguma peça não cabe na ${medidasInsumo?.unidadeComercialLabelMinuscula ?? 'unidade comercial'}.`}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Informe largura e altura do produto para calcular o aproveitamento.
        </p>
      )}

      {insumo?.id && resultado && (
        <SobrasRetalhosSugestaoPanel
          insumoId={insumo.id}
          areaMinimaM2={Number(
            resultado.area_pecas_m2 ?? resultado.areaPecasM2 ?? 0,
          )}
        />
      )}
    </div>
  );
}
