'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Building2, Plus, Search, List, Grid3X3, Edit, Trash2 } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useIsMobile } from '@/hooks/use-media-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { centrosTrabalhoModuleNav } from '@/lib/module-nav';

interface SetorProdutivo {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}

export default function SetoresProdutivosPage() {
  const [setores, setSetores] = useState<SetorProdutivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [toDelete, setToDelete] = useState<SetorProdutivo | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchSetores();
  }, []);

  const fetchSetores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      const response = await fetch('/api/centros-de-trabalho/setores-produtivos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSetores(data);
      } else if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar setores:', error);
      toast.error(error.message || 'Erro ao carregar setores produtivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/centros-de-trabalho/setores-produtivos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Setor excluído com sucesso');
        setSetores(prev => prev.filter(s => s.id !== id));
      } else {
        throw new Error('Erro ao excluir setor');
      }
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast.error('Erro ao excluir setor');
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return setores.filter(setor =>
      setor.nome.toLowerCase().includes(term) ||
      setor.descricao?.toLowerCase().includes(term)
    );
  }, [setores, searchTerm]);

  const columns: ColumnDef<SetorProdutivo>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: row.original.cor }}
          />
          <span className="font-medium">{row.original.nome}</span>
        </div>
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
      accessorKey: 'ativo',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.ativo ? 'default' : 'secondary'}>
          {row.original.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'ordem',
      header: 'Ordem',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.ordem}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right w-full">Ações</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/centros-de-trabalho/setores-produtivos/editar/${row.original.id}`}>
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
      nav={centrosTrabalhoModuleNav}
      title="Setores Produtivos"
      subtitle="Gerencie os setores produtivos da sua empresa"
      icon={<Building2 className="h-7 w-7" />}
      backHref="/centros-de-trabalho"
      actions={
        <Link href="/centros-de-trabalho/setores-produtivos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Setor
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

  const table = <DataTable<SetorProdutivo, unknown> columns={columns} data={filtered} />;

  const emptyState = (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhum setor cadastrado</h3>
          <p className="text-gray-600 mb-4">Cadastre seu primeiro setor produtivo.</p>
          <Link href="/centros-de-trabalho/setores-produtivos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Setor
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
            {filtered.map((setor) => (
              <Card key={setor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: setor.cor }}
                        />
                        <span>{setor.nome}</span>
                      </CardTitle>
                      {setor.descricao && (
                        <div className="text-xs text-gray-500 mt-1">{setor.descricao}</div>
                      )}
                    </div>
                    <Badge variant={setor.ativo ? 'default' : 'secondary'}>
                      {setor.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Ordem:</span>
                      <span className="font-medium">{setor.ordem}</span>
                    </div>
                    <div className="pt-3 border-t flex gap-2">
                      <Link href={`/centros-de-trabalho/setores-produtivos/editar/${setor.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Editar</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => setToDelete(setor)}>Excluir</Button>
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
        title="Excluir Setor Produtivo"
        description={toDelete ? `Tem certeza que deseja excluir o setor "${toDelete.nome}"? Esta ação não pode ser desfeita.` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { if (toDelete) { handleDelete(toDelete.id); setToDelete(null); } }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
