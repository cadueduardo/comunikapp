'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import type { Alerta, NivelAlerta } from '@/lib/home-operacional-api';
import { alertSurfaceThemes } from '@/lib/theme-surfaces';

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

const ALERTA_ICONES: Record<NivelAlerta, React.ReactNode> = {
  critico: <AlertCircle className="h-4 w-4" />,
  atencao: <AlertTriangle className="h-4 w-4" />,
  informativo: <Info className="h-4 w-4" />,
};

const ALERTA_LABELS: Record<NivelAlerta, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  informativo: 'Informativo',
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
  const tema = alertSurfaceThemes[alerta.nivel];
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
        <div className={`mt-0.5 flex-shrink-0 ${tema.iconCls}`}>
          {ALERTA_ICONES[alerta.nivel]}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug text-foreground">
              {alerta.titulo}
            </p>
            <span
              className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${tema.pillCls}`}
            >
              {ALERTA_LABELS[alerta.nivel]}
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
