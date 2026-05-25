'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import type { Alerta, NivelAlerta } from '@/lib/home-operacional-api';

/**
 * Card individual de um alerta operacional (Fase 5).
 *
 * Hierarquia visual obrigatoria por nivel:
 * - critico: borda + fundo vermelhos suaves, icone AlertCircle.
 * - atencao: borda + fundo ambar suaves, icone AlertTriangle.
 * - informativo: borda neutra, icone Info.
 *
 * O bloco e somente leitura + atalho - nao ha drag-and-drop nem dismiss
 * por enquanto. Acoes com `endpoint` disparam a chamada direta e o
 * callback `onAcaoConcluida` recarrega o painel.
 */
export interface AlertaCardProps {
  alerta: Alerta;
  onAcaoConcluida?: () => void;
}

interface NivelTema {
  containerCls: string;
  iconCls: string;
  // Marcador de nivel discreto (chip) - so usado para "critico" e "atencao"
  // porque o "informativo" ja se diferencia bastante pelo tom mais neutro.
  pillCls: string;
  pillLabel: string;
  icone: React.ReactNode;
}

const TEMAS: Record<NivelAlerta, NivelTema> = {
  critico: {
    containerCls:
      'border-red-300 bg-red-50/70 hover:bg-red-50 focus-within:ring-red-400',
    iconCls: 'text-red-600',
    pillCls: 'bg-red-100 text-red-700',
    pillLabel: 'Crítico',
    icone: <AlertCircle className="h-4 w-4" />,
  },
  atencao: {
    containerCls:
      'border-amber-300 bg-amber-50/70 hover:bg-amber-50 focus-within:ring-amber-400',
    iconCls: 'text-amber-600',
    pillCls: 'bg-amber-100 text-amber-700',
    pillLabel: 'Atenção',
    icone: <AlertTriangle className="h-4 w-4" />,
  },
  informativo: {
    containerCls:
      'border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 focus-within:ring-zinc-400',
    iconCls: 'text-zinc-600',
    pillCls: 'bg-zinc-100 text-zinc-700',
    pillLabel: 'Informativo',
    icone: <Info className="h-4 w-4" />,
  },
};

function tempoRelativo(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const diffMs = Date.now() - data.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `há ${diffD} d`;
  return data.toLocaleDateString('pt-BR');
}

export function AlertaCard({ alerta, onAcaoConcluida }: AlertaCardProps) {
  const tema = TEMAS[alerta.nivel];
  const [executando, setExecutando] = useState(false);

  async function executarEndpoint() {
    if (!alerta.acao || alerta.acao.tipo !== 'endpoint') return;
    setExecutando(true);
    try {
      const r = await apiRequest(alerta.acao.endpoint, {
        method: alerta.acao.metodo,
      });
      if (!r.ok) {
        const erro = await r.json().catch(() => ({}));
        throw new Error(erro?.message || `Erro HTTP ${r.status}`);
      }
      toast.success(`${alerta.acao.label} concluído.`);
      onAcaoConcluida?.();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : `Falha ao executar "${alerta.acao.label}".`,
      );
    } finally {
      setExecutando(false);
    }
  }

  return (
    <div
      className={`rounded-md border p-3 transition-colors ${tema.containerCls}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 flex-shrink-0 ${tema.iconCls}`}>{tema.icone}</div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug text-foreground">
              {alerta.titulo}
            </p>
            <span
              className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${tema.pillCls}`}
            >
              {tema.pillLabel}
            </span>
          </div>

          {alerta.descricao && (
            <p className="text-xs text-muted-foreground leading-snug">
              {alerta.descricao}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">
              {tempoRelativo(alerta.criado_em)}
            </span>

            {alerta.acao && alerta.acao.tipo === 'link' && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <Link href={alerta.acao.href}>
                  {alerta.acao.label}
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </Button>
            )}

            {alerta.acao && alerta.acao.tipo === 'endpoint' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={executando}
                onClick={() => void executarEndpoint()}
              >
                {executando ? 'Aguarde...' : alerta.acao.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
