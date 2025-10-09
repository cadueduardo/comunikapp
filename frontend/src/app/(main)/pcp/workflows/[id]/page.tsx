'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconCheck,
  IconClock,
  IconPlayerPlay
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface WorkflowTemplate {
  id: string;
  nome: string;
  descricao?: string;
  etapas: Array<{
    id: string;
    nome: string;
    descricao?: string;
    ordem: number;
    obrigatoria: boolean;
    tempo_estimado?: number;
    responsaveis_permitidos?: string[];
    checklist?: Array<{
      id: string;
      descricao: string;
      obrigatorio: boolean;
      ordem: number;
    }>;
  }>;
  ativo: boolean;
  sequencial: boolean;
  criado_em: string;
  atualizado_em: string;
}

export default function ViewWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchWorkflow(params.id as string);
    }
  }, [params.id]);

  const fetchWorkflow = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/pcp/workflow-templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflow(data);
      } else {
        toast.error('Erro ao carregar workflow');
        router.push('/pcp/workflows');
      }
    } catch (error) {
      console.error('Erro ao buscar workflow:', error);
      toast.error('Erro ao conectar com o servidor');
      router.push('/pcp/workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/pcp/workflows/${params.id}/editar`);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este workflow?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/pcp/workflow-templates/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Workflow excluído com sucesso');
        router.push('/pcp/workflows');
      } else {
        toast.error('Erro ao excluir workflow');
      }
    } catch (error) {
      console.error('Erro ao excluir workflow:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const getStatusColor = (ativo: boolean) => {
    return ativo 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusText = (ativo: boolean) => {
    return ativo ? 'ATIVO' : 'INATIVO';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/pcp/workflows')}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando workflow...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/pcp/workflows')}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Workflow não encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              O workflow solicitado não foi encontrado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/pcp/workflows')}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {workflow.nome}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {workflow.descricao || 'Sem descrição'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(workflow.ativo)}>
            {getStatusText(workflow.ativo)}
          </Badge>
          <Button onClick={handleEdit}>
            <IconEdit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <IconTrash className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações do Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Tipo</div>
              <div className="text-lg font-semibold">
                {workflow.sequencial ? 'Sequencial' : 'Paralelo'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Total de Etapas</div>
              <div className="text-lg font-semibold">{workflow.etapas?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Criado em</div>
              <div className="text-lg font-semibold">
                {new Date(workflow.criado_em).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etapas do Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Etapas do Workflow</CardTitle>
          <CardDescription>
            {workflow.sequencial 
              ? 'As etapas devem ser executadas em ordem sequencial'
              : 'As etapas podem ser executadas em paralelo'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflow.etapas && workflow.etapas.length > 0 ? (
            <div className="space-y-4">
              {workflow.etapas
                .sort((a, b) => a.ordem - b.ordem)
                .map((etapa, index) => (
                <Card key={etapa.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {etapa.ordem}. {etapa.nome}
                        </CardTitle>
                        {etapa.descricao && (
                          <CardDescription className="mt-1">
                            {etapa.descricao}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {etapa.obrigatoria && (
                          <Badge variant="secondary">
                            <IconCheck className="h-3 w-3 mr-1" />
                            Obrigatória
                          </Badge>
                        )}
                        {etapa.tempo_estimado && (
                          <Badge variant="outline">
                            <IconClock className="h-3 w-3 mr-1" />
                            {etapa.tempo_estimado}min
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {etapa.checklist && etapa.checklist.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Checklist:
                      </div>
                      <ul className="space-y-1">
                        {etapa.checklist
                          .sort((a, b) => a.ordem - b.ordem)
                          .map((item) => (
                          <li key={item.id} className="flex items-center gap-2 text-sm">
                            <IconCheck className="h-4 w-4 text-gray-400" />
                            <span className={item.obrigatorio ? 'font-medium' : 'text-gray-600'}>
                              {item.descricao}
                              {item.obrigatorio && ' *'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <IconPlayerPlay className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma etapa definida
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Este workflow ainda não possui etapas configuradas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
