import { useEffect, useMemo, useState } from 'react';
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
import {
  IconAlertTriangle,
  IconBulb,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react';
import { toast } from 'sonner';

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
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null,
  );
  const [forcar, setForcar] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !osId) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Token de autenticação não encontrado.');
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [sugestaoResponse, templatesResponse] = await Promise.all([
          fetch(`/api/pcp/workflows/sugestao/${osId}`, { headers }),
          fetch('/api/pcp/workflow-templates', { headers }),
        ]);

        if (sugestaoResponse.ok) {
          const suggestionData = await sugestaoResponse.json();
          setSuggestion(suggestionData);
          if (suggestionData?.workflowId) {
            setSelectedWorkflowId(suggestionData.workflowId);
          }
        } else {
          setSuggestion(null);
        }

        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          setWorkflows(Array.isArray(templatesData) ? templatesData : []);
          if (!suggestion?.workflowId && templatesData?.length) {
            setSelectedWorkflowId(templatesData[0].id);
          }
        } else {
          throw new Error('Erro ao carregar workflows disponíveis.');
        }
      } catch (loadError: unknown) {
        console.error(
          'Erro ao carregar dados para sugestão de workflow:',
          loadError,
        );
        toast.error(
          loadError instanceof Error
            ? loadError.message
            : 'Erro ao carregar opções de workflow.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, osId]);

  useEffect(() => {
    if (!open) {
      setSuggestion(null);
      setWorkflows([]);
      setSelectedWorkflowId(null);
      setForcar(false);
      setSubmitting(false);
    }
  }, [open]);

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId),
    [selectedWorkflowId, workflows],
  );

  const handleConfirm = async () => {
    if (!osId) {
      toast.error('OS não informada.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const usuarioId = localStorage.getItem('user_id') ?? undefined;

      const response = await fetch('/api/pcp/workflows/atribuir', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          osId,
          workflowId: selectedWorkflowId || undefined,
          forcar,
          usuarioId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Erro ao atribuir workflow.');
      }

      const data: WorkflowAssignmentResponse = await response.json();
      toast.success(data.mensagem || 'Workflow atribuído com sucesso.');
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

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atribuir workflow</DialogTitle>
          <DialogDescription>
            {osNumero
              ? `Selecione o workflow que será utilizado pela OS ${osNumero}.`
              : 'Selecione o workflow que será utilizado nesta OS.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando opções de workflow...
          </div>
        ) : (
          <div className="space-y-6">
            {suggestion && suggestion.workflowId && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <IconBulb className="h-5 w-5" />
                  <span className="font-semibold">Sugestão inteligente</span>
                  <Badge>{suggestion.score} pts</Badge>
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  Workflow sugerido automaticamente com base nas categorias
                  inteligentes.
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
                                sugestão
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
                Nenhum workflow disponível. Cadastre um workflow em PCP → Workflows.
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
                Reatribuir workflow mesmo se já existir uma instância ativa.
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
            disabled={submitting || (loading || !hasWorkflows)}
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
