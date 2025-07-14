'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Funcao {
  id: string;
  nome: string;
  custo_hora: number | string;
  descricao?: string;
  maquina_id?: string;
  maquina?: {
    nome: string;
  };
  criado_em: string;
}

export default function FuncoesPage() {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    funcaoId: string | null;
    funcaoNome: string;
  }>({
    open: false,
    funcaoId: null,
    funcaoNome: '',
  });

  useEffect(() => {
    fetchFuncoes();
  }, []);

  const fetchFuncoes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/funcoes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFuncoes(data);
      } else {
        toast.error('Erro ao carregar funções');
      }
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
      toast.error('Erro ao carregar funções');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/funcoes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Função excluída com sucesso!');
        fetchFuncoes();
      } else {
        // Tenta ler a mensagem de erro do backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erro ao excluir função';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao excluir função:', error);
      toast.error('Erro ao excluir função');
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      funcaoId: id,
      funcaoNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      funcaoId: null,
      funcaoNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.funcaoId) {
      await handleDelete(deleteDialog.funcaoId);
      closeDeleteDialog();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Funções</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as funções e seus custos operacionais.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Funções</h1>
        <p className="text-gray-600 mt-1">
          Gerencie as funções e seus custos operacionais.
        </p>
      </div>

      <div className="mb-6">
        <Link href="/configuracoes/funcoes/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Função
          </Button>
        </Link>
      </div>

      {funcoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">Nenhuma função cadastrada.</p>
            <Link href="/configuracoes/funcoes/novo">
              <Button>Cadastrar Primeira Função</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funcoes.map((funcao) => (
            <Card key={funcao.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{funcao.nome}</CardTitle>
                  <div className="flex space-x-2">
                    <Link href={`/configuracoes/funcoes/editar/${funcao.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(funcao.id, funcao.nome)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Custo por Hora:</span>
                    <p className="text-lg font-semibold">
                      R$ {typeof funcao.custo_hora === 'string' ? parseFloat(funcao.custo_hora).toFixed(2) : funcao.custo_hora.toFixed(2)}
                    </p>
                  </div>
                  
                  {funcao.maquina && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Máquina Vinculada:</span>
                      <p className="text-sm">{funcao.maquina.nome}</p>
                    </div>
                  )}
                  
                  {funcao.descricao && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Descrição:</span>
                      <p className="text-sm text-gray-600">{funcao.descricao}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500">Criado em:</span>
                    <p className="text-sm text-gray-600">
                      {new Date(funcao.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Função"
        description={`Tem certeza que deseja excluir a função "${deleteDialog.funcaoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
} 