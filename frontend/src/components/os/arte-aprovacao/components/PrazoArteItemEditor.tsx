'use client';

import { useState } from 'react';
import { Calendar, Edit3, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PrazoArteItemEditorProps {
  osId: string;
  itemId: string;
  dataPrazoArte?: string | null;
  onAtualizado?: (data: string | null) => void;
  readonly?: boolean;
}

function formatarData(iso: string | null | undefined): string {
  if (!iso) return 'Prazo não definido';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
}

function paraInputDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function PrazoArteItemEditor({
  osId,
  itemId,
  dataPrazoArte,
  onAtualizado,
  readonly = false,
}: PrazoArteItemEditorProps) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(paraInputDate(dataPrazoArte));
  const [salvando, setSalvando] = useState(false);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazoDate = dataPrazoArte ? new Date(dataPrazoArte) : null;
  const atrasado = prazoDate && prazoDate < hoje;

  const salvar = async () => {
    setSalvando(true);
    try {
      const token = localStorage.getItem('access_token');
      const body = valor
        ? { data_prazo_arte: new Date(`${valor}T12:00:00`).toISOString() }
        : { data_prazo_arte: null };

      const res = await fetch(
        `/api/arte-aprovacao/os/${osId}/itens/${itemId}/prazo-arte`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Erro ao salvar prazo');
      }

      onAtualizado?.(json.data?.data_prazo_arte ?? null);
      setEditando(false);
      toast.success('Prazo de arte atualizado');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar prazo de arte',
      );
    } finally {
      setSalvando(false);
    }
  };

  if (editando) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          type="date"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="h-8 w-36 text-xs"
          disabled={salvando}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={salvando}
          onClick={() => void salvar()}
        >
          {salvando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={salvando}
          onClick={() => {
            setValor(paraInputDate(dataPrazoArte));
            setEditando(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          atrasado ? 'text-red-500' : 'text-muted-foreground',
        )}
      />
      <span
        className={cn(
          'text-xs',
          atrasado ? 'text-red-600 font-medium' : 'text-muted-foreground',
        )}
      >
        Prazo arte: {formatarData(dataPrazoArte)}
        {atrasado && ' (atrasado)'}
      </span>
      {!readonly && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => {
            setValor(paraInputDate(dataPrazoArte));
            setEditando(true);
          }}
        >
          <Edit3 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
