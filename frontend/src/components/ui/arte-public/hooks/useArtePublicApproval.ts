'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Interfaces baseadas na estrutura real da API
interface ArteData {
  versao: {
    id: string;
    versao: string;
    status: string;
    descricao?: string;
    data_criacao: string;
    os_id: string;
  };
  os: {
    id: string;
    numero_os: string;
  };
  cliente: {
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
  comentarios: Array<{
    id: string;
    comentario: string;
    tipo: string;
    data_comentario: string;
    usuario: {
      nome: string;
      email: string;
    };
  }>;
  autor: {
    nome: string;
    email: string;
  };
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

interface VersaoArte {
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
}

interface MensagemArte {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  data: string;
  lida: boolean;
}

interface UseArtePublicApprovalReturn {
  // Estados principais
  arteData: ArteData | null;
  loading: boolean;
  error: string | null;
  
  // Estados da interface
  produtoSelecionado: string;
  versaoSelecionada: string;
  declarationChecked: boolean;
  processing: boolean;
  
  // Dados processados
  produtos: ProdutoArte[];
  versoes: VersaoArte[];
  mensagens: MensagemArte[];
  produtoAtual: ProdutoArte | null;
  versaoAtual: VersaoArte | null;
  
  // Handlers
  setProdutoSelecionado: (produtoId: string) => void;
  setVersaoSelecionada: (versaoId: string) => void;
  setDeclarationChecked: (checked: boolean) => void;
  enviarMensagem: (mensagem: string) => Promise<void>;
  aprovarArte: () => Promise<void>;
  rejeitarArte: () => Promise<void>;
}

export function useArtePublicApproval(token: string): UseArtePublicApprovalReturn {
  // Função para extrair menções de um texto
  const extrairMencoes = (texto: string): string[] => {
    const regex = /@(V\d+-\w+)/g;
    const mencoes: string[] = [];
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      mencoes.push(match[1]);
    }
    
    return mencoes;
  };

  // Função para formatar datas
  const formatarData = (dataString: any): string => {
    try {
      if (!dataString) {
        return 'Data não disponível';
      }
      
      // Se é um objeto vazio, usar data atual como fallback
      if (typeof dataString === 'object' && Object.keys(dataString).length === 0) {
        return new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
      
      // Se é um objeto, tentar extrair propriedades de data
      if (typeof dataString === 'object') {
        const possibleDate = dataString.created_at || dataString.data_criacao || dataString.date || dataString.timestamp;
        if (possibleDate) {
          dataString = possibleDate;
        } else {
          return 'Data não disponível';
        }
      }
      
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        return 'Data não disponível';
      }
      
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data não disponível';
    }
  };

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
  const [versoes, setVersoes] = useState<VersaoArte[]>([]);
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
  const carregarDados = useCallback(async () => {
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
  }, [token]);

  // Processar dados para a interface
  const processarDados = (data: ArteData) => {
    // Tentar extrair nome do produto do arquivo ou usar fallback
    const arquivoPrincipal = data.arquivos?.[0];
    let nomeProduto = 'Arte Principal'; // Fallback padrão
    
    if (arquivoPrincipal?.nome_original) {
      // Tentar extrair nome do produto do nome do arquivo
      const nomeArquivo = arquivoPrincipal.nome_original;
      // Remover extensão e tentar identificar produto
      const nomeSemExtensao = nomeArquivo.replace(/\.[^/.]+$/, '');
      
      // Se contém palavras-chave de produtos comuns
      if (nomeSemExtensao.toLowerCase().includes('banner')) {
        nomeProduto = 'Banner';
      } else if (nomeSemExtensao.toLowerCase().includes('flyer')) {
        nomeProduto = 'Flyer';
      } else if (nomeSemExtensao.toLowerCase().includes('cartao')) {
        nomeProduto = 'Cartão';
      } else if (nomeSemExtensao.toLowerCase().includes('logo')) {
        nomeProduto = 'Logo';
      } else if (nomeSemExtensao.toLowerCase().includes('panfleto')) {
        nomeProduto = 'Panfleto';
      } else if (nomeSemExtensao.toLowerCase().includes('lona')) {
        nomeProduto = 'Lona com Ilhós';
      } else if (nomeSemExtensao.toLowerCase().includes('cartaz')) {
        nomeProduto = 'Cartaz';
      } else if (nomeSemExtensao.toLowerCase().includes('adesivo')) {
        nomeProduto = 'Adesivo';
      } else {
        // Usar parte do nome do arquivo como nome do produto
        const partesNome = nomeSemExtensao.split(/[-_\s]/);
        // Filtrar partes que são apenas números ou datas
        const partesFiltradas = partesNome.filter(parte => 
          !/^\d+$/.test(parte) && 
          !/^\d{8}$/.test(parte) && // datas YYYYMMDD
          !/^\d{6}$/.test(parte) && // datas YYMMDD
          parte.length > 2
        );
        
        if (partesFiltradas.length > 0) {
          nomeProduto = partesFiltradas[0];
        } else {
          // Se não conseguiu detectar, usar nome baseado no contexto
          // Como é uma arte de chef/cozinha, pode ser um banner ou cartaz
          nomeProduto = 'Banner';
        }
      }
    }
    
    // Como a API retorna apenas uma versão específica, vamos criar um "produto" único
    const produtoUnico: ProdutoArte = {
      id: data.versao.id,
      nome: nomeProduto,
      versaoAtual: data.versao.versao,
      status: data.versao.status as 'APROVADA' | 'ENVIADA_CLIENTE' | 'REVISAO_SOLICITADA',
      statusColor: getStatusColor(data.versao.status)
    };

    setProdutos([produtoUnico]);

    // Verificar se a API retorna múltiplas versões
    if (data.versoes && Array.isArray(data.versoes) && data.versoes.length > 0) {
      // Usar as versões reais da API
      const versoesReais: VersaoArte[] = data.versoes.map((versao: any) => ({
        id: versao.id,
        versao: versao.versao,
        status: versao.status,
        descricao: versao.descricao,
        data_criacao: versao.data_criacao,
        autor: versao.autor || data.autor,
        arquivos: versao.arquivos || []
      }));
      
      setVersoes(versoesReais);
      // Selecionar a versão atual (associada ao token) por padrão
      setVersaoSelecionada(data.versao.id);
    } else {
      // Usar apenas a versão atual
      const versaoAtual: VersaoArte = {
        id: data.versao.id,
        versao: data.versao.versao,
        status: data.versao.status,
        descricao: data.versao.descricao,
        data_criacao: data.versao.data_criacao,
        autor: data.autor,
        arquivos: data.arquivos || []
      };

      setVersoes([versaoAtual]);
      setVersaoSelecionada(versaoAtual.id);
    }

    // Selecionar o produto único automaticamente
    setProdutoSelecionado(produtoUnico.id);

    // Processar comentários diretamente dos dados da API
    if (data.comentarios && Array.isArray(data.comentarios)) {
      const mensagensProcessadas: MensagemArte[] = data.comentarios.map((comentario: any) => ({
        id: comentario.id,
        autor: comentario.usuario?.nome || 'Usuário',
        autorTipo: comentario.tipo === 'CLIENTE' ? 'cliente' : 'equipe',
        mensagem: comentario.comentario,
        data: comentario.data_comentario,
        lida: true,
        mencoes: extrairMencoes(comentario.comentario)
      }));
      
      setMensagens(mensagensProcessadas);
    }
  };

  // Carregar versões de um produto específico (simplificado)
  const carregarVersoesProduto = async (produtoId: string) => {
    // Como já temos os dados da versão única, não precisamos fazer nada aqui
    console.log('📋 Carregando versões para produto:', produtoId);
  };

  // Carregar mensagens de uma versão
  const carregarMensagens = async (versaoId: string) => {
    try {
      // Como os comentários já vêm na API principal, vamos processá-los diretamente
      if (arteData?.comentarios) {
        const mensagensProcessadas: MensagemArte[] = arteData.comentarios.map((comentario: any) => ({
          id: comentario.id,
          autor: comentario.usuario?.nome || 'Usuário',
          autorTipo: comentario.tipo === 'CLIENTE' ? 'cliente' : 'equipe',
          mensagem: comentario.comentario,
          data: comentario.data_comentario,
          lida: true,
          mencoes: extrairMencoes(comentario.comentario)
        }));
        
        setMensagens(mensagensProcessadas);
      } else {
        // Fallback: tentar buscar comentários via API separada
        const response = await fetch(`/api/arte-aprovacao/comentarios/public/${versaoId}/${token}`);
        const data = await response.json();

        if (data.success) {
          const mensagensProcessadas: MensagemArte[] = data.data.map((comentario: any) => ({
            id: comentario.id,
            autor: comentario.usuario?.nome || 'Usuário',
            autorTipo: comentario.tipo === 'CLIENTE' ? 'cliente' : 'equipe',
            mensagem: comentario.comentario,
            data: comentario.data_comentario,
            lida: true,
            mencoes: extrairMencoes(comentario.comentario)
          }));
          
          setMensagens(mensagensProcessadas);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Handlers
  const handleProdutoChange = (produtoId: string) => {
    setProdutoSelecionado(produtoId);
    carregarVersoesProduto(produtoId);
  };

  const handleVersaoChange = (versaoId: string) => {
    setVersaoSelecionada(versaoId);
    carregarMensagens(versaoId);
  };

  const enviarMensagem = async (mensagem: string) => {
    try {
      const response = await fetch('/api/arte-aprovacao/comentarios/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versao_id: versaoSelecionada,
          comentario: mensagem,
          token_publico: token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Comentário adicionado com sucesso!');
        carregarMensagens(versaoSelecionada);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const aprovarArte = async () => {
    await processApproval(true);
  };

  const rejeitarArte = async () => {
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

  // Dados computados
  const produtoAtual = produtos.find(p => p.id === produtoSelecionado) || null;
  const versaoAtual = versoes.find(v => v.id === versaoSelecionada) || null;

  // Carregar dados iniciais
  useEffect(() => {
    if (token) {
      carregarDados();
    }
  }, [token, carregarDados]); // Incluir carregarDados nas dependências

  return {
    // Estados principais
    arteData,
    loading,
    error,
    
    // Estados da interface
    produtoSelecionado,
    versaoSelecionada,
    declarationChecked,
    processing,
    
    // Dados processados
    produtos,
    versoes,
    mensagens,
    produtoAtual,
    versaoAtual,
    
    // Handlers
    setProdutoSelecionado: handleProdutoChange,
    setVersaoSelecionada: handleVersaoChange,
    setDeclarationChecked,
    enviarMensagem,
    aprovarArte,
    rejeitarArte,
  };
}
