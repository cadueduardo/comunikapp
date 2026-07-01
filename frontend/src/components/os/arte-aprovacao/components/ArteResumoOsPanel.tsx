'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Palette, User, FileImage } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArteStatusTracker } from './ArteStatusTracker';
import { PrazoArteItemEditor } from './PrazoArteItemEditor';
import { openArteFilePreview } from '@/lib/arte-assets';
import { useArteKanbanSocket } from '@/hooks/use-arte-kanban-socket';
import { toast } from 'sonner';

export interface ItemArteOs {
  item_id: string;
  produto_nome: string;
  responsabilidade_arte: string;
  finalidade_anexo: string | null;
  status_arte: string;
  data_prazo_arte: string | null;
  referencia_url: string | null;
  designer_atribuido?: { id: string; nome: string } | null;
  arte_producao?: {
    versao_id: string;
    versao: string;
    arquivo_id: string;
    nome_arquivo: string;
    nome_original: string;
    url_arquivo: string;
    storage_provider: string;
  } | null;
}

const STATUS_LABEL: Record<string, string> = {
  NAO_APLICA: 'Não se aplica',
  AGUARDANDO_INICIO: 'Na fila',
  EM_CRIACAO: 'Em criação',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  REVISAO_SOLICITADA: 'Em revisão',
  APROVADA: 'Aprovada',
  LIBERADA_PCP: 'Liberada para PCP',
  AGUARDANDO_ARQUIVO_CLIENTE: 'Aguardando arquivo do cliente',
  ARQUIVO_RECEBIDO: 'Arquivo recebido',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  AGUARDANDO_INICIO: 'secondary',
  EM_CRIACAO: 'default',
  AGUARDANDO_CLIENTE: 'default',
  REVISAO_SOLICITADA: 'default',
  APROVADA: 'outline',
  LIBERADA_PCP: 'outline',
  AGUARDANDO_ARQUIVO_CLIENTE: 'default',
  ARQUIVO_RECEBIDO: 'outline',
};

const RESPONSABILIDADE_LABEL: Record<string, string> = {
  EMPRESA_CRIA: 'Empresa cria',
  EMPRESA_ADAPTA: 'Empresa adapta',
  CLIENTE_FORNECE: 'Cliente envia arquivo',
  NAO_APLICAVEL: 'Sem arte',
};

const STATUS_PENDENTES = new Set([
  'AGUARDANDO_INICIO',
  'EM_CRIACAO',
  'AGUARDANDO_CLIENTE',
  'REVISAO_SOLICITADA',
  'AGUARDANDO_ARQUIVO_CLIENTE',
]);

const ARTE_INTERNA = new Set(['EMPRESA_CRIA', 'EMPRESA_ADAPTA']);
const ARTE_COM_WORKSPACE = new Set([
  'EMPRESA_CRIA',
  'EMPRESA_ADAPTA',
  'CLIENTE_FORNECE',
]);

interface ArteResumoOsPanelProps {
  osId: string;
}

export function ArteResumoOsPanel({ osId }: ArteResumoOsPanelProps) {
  const [itens, setItens] = useState<ItemArteOs[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
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
      console.error('Erro ao carregar resumo de arte:', error);
    } finally {
      setLoading(false);
    }
  }, [osId]);

  useEffect(() => {
    setLoading(true);
    void carregar();
  }, [carregar]);

  const handleStatusAtualizado = useCallback(
    (payload: { item_id: string; os_id: string; status_arte: string }) => {
      if (payload.os_id !== osId) return;
      setItens((prev) =>
        prev.map((item) =>
          item.item_id === payload.item_id
            ? { ...item, status_arte: payload.status_arte }
            : item,
        ),
      );
    },
    [osId],
  );

  useArteKanbanSocket({
    habilitado: Boolean(osId),
    onStatusAtualizado: handleStatusAtualizado,
  });

  const itensComArte = useMemo(
    () =>
      itens.filter(
        (i) =>
          i.responsabilidade_arte !== 'NAO_APLICAVEL' ||
          i.status_arte !== 'NAO_APLICA',
      ),
    [itens],
  );

  const pendentes = useMemo(
    () => itensComArte.filter((i) => STATUS_PENDENTES.has(i.status_arte)).length,
    [itensComArte],
  );

  const atualizarPrazoLocal = (itemId: string, data: string | null) => {
    setItens((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, data_prazo_arte: data } : item,
      ),
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando status de arte…
        </CardContent>
      </Card>
    );
  }

  if (itensComArte.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Arte & Aprovação
          </CardTitle>
          <div className="flex gap-2">
            {pendentes > 0 && (
              <Badge variant="secondary">
                {pendentes} pendente{pendentes !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/arte">
                <ExternalLink className="h-4 w-4 mr-2" />
                Fila de arte
              </Link>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Acompanhe o andamento da arte por produto. Use o workspace para enviar
          ou conferir arquivos de produção.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {itensComArte.map((item) => {
          const interno = ARTE_INTERNA.has(item.responsabilidade_arte);
          const comWorkspace = ARTE_COM_WORKSPACE.has(item.responsabilidade_arte);
          const workspaceUrl = `/arte/trabalho/${osId}/${item.item_id}`;

          return (
            <div
              key={item.item_id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1 flex-1">
                  <p className="font-medium text-sm">{item.produto_nome}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {RESPONSABILIDADE_LABEL[item.responsabilidade_arte] ||
                        item.responsabilidade_arte}
                    </Badge>
                    <Badge
                      variant={STATUS_VARIANT[item.status_arte] ?? 'secondary'}
                      className="text-xs"
                    >
                      {STATUS_LABEL[item.status_arte] || item.status_arte}
                    </Badge>
                    {item.designer_atribuido?.nome && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {item.designer_atribuido.nome}
                      </span>
                    )}
                  </div>
                </div>

                {comWorkspace && (
                  <Button size="sm" variant="outline" asChild className="shrink-0">
                    <Link href={workspaceUrl}>
                      {interno ? 'Abrir na fila' : 'Abrir workspace'}
                    </Link>
                  </Button>
                )}
              </div>

              <ArteStatusTracker
                statusArte={item.status_arte}
                responsabilidadeArte={item.responsabilidade_arte}
              />

              {interno && (
                <PrazoArteItemEditor
                  osId={osId}
                  itemId={item.item_id}
                  dataPrazoArte={item.data_prazo_arte}
                  onAtualizado={(data) => atualizarPrazoLocal(item.item_id, data)}
                />
              )}

              {item.arte_producao && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void openArteFilePreview({
                        url_arquivo: item.arte_producao!.url_arquivo,
                        nome_arquivo: item.arte_producao!.nome_arquivo,
                        nome_original: item.arte_producao!.nome_original,
                        versao_id: item.arte_producao!.versao_id,
                        storage_provider: item.arte_producao!.storage_provider,
                      }).catch((err) => {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : 'Erro ao abrir arte',
                        );
                      });
                    }}
                  >
                    <FileImage className="h-4 w-4 mr-2" />
                    Ver arte de produção
                    {item.arte_producao.versao
                      ? ` (${item.arte_producao.versao})`
                      : ''}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
