'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { InstalacaoLoteDetalhePanel } from '@/components/instalacao/InstalacaoLoteDetalhePanel';
import { InstalacaoOsKanbanBoard } from '@/components/instalacao/InstalacaoOsKanbanBoard';
import { NovoLoteDialog } from '@/components/instalacao/NovoLoteDialog';
import { OcorrenciaRapidaDialog } from '@/components/instalacao/OcorrenciaRapidaDialog';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import {
  calcularIntervaloConflitosLotes,
  extrairLotesEmConflito,
} from '@/lib/instalacao/instalacao-calendario.utils';
import { montarEnderecoResumido } from '@/lib/instalacao/instalacao-lote-utils';
import type {
  LotePainelOs,
  PainelOsInstalacao,
  EnderecoLoteForm,
} from '@/lib/instalacao/instalacao.types';
import { montarPayloadAgendaLote } from '@/lib/instalacao/instalacao.types';
import { INSTALACAO_LOTE_DETALHE_DIALOG_CLASS } from '@/lib/instalacao/instalacao-modal-classes';
import { IconLoader2, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';

interface InstalacaoWorkspacePanelProps {
  osId: string;
  onMutacao?: () => void;
  loteInicialId?: string | null;
  abrirEdicaoInicial?: boolean;
  onLoteInicialConsumido?: () => void;
}

export interface InstalacaoWorkspacePanelHandle {
  /** Fecha edição do lote ou volta ao kanban antes de fechar o workspace. */
  voltarUmNivel: () => boolean;
}

/**
 * Workspace de instalação (módulo /instalacao).
 * UX-06: 1 lote → detalhe direto; múltiplos lotes → Kanban interno com drill-down.
 */
export const InstalacaoWorkspacePanel = forwardRef<
  InstalacaoWorkspacePanelHandle,
  InstalacaoWorkspacePanelProps
>(function InstalacaoWorkspacePanel(
  {
    osId,
    onMutacao,
    loteInicialId,
    abrirEdicaoInicial = false,
    onLoteInicialConsumido,
  },
  ref,
) {
  const [painel, setPainel] = useState<PainelOsInstalacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [lotesEmConflito, setLotesEmConflito] = useState<Set<string>>(new Set());
  const [loteSelecionadoId, setLoteSelecionadoId] = useState<string | null>(
    null,
  );
  const [edicaoLoteAberta, setEdicaoLoteAberta] = useState(false);

  const totalLotesRef = useRef(0);
  const instalacaoComplexaRef = useRef(false);

  const fecharDetalheLote = useCallback(() => {
    setEdicaoLoteAberta(false);
    setLoteSelecionadoId(null);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      voltarUmNivel: () => {
        if (edicaoLoteAberta) {
          setEdicaoLoteAberta(false);
          return true;
        }
        if (loteSelecionadoId && instalacaoComplexaRef.current) {
          fecharDetalheLote();
          return true;
        }
        return false;
      },
    }),
    [edicaoLoteAberta, loteSelecionadoId, fecharDetalheLote],
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

      const intervalo = calcularIntervaloConflitosLotes(painelData.lotes);
      if (intervalo) {
        try {
          const conflitosResposta =
            await instalacaoApi.consultarConflitosAgenda(intervalo);
          setLotesEmConflito(
            extrairLotesEmConflito(conflitosResposta.conflitos),
          );
        } catch {
          setLotesEmConflito(new Set());
        }
      } else {
        setLotesEmConflito(new Set());
      }
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
    setEdicaoLoteAberta(false);
    void carregar();
  }, [osId, carregar]);

  useEffect(() => {
    if (!loteInicialId || carregando || !painel) return;
    const existe = painel.lotes.some((l) => l.id === loteInicialId);
    if (!existe) return;
    setLoteSelecionadoId(loteInicialId);
    if (abrirEdicaoInicial) {
      setEdicaoLoteAberta(true);
    }
    onLoteInicialConsumido?.();
  }, [
    loteInicialId,
    abrirEdicaoInicial,
    carregando,
    painel,
    onLoteInicialConsumido,
  ]);

  async function handleCriarLote(
    dados: Parameters<typeof instalacaoApi.criarLote>[0],
  ) {
    await instalacaoApi.criarLote(dados);
    toast.success('Lote de instalação criado.');
    await carregar();
    notificarMutacao();
  }

  async function handleAtualizarLote(
    loteId: string,
    dados: EnderecoLoteForm,
  ) {
    await instalacaoApi.atualizarLote(loteId, {
      cep: dados.cep,
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento || undefined,
      bairro: dados.bairro,
      cidade: dados.cidade,
      uf: dados.uf,
      quantidade_alocada: dados.quantidade_alocada,
      ...montarPayloadAgendaLote(dados),
    });
    toast.success('Endereço do lote atualizado.');
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
  totalLotesRef.current = totalLotes;
  instalacaoComplexaRef.current = instalacaoComplexa;

  const loteSelecionado: LotePainelOs | null =
    loteSelecionadoId != null
      ? (painel.lotes.find((l) => l.id === loteSelecionadoId) ?? null)
      : instalacaoSimples
        ? (painel.lotes[0] ?? null)
        : null;

  const exibirKanban = instalacaoComplexa;
  const exibirDetalheInline = instalacaoSimples && Boolean(loteSelecionado);
  const exibirDetalheModal = instalacaoComplexa && Boolean(loteSelecionado);
  const podeCriarLote =
    itensSaldo.length > 0 && quantidadePendenteAlocacao > 0;

  function resolverQuantidadeMaximaEdicao(lote: LotePainelOs): number {
    const itemSaldo = itensSaldo.find(
      (item) => item.item_os_id === lote.item_os_id,
    );
    return (
      (itemSaldo?.saldo_disponivel ?? 0) + (lote.quantidade_alocada ?? 0)
    );
  }

  function renderPainelLoteDetalhe(lote: LotePainelOs) {
    return (
      <InstalacaoLoteDetalhePanel
        lote={lote}
        ocorrencias={painel.ocorrencias.filter(
          (occ) => occ.item_instalacao?.id === lote.id,
        )}
        buscarCep={(cep) => instalacaoApi.buscarCep(cep)}
        onEditarEndereco={(dados) => handleAtualizarLote(lote.id, dados)}
        quantidadeMaximaEdicao={resolverQuantidadeMaximaEdicao(lote)}
        onUploadAnexo={(arquivo) => instalacaoApi.uploadAnexo(arquivo)}
        onAprovarConclusao={async (dados) => {
          await instalacaoApi.aprovarConclusaoLoteGestao(lote.id, dados);
          toast.success('Conclusão do lote aprovada pela gestão.');
          await carregar();
          notificarMutacao();
        }}
        onVoltar={instalacaoComplexa ? fecharDetalheLote : undefined}
        edicaoAberta={edicaoLoteAberta}
        onEdicaoAbertaChange={setEdicaoLoteAberta}
        osId={osId}
        painelOs={painel}
        onRegistrarOcorrencia={handleRegistrarOcorrencia}
      />
    );
  }

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
            loteIdFixo={loteSelecionado?.id}
            loteRotuloFixo={
              loteSelecionado
                ? montarEnderecoResumido(loteSelecionado)
                : undefined
            }
          />
          {podeCriarLote && (
            <NovoLoteDialog
              itensSaldo={itensSaldo}
              buscarCep={(cep) => instalacaoApi.buscarCep(cep)}
              onCriar={handleCriarLote}
            />
          )}
        </div>
      </div>

      {itensSaldo.length > 0 && quantidadePendenteAlocacao === 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="p-4 text-sm text-foreground">
            Quantidade total já distribuída em lotes. Use{' '}
            <strong>Editar endereço</strong> em cada lote para confirmar ou
            corrigir o local de instalação.
          </CardContent>
        </Card>
      )}

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              Quadro de lotes
            </h4>
            {podeCriarLote && (
              <NovoLoteDialog
                itensSaldo={itensSaldo}
                buscarCep={(cep) => instalacaoApi.buscarCep(cep)}
                onCriar={handleCriarLote}
              />
            )}
          </div>
          <InstalacaoOsKanbanBoard
            lotes={painel.lotes}
            lotesEmConflito={lotesEmConflito}
            onLoteSelecionado={(lote) => setLoteSelecionadoId(lote.id)}
            onAtualizado={async () => {
              await carregar();
              notificarMutacao();
            }}
          />
        </div>
      )}

      {exibirDetalheInline && loteSelecionado && renderPainelLoteDetalhe(loteSelecionado)}

      {exibirDetalheModal && loteSelecionado && (
        <Dialog
          open
          onOpenChange={(aberto) => {
            if (!aberto) fecharDetalheLote();
          }}
        >
          <DialogContent
            className={INSTALACAO_LOTE_DETALHE_DIALOG_CLASS}
            onInteractOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              if (edicaoLoteAberta) {
                setEdicaoLoteAberta(false);
              } else {
                fecharDetalheLote();
              }
            }}
          >
            <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
              <DialogTitle className="text-left text-base font-semibold">
                Execução do lote
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {montarEnderecoResumido(loteSelecionado)}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {renderPainelLoteDetalhe(loteSelecionado)}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});
