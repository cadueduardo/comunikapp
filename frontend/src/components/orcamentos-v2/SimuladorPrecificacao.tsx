'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator } from 'lucide-react';

/**
 * Simulador científico de precificação (standalone).
 *
 * Usa as MESMAS fórmulas do PreviewCalculoV2:
 * - markup:           preco = (custo * (1 + margem)) / (1 - impostos - comissao)
 * - margem_por_dentro:preco = custo / (1 - impostos - comissao - margem)
 *
 * Não fala com o backend — é para conferência/exploração rápida. Útil para o
 * usuário entender como a margem real muda conforme tipo de cálculo, e para
 * comparar entre os dois métodos.
 */

type TipoCalculo = 'markup' | 'margem_por_dentro';

interface ResultadoSimulacao {
  custo: number;
  precoFinal: number;
  margemValor: number;
  margemRealPercent: number; // margem efetiva sobre o preço final
  impostosValor: number;
  comissaoValor: number;
  subtotalComLucro: number;
  valido: boolean;
  motivoInvalido?: string;
}

function parseNumeroPtBr(raw: string): number {
  if (!raw) return 0;
  const texto = String(raw).trim().replace(/[^0-9,.-]/g, '');
  const temVirgula = texto.includes(',');
  const limpo = temVirgula
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatNumeroInicial(valor: number | undefined, casas = 2): string {
  if (valor === undefined || !Number.isFinite(valor)) return '';
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

function pct(valor: number): string {
  if (!Number.isFinite(valor)) return '—';
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

function calcular(
  custoStr: string,
  margemStr: string,
  impostosStr: string,
  comissaoStr: string,
  tipo: TipoCalculo,
): ResultadoSimulacao {
  const custo = parseNumeroPtBr(custoStr);
  const margem = parseNumeroPtBr(margemStr) / 100;
  const impostos = parseNumeroPtBr(impostosStr) / 100;
  const comissao = parseNumeroPtBr(comissaoStr) / 100;

  if (custo <= 0) {
    return {
      custo,
      precoFinal: 0,
      margemValor: 0,
      margemRealPercent: 0,
      impostosValor: 0,
      comissaoValor: 0,
      subtotalComLucro: 0,
      valido: false,
      motivoInvalido: 'Informe o custo para simular.',
    };
  }

  let precoFinal = 0;
  if (tipo === 'markup') {
    const divisor = 1 - impostos - comissao;
    if (divisor <= 0) {
      return {
        custo,
        precoFinal: 0,
        margemValor: 0,
        margemRealPercent: 0,
        impostosValor: 0,
        comissaoValor: 0,
        subtotalComLucro: 0,
        valido: false,
        motivoInvalido: 'Impostos + comissão >= 100%. Reduza para simular.',
      };
    }
    precoFinal = (custo * (1 + margem)) / divisor;
  } else {
    const divisor = 1 - impostos - comissao - margem;
    if (divisor <= 0) {
      return {
        custo,
        precoFinal: 0,
        margemValor: 0,
        margemRealPercent: 0,
        impostosValor: 0,
        comissaoValor: 0,
        subtotalComLucro: 0,
        valido: false,
        motivoInvalido: 'Impostos + comissão + margem >= 100%. Reduza para simular.',
      };
    }
    precoFinal = custo / divisor;
  }

  const impostosValor = precoFinal * impostos;
  const comissaoValor = precoFinal * comissao;
  const subtotalComLucro = precoFinal - impostosValor - comissaoValor;
  const margemValor = subtotalComLucro - custo;
  const margemRealPercent = precoFinal > 0 ? (margemValor / precoFinal) * 100 : 0;

  return {
    custo,
    precoFinal,
    margemValor,
    margemRealPercent,
    impostosValor,
    comissaoValor,
    subtotalComLucro,
    valido: true,
  };
}

export interface SimuladorPrecificacaoProps {
  custoInicial?: number;
  margemInicial?: number;
  impostosInicial?: number;
  comissaoInicial?: number;
  tipoInicial?: TipoCalculo;
  className?: string;
}

export function SimuladorPrecificacao({
  custoInicial,
  margemInicial,
  impostosInicial,
  comissaoInicial,
  tipoInicial,
  className,
}: SimuladorPrecificacaoProps) {
  const [custo, setCusto] = useState<string>(
    formatNumeroInicial(custoInicial, 2),
  );
  const [margem, setMargem] = useState<string>(
    margemInicial !== undefined ? formatNumeroInicial(margemInicial, 2) : '45',
  );
  const [impostos, setImpostos] = useState<string>(
    impostosInicial !== undefined ? formatNumeroInicial(impostosInicial, 2) : '6',
  );
  const [comissao, setComissao] = useState<string>(
    comissaoInicial !== undefined ? formatNumeroInicial(comissaoInicial, 2) : '5',
  );
  const [tipo, setTipo] = useState<TipoCalculo>(tipoInicial ?? 'margem_por_dentro');

  const resultado = useMemo(
    () => calcular(custo, margem, impostos, comissao, tipo),
    [custo, margem, impostos, comissao, tipo],
  );

  const resultadoComparacao = useMemo(() => {
    const outro: TipoCalculo = tipo === 'markup' ? 'margem_por_dentro' : 'markup';
    return calcular(custo, margem, impostos, comissao, outro);
  }, [custo, margem, impostos, comissao, tipo]);

  return (
    <Card className={`p-4 ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-5 w-5 text-indigo-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Simulador de precificação
          </h3>
          <p className="text-xs text-gray-500">
            Não salva nada — use para entender o impacto dos parâmetros antes de
            confirmar o orçamento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <Label htmlFor="sim-custo" className="text-xs">
            Custo total (R$)
          </Label>
          <Input
            id="sim-custo"
            inputMode="decimal"
            placeholder="0,00"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sim-margem" className="text-xs">
            Margem (%)
          </Label>
          <Input
            id="sim-margem"
            inputMode="decimal"
            value={margem}
            onChange={(e) => setMargem(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sim-impostos" className="text-xs">
            Impostos (%)
          </Label>
          <Input
            id="sim-impostos"
            inputMode="decimal"
            value={impostos}
            onChange={(e) => setImpostos(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sim-comissao" className="text-xs">
            Comissão (%)
          </Label>
          <Input
            id="sim-comissao"
            inputMode="decimal"
            value={comissao}
            onChange={(e) => setComissao(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sim-tipo" className="text-xs">
            Tipo de cálculo
          </Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCalculo)}>
            <SelectTrigger id="sim-tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="margem_por_dentro">Margem por dentro</SelectItem>
              <SelectItem value="markup">Markup</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!resultado.valido ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {resultado.motivoInvalido}
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="text-xs text-emerald-700">Preço final sugerido</div>
              <div className="text-lg font-bold text-emerald-900">
                {brl(resultado.precoFinal)}
              </div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
              <div className="text-xs text-gray-500">Lucro líquido estimado</div>
              <div className="text-base font-semibold text-gray-900">
                {brl(resultado.margemValor)}{' '}
                <span className="text-xs font-normal text-gray-500">
                  ({pct(resultado.margemRealPercent)} sobre o preço)
                </span>
              </div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
              <div className="text-xs text-gray-500">Subtotal com lucro</div>
              <div className="text-base font-semibold text-gray-900">
                {brl(resultado.subtotalComLucro)}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Impostos {brl(resultado.impostosValor)} · Comissão{' '}
                {brl(resultado.comissaoValor)}
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-gray-500">
            {resultadoComparacao.valido && (
              <>
                <span className="font-semibold">Comparação:</span>{' '}
                no método{' '}
                <span className="font-semibold">
                  {tipo === 'markup' ? 'margem por dentro' : 'markup'}
                </span>{' '}
                este mesmo cenário daria preço{' '}
                {brl(resultadoComparacao.precoFinal)}
                {' '}({pct(resultadoComparacao.margemRealPercent)} de margem
                real).
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
