'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  X, 
  AlertCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ArtePublicSidebar } from '@/components/ui/arte-public/ArtePublicSidebar';

// Interfaces baseadas no sistema existente
interface ArteData {
  os: {
    id: string;
    numero_os: string;
  };
  cliente: {
    nome: string;
    email: string;
  };
  produtos: Array<{
    id: string;
    nome: string;
    versao_mais_recente: {
      id: string;
      versao: string;
      status: string;
      descricao?: string;
      data_criacao: string;
      autor: {
        nome: string;
        email: string;
      };
      arquivos: Array<{
        id: string;
        nome_original: string;
        tipo_arquivo: string;
        url_arquivo: string;
        url_thumbnail?: string;
      }>;
    };
  }>;
  link: {
    id: string;
    expira_em: string;
    aprovado: boolean;
  };
}

interface ProdutoArte {
  id: string;
  nome: string;
  versaoAtual: string;
  status: 'APROVADA' | 'ENVIADA_CLIENTE' | 'REVISAO_SOLICITADA';
  statusColor: 'green' | 'yellow' | 'red';
}

interface VersaoHistorico {
  id: string;
  versao: string;
  data: string;
  autor: string;
  status: string;
  thumbnail: string;
  isAtual: boolean;
}

interface MensagemArte {
  id: string;
  autor_nome: string;
  autor_tipo: 'CLIENTE' | 'EQUIPE';
  mensagem: string;
  mensagem_processada?: string;
  data_comentario: string;
  mencoes_versoes?: string[];
}

export default function ArtePublicApprovalPageV2() {
  const params = useParams();
  const token = params.token as string;
  
  // Estados principais
  const [loading, setLoading] = useState(true);
  const [arteData, setArteData] = useState<ArteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados da interface
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');
  const [versaoSelecionada, setVersaoSelecionada] = useState<string>('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Estados dos dados processados
  const [produtos, setProdutos] = useState<ProdutoArte[]>([]);
  const [versoesHistorico, setVersoesHistorico] = useState<VersaoHistorico[]>([]);
  const [mensagens, setMensagens] = useState<MensagemArte[]>([]);

  // Carregar dados da arte
  useEffect(() => {
    const loadArteData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/arte-aprovacao/links/public/${token}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        setArteData(data.data);
        processarDados(data.data);
        
      } catch (error: any) {
        console.error('Erro ao carregar dados da arte:', error);
        setError(error.message || 'Erro ao carregar dados da arte');
      } finally {
        setLoading(false);
      }
    };

    loadArteData();
  }, [token]);

  // Processar dados para a interface
  const processarDados = (data: ArteData) => {
    // Processar produtos
    const produtosProcessados: ProdutoArte[] = data.produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      versaoAtual: produto.versao_mais_recente.versao,
      status: produto.versao_mais_recente.status as any,
      statusColor: getStatusColor(produto.versao_mais_recente.status)
    }));
    
    setProdutos(produtosProcessados);
    
    // Selecionar primeiro produto
    if (produtosProcessados.length > 0) {
      const primeiroProduto = produtosProcessados[0];
      setProdutoSelecionado(primeiroProduto.id);
      
      // Carregar versões do produto selecionado
      carregarVersoesProduto(primeiroProduto.id, data);
    }
  };

  // Carregar versões de um produto específico
  const carregarVersoesProduto = async (produtoId: string, data?: ArteData) => {
    try {
      // Buscar todas as versões do produto específico
      const produto = data?.produtos.find(p => p.id === produtoId);
      if (!produto) return;

      // Se temos dados da API pública, usar as versões retornadas
      if (data?.versoes && Array.isArray(data.versoes)) {
        const versoesDoProduto = data.versoes.filter(v => 
          v.servico_id === produtoId || 
          v.id === produto.versao_mais_recente.id
        );

        const versoesProcessadas: VersaoHistorico[] = versoesDoProduto.map(v => ({
          id: v.id,
          versao: v.versao,
          data: v.data_criacao,
          autor: v.autor.nome,
          status: v.status,
          thumbnail: v.arquivos?.[0]?.url_thumbnail || '',
          isAtual: v.id === produto.versao_mais_recente.id
        }));

        setVersoesHistorico(versoesProcessadas);
      } else {
        // Fallback: usar apenas a versão mais recente
        const versoesProcessadas: VersaoHistorico[] = [
          {
            id: produto.versao_mais_recente.id,
            versao: produto.versao_mais_recente.versao,
            data: produto.versao_mais_recente.data_criacao,
            autor: produto.versao_mais_recente.autor.nome,
            status: produto.versao_mais_recente.status,
            thumbnail: produto.versao_mais_recente.arquivos[0]?.url_thumbnail || '',
            isAtual: true
          }
        ];

        setVersoesHistorico(versoesProcessadas);
      }
      
      if (versoesHistorico.length > 0) {
        setVersaoSelecionada(versoesHistorico[0].id);
      }
      
    } catch (error) {
      console.error('Erro ao carregar versões do produto:', error);
    }
  };

  // Funções auxiliares
  const getStatusColor = (status: string): 'green' | 'yellow' | 'red' => {
    switch (status) {
      case 'APROVADA':
        return 'green';
      case 'ENVIADA_CLIENTE':
        return 'yellow';
      case 'REVISAO_SOLICITADA':
        return 'red';
      default:
        return 'yellow';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'Aprovada';
      case 'ENVIADA_CLIENTE':
        return 'Aguardando Aprovação';
      case 'REVISAO_SOLICITADA':
        return 'Revisão Solicitada';
      default:
        return status;
    }
  };

  // Handlers
  const handleProdutoSelect = (produtoId: string) => {
    setProdutoSelecionado(produtoId);
    if (arteData) {
      carregarVersoesProduto(produtoId, arteData);
    }
  };

  const handleVersaoSelect = (versaoId: string) => {
    setVersaoSelecionada(versaoId);
  };

  const handleEnviarMensagem = async (mensagem: string, mencoes?: string[]) => {
    try {
      // TODO: Implementar envio de mensagem com menções
      console.log('Enviando mensagem:', { mensagem, mencoes });
      
      // Mock da mensagem enviada
      const novaMensagem: MensagemArte = {
        id: `msg-${Date.now()}`,
        autor_nome: 'Cliente',
        autor_tipo: 'CLIENTE',
        mensagem,
        data_comentario: new Date().toISOString(),
        mencoes_versoes: mencoes
      };
      
      setMensagens(prev => [...prev, novaMensagem]);
      
      toast.success('Mensagem enviada com sucesso!');
      
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleAprovar = async () => {
    if (!declarationChecked) {
      toast.error('Por favor, confirme que revisou e aprova a arte');
      return;
    }

    await processApproval(true);
  };

  const handleRejeitar = async () => {
    await processApproval(false);
  };

  const processApproval = async (aprovado: boolean) => {
    try {
      setProcessing(true);
      
      const response = await fetch(`/api/arte-aprovacao/links/public/${token}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aprovado,
          comentario: aprovado ? undefined : 'Solicitação de alteração via chat',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success(data.data.mensagem);
      
      // Redirecionar para página de sucesso
      setTimeout(() => {
        window.location.href = '/arte/aprovacao/sucesso';
      }, 2000);
      
    } catch (error: any) {
      toast.error('Erro ao processar aprovação');
      console.error('Erro ao aprovar:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implementar download PDF
    console.log('Download PDF');
    toast.info('Funcionalidade de download PDF em desenvolvimento');
  };

  const handleDownloadJPG = () => {
    // TODO: Implementar download JPG
    console.log('Download JPG');
    toast.info('Funcionalidade de download JPG em desenvolvimento');
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da arte...</p>
        </div>
      </div>
    );
  }

  if (error || !arteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Inválido</h2>
          <p className="text-gray-600 mb-4">
            {error || 'O link de aprovação não foi encontrado ou expirou.'}
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o designer para solicitar um novo link.
          </p>
        </div>
      </div>
    );
  }

  // Dados processados para a sidebar
  const versaoAtual = versoesHistorico.find(v => v.id === versaoSelecionada) || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Prévia pública — Aprovação de Arte
              </h1>
              <p className="text-gray-600">
                {arteData.os.numero_os} • {arteData.cliente.nome}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Baixar prova (PDF)
              </Button>
              
              <Button
                onClick={handleDownloadJPG}
                variant="outline"
                size="sm"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Baixar imagem (JPG)
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.close()}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[calc(100vh-200px)]">
          
          {/* Área Principal - Preview Central */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg border border-gray-200 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-96 h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                  {versaoAtual?.thumbnail ? (
                    <img
                      src={versaoAtual.thumbnail}
                      alt={`Versão ${versaoAtual.versao}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Pré-visualização da arte selecionada (PDF/JPG)
                      </p>
                    </div>
                  )}
                </div>
                
                {versaoAtual && (
                  <div className="text-sm text-gray-600">
                    <p>Versão: {versaoAtual.versao}</p>
                    <p>Criada em: {new Date(versaoAtual.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ArtePublicSidebar
              produtos={produtos}
              produtoSelecionado={produtoSelecionado}
              onProdutoSelect={handleProdutoSelect}
              versoesHistorico={versoesHistorico}
              versaoAtual={versaoAtual}
              onVersaoSelect={handleVersaoSelect}
              mensagens={mensagens}
              onEnviarMensagem={handleEnviarMensagem}
              onAprovar={handleAprovar}
              onRejeitar={handleRejeitar}
              declarationChecked={declarationChecked}
              onDeclarationChange={setDeclarationChecked}
              loading={loading}
              processing={processing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

