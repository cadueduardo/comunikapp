'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  GradeAtributoDef,
  GradeDistribuicaoLinha,
} from '@/lib/catalogo/personalizacao-orcamento.types';

interface GradeDistribuicaoMiniProps {
  definicoes: GradeAtributoDef[];
  linhas: GradeDistribuicaoLinha[];
  quantidadeTotal: number;
  onChange: (linhas: GradeDistribuicaoLinha[]) => void;
  disabled?: boolean;
}

export function GradeDistribuicaoMini({
  definicoes,
  linhas,
  quantidadeTotal,
  onChange,
  disabled,
}: GradeDistribuicaoMiniProps) {
  const soma = useMemo(
    () => linhas.reduce((acc, l) => acc + (Number(l.quantidade) || 0), 0),
    [linhas],
  );
  const divergente = soma !== quantidadeTotal;

  if (!definicoes.length || quantidadeTotal <= 1) {
    return null;
  }

  const atualizarQuantidade = (indice: number, quantidade: number) => {
    const novas = linhas.map((l, i) =>
      i === indice ? { ...l, quantidade: Math.max(0, quantidade) } : l,
    );
    onChange(novas);
  };

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-4">
      <div>
        <Label className="text-sm font-medium">Distribuição por atributos</Label>
        <p className="text-xs text-muted-foreground">
          Informe a quantidade por combinação. A soma deve ser igual à quantidade total (
          {quantidadeTotal}).
        </p>
      </div>
      <div className="space-y-2">
        {linhas.map((linha, indice) => {
          const rotulo = definicoes
            .map((d) => `${d.label}: ${linha.atributos[d.chave] || '-'}`)
            .join(' · ');
          return (
            <div
              key={`${rotulo}-${indice}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded border bg-background px-3 py-2"
            >
              <span className="text-sm">{rotulo}</span>
              <Input
                type="number"
                min={0}
                className="w-24"
                disabled={disabled}
                value={linha.quantidade || ''}
                onChange={(e) =>
                  atualizarQuantidade(indice, Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                }
              />
            </div>
          );
        })}
      </div>
      <p
        className={
          divergente
            ? 'text-sm font-medium text-destructive'
            : 'text-sm text-muted-foreground'
        }
      >
        Soma atual: {soma} / {quantidadeTotal}
        {divergente ? ' — ajuste as quantidades antes de salvar.' : ''}
      </p>
    </div>
  );
}

export function construirLinhasGradeIniciais(
  definicoes: GradeAtributoDef[],
  quantidadeTotal: number,
): GradeDistribuicaoLinha[] {
  if (!definicoes.length) return [];

  const primeira = definicoes[0];
  if (definicoes.length === 1 && primeira.opcoes.length) {
    return primeira.opcoes.map((opcao) => ({
      atributos: { [primeira.chave]: opcao },
      quantidade: 0,
    }));
  }

  return [
    {
      atributos: Object.fromEntries(
        definicoes.map((d) => [d.chave, d.opcoes[0] || '']),
      ),
      quantidade: quantidadeTotal,
    },
  ];
}

export function somaGradeDistribuicao(linhas: GradeDistribuicaoLinha[]): number {
  return linhas.reduce((acc, l) => acc + (Number(l.quantidade) || 0), 0);
}
