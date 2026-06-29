'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileImage, Loader2 } from 'lucide-react';
import { AnexoGeometriaAbrirButton } from '@/components/shared/AnexoGeometriaAbrirButton';
import { useAnexoGeometriaPreview } from '@/hooks/use-anexo-geometria-preview';

interface ItemContextoArte {
  item_id: string;
  produto_nome: string;
  responsabilidade_arte: string;
  finalidade_anexo: string | null;
  status_arte: string;
  referencia_url: string | null;
  geometria_origem?: string | null;
}

const FINALIDADE_LABEL: Record<string, string> = {
  REFERENCIA_VISUAL: 'Referência visual',
  DESENHO_TECNICO: 'Desenho técnico',
  ARTE_PRODUCAO: 'Arte de produção',
};

interface ArteReferenciaOrcamentoPanelProps {
  osId: string;
  itemIdSelecionado?: string;
}

function ReferenciaItemCard({ item }: { item: ItemContextoArte }) {
  const previewImagem =
    item.geometria_origem === 'IMAGEM' || !item.geometria_origem;
  const { blobUrl, loading, isImage, error } = useAnexoGeometriaPreview(
    item.referencia_url,
    previewImagem,
  );

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-sm">{item.produto_nome}</span>
        {item.finalidade_anexo && (
          <Badge variant="outline">
            {FINALIDADE_LABEL[item.finalidade_anexo] || item.finalidade_anexo}
          </Badge>
        )}
        <Badge variant="secondary">{item.status_arte}</Badge>
      </div>

      {previewImagem && loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando preview…
        </div>
      )}

      {previewImagem && isImage && blobUrl && (
        <div className="relative max-w-md overflow-hidden rounded border">
          <Image
            src={blobUrl}
            alt={`Referência — ${item.produto_nome}`}
            width={480}
            height={320}
            className="h-auto w-full object-contain"
            unoptimized
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {item.referencia_url && (
        <AnexoGeometriaAbrirButton
          referenciaUrl={item.referencia_url}
          label="Abrir arquivo"
        />
      )}
    </div>
  );
}

export function ArteReferenciaOrcamentoPanel({
  osId,
  itemIdSelecionado,
}: ArteReferenciaOrcamentoPanelProps) {
  const [itens, setItens] = useState<ItemContextoArte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      const token = localStorage.getItem('access_token');
      if (!token || !osId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/arte-aprovacao/os/${osId}/itens-contexto`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) {
          setItens(json.data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar contexto de arte da OS:', error);
      } finally {
        setLoading(false);
      }
    };

    void carregar();
  }, [osId]);

  const itensVisiveis = itemIdSelecionado
    ? itens.filter((i) => i.item_id === itemIdSelecionado)
    : itens;

  const comReferencia = itensVisiveis.filter((i) => i.referencia_url);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando referências do orçamento…
        </CardContent>
      </Card>
    );
  }

  if (comReferencia.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          Referência do orçamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Anexo enviado pelo orçamentista — use como briefing para criação da arte.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {comReferencia.map((item) => (
          <ReferenciaItemCard key={item.item_id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
