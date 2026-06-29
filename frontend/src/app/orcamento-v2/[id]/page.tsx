'use client';

import { useState, useEffect, Fragment } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, MessageCircle, FileText, Phone, Mail, Printer, Share2, X } from 'lucide-react';
import { ChatFlutuante } from '@/components/ui/chat-flutuante';
import { ShareButton } from '@/components/ui/share-button';
import { resolverTextoCondicaoPagamento } from '@/lib/condicao-pagamento-descricao';
import { resolveAssetUrl } from '@/lib/config';

interface LinhaArtePdf {
  descricao: string;
  horas?: number | null;
  custo_hora?: number | null;
  preco_unitario: number;
  preco_total: number;
}

interface ProdutoOrcamento {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  unidade: string;
  largura?: number;
  altura?: number;
  area?: number;
  preco_unitario: number;
  preco_total: number;
  margem_lucro: number;
  impostos: number;
  observacoes?: string;
  linha_arte?: LinhaArtePdf | null;
}

interface OrcamentoV2 {
  id: string;
  numero: string;
  nome_servico: string;
  descricao?: string;
  preco_final: number;
  quantidade_produto?: number;
  unidade_medida_produto?: string;
  criado_em: string;
  status: string;
  status_aprovacao: string;
  observacoes_cliente?: string;
  
  // Produtos do orçamento
  produtos?: ProdutoOrcamento[];
  
  // Dados do cliente
  cliente?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
  };
  
  // Dados da loja
  loja?: {
    nome: string;
    email?: string;
    telefone?: string;
    logo_url?: string;
    cnpj?: string;
  };
  
  // Condições comerciais
  prazo_entrega?: string;
  forma_pagamento?: string;
  condicao_pagamento_tipo?: string;
  condicao_pagamento_entrada_pct?: number;
  condicao_pagamento_parcelas?: number;
  condicao_pagamento_descricao?: string;
  validade_proposta?: string;
  atendente?: string;
  observacoes?: string;
  entrega_valor_cobrado?: number;
  entrega_modalidade_nome?: string | null;
}

export default function OrcamentoV2PublicoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const modoSalvarPdf = searchParams.get('salvarPdf') === '1';
  const [orcamento, setOrcamento] = useState<OrcamentoV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [aprovando, setAprovando] = useState(false);
  const [rejeitando, setRejeitando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [mostrarChat, setMostrarChat] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [codigoAprovacao, setCodigoAprovacao] = useState('');

  useEffect(() => {
    const fetchOrcamento = async () => {
      try {
        const response = await fetch(`/api/orcamentos-v2/${params.id}/publico`);
        if (!response.ok) {
          throw new Error('Orçamento não encontrado');
        }
        const data = await response.json();
        setOrcamento(data);
      } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        toast.error('Erro ao carregar orçamento');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrcamento();
    }
  }, [params.id]);

  const handleAprovar = async () => {
    const codigoLimpo = codigoAprovacao.trim().toUpperCase();
    if (!codigoLimpo) {
      toast.error('Digite o código de aprovação recebido por email');
      return;
    }

    if (codigoLimpo.length !== 8) {
      toast.error('Código de aprovação deve ter 8 caracteres');
      return;
    }

    setAprovando(true);
    try {
      const response = await fetch(`/api/orcamentos-v2/${orcamento?.id}/publico/acao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acao: 'APROVAR',
          codigo_aprovacao: codigoLimpo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao aprovar orçamento');
      }

      const data = await response.json();
      setOrcamento(data);
      toast.success('Orçamento aprovado com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar orçamento');
    } finally {
      setAprovando(false);
    }
  };

  const handleRejeitar = async () => {
    if (!motivoRejeicao.trim()) {
      toast.error('Digite o motivo da rejeição');
      return;
    }

    setRejeitando(true);
    try {
      const response = await fetch(`/api/orcamentos-v2/${orcamento?.id}/publico/acao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acao: 'REJEITAR',
          observacoes: motivoRejeicao,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao rejeitar orçamento');
      }

      const data = await response.json();
      setOrcamento(data);
      toast.success('Orçamento rejeitado. Obrigado pelo feedback!');
    } catch (error) {
      console.error('Erro ao rejeitar orçamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao rejeitar orçamento');
    } finally {
      setRejeitando(false);
    }
  };

  const handleNegociar = async () => {
    try {
      const response = await fetch(`/api/orcamentos-v2/${orcamento?.id}/publico/acao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acao: 'NEGOCIAR',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao iniciar negociação');
      }

      const data = await response.json();
      setOrcamento(data);
      setMostrarChat(true);
      toast.success('Negociação iniciada! Use o chat para conversar com o vendedor.');
    } catch (error) {
      console.error('Erro ao iniciar negociação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar negociação');
    }
  };

  const handleReenviarCodigo = async () => {
    setReenviando(true);
    try {
      const response = await fetch(`/api/orcamentos-v2/${orcamento?.id}/reenviar-codigo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao reenviar código');
      }

      await response.json();
      toast.success('Código de aprovação reenviado com sucesso! Verifique seu email.');
    } catch (error) {
      console.error('Erro ao reenviar código:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao reenviar código');
    } finally {
      setReenviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Orçamento não encontrado</h1>
          <p className="text-gray-600">O orçamento solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  console.log('🔍 Debug - Orçamento completo:', orcamento);
  console.log('🔍 Debug - Status do orçamento:', orcamento.status);
  console.log('🔍 Debug - Status aprovação:', orcamento.status_aprovacao);

  // Usar valores corretos do banco em vez de recalcular
  const usarValoresCorretosDoBanco = (produtos: any[]) => {
    if (!produtos || produtos.length === 0) return produtos;

    console.log('🔍 Debug - Usando valores corretos do banco:', {
      produtosCount: produtos.length,
      produtosDetalhados: produtos.map(p => ({
        nome: p.nome,
        quantidade: p.quantidade,
        custo_total_producao: p.custo_total_producao,
        preco_unitario_banco: p.preco_unitario,
        preco_total_banco: p.preco_total,
        preco_unitario_final: Number(p.preco_unitario) || 0,
        preco_total_final: Number(p.preco_total) || 0,
        margem_lucro: p.margem_lucro,
        impostos: p.impostos
      }))
    });
    
    // Log individual detalhado de cada produto
    produtos.forEach((produto, index) => {
      console.log(`🔍 Debug - Produto ${index + 1} detalhado:`, {
        nome: produto.nome,
        quantidade: produto.quantidade,
        custo_total_producao: produto.custo_total_producao,
        preco_unitario: produto.preco_unitario,
        preco_total: produto.preco_total,
        preco_unitario_number: Number(produto.preco_unitario),
        preco_total_number: Number(produto.preco_total),
        margem_lucro: produto.margem_lucro,
        impostos: produto.impostos,
        // Valores brutos para debug
        preco_unitario_raw: produto.preco_unitario,
        preco_total_raw: produto.preco_total,
        custo_total_producao_raw: produto.custo_total_producao
      });
    });

    return produtos.map(produto => ({
      ...produto,
      preco_unitario: Number(produto.preco_unitario) || 0,
      preco_total: Number(produto.preco_total) || 0,
      linha_arte: produto.linha_arte
        ? {
            ...produto.linha_arte,
            preco_unitario: Number(produto.linha_arte.preco_unitario) || 0,
            preco_total: Number(produto.linha_arte.preco_total) || 0,
            horas:
              produto.linha_arte.horas != null
                ? Number(produto.linha_arte.horas)
                : null,
            custo_hora:
              produto.linha_arte.custo_hora != null
                ? Number(produto.linha_arte.custo_hora)
                : null,
          }
        : null,
    }));
  };

  // Usar valores corretos do banco em vez de recalcular
  const produtosComPrecosCorretos = orcamento.produtos && orcamento.produtos.length > 0 
    ? usarValoresCorretosDoBanco(orcamento.produtos)
    : [];
  const valorEntrega = Number(orcamento.entrega_valor_cobrado) || 0;
  const nomeModalidadeEntrega = orcamento.entrega_modalidade_nome?.trim() || '';
  const exibirLinhaEntrega = valorEntrega > 0;
  
  const jaAprovado = orcamento.status_aprovacao === 'APROVADO';
  const jaRejeitado = orcamento.status_aprovacao === 'REJEITADO';
  const emNegociacao = orcamento.status_aprovacao === 'NEGOCIANDO';
  const emRascunho = orcamento.status === 'rascunho';
  const podeInteragir = !jaAprovado && !jaRejeitado && !emRascunho;
  
  // Mostrar chat automaticamente se o orçamento ainda não foi aprovado ou rejeitado
  const deveMostrarChat = !jaAprovado && !jaRejeitado && !emRascunho;

  return (
    <>
      {/* Estilos específicos para impressão */}
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:p-4 { padding: 1rem !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:hidden { display: none !important; }
          
          /* Configuração de página A4 */
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          /* Quebra de página */
          .page-break {
            page-break-before: always;
          }
          
          /* Forçar cores de fundo em impressão */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
      
      {/* Página A4 para Impressão */}
      {modoSalvarPdf && (
        <header className="print:hidden sticky top-0 z-50 border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-[210mm] flex-col items-stretch justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Salvar PDF</h1>
                <p className="text-xs text-muted-foreground">
                  Revise o orçamento e use o botão ao lado para salvar o PDF.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Salvar como PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.close()}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
      )}

      <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none" style={{ minHeight: '297mm' }}>
          {/* Header da Empresa */}
          <div className="border-b-2 border-gray-300 p-6 print:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {resolveAssetUrl(orcamento.loja?.logo_url) ? (
                  <img 
                    src={resolveAssetUrl(orcamento.loja?.logo_url)!} 
                    alt="Logo" 
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {orcamento.loja?.nome?.charAt(0) || 'C'}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{orcamento.loja?.nome || 'Comunikapp'}</h1>
                  {orcamento.loja?.cnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {orcamento.loja.cnpj}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900">ORÇAMENTO</h2>
                <p className="text-lg text-gray-600">#{orcamento.numero}</p>
                <p className="text-sm text-gray-500">
                  {new Date(orcamento.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="p-6 print:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Dados do Cliente</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>Nome:</strong> {orcamento.cliente?.nome || 'Não informado'}
                  </p>
                  <p className="text-gray-700">
                    <strong>Email:</strong> {orcamento.cliente?.email || 'Não informado'}
                  </p>
                  {orcamento.cliente?.telefone && (
                    <p className="text-gray-700">
                      <strong>Telefone:</strong> {orcamento.cliente.telefone}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contato da Empresa</h3>
                <div className="space-y-2">
                  {orcamento.loja?.telefone && (
                    <p className="text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {orcamento.loja.telefone}
                    </p>
                  )}
                  {orcamento.loja?.email && (
                    <p className="text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {orcamento.loja.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabela de Produtos */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-3 py-2 text-center font-semibold">QTD</th>
                    <th className="border border-gray-400 px-3 py-2 text-left font-semibold">DESCRIÇÃO</th>
                    <th className="border border-gray-400 px-3 py-2 text-center font-semibold">PREÇO UNIT.</th>
                    <th className="border border-gray-400 px-3 py-2 text-right font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Se há produtos específicos, mostrar cada um */}
                  {produtosComPrecosCorretos && produtosComPrecosCorretos.length > 0 ? (
                    produtosComPrecosCorretos.map((produto, index) => (
                      <Fragment key={produto.id || index}>
                        <tr>
                          <td className="border border-gray-400 px-3 py-2 text-center">
                            {String(produto.quantidade || 1).padStart(2, '0')}
                          </td>
                          <td className="border border-gray-400 px-3 py-2">
                            <div className="font-bold text-gray-900">{produto.nome}</div>
                            {produto.descricao && (
                              <div className="text-sm text-gray-600 mt-1">{produto.descricao}</div>
                            )}
                            {/* Dimensões se disponíveis */}
                            {(produto.largura || produto.altura) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {produto.largura && produto.altura 
                                  ? `${produto.largura} x ${produto.altura} cm`
                                  : produto.largura 
                                    ? `Largura: ${produto.largura} cm`
                                    : `Altura: ${produto.altura} cm`
                                }
                              </div>
                            )}
                            {produto.observacoes && (
                              <div className="text-xs text-gray-500 mt-1 italic">
                                Obs: {produto.observacoes}
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-center">
                            {formatCurrency(produto.preco_unitario)}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-right font-medium">
                            {formatCurrency(produto.preco_total)}
                          </td>
                        </tr>
                        {produto.linha_arte && (
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-center">01</td>
                            <td className="border border-gray-400 px-3 py-2">
                              <div className="font-bold text-gray-900">
                                {produto.linha_arte.descricao}
                              </div>
                              {produto.linha_arte.horas != null && produto.linha_arte.horas > 0 && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {produto.linha_arte.custo_hora != null &&
                                  produto.linha_arte.custo_hora > 0
                                    ? `${produto.linha_arte.horas} h × ${formatCurrency(produto.linha_arte.custo_hora)}`
                                    : `${produto.linha_arte.horas} h`}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-400 px-3 py-2 text-center">
                              {formatCurrency(produto.linha_arte.preco_unitario)}
                            </td>
                            <td className="border border-gray-400 px-3 py-2 text-right font-medium">
                              {formatCurrency(produto.linha_arte.preco_total)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  ) : (
                    /* Fallback para orçamento legado (produto único) */
                    <tr>
                      <td className="border border-gray-400 px-3 py-2 text-center">
                        {String(orcamento.quantidade_produto || '01').padStart(2, '0')}
                      </td>
                      <td className="border border-gray-400 px-3 py-2">
                        <div className="font-bold text-gray-900">{orcamento.nome_servico}</div>
                        {orcamento.descricao && (
                          <div className="text-sm text-gray-600 mt-1">{orcamento.descricao}</div>
                        )}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center">
                        {formatCurrency(
                          Math.max(
                            0,
                            Number(orcamento.preco_final) - valorEntrega,
                          ) / (orcamento.quantidade_produto || 1),
                        )}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right font-medium">
                        {formatCurrency(Math.max(0, Number(orcamento.preco_final) - valorEntrega))}
                      </td>
                    </tr>
                  )}
                  {exibirLinhaEntrega && (
                    <tr>
                      <td className="border border-gray-400 px-3 py-2 text-center">01</td>
                      <td className="border border-gray-400 px-3 py-2">
                        <div className="font-bold text-gray-900">Entrega</div>
                        {nomeModalidadeEntrega ? (
                          <div className="text-sm text-gray-600 mt-1">
                            {nomeModalidadeEntrega}
                          </div>
                        ) : null}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center">
                        {formatCurrency(valorEntrega)}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right font-medium">
                        {formatCurrency(valorEntrega)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="border border-gray-400 px-3 py-2 text-right font-bold">
                      Total R$
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-right font-bold text-lg">
                      {formatCurrency(orcamento.preco_final)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Condições Comerciais */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-gray-400">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 font-semibold bg-gray-100 w-1/4">
                      PRAZO DE ENTREGA
                    </td>
                    <td className="border border-gray-400 px-3 py-2">
                      {orcamento.prazo_entrega || '10 a 15 dias úteis'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 font-semibold bg-gray-100">
                      FORMA DE PAGAMENTO
                    </td>
                    <td className="border border-gray-400 px-3 py-2">
                      {resolverTextoCondicaoPagamento(orcamento)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 font-semibold bg-gray-100">
                      VALIDADE DA PROPOSTA
                    </td>
                    <td className="border border-gray-400 px-3 py-2">
                      {orcamento.validade_proposta || '30 dias'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 font-semibold bg-gray-100">
                      ATENDENTE
                    </td>
                    <td className="border border-gray-400 px-3 py-2">
                      {orcamento.atendente || 'Equipe Comercial'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Status Badge */}
            <div className="mb-6 text-center print:hidden">
              <div className="flex flex-col items-center gap-4">
                {jaAprovado && (
                  <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    ORÇAMENTO APROVADO
                  </Badge>
                )}
                {jaRejeitado && (
                  <Badge className="bg-red-100 text-red-800 text-lg px-4 py-2">
                    <XCircle className="w-5 h-5 mr-2" />
                    ORÇAMENTO REJEITADO
                  </Badge>
                )}
                {emNegociacao && (
                  <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    EM NEGOCIAÇÃO
                  </Badge>
                )}
                
                {/* Botão de compartilhar sempre disponível para orçamentos finalizados */}
                {(jaAprovado || jaRejeitado) && (
                  <ShareButton
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    title={`Orçamento #${orcamento.numero} - ${orcamento.nome_servico}`}
                    text={`Confira este orçamento de ${orcamento.nome_servico} no valor de ${formatCurrency(orcamento.preco_final)}`}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </ShareButton>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            {podeInteragir ? (
              <div className="mb-6 print:hidden">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-center text-gray-600 mb-4">
                    Escolha uma das opções abaixo para prosseguir com este orçamento:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
                    {/* Aprovar */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 text-white h-16 flex flex-col items-center justify-center gap-2">
                          <CheckCircle className="h-6 w-6" />
                          <span className="font-semibold">APROVAR</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aprovar Orçamento</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Digite o código de aprovação que foi enviado para seu email:</p>
                          <div>
                            <Label htmlFor="codigo">Código de Aprovação</Label>
                            <Input
                              id="codigo"
                              value={codigoAprovacao}
                              onChange={(e) => setCodigoAprovacao(e.target.value.toUpperCase())}
                              placeholder="Digite o código de 8 caracteres"
                              className="mt-1"
                              maxLength={8}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleAprovar}
                              disabled={aprovando || !codigoAprovacao.trim()}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              {aprovando ? 'Aprovando...' : 'Confirmar Aprovação'}
                            </Button>
                            <Button 
                              onClick={handleReenviarCodigo}
                              disabled={reenviando}
                              variant="outline"
                              className="flex-1"
                            >
                              {reenviando ? 'Enviando...' : 'Reenviar Código'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Rejeitar */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 h-16 flex flex-col items-center justify-center gap-2">
                          <XCircle className="h-6 w-6" />
                          <span className="font-semibold">REJEITAR</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rejeitar Orçamento</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Por favor, nos informe o motivo da rejeição para que possamos melhorar:</p>
                          <div>
                            <Label htmlFor="motivo">Motivo da rejeição</Label>
                            <Textarea
                              id="motivo"
                              value={motivoRejeicao}
                              onChange={(e) => setMotivoRejeicao(e.target.value)}
                              placeholder="Explique brevemente o motivo..."
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          <Button 
                            onClick={handleRejeitar}
                            disabled={rejeitando || !motivoRejeicao.trim()}
                            className="w-full bg-red-600 hover:bg-red-700"
                          >
                            {rejeitando ? 'Rejeitando...' : 'Confirmar Rejeição'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Negociar */}
                    <Button 
                      onClick={handleNegociar}
                      variant="outline" 
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 h-16 flex flex-col items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-6 w-6" />
                      <span className="font-semibold">NEGOCIAR</span>
                    </Button>

                    {/* Gerar PDF */}
                    <Button 
                      onClick={() => window.print()}
                      variant="outline" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 h-16 flex flex-col items-center justify-center gap-2"
                    >
                      <FileText className="h-6 w-6" />
                      <span className="font-semibold">GERAR PDF</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Observações Finais */}
            <div className="text-xs text-gray-600 space-y-2">
              <p className="font-semibold">
                A empresa reserva-se o direito de faturar boleto / cheque somente após análise do crédito do cliente
              </p>
              
              {orcamento.loja?.email && (
                <p className="text-center">
                  <a href={`mailto:${orcamento.loja.email}`} className="text-blue-600 underline">
                    {orcamento.loja.email}
                  </a>
                </p>
              )}

              {/* Área de Assinatura */}
              <div className="mt-8 border border-gray-400 rounded p-4">
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <p className="mb-2 font-semibold">Concordo e Autorizo a produção do(s) item(s) acima discriminado(s)</p>
                    <div className="border-b border-gray-400 mt-8 mb-2"></div>
                    <p className="text-xs">Data: ___/___/_______</p>
                  </div>
                  <div className="text-center">
                    <p className="mb-2 font-semibold">Ass. Cliente:</p>
                    <div className="border-b border-gray-400 mt-8 mb-2"></div>
                    <p className="text-xs">_________________________________</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <p>Agradecemos seu contato e estamos à disposição para maiores informações.</p>
                {orcamento.loja?.telefone && (
                  <p className="mt-1">{orcamento.loja.telefone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Flutuante */}
      {deveMostrarChat && orcamento && (
        <ChatFlutuante
          orcamentoId={orcamento.id}
          isPublic={true}
          shouldOpen={emNegociacao || mostrarChat}
        />
      )}
    </>
  );
}
