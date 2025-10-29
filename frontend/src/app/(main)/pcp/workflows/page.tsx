'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  IconBuilding, 
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFilter
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface WorkflowTemplateSetor {
  id: string;
  setorId: string;
  nomeSetor?: string;
  ordem: number;
  tempoEstimado?: number | null;
  obrigatorio?: boolean;
}

interface WorkflowTemplate {
  id: string;
  nome: string;
  descricao?: string;
  etapas: any[];
  ativo: boolean;
  sequencial: boolean;
  criado_em: string;
  atualizado_em: string;
  setores?: WorkflowTemplateSetor[];
}

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/pcp/workflow-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      } else {
        toast.error('Erro ao carregar workflows');
      }
    } catch (error) {
      console.error('Erro ao buscar workflows:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (workflow.descricao && workflow.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (ativo: boolean) => {
    return ativo 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusText = (ativo: boolean) => {
    return ativo ? 'ATIVO' : 'INATIVO';
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Tem certeza que deseja excluir este workflow?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/pcp/workflow-templates/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Workflow excluído com sucesso');
        fetchWorkflows(); // Recarregar a lista
      } else {
        toast.error('Erro ao excluir workflow');
      }
    } catch (error) {
      console.error('Erro ao excluir workflow:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workflows
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie workflows de produção
          </p>
        </div>
        <Button asChild>
          <Link href="/pcp/workflows/novo">
            <IconPlus className="h-4 w-4 mr-2" />
            Novo Workflow
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou OS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <IconFilter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Workflows */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando workflows...</p>
            </CardContent>
          </Card>
        ) : filteredWorkflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{workflow.nome}</CardTitle>
                  <CardDescription>{workflow.descricao}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(workflow.ativo)}>
                    {getStatusText(workflow.ativo)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pcp/workflows/${workflow.id}`}>
                        <IconEye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pcp/workflows/${workflow.id}/editar`}>
                        <IconEdit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(workflow.id)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Setores</div>
                  <div className="text-lg font-semibold">
                    {workflow.setores?.length ?? workflow.etapas?.length ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Tipo</div>
                  <div className="text-lg font-semibold">
                    {workflow.sequencial ? 'Sequencial' : 'Paralelo'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Criado em</div>
                  <div className="text-lg font-semibold">
                    {new Date(workflow.criado_em).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Atualizado em</div>
                  <div className="text-lg font-semibold">
                    {new Date(workflow.atualizado_em).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </CardContent>
            {workflow.setores && workflow.setores.length > 0 && (
              <div className="px-6 pb-6">
                <div className="text-xs uppercase font-medium text-gray-500 mb-2">
                  Sequência
                </div>
                <div className="flex flex-wrap gap-2">
                  {workflow.setores
                    .slice()
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((setor) => (
                      <span
                        key={setor.id}
                        className="rounded-full border px-3 py-1 text-xs bg-gray-50"
                      >
                        {setor.nomeSetor || 'Setor'}{' '}
                        <span className="text-gray-500">
                          {setor.tempoEstimado
                            ? `• ${setor.tempoEstimado} min`
                            : null}
                        </span>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <IconBuilding className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum workflow encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro workflow'}
            </p>
            <Button asChild>
              <Link href="/pcp/workflows/novo">
                <IconPlus className="h-4 w-4 mr-2" />
                Criar Workflow
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
