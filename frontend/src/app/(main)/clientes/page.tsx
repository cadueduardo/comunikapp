'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { ClienteCard } from '@/components/ui/cliente-card';
import { useIsMobile } from '@/hooks/use-media-query';
import { Plus, Search, Table, LayoutGrid } from "lucide-react";
import { toast } from 'sonner';
import { createColumns, type Cliente } from './columns';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; clienteId?: string; loading?: boolean }>({ open: false });

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/clientes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchClientes();
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/clientes/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const handleDelete = async (clienteId: string) => {
    setConfirmDialog({ open: true, clienteId, loading: true });
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await fetch(`http://localhost:3001/clientes/${clienteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Cliente excluído com sucesso!');
        fetchClientes();
      } else {
        // Tenta ler a mensagem de erro do backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Não foi possível excluir o cliente.';
        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Ocorreu um erro ao excluir o cliente.');
      } else {
        toast.error('Ocorreu um erro ao excluir o cliente.');
      }
    } finally {
      setConfirmDialog({ open: false });
    }
  };

  const confirmDelete = async () => {
    if (confirmDialog.clienteId) {
      await handleDelete(confirmDialog.clienteId);
    }
  };

  const columns = createColumns(handleDelete);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            {loading ? 'Carregando...' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} na sua base`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Switch de visualização - apenas para desktop */}
          {!isMobile && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <Table className="h-4 w-4 mr-1" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Cards
              </Button>
            </div>
          )}
          <Link href="/clientes/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Search */}
      <div className="relative w-full md:max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar por nome, documento, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 w-full"
        />
      </div>

      {/* Lista de Clientes */}
      {clientes.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando seu primeiro cliente.
              </p>
              <Link href="/clientes/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Cliente
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Renderização condicional baseada no dispositivo e modo de visualização */}
          {(isMobile || viewMode === 'cards') ? (
            // Cards para mobile ou quando viewMode é 'cards'
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clientes.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            // Tabela para desktop quando viewMode é 'table'
            <DataTable columns={columns} data={clientes} />
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir cliente?"
        description="Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={confirmDialog.loading}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </div>
  );
} 