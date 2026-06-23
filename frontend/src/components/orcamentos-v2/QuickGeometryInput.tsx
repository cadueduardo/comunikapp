'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ruler } from 'lucide-react';

/**
 * Entrada rápida de geometria para um produto retangular.
 *
 * Sempre trabalha internamente em milímetros para precisão; expõe area_m2
 * e perimetro_mm calculados no callback `onChange`.
 *
 * Esta primeira versão suporta apenas geometria MANUAL (origem = 'MANUAL').
 * Anexo de imagem/DXF é Fase 2.D futura / Fase 7.
 *
 * Fase 11 (2026-05-26): suporte OPCIONAL a profundidade para produtos 3D
 * (totens, letras caixa, displays). Quando `permitirProfundidade=true`, o
 * componente exibe um checkbox "Este produto tem profundidade (3D)". Quando
 * marcado, expõe um campo de profundidade adicional e propaga `profundidade_mm`
 * no callback. Produtos planos não enxergam nenhuma mudança visual.
 */

export type UnidadeEntrada = 'mm' | 'cm' | 'm';

export interface GeometriaValor {
  largura: string; // valor digitado na unidade selecionada (string p/ não perder vírgula)
  altura: string;
  unidade: UnidadeEntrada;
  // Fase 11: profundidade opcional para produtos 3D. Strings para preservar virgula.
  // Quando temProfundidade=false ou ausente, o campo profundidade e ignorado.
  profundidade?: string;
  temProfundidade?: boolean;
}

export interface GeometriaCalculada {
  largura_mm: number;
  altura_mm: number;
  area_m2: number;
  perimetro_mm: number;
  // Fase 11: profundidade_mm so e > 0 quando temProfundidade=true E ha valor valido.
  // Caso contrario, vale 0 (produto 2D).
  profundidade_mm: number;
  geometria_origem: 'MANUAL';
}

export interface QuickGeometryInputProps {
  valor: GeometriaValor;
  onChange: (valor: GeometriaValor, calculada: GeometriaCalculada) => void;
  titulo?: string;
  larguraLabel?: string;
  alturaLabel?: string;
  className?: string;
  disabled?: boolean;
  // Fase 11: quando true, exibe checkbox e campo de profundidade. Default: false
  // (mantem comportamento existente para produtos planos).
  permitirProfundidade?: boolean;
  profundidadeLabel?: string;
}

const FATOR_PARA_MM: Record<UnidadeEntrada, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
};

function parseNumero(input: string): number {
  if (!input) return 0;
  const texto = String(input).trim().replace(/[^0-9,.-]/g, '');
  const temVirgula = texto.includes(',');
  const limpo = temVirgula
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto;
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function calcular(valor: GeometriaValor): GeometriaCalculada {
  const fator = FATOR_PARA_MM[valor.unidade];
  const larguraMm = parseNumero(valor.largura) * fator;
  const alturaMm = parseNumero(valor.altura) * fator;
  const areaMm2 = larguraMm * alturaMm;
  const areaM2 = areaMm2 / 1_000_000;
  const perimetroMm = 2 * (larguraMm + alturaMm);

  // Fase 11: profundidade so entra no calculo quando temProfundidade=true E valor > 0.
  // Caso contrario, retorna 0 (produto 2D).
  const profundidadeMm = valor.temProfundidade
    ? parseNumero(valor.profundidade || '') * fator
    : 0;

  return {
    largura_mm: arred(larguraMm, 2),
    altura_mm: arred(alturaMm, 2),
    area_m2: arred(areaM2, 4),
    perimetro_mm: arred(perimetroMm, 2),
    profundidade_mm: arred(profundidadeMm, 2),
    geometria_origem: 'MANUAL',
  };
}

function arred(v: number, casas: number) {
  if (!Number.isFinite(v)) return 0;
  const f = Math.pow(10, casas);
  return Math.round(v * f) / f;
}

function formatarNumeroPtBr(valor: number, casas: number, minimo = 0): string {
  if (!Number.isFinite(valor) || valor === 0) return '—';
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: minimo,
    maximumFractionDigits: casas,
  });
}

export function QuickGeometryInput({
  valor,
  onChange,
  titulo = 'Geometria do produto',
  larguraLabel = 'Largura',
  alturaLabel = 'Altura',
  className,
  disabled,
  permitirProfundidade = false,
  profundidadeLabel = 'Profundidade',
}: QuickGeometryInputProps) {
  const [estado, setEstado] = useState<GeometriaValor>(valor);
  const calculada = useMemo(() => calcular(estado), [estado]);

  // sincroniza com prop externa (caso pai mude o valor)
  useEffect(() => {
    if (
      valor.largura !== estado.largura ||
      valor.altura !== estado.altura ||
      valor.unidade !== estado.unidade ||
      valor.profundidade !== estado.profundidade ||
      valor.temProfundidade !== estado.temProfundidade
    ) {
      setEstado(valor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor.largura, valor.altura, valor.unidade, valor.profundidade, valor.temProfundidade]);

  function atualizar(novo: Partial<GeometriaValor>) {
    const next = { ...estado, ...novo };
    setEstado(next);
    onChange(next, calcular(next));
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Ruler className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-gray-800">{titulo}</span>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${estado.temProfundidade ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <div>
          <Label htmlFor="geom-largura" className="text-xs">
            {larguraLabel}
          </Label>
          <Input
            id="geom-largura"
            inputMode="decimal"
            placeholder="0"
            value={estado.largura}
            disabled={disabled}
            onChange={(e) => atualizar({ largura: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="geom-altura" className="text-xs">
            {alturaLabel}
          </Label>
          <Input
            id="geom-altura"
            inputMode="decimal"
            placeholder="0"
            value={estado.altura}
            disabled={disabled}
            onChange={(e) => atualizar({ altura: e.target.value })}
          />
        </div>
        {estado.temProfundidade && (
          <div>
            <Label htmlFor="geom-profundidade" className="text-xs">
              {profundidadeLabel}
            </Label>
            <Input
              id="geom-profundidade"
              inputMode="decimal"
              placeholder="0"
              value={estado.profundidade || ''}
              disabled={disabled}
              onChange={(e) => atualizar({ profundidade: e.target.value })}
            />
          </div>
        )}
        <div>
          <Label htmlFor="geom-unidade" className="text-xs">
            Unidade
          </Label>
          <Select
            value={estado.unidade}
            disabled={disabled}
            onValueChange={(v) =>
              atualizar({ unidade: v as UnidadeEntrada })
            }
          >
            <SelectTrigger id="geom-unidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mm">Milímetros (mm)</SelectItem>
              <SelectItem value="cm">Centímetros (cm)</SelectItem>
              <SelectItem value="m">Metros (m)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {permitirProfundidade && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-dashed border-blue-200 bg-blue-50/40 px-3 py-2">
          <Checkbox
            id="geom-tem-profundidade"
            checked={Boolean(estado.temProfundidade)}
            disabled={disabled}
            onCheckedChange={(checked) => {
              const ligar = checked === true;
              atualizar({
                temProfundidade: ligar,
                // Limpa o valor ao desligar para evitar persistir profundidade fantasma.
                profundidade: ligar ? estado.profundidade : '',
              });
            }}
          />
          <div className="text-xs text-gray-700">
            <Label htmlFor="geom-tem-profundidade" className="cursor-pointer font-medium">
              Este produto tem profundidade (3D)
            </Label>
            <p className="text-gray-500 mt-0.5">
              Marque para produtos como totens, letras caixa e displays. A profundidade segue a mesma unidade acima.
            </p>
          </div>
        </div>
      )}

      <div className={`mt-3 grid gap-3 text-xs ${estado.temProfundidade ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
          <div className="text-gray-500">Área calculada</div>
          <div className="font-mono font-semibold text-gray-900">
            {formatarNumeroPtBr(calculada.area_m2, 2)} m²
          </div>
        </div>
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
          <div className="text-gray-500">Perímetro calculado</div>
          <div className="font-mono font-semibold text-gray-900">
            {formatarNumeroPtBr(calculada.perimetro_mm / 1000, 2)} m
          </div>
        </div>
        {estado.temProfundidade && (
          <>
            <div className="rounded-md border border-dashed border-blue-200 bg-blue-50/40 px-3 py-2">
              <div className="text-gray-500">Área lateral (caixa aberta)</div>
              <div className="font-mono font-semibold text-gray-900">
                {formatarNumeroPtBr(
                  (calculada.perimetro_mm / 1000) * (calculada.profundidade_mm / 1000),
                  2,
                )}{' '}
                m²
              </div>
            </div>
            <div className="rounded-md border border-dashed border-blue-200 bg-blue-50/40 px-3 py-2">
              <div className="text-gray-500">Volume</div>
              <div className="font-mono font-semibold text-gray-900">
                {formatarNumeroPtBr(
                  calculada.area_m2 * (calculada.profundidade_mm / 1000),
                  3,
                )}{' '}
                m³
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const geometriaHelpers = {
  parseNumero,
  calcular,
  formatarNumeroPtBr,
};
