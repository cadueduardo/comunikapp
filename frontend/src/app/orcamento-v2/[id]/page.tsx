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
import { formatCpf, formatCnpj } from '@/lib/cpf-cnpj';
import {
  TimbradoCabecalhoDocumento,
  TimbradoRodapeDocumento,
} from '@/components/configuracoes/TimbradoPreview';

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
  unidade_geometria?: 'mm' | 'cm' | 'm' | null;
  area?: number;
  preco_unitario: number;
  preco_total: number;
  observacoes?: string;
  linha_arte?: LinhaArtePdf | null;
}

function formatarDimensoesProduto(produto: ProdutoOrcamento): string {
  const unidade = ['mm', 'cm', 'm'].includes(produto.unidade_geometria || '')
    ? produto.unidade_geometria
    : 'cm';

  if (produto.largura && produto.altura) {
    return `${produto.largura} x ${produto.altura} ${unidade}`;
  }

  return produto.largura
    ? `Largura: ${produto.largura} ${unidade}`
    : `Altura: ${produto.altura} ${unidade}`;
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
  
  cliente?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    tipo_pessoa?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
    documento?: string;
    razao_social?: string;
    nome_fantasia?: string;
    responsavel?: string;
    cargo_responsavel?: string;
    whatsapp?: string;
  };
  
  // Dados da loja
  loja?: {
    nome: string;
    nome_fantasia?: string | null;
    razao_social?: string | null;
    email?: string;
    telefone?: string;
    logo_url?: string;
    cnpj?: string | null;
    cpf?: string | null;
    inscricao_estadual?: string | null;
    inscricao_municipal?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    site_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    linkedin_url?: string | null;
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
    // O código é sensível a maiúsculas/minúsculas: só espaços acidentais de
    // cópia são removidos. O tamanho não é validado aqui — quem decide se o
    // código vale é o backend, e antecipar a regra no cliente só criaria mais
    // um lugar para desatualizar.
    const codigoLimpo = codigoAprovacao.trim();
    if (!codigoLimpo) {
      toast.error('Informe o código de aprovação recebido por e-mail');
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
      // Sem `console.error(error)` com o objeto inteiro: em falha de rede o
      // fetch pode carregar a requisição, e com ela o código, para o console.
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar orçamento');
    } finally {
      // Limpa o código do estado assim que a requisição termina, com sucesso
      // ou não. Em caso de sucesso ele já foi consumido e não vale mais; em
      // caso de falha, colar de novo custa menos do que manter o segredo vivo
      // na memória da aba, em snapshot de devtools ou em extensão do navegador.
      setCodigoAprovacao('');
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

  // Gate 0S / HS-02 e HS-06: aqui havia três blocos de `console.log` que
  // despejavam o orçamento inteiro, o custo de produção, a margem e os impostos
  // de cada produto no console do navegador — do cliente final, numa página
  // anônima. Nenhum desses campos era renderizado; eram só depuração. O backend
  // deixou de enviá-los, e os logs saíram junto.
  const usarValoresCorretosDoBanco = (produtos: any[]) => {
    if (!produtos || produtos.length === 0) return produtos;

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
      {/* Estilos específicos para impressão / PDF */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 0;
          }

          /* Timbrado fixo em todas as páginas impressas */
          .orcamento-print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 20;
            background: white;
          }
          .orcamento-print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 20;
            background: white;
          }
          .orcamento-print-body {
            padding-top: 42mm;
            padding-bottom: 28mm;
          }

          .page-break {
            page-break-before: always;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          a,
          a:visited {
            color: inherit !important;
            text-decoration: none !important;
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
        <div
          className="orcamento-folha mx-auto max-w-[210mm] bg-white shadow-lg print:max-w-none print:shadow-none"
          style={{ minHeight: '297mm' }}
        >
          <div className="orcamento-print-header">
            <TimbradoCabecalhoDocumento
              data={{
                logo_url: orcamento.loja?.logo_url,
                nome_destaque:
                  orcamento.loja?.nome_fantasia || orcamento.loja?.nome,
                razao_social: orcamento.loja?.razao_social,
                cnpj: orcamento.loja?.cnpj,
                cpf: orcamento.loja?.cpf,
              }}
              metaLinha={`#${orcamento.numero} / ${new Date(
                orcamento.criado_em,
              ).toLocaleDateString('pt-BR')}`}
              tituloDocumento="ORÇAMENTO"
            />
          </div>

          <div className="orcamento-print-body p-6 print:px-6 print:py-0">
          {/* Dados do Cliente */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2">
              {orcamento.cliente?.tipo_pessoa === 'PESSOA_JURIDICA' ? (
                <>
                  {/* Coluna 1: Dados do Cliente PJ (Contato Responsável) */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Dados do Cliente</h3>
                    <div className="space-y-1">
                      <p className="text-gray-700">
                        <strong>Responsável:</strong> {orcamento.cliente?.responsavel || 'Não informado'}
                      </p>
                      {orcamento.cliente?.telefone && (
                        <p className="text-gray-700">
                          <strong>Telefone:</strong> {orcamento.cliente.telefone}
                        </p>
                      )}
                      <p className="text-gray-700">
                        <strong>Email:</strong> {orcamento.cliente?.email || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Coluna 2: Dados da empresa */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Dados da empresa</h3>
                    <div className="space-y-1">
                      <p className="text-gray-700">
                        <strong>Razão Social:</strong> {orcamento.cliente?.razao_social || orcamento.cliente?.nome || 'Não informado'}
                      </p>
                      <p className="text-gray-700">
                        <strong>CNPJ:</strong> {orcamento.cliente?.documento ? formatCnpj(orcamento.cliente.documento) : 'Não informado'}
                      </p>
                      <p className="text-gray-700">
                        <strong>E-mail:</strong> {orcamento.cliente?.email || 'Não informado'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Coluna 1: Dados do Cliente PF (Nome e Email) */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Dados do Cliente</h3>
                    <div className="space-y-1">
                      <p className="text-gray-700">
                        <strong>Nome:</strong> {orcamento.cliente?.nome || 'Não informado'}
                      </p>
                      <p className="text-gray-700">
                        <strong>Email:</strong> {orcamento.cliente?.email || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Coluna 2: Contato do Cliente PF (WhatsApp e Telefone) */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contato</h3>
                    <div className="space-y-1">
                      {orcamento.cliente?.whatsapp && (
                        <p className="text-gray-700">
                          <strong>WhatsApp/Celular:</strong> {orcamento.cliente.whatsapp}
                        </p>
                      )}
                      {orcamento.cliente?.telefone && (
                        <p className="text-gray-700">
                          <strong>Telefone:</strong> {orcamento.cliente.telefone}
                        </p>
                      )}
                      {!orcamento.cliente?.whatsapp && !orcamento.cliente?.telefone && (
                        <p className="text-gray-700 text-gray-500 italic">
                          Nenhum telefone cadastrado
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
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
                              <div className="text-sm text-gray-600 mt-1">
                                {formatarDimensoesProduto(produto)}
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
                          <p>Cole abaixo o código de aprovação enviado para o seu e-mail:</p>
                          <div>
                            <Label htmlFor="codigo">Código de Aprovação</Label>
                            <Input
                              id="codigo"
                              value={codigoAprovacao}
                              onChange={(e) => setCodigoAprovacao(e.target.value)}
                              placeholder="Cole aqui o código recebido por e-mail"
                              autoComplete="off"
                              spellCheck={false}
                              className="mt-1 font-mono text-sm"
                              maxLength={128}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              O código diferencia maiúsculas de minúsculas e só pode ser usado uma vez.
                            </p>
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

            {/* Observações Finais + rodapé timbrado */}
            <div className="space-y-2 text-xs text-gray-600">
              <p className="font-semibold">
                A empresa reserva-se o direito de faturar boleto / cheque somente após análise do crédito do cliente
              </p>

              {/* Área de Assinatura */}
              <div className="mt-8 rounded border border-gray-400 p-4">
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <p className="mb-2 font-semibold">Concordo e Autorizo a produção do(s) item(s) acima discriminado(s)</p>
                    <div className="mb-2 mt-8 border-b border-gray-400"></div>
                    <p className="text-xs">Data: ___/___/_______</p>
                  </div>
                  <div className="text-center">
                    <p className="mb-2 font-semibold">Ass. Cliente:</p>
                    <div className="mb-2 mt-8 border-b border-gray-400"></div>
                    <p className="text-xs">_________________________________</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p>Agradecemos seu contato e estamos à disposição para maiores informações.</p>
              </div>
            </div>
          </div>

          {orcamento.loja ? (
            <div className="orcamento-print-footer mt-6 print:mt-0">
              <TimbradoRodapeDocumento
                data={{
                  nome_destaque:
                    orcamento.loja.nome_fantasia || orcamento.loja.nome,
                  razao_social: orcamento.loja.razao_social,
                  cnpj: orcamento.loja.cnpj,
                  cpf: orcamento.loja.cpf,
                  inscricao_estadual: orcamento.loja.inscricao_estadual,
                  inscricao_municipal: orcamento.loja.inscricao_municipal,
                  cep: orcamento.loja.cep,
                  logradouro: orcamento.loja.logradouro,
                  numero: orcamento.loja.numero,
                  complemento: orcamento.loja.complemento,
                  bairro: orcamento.loja.bairro,
                  cidade: orcamento.loja.cidade,
                  uf: orcamento.loja.uf,
                  telefone: orcamento.loja.telefone,
                  email: orcamento.loja.email,
                  site_url: orcamento.loja.site_url,
                  instagram_url: orcamento.loja.instagram_url,
                  facebook_url: orcamento.loja.facebook_url,
                  linkedin_url: orcamento.loja.linkedin_url,
                }}
              />
            </div>
          ) : null}
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
