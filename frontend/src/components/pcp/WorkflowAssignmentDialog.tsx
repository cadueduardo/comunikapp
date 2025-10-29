import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  IconAlertTriangle,
  IconBulb,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkflowTemplate {
  id: string;
  nome: string;
  descricao?: string;
  etapas?: unknown[];
  ativo: boolean;
  sequencial: boolean;
}

interface WorkflowSuggestion {
  workflowId: string;
  categoriaId?: string;
  score: number;
  motivos: string[];
}

interface WorkflowAssignmentResponse {
  workflowId: string;
  categoriaId?: string;
  instanciaId: string;
  mensagem: string;
}

interface ProdutoStatus {
  item_id: string;
  produto_servico: string;
  status_liberacao_pcp: string;
  data_prazo_produto?: string;
  prioridade_produto?: string;
  mensagem?: string;
  workflow_atribuido?: boolean;
}

interface WorkflowAssignmentDialogProps {
  open: boolean;
  osId?: string;
  osNumero?: string;
  onClose: () => void;
  onAssigned?: (result: WorkflowAssignmentResponse) => void;
}

export function WorkflowAssignmentDialog({
  open,
  osId,
  osNumero,
  onClose,
  onAssigned,
}: WorkflowAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [suggestion, setSuggestion] = useState<WorkflowSuggestion | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [forcar, setForcar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [produtos, setProdutos] = useState<ProdutoStatus[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSuggestion(null);
      setWorkflows([]);
      setSelectedWorkflowId(null);
      setProdutos([]);
      setSelectedProductIds([]);
      setForcar(false);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !osId) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setProdutos([]);
        setSelectedProductIds([]);

        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Token de autenticacao nao encontrado.');
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [
          sugestaoResponse,
          templatesResponse,
          produtosResponse,
        ] = await Promise.all([
          fetch(`/api/pcp/workflows/sugestao/${osId}`, { headers }),
          fetch('/api/pcp/workflow-templates', { headers }),
          fetch(`/api/os/produtos/${osId}/status-produtos`, { headers }),
        ]);

        let workflowInicial: string | null = null;

        const parseJsonSafely = async <T,>(response: Response): Promise<T | null> => {
          if (response.status === 204) {
            return null;
          }
          try {
            return (await response.json()) as T;
          } catch (err) {
            console.warn(
              '[WorkflowAssignmentDialog] Falha ao interpretar resposta JSON:',
              err,
            );
            return null;
          }
        };

        if (sugestaoResponse.ok) {
          const suggestionData = await parseJsonSafely<WorkflowSuggestion>(sugestaoResponse);
          setSuggestion(suggestionData);
          workflowInicial = suggestionData?.workflowId ?? null;
        } else {
          setSuggestion(null);
        }

        if (templatesResponse.ok) {
          const templatesData = await parseJsonSafely<WorkflowTemplate[]>(templatesResponse);
          const listaTemplates = Array.isArray(templatesData)
            ? templatesData
            : [];
          setWorkflows(listaTemplates);
          if (!workflowInicial && listaTemplates.length) {
            workflowInicial = listaTemplates[0].id;
          }
        } else {
          throw new Error('Erro ao carregar workflows disponiveis.');
        }

        setSelectedWorkflowId(workflowInicial);

        if (produtosResponse.ok) {
          let listaProdutos: ProdutoStatus[] = [];

          if (produtosResponse.status !== 204) {
            const produtosData = await parseJsonSafely<{
              data?: { produtos?: ProdutoStatus[] };
              produtos?: ProdutoStatus[];
            }>(produtosResponse);

            const candidatos =
              produtosData?.data?.produtos ?? produtosData?.produtos;

            listaProdutos = Array.isArray(candidatos) ? candidatos : [];
          }

          setProdutos(listaProdutos);

          if (listaProdutos.length) {
            const liberadosDisponiveis = listaProdutos
              .filter(
                (produto) =>
                  (produto.status_liberacao_pcp ?? '').toUpperCase() ===
                    'LIBERADO' && !produto.workflow_atribuido,
              )
              .map((produto) => produto.item_id)
              .filter((id): id is string => Boolean(id));
            setSelectedProductIds(liberadosDisponiveis);
          } else {
            setSelectedProductIds([]);
          }
        } else if (produtosResponse.status === 404) {
          setProdutos([]);
          setSelectedProductIds([]);
        } else {
          const textoErro = await produtosResponse.text().catch(() => '');
          throw new Error(
            `Erro ao carregar produtos liberados (HTTP ${produtosResponse.status}): ${textoErro}`,
          );
        }
      } catch (loadError: unknown) {
        console.error('Erro ao carregar dados para sugestao de workflow:', loadError);
        toast.error(
          loadError instanceof Error
            ? loadError.message
            : 'Erro ao carregar opcoes de workflow.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, osId]);

  const liberadosDisponiveis = useMemo(
    () =>
      produtos.filter((produto) => {
        const status = (produto.status_liberacao_pcp ?? '').toUpperCase();
        if (status !== 'LIBERADO') {
          return false;
        }
        if (forcar) {
          return true;
        }
        return !produto.workflow_atribuido;
      }).length,
    [produtos, forcar],
  );

  const todosLiberadosSelecionados = useMemo(() => {
    const liberadosIds = produtos
      .filter((produto) => {
        const status = (produto.status_liberacao_pcp ?? '').toUpperCase();
        if (status !== 'LIBERADO') {
          return false;
        }
        if (forcar) {
          return true;
        }
        return !produto.workflow_atribuido;
      })
      .map((produto) => produto.item_id);

    if (!liberadosIds.length) {
      return false;
    }

    return liberadosIds.every((id) => selectedProductIds.includes(id));
  }, [produtos, selectedProductIds, forcar]);

  const handleToggleItem = useCallback(
    (itemId: string, checked: boolean) => {
      if (!itemId) {
        return;
      }
      const produto = produtos.find((item) => item.item_id === itemId);
      const status = (produto?.status_liberacao_pcp ?? '').toUpperCase();
      const podeSelecionar =
        status === 'LIBERADO' && (forcar || !produto?.workflow_atribuido);

      if (!podeSelecionar) {
        return;
      }

      setSelectedProductIds((prev) => {
        if (checked) {
          return prev.includes(itemId) ? prev : [...prev, itemId];
        }
        return prev.filter((id) => id !== itemId);
      });
    },
    [produtos, forcar],
  );

  const handleToggleAll = useCallback(() => {
    const liberadosIds = produtos
      .filter((produto) => {
        const status = (produto.status_liberacao_pcp ?? '').toUpperCase();
        if (status !== 'LIBERADO') {
          return false;
        }
        if (forcar) {
          return true;
        }
        return !produto.workflow_atribuido;
      })
      .map((produto) => produto.item_id)
      .filter((id): id is string => Boolean(id));

    if (!liberadosIds.length) {
      return;
    }

    if (todosLiberadosSelecionados) {
      setSelectedProductIds((prev) =>
        prev.filter((id) => !liberadosIds.includes(id)),
      );
    } else {
      setSelectedProductIds((prev) =>
        Array.from(new Set([...prev, ...liberadosIds])),
      );
    }
  }, [produtos, todosLiberadosSelecionados, forcar]);

  useEffect(() => {
    if (!forcar) {
      setSelectedProductIds((prev) =>
        prev.filter((id) => {
          if (!id) {
            return false;
          }
          const produto = produtos.find((item) => item.item_id === id);
          if (!produto) {
            return false;
          }
          const status = (produto.status_liberacao_pcp ?? '').toUpperCase();
          return status === 'LIBERADO' && !produto.workflow_atribuido;
        }),
      );
    }
  }, [forcar, produtos]);

  const handleConfirm = async () => {
    if (!osId) {
      toast.error('OS nao informada.');
      return;
    }

    if (!selectedWorkflowId) {
      toast.error('Selecione um workflow para continuar.');
      return;
    }

    if (liberadosDisponiveis > 0 && selectedProductIds.length === 0) {
      toast.error('Selecione pelo menos um produto liberado para o PCP.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticacao nao encontrado.');
      }

      const usuarioId = localStorage.getItem('user_id') ?? undefined;

      const payload: Record<string, unknown> = {
        osId,
        workflowId: selectedWorkflowId,
        forcar,
        usuarioId,
      };

      if (selectedProductIds.length > 0) {
        payload.itemOsIds = selectedProductIds;
      }

      const response = await fetch('/api/pcp/workflows/atribuir', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Erro ao atribuir workflow.');
      }

      const data: WorkflowAssignmentResponse = await response.json();
      toast.success(data.mensagem || 'Workflow atribuido com sucesso.');
      onAssigned?.(data);
      onClose();
    } catch (submitError: unknown) {
      console.error('Erro ao atribuir workflow:', submitError);
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : 'Erro ao atribuir workflow.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasWorkflows = workflows.length > 0;
  const possuiLiberados = useMemo(
    () =>
      produtos.some(
        (produto) =>
          (produto.status_liberacao_pcp ?? '').toUpperCase() === 'LIBERADO',
      ),
    [produtos],
  );
  const possuiLiberadosComWorkflow = useMemo(
    () =>
      produtos.some(
        (produto) =>
          (produto.status_liberacao_pcp ?? '').toUpperCase() === 'LIBERADO' &&
          produto.workflow_atribuido,
      ),
    [produtos],
  );

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atribuir workflow</DialogTitle>
          <DialogDescription>
            {osNumero
              ? `Selecione o workflow que sera utilizado pela OS ${osNumero}.`
              : 'Selecione o workflow que sera utilizado nesta OS.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando opcoes de workflow...
          </div>
        ) : (
          <div className="space-y-6">
            {suggestion && suggestion.workflowId && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <IconBulb className="h-5 w-5" />
                  <span className="font-semibold">Sugestao inteligente</span>
                  <Badge>{suggestion.score} pts</Badge>
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  Workflow sugerido automaticamente com base nas categorias inteligentes.
                </p>
                {suggestion.motivos?.length > 0 && (
                  <ul className="mt-3 list-inside list-disc text-sm text-blue-700">
                    {suggestion.motivos.map((motivo, index) => (
                      <li key={index}>{motivo}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {produtos.length > 0 && (
              <div className="space-y-3 rounded-lg border border-muted/60 bg-muted/10 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Produtos liberados para o PCP</h4>
                    <p className="text-xs text-muted-foreground">
                      Selecione quais produtos receberao este workflow. Somente produtos ja liberados podem ser selecionados.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleAll}
                    disabled={liberadosDisponiveis === 0}
                  >
                    {todosLiberadosSelecionados ? 'Limpar selecao' : 'Selecionar liberados'}
                  </Button>
                </div>

                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {produtos.map((produto) => {
                    const status = (produto.status_liberacao_pcp ?? '').toUpperCase();
                    const isLiberado = status === 'LIBERADO';
                    const alreadyHasWorkflow = !!produto.workflow_atribuido;
                    const itemId = produto.item_id ?? '';
                    const checkboxDisabled =
                      !isLiberado || !itemId || (!forcar && alreadyHasWorkflow);
                    const checked = itemId
                      ? selectedProductIds.includes(itemId)
                      : false;
                    let prazoFormatado: string | null = null;
                    if (produto.data_prazo_produto) {
                      const prazoDate = new Date(produto.data_prazo_produto);
                      if (!Number.isNaN(prazoDate.getTime())) {
                        prazoFormatado = prazoDate.toLocaleDateString('pt-BR');
                      }
                    }

                    return (
                      <div
                        key={produto.item_id}
                        className={cn(
                          'flex items-start gap-3 rounded-md border p-3 text-sm transition-colors',
                          checked ? 'border-blue-500 bg-blue-50/80' : 'border-border bg-background',
                          !isLiberado && 'opacity-75',
                          alreadyHasWorkflow && !forcar && 'border-dashed opacity-80',
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            handleToggleItem(itemId, Boolean(value))
                          }
                          disabled={checkboxDisabled}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold leading-tight">{produto.produto_servico}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs uppercase',
                                  isLiberado
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-amber-500 bg-amber-50 text-amber-700',
                                )}
                              >
                                {status}
                              </Badge>
                              {alreadyHasWorkflow && (
                                <Badge
                                  variant="outline"
                                  className="border-slate-300 text-slate-600"
                                >
                                  workflow aplicado
                                </Badge>
                              )}
                            </div>
                          </div>
                          {produto.mensagem && (
                            <p className="text-xs text-muted-foreground">{produto.mensagem}</p>
                          )}
                          {prazoFormatado && (
                            <p className="text-xs text-muted-foreground">Prazo: {prazoFormatado}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {liberadosDisponiveis === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {possuiLiberados && possuiLiberadosComWorkflow && !forcar
                      ? 'Todos os produtos liberados ja possuem workflow. Ative "Reatribuir" para reaplicar.'
                      : 'Nenhum produto esta liberado ainda. O workflow sera aplicado a OS inteira.'}
                  </p>
                )}
              </div>
            )}

            {hasWorkflows ? (
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                <RadioGroup
                  value={selectedWorkflowId ?? undefined}
                  onValueChange={setSelectedWorkflowId}
                >
                  {workflows.map((workflow) => {
                    const isSuggested =
                      suggestion?.workflowId === workflow.id && !forcar;
                    return (
                      <div
                        key={workflow.id}
                        className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                          selectedWorkflowId === workflow.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-border bg-background'
                        }`}
                      >
                        <RadioGroupItem
                          value={workflow.id}
                          id={`workflow-${workflow.id}`}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`workflow-${workflow.id}`}
                              className="font-semibold leading-none"
                            >
                              {workflow.nome}
                            </label>
                            {!workflow.ativo && (
                              <Badge variant="destructive">inativo</Badge>
                            )}
                            {isSuggested && (
                              <Badge className="bg-blue-600 text-white">
                                sugestao
                              </Badge>
                            )}
                            {selectedWorkflowId === workflow.id && (
                              <Badge
                                variant="outline"
                                className="border-green-500 text-green-700"
                              >
                                <IconCheck className="mr-1 h-3 w-3" /> selecionado
                              </Badge>
                            )}
                          </div>
                          {workflow.descricao && (
                            <p className="text-sm text-muted-foreground">
                              {workflow.descricao}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {workflow.sequencial
                              ? 'Fluxo sequencial'
                              : 'Fluxo paralelo'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <IconAlertTriangle className="h-5 w-5 text-amber-500" />
                Nenhum workflow disponivel. Cadastre um workflow em PCP -> Workflows.
              </div>
            )}

            <div className="flex items-center gap-2 rounded-md border p-3">
              <Switch
                id="forcar-workflow"
                checked={forcar}
                onCheckedChange={setForcar}
              />
              <Label
                htmlFor="forcar-workflow"
                className="text-sm text-muted-foreground"
              >
                Reatribuir workflow mesmo se ja existir uma instancia ativa.
              </Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              submitting ||
              loading ||
              !hasWorkflows ||
              (liberadosDisponiveis > 0 && selectedProductIds.length === 0)
            }
          >
            {submitting && (
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
