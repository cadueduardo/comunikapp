'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface SetorOption {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
}

interface WorkflowSetorForm {
  id: string;
  setorId: string;
  tempoEstimado: string;
  obrigatorio: boolean;
}

export default function NovoWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [sequencial, setSequencial] = useState(true);

  const [setoresDisponiveis, setSetoresDisponiveis] = useState<SetorOption[]>(
    [],
  );
  const [setoresWorkflow, setSetoresWorkflow] = useState<WorkflowSetorForm[]>(
    [],
  );
  const [carregandoSetores, setCarregandoSetores] = useState(true);

  useEffect(() => {
    const carregarSetores = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          '/api/centros-de-trabalho/setores-produtivos',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Não foi possível carregar os setores produtivos.');
        }

        const data = await response.json();
        setSetoresDisponiveis(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erro ao buscar setores produtivos:', error);
        toast.error('Erro ao carregar setores produtivos');
      } finally {
        setCarregandoSetores(false);
      }
    };

    carregarSetores();
  }, []);

  const podeAdicionarSetor = useMemo(
    () => setoresDisponiveis.length > 0,
    [setoresDisponiveis],
  );

  const handleAdicionarSetor = () => {
    if (!podeAdicionarSetor) {
      toast.error('Cadastre setores produtivos antes de montar um workflow.');
      return;
    }

    const defaultSetorId =
      setoresDisponiveis.find(
        (setor) => !setoresWorkflow.some((item) => item.setorId === setor.id),
      )?.id ?? setoresDisponiveis[0].id;

    setSetoresWorkflow((prev) => [
      ...prev,
      {
        id: `setor-${Date.now()}`,
        setorId: defaultSetorId,
        tempoEstimado: '',
        obrigatorio: true,
      },
    ]);
  };

  const handleAtualizarSetor = (
    formId: string,
    campo: keyof WorkflowSetorForm,
    valor: string | boolean,
  ) => {
    setSetoresWorkflow((prev) =>
      prev.map((item) =>
        item.id === formId ? { ...item, [campo]: valor } : item,
      ),
    );
  };

  const handleRemoverSetor = (formId: string) => {
    setSetoresWorkflow((prev) => prev.filter((item) => item.id !== formId));
  };

  const moverSetor = (index: number, direcao: 'up' | 'down') => {
    setSetoresWorkflow((prev) => {
      const novo = [...prev];
      if (direcao === 'up' && index > 0) {
        [novo[index - 1], novo[index]] = [novo[index], novo[index - 1]];
      } else if (direcao === 'down' && index < novo.length - 1) {
        [novo[index + 1], novo[index]] = [novo[index], novo[index + 1]];
      }
      return novo;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!nome.trim()) {
      toast.error('Informe um nome para o workflow.');
      return;
    }

    if (setoresWorkflow.length === 0) {
      toast.error('Adicione pelo menos um setor ao workflow.');
      return;
    }

    for (const setor of setoresWorkflow) {
      if (!setor.setorId) {
        toast.error('Selecione um setor para cada etapa do workflow.');
        return;
      }

      if (
        setor.tempoEstimado.trim() !== '' &&
        (Number.isNaN(Number(setor.tempoEstimado)) ||
          Number(setor.tempoEstimado) < 0)
      ) {
        toast.error(
          'Tempo estimado deve ser um número positivo (ou deixe em branco).',
        );
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const payload = {
        nome,
        descricao,
        ativo,
        sequencial,
        etapas: [],
        setores: setoresWorkflow.map((setor, index) => ({
          setorId: setor.setorId,
          ordem: index,
          tempoEstimado:
            setor.tempoEstimado.trim() === ''
              ? undefined
              : Number(setor.tempoEstimado),
          obrigatorio: setor.obrigatorio,
        })),
      };

      const response = await fetch('/api/pcp/workflow-templates', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error?.error || 'Erro ao criar workflow. Tente novamente.',
        );
      }

      toast.success('Workflow criado com sucesso');
      router.push('/pcp/workflows');
    } catch (error) {
      console.error('Erro ao criar workflow:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar workflow.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Novo Workflow
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Defina o fluxo de produção associando os setores produtivos.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/pcp/workflows">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Ex: Workflow padrão de produção"
                  required
                />
              </div>
              <div className="flex items-center gap-6 pt-6 md:pt-0">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={ativo}
                    onCheckedChange={setAtivo}
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sequencial"
                    checked={sequencial}
                    onCheckedChange={setSequencial}
                  />
                  <Label htmlFor="sequencial">Sequencial</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Descrição do fluxo ou orientações gerais"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sequência de setores</CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={handleAdicionarSetor}
              disabled={carregandoSetores || !podeAdicionarSetor}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar setor
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {carregandoSetores ? (
              <p className="text-sm text-gray-500">Carregando setores...</p>
            ) : setoresWorkflow.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Nenhum setor na sequência. Clique em &ldquo;Adicionar
                setor&rdquo; para começar.
              </p>
            ) : (
              setoresWorkflow.map((item, index) => {
                const setorSelecionado = setoresDisponiveis.find(
                  (setor) => setor.id === item.setorId,
                );

                return (
                  <Card key={item.id} className="border border-dashed">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">
                            Etapa {index + 1}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={index === 0}
                              onClick={() => moverSetor(index, 'up')}
                              aria-label="Mover para cima"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={index === setoresWorkflow.length - 1}
                              onClick={() => moverSetor(index, 'down')}
                              aria-label="Mover para baixo"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRemoverSetor(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label>Setor produtivo *</Label>
                          <Select
                            value={item.setorId}
                            onValueChange={(value) =>
                              handleAtualizarSetor(item.id, 'setorId', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o setor" />
                            </SelectTrigger>
                            <SelectContent>
                              {setoresDisponiveis.map((setor) => (
                                <SelectItem key={setor.id} value={setor.id}>
                                  {setor.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {setorSelecionado?.descricao && (
                            <p className="mt-2 text-xs text-gray-500">
                              {setorSelecionado.descricao}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Tempo estimado (min)</Label>
                          <Input
                            value={item.tempoEstimado}
                            onChange={(event) =>
                              handleAtualizarSetor(
                                item.id,
                                'tempoEstimado',
                                event.target.value,
                              )
                            }
                            placeholder="Opcional"
                            type="number"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`obrigatorio-${item.id}`}
                          checked={item.obrigatorio}
                          onCheckedChange={(checked) =>
                            handleAtualizarSetor(
                              item.id,
                              'obrigatorio',
                              checked,
                            )
                          }
                        />
                        <Label htmlFor={`obrigatorio-${item.id}`}>
                          Etapa obrigatória
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/pcp/workflows">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar workflow'}
          </Button>
        </div>
      </form>
    </div>
  );
}

