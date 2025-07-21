'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  Printer,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { ChatFlutuante } from '@/components/ui/chat-flutuante';

interface OrcamentoPublico {
  id: string;
  numero: string;
  nome_servico: string;
  descricao?: string;
  horas_producao: number;
  largura_produto?: number;
  altura_produto?: number;
  unidade_medida_produto?: string;
  area_produto?: number;
  custo_material: number;
  custo_mao_obra: number;
  custo_indireto: number;
  custo_total: number;
  margem_lucro: number;
  impostos: number;
  preco_final: number;
  status_aprovacao?: string;
  observacoes_cliente?: string;
  criado_em: string;
  cliente?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  itens?: Array<{
    id: string;
    insumo: {
      nome: string;
      unidade_medida: string;
    };
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
  }>;
  maquinas?: Array<{
    id: string;
    maquina: {
      nome: string;
      tipo: string;
    };
    horas_utilizadas: number;
    custo_total: number;
  }>;
  funcoes?: Array<{
    id: string;
    funcao: {
      nome: string;
    };
    horas_trabalhadas: number;
    custo_total: number;
  }>;
  loja?: {
    nome: string;
    logo_url?: string;
    telefone?: string;
    email?: string;
  };
}

export default function OrcamentoPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [orcamento, setOrcamento] = useState<OrcamentoPublico | null>(null);
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
      toast.error('Erro ao carregar o orçamento.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcaoCliente = async (acao: 'APROVAR' | 'REJEITAR' | 'NEGOCIAR') => {
    try {
      const response = await fetch(`http://localhost:3001/orcamentos/${id}/publico/acao`, {
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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Orçamento ${orcamento?.numero}`,
        text: `Orçamento ${orcamento?.numero} - ${orcamento?.nome_servico}`,
        url: window.location.href,
      });
    } catch {
      // Fallback para copiar link
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência');
    }
  };

  const handlePrint = () => {
    window.print();
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
        {/* Header com Logo e Timbrado */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {orcamento.loja?.logo_url && (
                <img 
                  src={orcamento.loja.logo_url} 
                  alt={orcamento.loja.nome}
                  className="h-12 w-auto"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{orcamento.loja?.nome}</h1>
                <p className="text-sm text-gray-600">Orçamento #{orcamento.numero}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Data: {new Date(orcamento.criado_em).toLocaleDateString('pt-BR')}</p>
              {orcamento.loja?.telefone && (
                <p className="text-sm text-gray-600">{orcamento.loja.telefone}</p>
              )}
              {orcamento.loja?.email && (
                <p className="text-sm text-gray-600">{orcamento.loja.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Ações - Logo após o header */}
        <div className="flex gap-2 mb-6 print:hidden">
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>

        {/* Status do Orçamento */}
        <div className="mb-6">
          <Card className="print:shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Status do Orçamento</h3>
                  <p className="text-sm text-gray-600">
                    {orcamento.status_aprovacao === 'PENDENTE' && 'Aguardando sua decisão'}
                    {orcamento.status_aprovacao === 'NEGOCIANDO' && 'Em negociação - Use o chat para conversar'}
                    {orcamento.status_aprovacao === 'APROVADO' && 'Orçamento aprovado'}
                    {orcamento.status_aprovacao === 'REJEITADO' && 'Orçamento rejeitado'}
                  </p>
                </div>
                <Badge 
                  variant={
                    orcamento.status_aprovacao === 'APROVADO' ? 'default' :
                    orcamento.status_aprovacao === 'REJEITADO' ? 'destructive' :
                    orcamento.status_aprovacao === 'NEGOCIANDO' ? 'secondary' : 'outline'
                  }
                  className={
                    orcamento.status_aprovacao === 'NEGOCIANDO' ? 'bg-blue-100 text-blue-800' :
                    orcamento.status_aprovacao === 'APROVADO' ? 'bg-green-100 text-green-800 border-green-200' :
                    orcamento.status_aprovacao === 'REJEITADO' ? 'bg-red-100 text-red-800' : ''
                  }
                >
                  {orcamento.status_aprovacao === 'PENDENTE' && '⏳ Pendente'}
                  {orcamento.status_aprovacao === 'NEGOCIANDO' && '🔄 Negociando'}
                  {orcamento.status_aprovacao === 'APROVADO' && '✅ Aprovado'}
                  {orcamento.status_aprovacao === 'REJEITADO' && '❌ Rejeitado'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cliente - Sidebar Direito */}
        {orcamento.cliente && (
          <div className="mb-6">
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{orcamento.cliente.nome}</p>
                {orcamento.cliente.email && (
                  <p className="text-sm text-muted-foreground">{orcamento.cliente.email}</p>
                )}
                {orcamento.cliente.telefone && (
                  <p className="text-sm text-muted-foreground">{orcamento.cliente.telefone}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabela de Produtos/Serviços - Largura Completa */}
        <Card className="print:shadow-none mb-6">
          <CardHeader>
            <CardTitle>Produtos e Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-semibold text-sm">QUANT.</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">PRODUTOS</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">UNID.</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">SUB-TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Item Principal do Serviço */}
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm">01</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{orcamento.nome_servico}</p>
                        {orcamento.descricao && (
                          <p className="text-sm text-gray-600">{orcamento.descricao}</p>
                        )}
                        {orcamento.area_produto && (
                          <p className="text-sm text-gray-600">Área: {orcamento.area_produto}m²</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm">{formatCurrency(orcamento.preco_final)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(orcamento.preco_final)}</td>
                  </tr>
                  
                  {/* Instalação (se aplicável) */}
                  {orcamento.horas_producao > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-sm">01</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">Serviço de Produção</p>
                          <p className="text-sm text-gray-600">{orcamento.horas_producao}h de produção</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm">Incluído</td>
                      <td className="py-3 px-4 text-right font-medium">Incluído</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={3} className="py-3 px-4 text-right font-bold text-lg">
                      Total R$
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-lg">
                      {formatCurrency(orcamento.preco_final)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>



        {/* Termos e Condições */}
        <div className="space-y-6">
          {/* Termos de Entrega e Pagamento */}
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Termos e Condições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">PRAZO DE ENTREGA</h4>
                  <p>10 a 15 dias úteis</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">FORMA DE PAGAMENTO</h4>
                  <p>40% de entrada, restante 3x cartão</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">VALIDADE DA PROPOSTA</h4>
                  <p>30 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Área de Aprovação do Cliente */}
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Aprovação do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-gray-300 p-4 rounded-lg">
                <p className="text-sm mb-4">
                  Concordo e Autorizo a produção do(s) item(s) acima discriminado(s)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Data:</label>
                    <div className="h-8 border-b border-gray-400"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ass. Cliente:</label>
                    <div className="h-8 border-b border-gray-400"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Agradecemos seu contato e estamos a disposição para maiores informações.</strong>
            </p>
            {orcamento.loja?.telefone && (
              <p>Telefone: {orcamento.loja.telefone}</p>
            )}
            {orcamento.loja?.email && (
              <p>Email: {orcamento.loja.email}</p>
            )}
            <p className="text-xs mt-4">
              <strong>Garantias e Condições:</strong> Garantia de 3 meses para componentes elétricos, 
              1 ano para ACM, PVC/ACM, INOX, 6 meses para impressão em lona. Cliente responsável por 
              pontos de energia para itens iluminados.
            </p>
          </div>
        </div>

        {/* Área de Aprovação do Cliente */}
        {orcamento.status_aprovacao !== 'APROVADO' && orcamento.status_aprovacao !== 'REJEITADO' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-6 print:hidden">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {orcamento.status_aprovacao === 'NEGOCIANDO' ? 'Negociação em Andamento' : 'Decisão do Cliente'}
                    </h3>
                    <Badge 
                      variant={orcamento.status_aprovacao === 'NEGOCIANDO' ? 'secondary' : 'outline'}
                      className={
                        orcamento.status_aprovacao === 'NEGOCIANDO' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    >
                      {orcamento.status_aprovacao === 'NEGOCIANDO' ? '🔄 Negociando' : '⏳ Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {orcamento.status_aprovacao === 'NEGOCIANDO' 
                      ? 'Você pode continuar negociando ou aprovar o orçamento atual'
                      : 'Escolha uma das opções abaixo para prosseguir com o orçamento'
                    }
                  </p>
                  {orcamento.status_aprovacao === 'NEGOCIANDO' && (
                    <p className="text-xs text-blue-600 mt-1">
                      💬 Use o chat flutuante para conversar com o vendedor
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleAcaoCliente('APROVAR')}
                    className="bg-green-600 hover:bg-green-700 px-6"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  {orcamento.status_aprovacao !== 'NEGOCIANDO' && (
                    <Button 
                      onClick={() => setShowNegociacao(true)}
                      variant="outline"
                      className="px-6"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Negociar
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleAcaoCliente('REJEITAR')}
                    variant="destructive"
                    className="px-6"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
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

        {/* Histórico de Mensagens */}
        {orcamento.status_aprovacao === 'NEGOCIANDO' && (
          <Card className="print:shadow-none mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Histórico de Conversa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  Este orçamento está em negociação. Use o chat flutuante para continuar a conversa.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowNegociacao(true)}
                    variant="outline"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Continuar Negociação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Flutuante para Cliente */}
        <ChatFlutuante orcamentoId={id} isPublic={true} />
      </div>
    </div>
  );
} 