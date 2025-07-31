'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/data-table/data-table';
import { OrcamentoCard } from '@/components/ui/orcamento-card';
import { Plus, Table, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { createColumns, type Orcamento } from './columns';
import { apiRequest } from '@/lib/api';

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');


  const carregarOrcamentos = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/orcamentos');
      if (!response.ok) {
        throw new Error('Erro ao carregar orçamentos');
      }
      const data = await response.json();
      setOrcamentos(data);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    carregarOrcamentos();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await apiRequest(`/orcamentos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Erro ao excluir orçamento');
      }
      toast.success('Orçamento excluído com sucesso');
      carregarOrcamentos();
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast.error('Erro ao excluir orçamento');
    }
  };

  const handleShare = async (orcamento: Orcamento) => {
    try {
      // Gerar URL pública diretamente
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const url = `${baseUrl}/orcamento/${orcamento.id}`;
      
      // Dados para compartilhamento
      const shareData = {
        title: `Orçamento #${orcamento.numero} - ${orcamento.nome_servico}`,
        text: `Confira este orçamento de ${orcamento.nome_servico} no valor de ${orcamento.preco_final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        url: url
      };
      
      // Detecção melhorada de dispositivos que suportam compartilhamento nativo
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      const isSmallScreen = window.screen.width <= 768;
      
      const shouldUseNativeShare = navigator.share && (isMobileDevice || isTouchDevice || isPWA || isSmallScreen);
      
      if (shouldUseNativeShare) {
        await navigator.share(shareData);
        toast.success('📱 Orçamento compartilhado com sucesso!');
      } else {
        // Fallback: copiar para clipboard
        await navigator.clipboard.writeText(url);
        toast.success('📋 Link copiado para a área de transferência');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      
      // Se o compartilhamento nativo falhou, tentar copiar para clipboard como fallback
      if (error.name === 'AbortError') {
        // Usuário cancelou o compartilhamento
        toast.info('Compartilhamento cancelado');
        return;
      }
      
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const url = `${baseUrl}/orcamento/${orcamento.id}`;
        await navigator.clipboard.writeText(url);
        toast.success('📋 Link copiado para a área de transferência');
      } catch (clipboardError) {
        console.error('Erro no clipboard:', clipboardError);
        toast.error('Erro ao compartilhar orçamento');
      }
    }
  };

  const columns = createColumns(handleDelete, handleShare);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-gray-600">Gerencie seus orçamentos e propostas comerciais.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botões de visualização */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
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
          
          {/* Botão novo orçamento */}
          <Link href="/orcamentos/novo">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      {orcamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum orçamento encontrado</h3>
              <p className="text-gray-600 mb-4">Comece criando seu primeiro orçamento.</p>
              <Link href="/orcamentos/novo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Orçamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <DataTable columns={columns} data={orcamentos} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orcamentos.map((orcamento) => (
            <OrcamentoCard
              key={orcamento.id}
              orcamento={orcamento}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
    </div>
  );
} 