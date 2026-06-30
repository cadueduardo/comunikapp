'use client';

import { useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { catalogoArteProducaoApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface ArteProducaoVdpControleProps {
  itemOsId: string;
  modoFulfillment?: string | null;
  arteProducaoUrl?: string | null;
  compact?: boolean;
}

export function ArteProducaoVdpControle({
  itemOsId,
  modoFulfillment,
  arteProducaoUrl,
  compact = false,
}: ArteProducaoVdpControleProps) {
  const [baixando, setBaixando] = useState(false);
  const modo = String(modoFulfillment || '').toUpperCase();

  if (modo !== 'MAKE' && modo !== 'HIBRIDO') {
    return null;
  }

  if (!arteProducaoUrl) {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-800"
        onClick={(e) => e.stopPropagation()}
      >
        ⏳ Gerando Arquivo de Produção...
      </Badge>
    );
  }

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    try {
      setBaixando(true);
      await catalogoArteProducaoApi.downloadArteProducao(itemOsId, token);
      toast.success('Download da arte de produção iniciado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível baixar a arte de produção.',
      );
    } finally {
      setBaixando(false);
    }
  };

  if (compact) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        disabled={baixando}
        onClick={handleDownload}
      >
        <IconDownload className="h-3.5 w-3.5" />
        {baixando ? 'Baixando...' : 'Arte VDP'}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="mt-2 h-8 w-full gap-2 text-xs font-medium"
      disabled={baixando}
      onClick={handleDownload}
    >
      <IconDownload className="h-4 w-4" />
      {baixando ? 'Baixando...' : '⬇️ Baixar Arte Print-Ready (VDP)'}
    </Button>
  );
}
