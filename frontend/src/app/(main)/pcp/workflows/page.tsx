'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Workflow, Plus, Search, List, Grid3X3, Edit, Trash2 } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useIsMobile } from '@/hooks/use-media-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { pcpModuleNav } from '@/lib/module-nav';

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
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [toDelete, setToDelete] = useState<WorkflowTemplate | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      const response = await fetch('/api/pcp/workflow-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      } else if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar workflows:', error);
      toast.error(error.message || 'Erro ao carregar workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/pcp/workflow-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Workflow excluído com sucesso');
        setWorkflows(prev => prev.filter(w => w.id !== id));
      } else {
        const data = await response.json().catch(() => ({}));
        const mensagem = (data as any)?.message || (data as any)?.error || 'Erro ao excluir workflow';
        toast.error(mensagem);
      }
    } catch (error) {
      console.error('Erro ao excluir workflow:', error);
      toast.error('Erro ao excluir workflow');
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return workflows.filter(workflow =>
      workflow.nome.toLowerCase().includes(term) ||
      workflow.descricao?.toLowerCase().includes(term)
    );
  }, [workflows, searchTerm]);

  const columns: ColumnDef<WorkflowTemplate>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nome}</span>
      ),
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.descricao || '—'}</span>
      ),
    },
    {
      accessorKey: 'setores',
      header: 'Setores',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.setores?.length || 0} setor(es)</span>
      ),
    },
    {
      accessorKey: 'sequencial',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.sequencial ? 'Sequencial' : 'Paralelo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.ativo ? 'default' : 'secondary'}>
          {row.original.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right w-full">Ações</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/pcp/workflows/${row.original.id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setToDelete(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const header = (
    <ModuleHeader
      nav={pcpModuleNav}
      title="Workflows"
      subtitle="Gerencie os templates de workflow para o PCP"
      icon={<Workflow className="h-7 w-7" />}
      backHref="/pcp"
      actions={
        <Link href="/pcp/workflows/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Workflow
          </Button>
        </Link>
      }
    />
  );

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>
      {!isMobile && (
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4 mr-2" />
            Tabela
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Cards
          </Button>
        </div>
      )}
    </div>
  );

  const table = <DataTable<WorkflowTemplate, unknown> columns={columns} data={filtered} />;

  const emptyState = (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhum workflow cadastrado</h3>
          <p className="text-gray-600 mb-4">Cadastre seu primeiro workflow.</p>
          <Link href="/pcp/workflows/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Workflow
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      {toolbar}
      {filtered.length ? (
        viewMode === 'table' ? (
          table
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workflow.nome}</CardTitle>
                      {workflow.descricao && (
                        <div className="text-xs text-gray-500 mt-1">{workflow.descricao}</div>
                      )}
                    </div>
                    <Badge variant={workflow.ativo ? 'default' : 'secondary'}>
                      {workflow.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Setores:</span>
                      <span className="font-medium">{workflow.setores?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipo:</span>
                      <Badge variant="outline" className="font-medium">
                        {workflow.sequencial ? 'Sequencial' : 'Paralelo'}
                      </Badge>
                    </div>
                    {workflow.setores && workflow.setores.length > 0 && (
                      <div>
                        <p className="text-gray-500 mb-2">Sequência:</p>
                        <div className="flex flex-wrap gap-1">
                          {workflow.setores
                            .sort((a, b) => a.ordem - b.ordem)
                            .map((setor, index) => (
                              <Badge key={setor.id} variant="secondary" className="text-xs">
                                {index + 1}. {setor.nomeSetor || 'Setor'}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t flex gap-2">
                      <Link href={`/pcp/workflows/${workflow.id}/editar`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Editar</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => setToDelete(workflow)}>Excluir</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        emptyState
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir Workflow"
        description={toDelete ? `Tem certeza que deseja excluir o workflow "${toDelete.nome}"? Esta ação não pode ser desfeita.` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { if (toDelete) { handleDelete(toDelete.id); setToDelete(null); } }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
