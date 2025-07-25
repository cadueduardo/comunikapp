'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Removido CardHeader e CardTitle
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, MoreVertical, FileText } from "lucide-react"; // Trocado MoreHorizontal por MoreVertical, Adicionado FileText
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Adicionado DropdownMenu
import { toast } from 'sonner'; // Adicionado toast
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Cliente {
  id: string;
  nome: string;
  tipo_pessoa: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  documento: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  status_cliente: 'ATIVO' | 'INATIVO' | 'PROSPECT' | 'BLOQUEADO';
  criado_em: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'PROSPECT': return 'bg-blue-100 text-blue-800';
      case 'INATIVO': return 'bg-gray-100 text-gray-800';
      case 'BLOQUEADO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDelete = async (clienteId: string) => {
    setConfirmDialog({ open: true, clienteId, loading: false });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.clienteId) return;
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      const response = await fetch(`http://localhost:3001/clientes/${confirmDialog.clienteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setClientes(prevClientes => prevClientes.filter(c => c.id !== confirmDialog.clienteId));
        toast.success('Cliente excluído com sucesso!');
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
    <div className="p-2 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-600">
            {loading ? 'Carregando...' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} na sua base`}
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button className="flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Search - Novo design */}
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar por nome, documento, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 w-full"
        />
      </div>

      {/* Lista de Clientes - Com Dropdown Menu */}
      {clientes.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
          <p className="mb-2">Nenhum cliente encontrado.</p>
          <Link href="/clientes/novo">
            <Button className="mt-4 cursor-pointer hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeiro cliente
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 relative">
                
                {/* Menu Dropdown de Ações */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        {/* TODO: Criar a página /orcamentos/novo */}
                        <Link href={`/orcamentos/novo?clienteId=${cliente.id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Novo Orçamento</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/clientes/editar/${cliente.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(cliente.id)}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg truncate pr-8" title={cliente.nome}>
                      {cliente.nome}
                    </h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge className={`${getStatusColor(cliente.status_cliente)} hover:${getStatusColor(cliente.status_cliente)}`}>
                      {cliente.status_cliente}
                    </Badge>
                    <Badge variant="outline">
                      {cliente.tipo_pessoa === 'PESSOA_FISICA' ? 'P. Física' : 'P. Jurídica'}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <strong>Doc:</strong> {cliente.documento}
                    </p>
                    {cliente.email && <p><strong>Email:</strong> {cliente.email}</p>}
                    {cliente.telefone && <p><strong>Fone:</strong> {cliente.telefone}</p>}
                    {cliente.cidade && <p><strong>Cidade:</strong> {cliente.cidade}</p>}
                    <p>
                      <strong>Desde:</strong> {formatDate(cliente.criado_em)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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