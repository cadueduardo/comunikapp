'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoteInstaladorCard } from '@/components/instalacao/LoteInstaladorCard';
import { instaladorApi } from '@/lib/instalacao/instalador-api';
import type { LoteInstaladorResumo } from '@/lib/instalacao/instalacao.types';
import { IconArrowLeft, IconLoader2, IconRefresh, IconTool } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function InstaladorPage() {
  const [lotes, setLotes] = useState<LoteInstaladorResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await instaladorApi.listarLotes();
      setLotes(dados);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao carregar lotes',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-lg flex-col gap-4 overflow-x-hidden px-3 py-4 sm:px-4">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/dashboard">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground">
              Instalação em campo
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Lotes pendentes da sua loja
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={carregando}
          onClick={() => void carregar()}
        >
          <IconRefresh className="h-4 w-4" />
        </Button>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando fila...
        </div>
      ) : lotes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center">
          <IconTool className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum lote pendente no momento.
          </p>
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-3">
          {lotes.map((lote) => (
            <LoteInstaladorCard key={lote.id} lote={lote} />
          ))}
        </div>
      )}
    </div>
  );
}
