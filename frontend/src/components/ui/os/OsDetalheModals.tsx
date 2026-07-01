'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertTriangle, Palette } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface OsDetalheModalsProps {
  osId: string | null;
  osNumero?: string | null;
  tipo: 'liberacao' | 'arte' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OsDetalheModals({
  osId,
  osNumero,
  tipo,
  open,
  onOpenChange,
}: OsDetalheModalsProps) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [liberacao, setLiberacao] = useState<{
    liberados: Array<{ item_id: string; produto_servico: string }>;
    pendentes: Array<{
      item_id: string;
      produto_servico: string;
      motivos: string[];
    }>;
    expedicao: Array<{ item_id: string; produto_servico: string }>;
  } | null>(null);
  const [arte, setArte] = useState<{
    produtos: Array<{
      item_id: string;
      produto_servico: string;
      status_arte_label: string;
      requer_arte: boolean;
    }>;
  } | null>(null);

  useEffect(() => {
    if (!open || !osId || !tipo) {
      setLiberacao(null);
      setArte(null);
      setErro(null);
      return;
    }

    let cancelado = false;

    const carregar = async () => {
      try {
        setCarregando(true);
        setErro(null);
        const path =
          tipo === 'liberacao'
            ? `/os/produtos/${osId}/liberacao-pcp/detalhe`
            : `/os/produtos/${osId}/arte-resumo`;
        const resp = await apiRequest(path);
        if (!resp.ok) {
          throw new Error('Falha ao carregar detalhes');
        }
        const json = await resp.json();
        const data = json.data ?? json;
        if (cancelado) return;
        if (tipo === 'liberacao') {
          setLiberacao({
            liberados: data.liberados ?? [],
            pendentes: data.pendentes ?? [],
            expedicao: data.expedicao ?? [],
          });
        } else {
          setArte({ produtos: data.produtos ?? [] });
        }
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : 'Erro ao carregar');
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [open, osId, tipo]);

  const titulo =
    tipo === 'liberacao'
      ? `Liberação PCP${osNumero ? ` — OS #${osNumero}` : ''}`
      : `Arte por produto${osNumero ? ` — OS #${osNumero}` : ''}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tipo === 'arte' ? (
              <Palette className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {titulo}
          </DialogTitle>
          <DialogDescription>
            {tipo === 'liberacao'
              ? 'Produtos liberados para produção (PCP), pendentes de fábrica e itens de expedição/estoque.'
              : 'Status de arte de cada produto desta OS.'}
          </DialogDescription>
        </DialogHeader>

        {carregando && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        )}

        {erro && (
          <div className="text-sm text-destructive py-2">{erro}</div>
        )}

        {!carregando && !erro && tipo === 'liberacao' && liberacao && (
          <div className="space-y-4 text-sm">
            {liberacao.liberados.length > 0 && (
              <div>
                <p className="font-medium text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Liberados ({liberacao.liberados.length})
                </p>
                <ul className="space-y-1">
                  {liberacao.liberados.map((p) => (
                    <li
                      key={p.item_id}
                      className="rounded border border-green-100 bg-green-50 px-2 py-1.5"
                    >
                      {p.produto_servico}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {liberacao.pendentes.length > 0 && (
              <div>
                <p className="font-medium text-amber-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Pendentes PCP ({liberacao.pendentes.length})
                </p>
                <ul className="space-y-2">
                  {liberacao.pendentes.map((p) => (
                    <li
                      key={p.item_id}
                      className="rounded border border-amber-100 bg-amber-50 px-2 py-1.5"
                    >
                      <div className="font-medium">{p.produto_servico}</div>
                      <ul className="mt-1 text-xs text-muted-foreground list-disc pl-4">
                        {p.motivos.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {liberacao.expedicao.length > 0 && (
              <div>
                <p className="font-medium text-muted-foreground mb-2">
                  Expedição / estoque ({liberacao.expedicao.length})
                </p>
                <ul className="space-y-1">
                  {liberacao.expedicao.map((p) => (
                    <li
                      key={p.item_id}
                      className="rounded border border-muted bg-muted/30 px-2 py-1.5"
                    >
                      {p.produto_servico}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!carregando && !erro && tipo === 'arte' && arte && (
          <ul className="space-y-2 text-sm">
            {arte.produtos.map((p) => (
              <li
                key={p.item_id}
                className="flex items-center justify-between gap-2 rounded border px-2 py-1.5"
              >
                <span>{p.produto_servico}</span>
                <Badge variant={p.requer_arte ? 'outline' : 'secondary'}>
                  {p.status_arte_label}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
