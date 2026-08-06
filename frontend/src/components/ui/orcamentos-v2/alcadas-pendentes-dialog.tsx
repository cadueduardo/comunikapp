'use client';

import { useCallback, useEffect, useState } from 'react';
import { getClientSessionToken } from '@/lib/session-auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Loader2, XCircle } from 'lucide-react';

export interface SolicitacaoAlcada {
  id: string;
  numero: string;
  nome_servico: string;
  cliente_nome: string;
  preco_base: number;
  preco_final: number;
  desconto_percentual: number;
  criado_em: string;
  status_comercial: string;
}

interface AlcadasPendentesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AlcadasPendentesDialog({
  open,
  onOpenChange,
  onSuccess,
}: AlcadasPendentesDialogProps) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAlcada[]>([]);
  const [loading, setLoading] = useState(false);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState<SolicitacaoAlcada | null>(null);

  const carregarSolicitacoes = useCallback(async () => {
    setLoading(true);
    try {
      const token = getClientSessionToken();
      if (!token) return;

      const res = await fetch('/api/orcamentos-v2/alcadas-pendentes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Sem permissão, rota ausente ou falha transitória: UI vazia, sem ruído.
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          setSolicitacoes([]);
          return;
        }
        throw new Error('Falha ao carregar solicitações de alçada.');
      }

      const data = await res.json();
      setSolicitacoes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSolicitacoes([]);
      toast.error('Erro ao carregar solicitações de alçada.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      carregarSolicitacoes();
      setJustificativa('');
      setItemSelecionado(null);
    }
  }, [open, carregarSolicitacoes]);

  const handleDecidir = async (aprovar: boolean) => {
    if (!itemSelecionado) return;
    if (!justificativa.trim() || justificativa.trim().length < 3) {
      toast.error('Informe uma justificativa válida com no mínimo 3 caracteres.');
      return;
    }

    setProcessandoId(itemSelecionado.id);
    try {
      const token = getClientSessionToken();
      if (!token) return;

      const res = await fetch(
        `/api/orcamentos-v2/${itemSelecionado.id}/alcada/decidir`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            aprovar,
            justificativa: justificativa.trim(),
          }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao processar decisão de alçada.');
      }

      toast.success(
        aprovar
          ? `Alçada do orçamento ${itemSelecionado.numero} APROVADA.`
          : `Alçada do orçamento ${itemSelecionado.numero} REJEITADA.`,
      );

      setItemSelecionado(null);
      setJustificativa('');
      await carregarSolicitacoes();
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao decidir alçada.';
      toast.error(msg);
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alçadas Comerciais Pendentes
          </DialogTitle>
          <DialogDescription>
            Avalie e decida sobre propostas cujo desconto excede a alçada permitida do vendedor.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando solicitações...</span>
          </div>
        ) : solicitacoes.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma solicitação de alçada comercial pendente.
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {solicitacoes.map((item) => {
              const isSelected = itemSelecionado?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{item.nome_servico}</span>
                        <Badge variant="outline">{item.numero}</Badge>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          Desconto: {item.desconto_percentual}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cliente: <span className="font-medium text-foreground">{item.cliente_nome}</span>
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-xs text-muted-foreground line-through">
                        Base: {formatCurrency(item.preco_base)}
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        Final: {formatCurrency(item.preco_final)}
                      </div>
                    </div>
                  </div>

                  {!isSelected ? (
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setItemSelecionado(item);
                          setJustificativa('');
                        }}
                      >
                        Analisar Solicitação
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 border-t pt-3 space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor={`justificativa-${item.id}`} className="text-xs font-semibold">
                          Justificativa Comercial do Gestor (Obrigatória)
                        </Label>
                        <Textarea
                          id={`justificativa-${item.id}`}
                          placeholder="Informe o motivo da aprovação ou rejeição do desconto..."
                          value={justificativa}
                          onChange={(e) => setJustificativa(e.target.value)}
                          className="text-xs"
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setItemSelecionado(null)}
                          disabled={processandoId === item.id}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDecidir(false)}
                          disabled={processandoId === item.id}
                        >
                          {processandoId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                          onClick={() => handleDecidir(true)}
                          disabled={processandoId === item.id}
                        >
                          {processandoId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
