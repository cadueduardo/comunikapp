'use client';

import { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { abrirAnexoGeometria } from '@/lib/anexo-geometria-client';

interface AnexoGeometriaAbrirButtonProps {
  referenciaUrl: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function AnexoGeometriaAbrirButton({
  referenciaUrl,
  label = 'Ver referência',
  variant = 'outline',
  size = 'sm',
  className,
}: AnexoGeometriaAbrirButtonProps) {
  const [abrindo, setAbrindo] = useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={abrindo}
      onClick={() => {
        setAbrindo(true);
        void abrirAnexoGeometria(referenciaUrl).finally(() => setAbrindo(false));
      }}
    >
      {abrindo ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
