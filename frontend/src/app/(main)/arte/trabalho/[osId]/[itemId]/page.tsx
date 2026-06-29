'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArteWorkspacePanel } from '@/components/arte-aprovacao/ArteWorkspacePanel';
import { apiRequest } from '@/lib/api';

interface OsResumo {
  id: string;
  numero: string;
  nome_servico: string;
}

export default function ArteTrabalhoPage() {
  const params = useParams<{ osId: string; itemId: string }>();
  const osId = params.osId;
  const itemId = params.itemId;

  const [os, setOs] = useState<OsResumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const response = await apiRequest(`/os/${osId}`);
        if (!response.ok) throw new Error('OS não encontrada');
        const payload = await response.json();
        const osData = (payload?.data ?? payload) as OsResumo;
        setOs(osData);
      } catch (error) {
        console.error('Erro ao carregar OS:', error);
      } finally {
        setLoading(false);
      }
    };
    if (osId) void carregar();
  }, [osId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/arte">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à fila
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Arte & Aprovação</h1>
            <p className="text-sm text-muted-foreground">
              {os
                ? `OS #${os.numero} — ${os.nome_servico}`
                : 'Ordem de serviço'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/os/${osId}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver OS (gestor)
          </Link>
        </Button>
      </div>

      <ArteWorkspacePanel
        osId={osId}
        itemId={itemId}
        osNumero={os?.numero}
      />
    </div>
  );
}
