'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PersonalizacaoVdpModo } from '@/lib/catalogo/personalizacao-orcamento.types';

interface VdpModoToggleProps {
  modo: PersonalizacaoVdpModo;
  onModoChange: (modo: PersonalizacaoVdpModo) => void;
  disabled?: boolean;
}

export function VdpModoToggle({ modo, onModoChange, disabled }: VdpModoToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={modo === 'INLINE' ? 'default' : 'outline'}
        disabled={disabled}
        className={cn(modo === 'INLINE' && 'pointer-events-none')}
        onClick={() => onModoChange('INLINE')}
      >
        Digitar inline
      </Button>
      <Button
        type="button"
        size="sm"
        variant={modo === 'PLANILHA' ? 'default' : 'outline'}
        disabled={disabled}
        className={cn(modo === 'PLANILHA' && 'pointer-events-none')}
        onClick={() => onModoChange('PLANILHA')}
      >
        Importar planilha (CSV)
      </Button>
    </div>
  );
}
