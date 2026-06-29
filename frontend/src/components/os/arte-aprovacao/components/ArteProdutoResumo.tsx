'use client';

import Link from 'next/link';
import { ExternalLink, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArteStatusTracker } from './ArteStatusTracker';
import { PrazoArteItemEditor } from './PrazoArteItemEditor';
import {
  produtoRequerArte,
  STATUS_ARTE_LABEL,
} from '@/lib/arte-produto-utils';

const RESPONSABILIDADE_LABEL: Record<string, string> = {
  EMPRESA_CRIA: 'Empresa cria',
  EMPRESA_ADAPTA: 'Empresa adapta',
  CLIENTE_FORNECE: 'Cliente fornece',
};

const ARTE_INTERNA = new Set(['EMPRESA_CRIA', 'EMPRESA_ADAPTA']);

interface ArteProdutoResumoProps {
  osId: string;
  itemId: string;
  produtoNome: string;
  responsabilidadeArte?: string | null;
  statusArte?: string | null;
  dataPrazoArte?: string | null;
  designerAtribuido?: { id: string; nome: string } | null;
  onPrazoAtualizado?: (data: string | null) => void;
  readonly?: boolean;
}

export function ArteProdutoResumo({
  osId,
  itemId,
  produtoNome,
  responsabilidadeArte,
  statusArte,
  dataPrazoArte,
  designerAtribuido,
  onPrazoAtualizado,
  readonly = false,
}: ArteProdutoResumoProps) {
  if (!produtoRequerArte(responsabilidadeArte, statusArte)) {
    return null;
  }

  const interno = ARTE_INTERNA.has(responsabilidadeArte || '');
  const status = statusArte || 'AGUARDANDO_INICIO';

  return (
    <div className="rounded-md border border-blue-100 bg-blue-50/40 p-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-medium text-blue-900 uppercase tracking-wide">
            Arte & Aprovação
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs bg-white">
              {RESPONSABILIDADE_LABEL[responsabilidadeArte || ''] ||
                responsabilidadeArte}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {STATUS_ARTE_LABEL[status] || status}
            </Badge>
            {designerAtribuido?.nome && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {designerAtribuido.nome}
              </span>
            )}
          </div>
        </div>
        {interno && (
          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" asChild>
            <Link href={`/arte/trabalho/${osId}/${itemId}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir na fila
            </Link>
          </Button>
        )}
      </div>

      <ArteStatusTracker
        statusArte={status}
        responsabilidadeArte={responsabilidadeArte || ''}
      />

      {interno && (
        <PrazoArteItemEditor
          osId={osId}
          itemId={itemId}
          dataPrazoArte={dataPrazoArte}
          onAtualizado={onPrazoAtualizado}
          readonly={readonly}
        />
      )}

      {!interno && (
        <p className="text-xs text-muted-foreground">
          {produtoNome}: aguardando envio do arquivo pelo cliente.
        </p>
      )}
    </div>
  );
}
