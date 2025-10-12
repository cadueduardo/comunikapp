'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Interfaces
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

interface UseArtePublicDataReturn {
  // Dados principais
  arteData: ArteData | null;
  loading: boolean;
  error: string | null;
  
  // Dados processados
  produtos: ProdutoArte[];
  versoesHistorico: VersaoHistorico[];
  mensagens: MensagemArte[];
  
  // Estados da interface
  produtoSelecionado: string;
  versaoSelecionada: string;
  declarationChecked: boolean;
  processing: boolean;
  
  // Handlers
  setProdutoSelecionado: (produtoId: string) => void;
  setVersaoSelecionada: (versaoId: string) => void;
  setDeclarationChecked: (checked: boolean) => void;
  setProcessing: (processing: boolean) => void;
  
  // Funções
  carregarDados: () => Promise<void>;
  enviarMensagem: (mensagem: string, mencoes?: string[]) => Promise<void>;
  aprovarArte: () => Promise<void>;
  rejeitarArte: () => Promise<void>;
  
  // Dados processados
  versaoAtual: VersaoHistorico | null;
}

export function useArtePublicData(token: string): UseArtePublicDataReturn {
  // Estados principais
  const [arteData, setArteData] = useState<ArteData | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Função para obter cor do status
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

  // Carregar dados da arte
  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      toast.error('Erro ao carregar dados da arte');
    } finally {
      setLoading(false);
    }
  };

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
    
    // Selecionar primeiro produto se não houver seleção
    if (produtosProcessados.length > 0 && !produtoSelecionado) {
      const primeiroProduto = produtosProcessados[0];
      setProdutoSelecionado(primeiroProduto.id);
      
      // Carregar versões do produto selecionado
      carregarVersoesProduto(primeiroProduto.id, data);
    }
  };

  // Carregar versões de um produto específico
  const carregarVersoesProduto = async (produtoId: string, data?: ArteData) => {
    try {
      // TODO: Implementar API para buscar versões de um produto específico
      // Por enquanto, usar dados baseados no produto atual
      const produto = data?.produtos.find(p => p.id === produtoId);
      if (!produto) return;

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
      
      if (versoesProcessadas.length > 0 && !versaoSelecionada) {
        setVersaoSelecionada(versoesProcessadas[0].id);
      }
      
    } catch (error) {
      console.error('Erro ao carregar versões do produto:', error);
      toast.error('Erro ao carregar versões do produto');
    }
  };

  // Enviar mensagem
  const enviarMensagem = async (mensagem: string, mencoes?: string[]) => {
    try {
      // TODO: Implementar envio de mensagem com menções via API
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
      throw error;
    }
  };

  // Aprovar arte
  const aprovarArte = async () => {
    if (!declarationChecked) {
      toast.error('Por favor, confirme que revisou e aprova a arte');
      return;
    }

    await processApproval(true);
  };

  // Rejeitar arte
  const rejeitarArte = async () => {
    await processApproval(false);
  };

  // Processar aprovação
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
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Carregar dados quando o token mudar
  useEffect(() => {
    if (token) {
      carregarDados();
    }
  }, [token]);

  // Carregar versões quando produto selecionado mudar
  useEffect(() => {
    if (produtoSelecionado && arteData) {
      carregarVersoesProduto(produtoSelecionado, arteData);
    }
  }, [produtoSelecionado, arteData]);

  // Dados processados
  const versaoAtual = versoesHistorico.find(v => v.id === versaoSelecionada) || null;

  return {
    // Dados principais
    arteData,
    loading,
    error,
    
    // Dados processados
    produtos,
    versoesHistorico,
    mensagens,
    
    // Estados da interface
    produtoSelecionado,
    versaoSelecionada,
    declarationChecked,
    processing,
    
    // Handlers
    setProdutoSelecionado,
    setVersaoSelecionada,
    setDeclarationChecked,
    setProcessing,
    
    // Funções
    carregarDados,
    enviarMensagem,
    aprovarArte,
    rejeitarArte,
    
    // Dados processados
    versaoAtual
  };
}
