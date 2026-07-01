'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstalacaoLoteDetalhePanel } from '@/components/instalacao/InstalacaoLoteDetalhePanel';
import { InstalacaoOsKanbanBoard } from '@/components/instalacao/InstalacaoOsKanbanBoard';
import { NovoLoteDialog } from '@/components/instalacao/NovoLoteDialog';
import { OcorrenciaRapidaDialog } from '@/components/instalacao/OcorrenciaRapidaDialog';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import type {
  LotePainelOs,
  PainelOsInstalacao,
} from '@/lib/instalacao/instalacao.types';
import { IconLoader2, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';

interface InstalacaoWorkspacePanelProps {
  osId: string;
  onMutacao?: () => void;
}

/**
 * Workspace de instalação (módulo /instalacao).
 * UX-06: 1 lote → detalhe direto; múltiplos lotes → Kanban interno com drill-down.
 */
export function InstalacaoWorkspacePanel({
  osId,
  onMutacao,
}: InstalacaoWorkspacePanelProps) {
  const [painel, setPainel] = useState<PainelOsInstalacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [loteSelecionadoId, setLoteSelecionadoId] = useState<string | null>(
    null,
  );

  const onMutacaoRef = useRef(onMutacao);
  onMutacaoRef.current = onMutacao;

  const notificarMutacao = useCallback(() => {
    onMutacaoRef.current?.();
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const painelData = await instalacaoApi.obterPainelOs(osId);
      setPainel(painelData);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao carregar instalação',
      );
    } finally {
      setCarregando(false);
    }
  }, [osId]);

  useEffect(() => {
    setLoteSelecionadoId(null);
    void carregar();
  }, [osId, carregar]);

  async function handleCriarLote(
    dados: Parameters<typeof instalacaoApi.criarLote>[0],
  ) {
    await instalacaoApi.criarLote(dados);
    toast.success('Lote de instalação criado.');
    await carregar();
    notificarMutacao();
  }

  async function handleRegistrarOcorrencia(dados: {
    os_id: string;
    item_instalacao_id?: string;
    tipo: string;
    descricao: string;
    fotos_evidencia?: string[];
  }) {
    await instalacaoApi.registrarOcorrencia(dados);
    toast.success('Ocorrência registrada.');
    await carregar();
    notificarMutacao();
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando workspace de instalação...
      </div>
    );
  }

  if (!painel) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Não foi possível carregar os dados de instalação desta OS.
        </CardContent>
      </Card>
    );
  }

  const itensSaldo = painel.itens_saldo ?? [];
  const quantidadePendenteAlocacao = itensSaldo.reduce(
    (acc, item) => acc + item.saldo_disponivel,
    0,
  );
  const totalLotes = painel.lotes.length;
  const instalacaoSimples = totalLotes === 1;
  const instalacaoComplexa = totalLotes > 1;

  const loteSelecionado: LotePainelOs | null =
    loteSelecionadoId != null
      ? (painel.lotes.find((l) => l.id === loteSelecionadoId) ?? null)
      : instalacaoSimples
        ? (painel.lotes[0] ?? null)
        : null;

  const exibirKanban = instalacaoComplexa && !loteSelecionado;
  const exibirDetalhe = Boolean(loteSelecionado);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 overflow-hidden">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">
            Execução em campo
          </h3>
          <p className="text-sm text-muted-foreground">
            {instalacaoSimples
              ? 'Instalação simples — um único endereço nesta OS.'
              : instalacaoComplexa
                ? `${totalLotes} lotes — gerencie cada frente de trabalho no quadro abaixo.`
                : 'Nenhum lote vinculado — aloque endereços para iniciar a execução.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void carregar()}
          >
            <IconRefresh className="mr-1.5 h-4 w-4" />
            Atualizar
          </Button>
          <OcorrenciaRapidaDialog
            osId={osId}
            painel={painel}
            onRegistrar={handleRegistrarOcorrencia}
            onUpload={(arquivo) => instalacaoApi.uploadAnexo(arquivo)}
          />
          {quantidadePendenteAlocacao > 0 && (
            <NovoLoteDialog
              itensSaldo={itensSaldo}
              buscarCep={(cep) => instalacaoApi.buscarCep(cep)}
              onCriar={handleCriarLote}
            />
          )}
        </div>
      </div>

      {itensSaldo.length > 0 && quantidadePendenteAlocacao > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Quantidade pendente de alocação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {itensSaldo.map((item) => (
              <div
                key={item.item_os_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="min-w-0 text-foreground">
                  {item.produto_servico ?? 'Produto'}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    {item.saldo_disponivel}
                  </span>
                  {' / '}
                  {item.quantidade_total} un. sem endereço de lote
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalLotes === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum lote de instalação vinculado a esta OS.
            {quantidadePendenteAlocacao > 0 && (
              <span className="mt-1 block">
                Use &quot;Novo lote&quot; para alocar endereços e quantidades.
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {exibirKanban && (
        <div className="min-w-0 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Quadro de lotes
          </h4>
          <InstalacaoOsKanbanBoard
            lotes={painel.lotes}
            onLoteSelecionado={(lote) => setLoteSelecionadoId(lote.id)}
            onAtualizado={async () => {
              await carregar();
              notificarMutacao();
            }}
          />
        </div>
      )}

      {exibirDetalhe && loteSelecionado && (
        <InstalacaoLoteDetalhePanel
          lote={loteSelecionado}
          onVoltar={
            instalacaoComplexa
              ? () => setLoteSelecionadoId(null)
              : undefined
          }
        />
      )}
    </div>
  );
}
