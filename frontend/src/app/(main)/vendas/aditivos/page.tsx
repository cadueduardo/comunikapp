'use client';

import { useCallback, useEffect, useState } from 'react';
import { getClientSessionToken } from '@/lib/session-auth';
import { toast } from 'sonner';
import { Layers, Loader2, Tag, CheckCircle2 } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ViewToggle } from '@/components/ui/shared/view-toggle';
import { useIsMobile } from '@/hooks/use-media-query';
import { AditivosTable, OcorrenciaAditivo } from '@/components/ui/vendas/aditivos-table';
import { AditivosCards } from '@/components/ui/vendas/aditivos-cards';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function VendasAditivosPage() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [data, setData] = useState<OcorrenciaAditivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemPrecificando, setItemPrecificando] = useState<OcorrenciaAditivo | null>(null);
  const [valorCobrado, setValorCobrado] = useState<string>('');
  const [justificativa, setJustificativa] = useState<string>('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setViewMode('cards');
    }
  }, [isMobile]);

  const carregarOcorrencias = useCallback(async () => {
    setLoading(true);
    try {
      const token = getClientSessionToken();
      if (!token) return;

      const res = await fetch('/api/vendas/aditivos/ocorrencias', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao carregar ocorrências pendentes de aditivo.');
      }

      const list = await res.json();
      setData(list);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar ocorrências de aditivo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarOcorrencias();
  }, [carregarOcorrencias]);

  const handlePrecificarSubmit = async () => {
    if (!itemPrecificando) return;
    const valor = parseFloat(valorCobrado);
    if (isNaN(valor) || valor < 0) {
      toast.error('Informe um valor válido cobrado (maior ou igual a 0).');
      return;
    }

    setProcessando(true);
    try {
      const token = getClientSessionToken();
      if (!token) return;

      const res = await fetch('/api/vendas/aditivos/precificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ocorrencia_id: itemPrecificando.id,
          valor_cobrado: valor,
          justificativa: justificativa.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao precificar ocorrência.');
      }

      toast.success(
        valor === 0
          ? 'Ocorrência abonada com sucesso.'
          : 'Precificação registrada com sucesso.',
      );

      setItemPrecificando(null);
      await carregarOcorrencias();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao precificar ocorrência.';
      toast.error(msg);
    } finally {
      setProcessando(false);
    }
  };

  const handleGerarOsAditiva = async (osPaiId: string, ocorrenciaId: string) => {
    setProcessando(true);
    try {
      const token = getClientSessionToken();
      if (!token) return;

      const res = await fetch('/api/vendas/aditivos/gerar-os-aditiva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          os_pai_id: osPaiId,
          ocorrencia_ids: [ocorrenciaId],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao gerar OS Aditiva.');
      }

      const resultado = await res.json();
      toast.success(
        `OS Aditiva ${resultado.os_aditiva_numero || ''} gerada com sucesso!`,
      );

      await carregarOcorrencias();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar OS Aditiva.';
      toast.error(msg);
    } finally {
      setProcessando(false);
    }
  };

  const effectiveView = isMobile ? 'cards' : viewMode;

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      <ModuleHeader
        title="Aditivos Comerciais & OS Aditiva"
        subtitle="Gestão comercial de ocorrências operacionais e geração de aditivos vinculados"
        icon={<Layers className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />}
        actions={
          !isMobile ? (
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          ) : null
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando ocorrências...</span>
        </div>
      ) : effectiveView === 'table' ? (
        <AditivosTable
          data={data}
          onPrecificar={(item) => {
            setItemPrecificando(item);
            setValorCobrado(item.preco_sugerido ? String(item.preco_sugerido) : '');
            setJustificativa('');
          }}
          onGerarOsAditiva={handleGerarOsAditiva}
        />
      ) : (
        <AditivosCards
          data={data}
          onPrecificar={(item) => {
            setItemPrecificando(item);
            setValorCobrado(item.preco_sugerido ? String(item.preco_sugerido) : '');
            setJustificativa('');
          }}
          onGerarOsAditiva={handleGerarOsAditiva}
        />
      )}

      {/* Dialog de Precificação Comercial */}
      <Dialog open={!!itemPrecificando} onOpenChange={(open) => !open && setItemPrecificando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Precificar Ocorrência — OS {itemPrecificando?.os_numero}
            </DialogTitle>
            <DialogDescription>
              {itemPrecificando?.tipo}: {itemPrecificando?.descricao}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="valor-cobrado">Valor Cobrado Comercial (BRL)</Label>
              <Input
                id="valor-cobrado"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 150.00 (ou 0.00 para abono)"
                value={valorCobrado}
                onChange={(e) => setValorCobrado(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Sugerido operacional: R$ {itemPrecificando?.preco_sugerido?.toFixed(2) ?? '0.00'}.
                Preencha 0.00 para abonar a ocorrência.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa Comercial</Label>
              <Textarea
                id="justificativa"
                placeholder="Motivo da reprecificação ou abono..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemPrecificando(null)} disabled={processando}>
              Cancelar
            </Button>
            <Button onClick={handlePrecificarSubmit} disabled={processando}>
              {processando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Salvar Precificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
