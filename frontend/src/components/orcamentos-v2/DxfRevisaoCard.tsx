'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Info, Layers, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Estrutura devolvida pelo backend (`DxfParserService.parse`) — replicada
 * aqui em TypeScript para o frontend consumir sem dependência circular.
 *
 * Mantenha em sincronia com `backend/src/orcamentos-v2/services/dxf-parser.service.ts`
 * (interface `DxfExtraido`).
 */
export interface DxfExtraido {
  versao_parser: string;
  nome_projeto: string | null;
  unidade_origem: 'mm' | 'cm' | 'm' | 'pol' | 'pe' | 'desconhecida';
  largura_mm: number | null;
  altura_mm: number | null;
  area_mm2: number | null;
  area_origem: 'POLIGONO_FECHADO' | 'BOUNDING_BOX' | null;
  perimetro_total_mm: number;
  camadas: Array<{
    nome: string;
    perimetro_mm: number;
    quantidade_entidades: number;
  }>;
  camada_sugerida: string | null;
  alertas: string[];
}

/**
 * Resultado retornado pelo card quando o operador clica em "Aplicar ao
 * produto". Sempre devolve valores em mm (a conversão para a unidade do
 * formulário é responsabilidade do caller).
 */
export interface AplicarMedidasDxf {
  largura_mm: number;
  altura_mm: number;
  area_mm2: number;
  perimetro_mm: number;
  camada_perimetro: string | null;
  origem_area: 'POLIGONO_FECHADO' | 'BOUNDING_BOX';
}

interface DxfRevisaoCardProps {
  dados: DxfExtraido;
  /**
   * Disparado quando o operador confirma a aplicação. O caller decide o
   * que fazer com os valores (em `ProdutoSection.tsx` invocamos
   * `atualizarGeometria`).
   */
  onAplicar: (medidas: AplicarMedidasDxf) => void;
  /**
   * Disparado quando o operador clica em "Ignorar". O caller pode esconder
   * o card ou marcá-lo como dispensado para esta sessão.
   */
  onIgnorar: () => void;
}

/**
 * Card "Valores detectados no DXF" exibido logo abaixo do `AnexoGeometriaInput`
 * quando o backend devolve `dxf_extraido` não nulo.
 *
 * Política de produto (Sub-fase 7.B):
 *  - O card NUNCA aplica valores automaticamente. Mostra o que foi extraído
 *    e exige clique em "Aplicar ao produto".
 *  - A camada padrão para perímetro é a "CORTE" (ou a primeira encontrada)
 *    mas o operador pode trocar.
 *  - Quando há alertas (ex.: área via bounding box), eles são exibidos em
 *    destaque para que o operador saiba que pode precisar ajustar.
 */
export function DxfRevisaoCard({
  dados,
  onAplicar,
  onIgnorar,
}: DxfRevisaoCardProps) {
  const [camadaSelecionada, setCamadaSelecionada] = useState<string | null>(
    dados.camada_sugerida || dados.camadas[0]?.nome || null,
  );

  const camadaAtual = useMemo(
    () => dados.camadas.find((c) => c.nome === camadaSelecionada) || null,
    [dados.camadas, camadaSelecionada],
  );

  const podeAplicar =
    !!camadaAtual &&
    dados.largura_mm !== null &&
    dados.altura_mm !== null &&
    dados.area_mm2 !== null &&
    dados.area_origem !== null;

  const formatarMm = (valor: number | null): string => {
    if (valor === null || !Number.isFinite(valor)) return '—';
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mm`;
  };

  const formatarAreaM2 = (valorMm2: number | null): string => {
    if (valorMm2 === null || !Number.isFinite(valorMm2)) return '—';
    const m2 = valorMm2 / 1_000_000;
    return `${m2.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} m²`;
  };

  const handleAplicar = () => {
    if (!podeAplicar || !camadaAtual) return;
    onAplicar({
      largura_mm: dados.largura_mm!,
      altura_mm: dados.altura_mm!,
      area_mm2: dados.area_mm2!,
      perimetro_mm: camadaAtual.perimetro_mm,
      camada_perimetro: camadaAtual.nome,
      origem_area: dados.area_origem!,
    });
  };

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Ruler className="h-4 w-4" />
          <span>Valores detectados no DXF</span>
        </div>
        {dados.nome_projeto ? (
          <span className="text-xs text-muted-foreground truncate max-w-[14rem]">
            Projeto: {dados.nome_projeto}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Largura</p>
          <p className="font-medium">{formatarMm(dados.largura_mm)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Altura</p>
          <p className="font-medium">{formatarMm(dados.altura_mm)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Área</p>
          <p className="font-medium">{formatarAreaM2(dados.area_mm2)}</p>
          {dados.area_origem === 'BOUNDING_BOX' ? (
            <p className="text-[10px] text-amber-700">aprox. (envolvente)</p>
          ) : dados.area_origem === 'POLIGONO_FECHADO' ? (
            <p className="text-[10px] text-emerald-700">polígono fechado</p>
          ) : null}
        </div>
        <div>
          <p className="text-muted-foreground">Perímetro (camada)</p>
          <p className="font-medium">
            {camadaAtual ? formatarMm(camadaAtual.perimetro_mm) : '—'}
          </p>
        </div>
      </div>

      {dados.camadas.length > 0 ? (
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Camadas do DXF (selecione qual usar para o perímetro)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dados.camadas.map((camada) => {
              const ativa = camadaSelecionada === camada.nome;
              return (
                <button
                  key={camada.nome}
                  type="button"
                  onClick={() => setCamadaSelecionada(camada.nome)}
                  className={[
                    'rounded border px-2 py-1 text-xs transition-colors',
                    ativa
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 hover:border-muted-foreground/60',
                  ].join(' ')}
                >
                  <span className="font-medium">{camada.nome}</span>
                  <span className="ml-1 text-muted-foreground">
                    ({formatarMm(camada.perimetro_mm)})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {dados.alertas.length > 0 ? (
        <div className="rounded bg-amber-50 border border-amber-200 p-2">
          <div className="flex items-start gap-2 text-amber-900">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <ul className="text-xs space-y-0.5 list-disc list-inside">
              {dados.alertas.map((alerta, idx) => (
                <li key={idx}>{alerta}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onIgnorar}
        >
          Ignorar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleAplicar}
          disabled={!podeAplicar}
          className="gap-1"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aplicar ao produto
        </Button>
      </div>
    </div>
  );
}
