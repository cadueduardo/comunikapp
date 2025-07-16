'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Eye, Edit, Trash2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface Orcamento {
  id: string;
  numero: string;
  nome_servico: string;
  descricao?: string;
  preco_final: number;
  criado_em: string;
  status_aprovacao?: string;
  cliente?: {
    id: string;
    nome: string;
  };
}

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    orcamentoId: string | null;
    orcamentoNome: string;
  }>({
    open: false,
    orcamentoId: null,
    orcamentoNome: '',
  });

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  const fetchOrcamentos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await fetch('http://localhost:3001/orcamentos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar orçamentos.');
      }

      const data = await response.json();
      setOrcamentos(data);
    } catch (error) {
      toast.error('Erro ao carregar orçamentos.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await fetch(`http://localhost:3001/orcamentos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Orçamento excluído com sucesso!');
        fetchOrcamentos();
      } else {
        // Tenta ler a mensagem de erro do backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Falha ao excluir orçamento.';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Erro ao excluir orçamento.');
      console.error(error);
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      orcamentoId: id,
      orcamentoNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      orcamentoId: null,
      orcamentoNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.orcamentoId) {
      await handleDelete(deleteDialog.orcamentoId);
      closeDeleteDialog();
    }
  };

  const handleShare = async (orcamento: Orcamento) => {
    try {
      const publicUrl = `${window.location.origin}/orcamento/${orcamento.id}`;
      
      // Tenta usar a Web Share API
      if (navigator.share) {
        await navigator.share({
          title: `Orçamento ${orcamento.numero}`,
          text: `Confira o orçamento ${orcamento.nome_servico}`,
          url: publicUrl,
        });
      } else {
        // Fallback: copia para clipboard
        await navigator.clipboard.writeText(publicUrl);
        toast.success('Link público copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao compartilhar orçamento.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus orçamentos e propostas comerciais.
          </p>
        </div>
        <Link href="/orcamentos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      <Separator className="mb-6" />

      {orcamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum orçamento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro orçamento para testar o motor de cálculo.
              </p>
              <Link href="/orcamentos/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Orçamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orcamentos.map((orcamento) => (
            <Card key={orcamento.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{orcamento.nome_servico}</h3>
                      <Badge variant="secondary">#{orcamento.numero}</Badge>
                      {orcamento.status_aprovacao && orcamento.status_aprovacao !== 'PENDENTE' && (
                        <Badge 
                          variant={
                            orcamento.status_aprovacao === 'APROVADO' ? 'default' :
                            orcamento.status_aprovacao === 'REJEITADO' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {orcamento.status_aprovacao === 'APROVADO' ? '✓ Aprovado' :
                           orcamento.status_aprovacao === 'REJEITADO' ? '✗ Rejeitado' :
                           orcamento.status_aprovacao === 'NEGOCIANDO' ? '🔄 Negociando' :
                           orcamento.status_aprovacao}
                        </Badge>
                      )}
                    </div>
                    
                    {orcamento.descricao && (
                      <p className="text-muted-foreground mb-3">{orcamento.descricao}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {orcamento.cliente && (
                        <span>Cliente: {orcamento.cliente.nome}</span>
                      )}
                      <span>
                        Criado em: {new Date(orcamento.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(orcamento.preco_final)}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleShare(orcamento)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Link href={`/orcamentos/${orcamento.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/orcamentos/${orcamento.id}/editar`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openDeleteDialog(orcamento.id, orcamento.nome_servico)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Orçamento"
        description={`Tem certeza que deseja excluir o orçamento "${deleteDialog.orcamentoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
} 