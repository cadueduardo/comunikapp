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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconAlertTriangle,
  IconBulb,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { solicitarAtualizacaoBadgesSidebar } from '@/lib/sidebar-badge-refresh';
import { itemRequerFabricaPcp, MODO_FULFILLMENT_LABEL } from '@/lib/os-fulfillment-utils';

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

interface ItemWorkflowSuggestion extends WorkflowSuggestion {
  itemOsId: string;
  origem: 'FULFILLMENT' | 'REGRAS' | 'SEM_SUGESTAO';
  confianca: 'ALTA' | 'MEDIA' | 'BAIXA';
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
  modo_fulfillment?: string | null;
  requer_pcp_fabrica?: boolean;
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
  const [itemSuggestions, setItemSuggestions] = useState<
    Record<string, ItemWorkflowSuggestion>
  >({});
  const [workflowByProduct, setWorkflowByProduct] = useState<
    Record<string, string>
  >({});
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [forcar, setForcar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [produtos, setProdutos] = useState<ProdutoStatus[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSuggestion(null);
      setItemSuggestions({});
      setWorkflowByProduct({});
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
          sugestoesItensResponse,
          templatesResponse,
          produtosResponse,
        ] = await Promise.all([
          fetch(`/api/pcp/workflows/sugestoes-itens/${osId}`, { headers }),
          fetch('/api/pcp/workflow-templates', { headers }),
          fetch(`/api/os/produtos/${osId}/status-produtos`, { headers }),
        ]);

        let workflowInicial: string | null = null;
        let sugestoesItens: ItemWorkflowSuggestion[] = [];
        let templatesCarregados: WorkflowTemplate[] = [];

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

        if (sugestoesItensResponse.ok) {
          const suggestionData =
            await parseJsonSafely<ItemWorkflowSuggestion[]>(
              sugestoesItensResponse,
            );
          sugestoesItens = Array.isArray(suggestionData) ? suggestionData : [];
          setItemSuggestions(
            Object.fromEntries(
              sugestoesItens.map((item) => [item.itemOsId, item]),
            ),
          );
          const primeiraSugestao = sugestoesItens.find(
            (item) => item.workflowId,
          );
          workflowInicial = primeiraSugestao?.workflowId ?? null;
          setSuggestion(primeiraSugestao ?? null);
        } else {
          setSuggestion(null);
          setItemSuggestions({});
        }

        if (templatesResponse.ok) {
          const templatesData = await parseJsonSafely<WorkflowTemplate[]>(templatesResponse);
          const listaTemplates = Array.isArray(templatesData)
            ? templatesData
            : [];
          templatesCarregados = listaTemplates;
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

          const workflowPadrao =
            templatesCarregados[0]?.id ?? workflowInicial ?? null;
          const selecoesPorProduto = Object.fromEntries(
            listaProdutos
              .filter((produto) => Boolean(produto.item_id))
              .map((produto) => {
                const sugerido = sugestoesItens.find(
                  (item) => item.itemOsId === produto.item_id,
                )?.workflowId;
                return [produto.item_id, sugerido || workflowPadrao || ''];
              }),
          );
          setWorkflowByProduct(selecoesPorProduto);

          if (listaProdutos.length) {
            const liberadosDisponiveis = listaProdutos
              .filter(
                (produto) =>
                  itemRequerFabricaPcp(produto) &&
                  (produto.status_liberacao_pcp ?? '').toUpperCase() ===
                    'LIBERADO' &&
                  !produto.workflow_atribuido,
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

  const isProdutoPcpLiberado = useCallback(
    (produto: ProdutoStatus) => {
      if (!itemRequerFabricaPcp(produto)) {
        return false;
      }
      return (produto.status_liberacao_pcp ?? '').toUpperCase() === 'LIBERADO';
    },
    [],
  );

  const produtosPcp = useMemo(
    () => produtos.filter(isProdutoPcpLiberado),
    [produtos, isProdutoPcpLiberado],
  );

  const liberadosDisponiveis = useMemo(
    () =>
      produtosPcp.filter((produto) => forcar || !produto.workflow_atribuido)
        .length,
    [produtosPcp, forcar],
  );

  const todosLiberadosSelecionados = useMemo(() => {
    const liberadosIds = produtosPcp
      .filter((produto) => forcar || !produto.workflow_atribuido)
      .map((produto) => produto.item_id);

    if (!liberadosIds.length) {
      return false;
    }

    return liberadosIds.every((id) => selectedProductIds.includes(id));
  }, [produtosPcp, selectedProductIds, forcar]);

  const todosSelecionadosComWorkflow = useMemo(
    () =>
      selectedProductIds.every((itemId) => Boolean(workflowByProduct[itemId])),
    [selectedProductIds, workflowByProduct],
  );

  const handleToggleItem = useCallback(
    (itemId: string, checked: boolean) => {
      if (!itemId) {
        return;
      }
      const produto = produtos.find((item) => item.item_id === itemId);
      const podeSelecionar =
        !!produto &&
        isProdutoPcpLiberado(produto) &&
        (forcar || !produto.workflow_atribuido);

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
    [produtos, forcar, isProdutoPcpLiberado],
  );

  const handleToggleAll = useCallback(() => {
    const liberadosIds = produtosPcp
      .filter((produto) => forcar || !produto.workflow_atribuido)
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
  }, [produtosPcp, todosLiberadosSelecionados, forcar]);

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

    if (produtosPcp.length === 0 && !selectedWorkflowId) {
      toast.error('Selecione um workflow para continuar.');
      return;
    }

    if (liberadosDisponiveis > 0 && selectedProductIds.length === 0) {
      toast.error('Selecione pelo menos um produto liberado para o PCP.');
      return;
    }

    const produtoSemWorkflow = selectedProductIds.find(
      (itemId) => !workflowByProduct[itemId],
    );
    if (produtoSemWorkflow) {
      toast.error('Selecione o workflow de cada produto marcado.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticacao nao encontrado.');
      }

      const usuarioId = localStorage.getItem('user_id') ?? undefined;

      const grupos = new Map<string, string[]>();
      if (selectedProductIds.length > 0) {
        selectedProductIds.forEach((itemId) => {
          const workflowId = workflowByProduct[itemId];
          grupos.set(workflowId, [...(grupos.get(workflowId) ?? []), itemId]);
        });
      } else if (selectedWorkflowId) {
        grupos.set(selectedWorkflowId, []);
      }

      const resultados: WorkflowAssignmentResponse[] = [];
      for (const [workflowId, itemOsIds] of grupos) {
        const response = await fetch('/api/pcp/workflows/atribuir', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            osId,
            workflowId,
            forcar,
            usuarioId,
            ...(itemOsIds.length > 0 ? { itemOsIds } : {}),
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error?.message || error?.error || 'Erro ao atribuir workflow.',
          );
        }
        resultados.push(
          (await response.json()) as WorkflowAssignmentResponse,
        );
      }

      const data = resultados[resultados.length - 1];
      toast.success(
        selectedProductIds.length === 1
          ? 'Workflow atribuído ao produto.'
          : `Workflows atribuídos a ${selectedProductIds.length} produtos.`,
      );
      solicitarAtualizacaoBadgesSidebar();
      if (data) {
        onAssigned?.(data);
      }
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
              ? `Revise o workflow de cada produto da OS ${osNumero}.`
              : 'Revise o workflow de cada produto antes de confirmar.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando opcoes de workflow...
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(itemSuggestions).length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <IconBulb className="h-5 w-5" />
                  <span className="font-semibold">Roteamento assistido</span>
                </div>
                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  As sugestões foram calculadas individualmente. Itens com baixa
                  confiança devem ser revisados antes da confirmação.
                </p>
              </div>
            )}

            {produtosPcp.length > 0 && (
              <div className="space-y-3 rounded-lg border border-muted/60 bg-muted/10 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Produtos liberados para o PCP</h4>
                    <p className="text-xs text-muted-foreground">
                      Selecione os produtos e confirme ou altere o workflow sugerido para cada um.
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

                <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                  {produtosPcp.map((produto) => {
                    const isLiberado = isProdutoPcpLiberado(produto);
                    const status = (
                      produto.status_liberacao_pcp || 'PENDENTE'
                    ).toUpperCase();
                    const alreadyHasWorkflow = !!produto.workflow_atribuido;
                    const itemId = produto.item_id ?? '';
                    const itemSuggestion = itemSuggestions[itemId];
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
                          checked
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/30'
                            : 'border-border bg-background',
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
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                                )}
                              >
                                {status}
                              </Badge>
                              {alreadyHasWorkflow && (
                                <Badge
                                  variant="outline"
                                  className="border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                                >
                                  workflow aplicado
                                </Badge>
                              )}
                              {itemSuggestion && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    itemSuggestion.confianca === 'ALTA' &&
                                      'border-emerald-500 text-emerald-700 dark:text-emerald-300',
                                    itemSuggestion.confianca === 'MEDIA' &&
                                      'border-amber-500 text-amber-700 dark:text-amber-300',
                                    itemSuggestion.confianca === 'BAIXA' &&
                                      'border-muted-foreground/40 text-muted-foreground',
                                  )}
                                >
                                  confiança {itemSuggestion.confianca.toLowerCase()}
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
                          <div className="space-y-1 pt-2">
                            <Label
                              htmlFor={`workflow-item-${itemId}`}
                              className="text-xs"
                            >
                              Workflow do produto
                            </Label>
                            <Select
                              value={workflowByProduct[itemId] || undefined}
                              onValueChange={(workflowId) =>
                                setWorkflowByProduct((atual) => ({
                                  ...atual,
                                  [itemId]: workflowId,
                                }))
                              }
                              disabled={!itemId || (!forcar && alreadyHasWorkflow)}
                            >
                              <SelectTrigger id={`workflow-item-${itemId}`}>
                                <SelectValue placeholder="Selecione um workflow" />
                              </SelectTrigger>
                              <SelectContent>
                                {workflows.map((workflow) => (
                                  <SelectItem
                                    key={workflow.id}
                                    value={workflow.id}
                                    disabled={!workflow.ativo}
                                  >
                                    {workflow.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {itemSuggestion?.motivos?.[0] && (
                              <p className="text-xs text-muted-foreground">
                                {itemSuggestion.motivos[0]}
                              </p>
                            )}
                          </div>
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

            {produtosPcp.length === 0 && (hasWorkflows ? (
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
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
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
                                className="border-green-500 text-green-700 dark:text-green-300"
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
                Nenhum workflow disponivel. Cadastre um workflow em PCP &gt; Workflows.
              </div>
            ))}

            {!hasWorkflows && produtosPcp.length > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <IconAlertTriangle className="h-5 w-5 text-amber-500" />
                Nenhum workflow disponível. Cadastre um workflow em PCP &gt;
                Workflows antes de liberar os produtos.
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
                Reatribuir somente os produtos selecionados que já possuem workflow.
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
              (liberadosDisponiveis > 0 && selectedProductIds.length === 0) ||
              !todosSelecionadosComWorkflow
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
