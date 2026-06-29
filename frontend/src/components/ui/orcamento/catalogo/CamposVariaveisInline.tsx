'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CampoVariavelDefOrcamento } from '@/lib/catalogo/personalizacao-orcamento.types';

interface CamposVariaveisInlineProps {
  campos: CampoVariavelDefOrcamento[];
  valores: Record<string, string>;
  onChange: (chave: string, valor: string) => void;
  disabled?: boolean;
  prefixoId?: string;
}

export function CamposVariaveisInline({
  campos,
  valores,
  onChange,
  disabled,
  prefixoId = 'campo',
}: CamposVariaveisInlineProps) {
  const ordenados = [...campos].sort((a, b) => a.ordem - b.ordem);

  if (!ordenados.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta estampa não possui campos variáveis configurados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ordenados.map((campo) => {
        const valorAtual = valores[campo.chave] ?? '';
        const max = campo.max_caracteres ?? undefined;
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label htmlFor={`${prefixoId}-${campo.chave}`}>
              {campo.label}
              {campo.obrigatorio ? ' *' : ''}
            </Label>
            <Input
              id={`${prefixoId}-${campo.chave}`}
              type={campo.tipo === 'NUMERO' ? 'number' : campo.tipo === 'DATA' ? 'date' : 'text'}
              placeholder={campo.placeholder || undefined}
              maxLength={max}
              disabled={disabled}
              value={valorAtual}
              onChange={(e) => onChange(campo.chave, e.target.value)}
            />
            {max ? (
              <p className="text-xs text-muted-foreground">
                {valorAtual.length}/{max} caracteres
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
