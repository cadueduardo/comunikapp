'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { ItemProdutoAccordion } from '@/components/ui/item-produto-accordion';

interface Loja {
  nome: string;
  logo_url?: string;
  telefone?: string;
  email?: string;
}

interface Orcamento {
  id: string;
  numero: string;
  preco_final: number;
  criado_em: string;
  status_aprovacao?: string;
  condicoes_comerciais?: string;
  observacoes_cliente?: string;
  cliente?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  loja: Loja;
  itens_produto?: Array<{
    id: string;
    nome_servico: string;
    descricao?: string;
    largura_produto?: number;
    altura_produto?: number;
    unidade_medida_produto?: string;
    area_produto?: number;
    custo_material: number;
    custo_mao_obra: number;
    custo_indireto: number;
    custo_total: number;
    preco_final: number;
    ordem: number;
    itens_insumo?: Array<{
      id: string;
      insumo: {
        nome: string;
        unidade_medida: string;
      };
      quantidade: number;
      custo_unitario: number;
      custo_total: number;
    }>;
  }>;
}

export default function OrcamentoPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNegociacao, setShowNegociacao] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchOrcamento();
  }, [id]);

  const fetchOrcamento = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/orcamentos/${id}/publico`);
      
      if (response.ok) {
        const data = await response.json();
        setOrcamento(data);
      } else {
        toast.error('Orçamento não encontrado ou não está disponível.');
      }
    } catch (err) {
      toast.error('Ocorreu um erro ao carregar o orçamento.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Orçamento ${orcamento?.numero}`,
        text: `Confira o orçamento da ${orcamento?.loja.nome}`,
        url: window.location.href,
      });
    } catch {
      // Fallback para copiar link
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implementar geração de PDF
    toast.info('Funcionalidade de PDF em desenvolvimento.');
  };

  const handleAcaoCliente = async (acao: 'APROVAR' | 'REJEITAR' | 'NEGOCIAR') => {
    try {
      const response = await fetch(`http://localhost:3001/orcamentos/${id}/acao-cliente`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acao,
          observacoes: acao === 'NEGOCIAR' ? observacoes : undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // Recarregar o orçamento para atualizar o status
        await fetchOrcamento();
        setShowNegociacao(false);
        setObservacoes('');
      } else {
        toast.error('Erro ao processar ação');
      }
    } catch (err) {
      toast.error('Erro ao processar ação');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Orçamento não encontrado</h2>
          <p className="text-muted-foreground">
            O orçamento que você está procurando não existe ou não está disponível.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header com Timbrado */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {orcamento.loja.logo_url && (
                <img 
                  src={`http://localhost:3001${orcamento.loja.logo_url}`}
                  alt={orcamento.loja.nome}
                  className="h-16 w-auto object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{orcamento.loja.nome}</h1>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  {orcamento.loja.telefone && (
                    <span>{orcamento.loja.telefone}</span>
                  )}
                  {orcamento.loja.email && (
                    <span>{orcamento.loja.email}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">#{orcamento.numero}</Badge>
              <p className="text-sm text-gray-600">
                {new Date(orcamento.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Cliente */}
        {orcamento.cliente && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3">Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{orcamento.cliente.nome}</p>
                {orcamento.cliente.email && (
                  <p className="text-sm text-gray-600">{orcamento.cliente.email}</p>
                )}
              </div>
              {orcamento.cliente.telefone && (
                <div>
                  <p className="text-sm text-gray-600">{orcamento.cliente.telefone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Título do Orçamento */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Orçamento #{orcamento.numero}</h2>
          
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold text-green-600">
              {formatCurrency(orcamento.preco_final)}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Itens do Orçamento - Accordion */}
        {orcamento.itens_produto && orcamento.itens_produto.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Itens do Orçamento</h3>
            <div className="space-y-4">
              {orcamento.itens_produto
                .sort((a, b) => a.ordem - b.ordem)
                .map((item) => (
                  <ItemProdutoAccordion
                    key={item.id}
                    item={item}
                    isEditable={false}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Resumo do Orçamento */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Condições Comerciais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">PRAZO DE ENTREGA</p>
              <p className="font-medium">10 a 15 dias úteis</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">FORMA DE PAGAMENTO</p>
              <p className="font-medium">40% de entrada, restante em até 3x</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">VALIDADE DA PROPOSTA</p>
              <p className="font-medium">30 dias</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">ATENDENTE</p>
              <p className="font-medium">Sistema</p>
            </div>
          </div>
          
          {orcamento.condicoes_comerciais && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">CONDIÇÕES ESPECIAIS</p>
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {orcamento.condicoes_comerciais}
              </div>
            </div>
          )}
        </div>

        {/* Status da Aprovação */}
        {orcamento.status_aprovacao && orcamento.status_aprovacao !== 'PENDENTE' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3">Status do Orçamento</h3>
            <div className="flex items-center gap-3">
              <Badge 
                variant={
                  orcamento.status_aprovacao === 'APROVADO' ? 'default' :
                  orcamento.status_aprovacao === 'REJEITADO' ? 'destructive' :
                  'secondary'
                }
                className="text-sm"
              >
                {orcamento.status_aprovacao}
              </Badge>
            </div>
            {orcamento.observacoes_cliente && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Observações:</span> {orcamento.observacoes_cliente}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer com Decisão do Cliente - Largura Total */}
      {orcamento.status_aprovacao === 'PENDENTE' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Decisão do Cliente</h3>
                <p className="text-sm text-gray-600">
                  Escolha uma das opções abaixo para prosseguir com o orçamento
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleAcaoCliente('APROVAR')}
                  className="bg-green-600 hover:bg-green-700 px-6"
                >
                  Aprovar
                </Button>
                <Button 
                  onClick={() => setShowNegociacao(true)}
                  variant="outline"
                  className="px-6"
                >
                  Negociar
                </Button>
                <Button 
                  onClick={() => handleAcaoCliente('REJEITAR')}
                  variant="destructive"
                  className="px-6"
                >
                  Rejeitar
                </Button>
              </div>
            </div>

            {/* Modal de Negociação */}
            {showNegociacao && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Observações para negociação:</label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full mt-2 p-3 border rounded-md"
                      rows={4}
                      placeholder="Descreva as alterações que gostaria de fazer no orçamento..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleAcaoCliente('NEGOCIAR')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Enviar Negociação
                    </Button>
                    <Button 
                      onClick={() => setShowNegociacao(false)}
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 