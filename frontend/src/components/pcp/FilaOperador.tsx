'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconAlertTriangle,
  IconClock,
  IconExternalLink,
  IconPlayerPause,
  IconPlayerPlay,
  IconCheck,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { WorkflowCardInfo } from '@/components/pcp/WorkflowCardInfo';
import type { ItemFila } from '@/hooks/useMeuSetor';
import { IniciarProducaoMaquinaDialog } from '@/components/pcp/IniciarProducaoMaquinaDialog';

export interface FilaOperadorProps {
  fila: ItemFila[];
  loading?: boolean;
  setorAtualId: string;
  setoresDestino?: Array<{ id: string; nome: string }>;
  onIniciarProducao: (
    itemId: string,
    observacoes?: string,
    maquinaId?: string,
  ) => Promise<void>;
  onConcluirEtapa: (
    itemId: string,
    observacoes?: string,
    quantidadeProduzida?: number,
  ) => Promise<void>;
  onPausarProducao: (
    itemId: string,
    motivo: string,
    observacoes?: string,
  ) => Promise<void>;
  onMoverItem?: (itemId: string, setorDestinoId: string) => Promise<void>;
  onAbrirOs?: (osId: string) => void;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDENTE: 'Na fila',
    EM_ANDAMENTO: 'Em andamento',
    PAUSADA: 'Pausado',
    CONCLUIDA: 'Concluído',
  };

  return labels[status] ?? status;
}

function prioridadeClassName(prioridade: ItemFila['prioridade']): string {
  const classes: Record<ItemFila['prioridade'], string> = {
    URGENTE: 'border-fuchsia-200 text-fuchsia-700',
    BAIXA: 'border-zinc-200 text-zinc-700',
    MEDIA: 'border-blue-200 text-blue-700',
    NORMAL: 'border-slate-200 text-slate-700',
    ALTA: 'border-amber-200 text-amber-700',
    CRITICA: 'border-red-200 text-red-700',
  };

  return classes[prioridade] ?? 'border-slate-200 text-slate-700';
}

export function FilaOperador({
  fila,
  loading = false,
  setorAtualId,
  setoresDestino = [],
  onIniciarProducao,
  onConcluirEtapa,
  onPausarProducao,
  onMoverItem,
  onAbrirOs,
}: FilaOperadorProps) {
  const [acaoItemId, setAcaoItemId] = useState<string | null>(null);
  const [dialogMaquina, setDialogMaquina] = useState<{
    itemId: string;
    titulo: string;
  } | null>(null);

  async function executarAcao(
    itemId: string,
    acao: () => Promise<void>,
  ): Promise<void> {
    setAcaoItemId(itemId);
    try {
      await acao();
    } finally {
      setAcaoItemId(null);
    }
  }

  function solicitarInicio(item: ItemFila) {
    if (item.maquina_prevista?.id) {
      void executarAcao(item.id, () => onIniciarProducao(item.id));
      return;
    }
    setDialogMaquina({ itemId: item.id, titulo: item.titulo });
  }

  if (loading && fila.length === 0) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (fila.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        <p>Nenhum item na fila deste setor.</p>
        <p className="mt-1 text-xs">
          Itens aparecem aqui após o workflow ser atribuído e liberados neste setor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fila.map((item) => {
        const executando = acaoItemId === item.id;
        const atrasado =
          !!item.data_prazo &&
          new Date(item.data_prazo) < new Date() &&
          item.status !== 'CONCLUIDA';
        const destinosMovimento = setoresDestino.filter((setor) => {
          if (setor.id === setorAtualId) {
            return false;
          }
          if (item.proximos_setores_ids?.length) {
            return item.proximos_setores_ids.includes(setor.id);
          }
          return true;
        });

        return (
          <article
            key={item.id}
            className={cn(
              'rounded-md border bg-background p-3 shadow-sm',
              atrasado && 'border-orange-300 bg-orange-50/40',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{item.numero}</span>
                  <Badge variant="outline" className={prioridadeClassName(item.prioridade)}>
                    {item.prioridade}
                  </Badge>
                  <Badge variant="secondary">{statusLabel(item.status)}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{item.titulo}</p>
                <p className="text-xs text-muted-foreground">{item.cliente}</p>
              </div>

              {item.os_id && onAbrirOs && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => onAbrirOs(item.os_id!)}
                >
                  <IconExternalLink className="mr-1 h-3.5 w-3.5" />
                  OS
                </Button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <IconClock className="h-3.5 w-3.5" />
                {item.data_prazo || 'Sem prazo'}
              </span>
              {Number(item.tempo_previsto_min ?? 0) > 0 && (
                <span>
                  Tempo previsto: {formatarTempoPrevisto(item.tempo_previsto_min)}
                </span>
              )}
              {item.maquina_prevista && (
                <span>
                  Maquina: {item.maquina_prevista.nome || item.maquina_prevista.id}
                </span>
              )}
              {item.operador_atual && (
                <span>Operador: {item.operador_atual}</span>
              )}
              {atrasado && (
                <span className="inline-flex items-center gap-1 font-medium text-orange-700">
                  <IconAlertTriangle className="h-3.5 w-3.5" />
                  Atrasado
                </span>
              )}
            </div>

            {item.workflow_nome && (
              <div className="mt-2">
                <WorkflowCardInfo
                  compact
                  workflowId={item.workflow_id}
                  workflowNome={item.workflow_nome}
                  setoresNomes={item.workflow_setores_nomes}
                />
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {item.status === 'PENDENTE' && (
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  disabled={executando}
                  onClick={() => solicitarInicio(item)}
                >
                  <IconPlayerPlay className="mr-1 h-3.5 w-3.5" />
                  Iniciar
                </Button>
              )}

              {item.status === 'PAUSADA' && (
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  disabled={executando}
                  onClick={() => solicitarInicio(item)}
                >
                  <IconPlayerPlay className="mr-1 h-3.5 w-3.5" />
                  Retomar
                </Button>
              )}

              {item.status === 'EM_ANDAMENTO' && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    disabled={executando}
                    onClick={() =>
                      void executarAcao(item.id, () => onConcluirEtapa(item.id))
                    }
                  >
                    <IconCheck className="mr-1 h-3.5 w-3.5" />
                    Concluir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={executando}
                    onClick={() => {
                      const motivo = window.prompt('Motivo da pausa:');
                      if (!motivo?.trim()) return;
                      void executarAcao(item.id, () =>
                        onPausarProducao(item.id, motivo.trim()),
                      );
                    }}
                  >
                    <IconPlayerPause className="mr-1 h-3.5 w-3.5" />
                    Pausar
                  </Button>
                </>
              )}

              {onMoverItem && destinosMovimento.length > 0 && (
                <select
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                  defaultValue=""
                  disabled={executando}
                  onChange={(event) => {
                    const select = event.currentTarget;
                    const setorDestinoId = select.value;
                    if (!setorDestinoId) return;
                    select.value = '';
                    void executarAcao(item.id, () =>
                      onMoverItem!(
                        item.instancia_setor_id ?? item.id,
                        setorDestinoId,
                      ),
                    );
                  }}
                >
                  <option value="">Mover para setor...</option>
                  {destinosMovimento.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {item.os_id && !onAbrirOs && (
              <div className="mt-2">
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                  <Link href={`/os/${item.os_id}`}>Abrir OS</Link>
                </Button>
              </div>
            )}
          </article>
        );
      })}

      <IniciarProducaoMaquinaDialog
        open={dialogMaquina != null}
        onOpenChange={(open) => !open && setDialogMaquina(null)}
        setorId={setorAtualId}
        itemTitulo={dialogMaquina?.titulo}
        onConfirm={async (maquinaId) => {
          if (!dialogMaquina) return;
          await executarAcao(dialogMaquina.itemId, () =>
            onIniciarProducao(dialogMaquina.itemId, undefined, maquinaId),
          );
        }}
      />
    </div>
  );
}

function formatarTempoPrevisto(minutos?: number): string {
  const total = Number(minutos ?? 0);
  if (!Number.isFinite(total) || total <= 0) {
    return '-';
  }

  const horas = Math.floor(total / 60);
  const restante = Math.round(total % 60);
  if (horas <= 0) {
    return `${restante}min`;
  }
  if (restante <= 0) {
    return `${horas}h`;
  }
  return `${horas}h ${restante}min`;
}
