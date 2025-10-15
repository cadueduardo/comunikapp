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
  nomeArquivo?: string;
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

      console.log('🔍 [carregarDados] Dados brutos da API:', data.data);
      console.log('🔍 [carregarDados] Versões da API:', data.data.versoes?.map(v => ({
        id: v.id,
        versao: v.versao,
        data_criacao: v.data_criacao,
        tipo_data: typeof v.data_criacao
      })));
      setArteData(data.data);
      processarDados(data.data);
      
    } catch (error: any) {
      console.error('Erro ao carregar dados da arte:', error);
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = 'Erro ao carregar dados da arte';
      let toastMessage = 'Erro ao carregar dados da arte';
      
      if (error.message) {
        if (error.message.includes('Link de aprovação inativo')) {
          errorMessage = 'Este link de aprovação não está mais ativo. Entre em contato com o responsável para solicitar um novo link.';
          toastMessage = 'Link de aprovação inativo';
        } else if (error.message.includes('Link de aprovação expirado')) {
          errorMessage = 'Este link de aprovação expirou. Entre em contato com o responsável para solicitar um novo link.';
          toastMessage = 'Link de aprovação expirado';
        } else if (error.message.includes('Link de aprovação não encontrado')) {
          errorMessage = 'Link de aprovação não encontrado. Verifique se o link está correto.';
          toastMessage = 'Link não encontrado';
        } else if (error.message.includes('Arte já foi aprovada')) {
          errorMessage = 'Esta arte já foi aprovada.';
          toastMessage = 'Arte já aprovada';
        } else {
          errorMessage = error.message;
          toastMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast.error(toastMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Processar dados para a interface
  const processarDados = (data: ArteData) => {
    console.log('🔍 [processarDados] Dados recebidos:', {
      arquivos: data.arquivos?.length || 0,
      versoes: data.versoes?.length || 0,
      primeiroArquivo: data.arquivos?.[0]?.nome_original
    });

    // Tentar extrair nome do produto do arquivo ou usar fallback
    const arquivoPrincipal = data.arquivos?.[0];
    let nomeProduto = 'Arte Principal'; // Fallback padrão
    
    if (arquivoPrincipal?.nome_original) {
      // Tentar extrair nome do produto do nome do arquivo
      const nomeArquivo = arquivoPrincipal.nome_original;
      console.log('🔍 [processarDados] Nome do arquivo:', nomeArquivo);
      
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
      } else if (nomeSemExtensao.toLowerCase().includes('thumb')) {
        // Se contém "thumb", é provavelmente um thumbnail, usar nome mais genérico
        nomeProduto = 'Arte Principal';
      } else {
        // Usar parte do nome do arquivo como nome do produto
        const partesNome = nomeSemExtensao.split(/[-_\s]/);
        // Filtrar partes que são apenas números ou datas
        const partesFiltradas = partesNome.filter(parte => 
          !/^\d+$/.test(parte) && 
          !/^\d{8}$/.test(parte) && // datas YYYYMMDD
          !/^\d{6}$/.test(parte) && // datas YYMMDD
          parte.length > 2 &&
          !parte.toLowerCase().includes('thumb') // Excluir "thumb"
        );
        
        if (partesFiltradas.length > 0) {
          nomeProduto = partesFiltradas[0];
        } else {
          // Se não conseguiu detectar, usar nome baseado no contexto
          nomeProduto = 'Arte Principal';
        }
      }
    }
    
    console.log('✅ [processarDados] Nome do produto final:', nomeProduto);
    
    // Verificar se a API retorna dados de produtos estruturados
    let produtosProcessados: ProdutoArte[] = [];
    
    if (data.produtos && Array.isArray(data.produtos) && data.produtos.length > 0) {
      // Usar os produtos reais da API
      produtosProcessados = data.produtos.map((produto: any) => ({
        id: produto.id,
        nome: produto.nome,
        versaoAtual: produto.versao_mais_recente?.versao || 'v1',
        status: produto.versao_mais_recente?.status as 'APROVADA' | 'ENVIADA_CLIENTE' | 'REVISAO_SOLICITADA' || 'ENVIADA_CLIENTE',
        statusColor: getStatusColor(produto.versao_mais_recente?.status || 'ENVIADA_CLIENTE')
      }));
      
      console.log('✅ [processarDados] Produtos da API:', produtosProcessados);
    } else if (data.versoes && Array.isArray(data.versoes) && data.versoes.length > 0) {
      // Se não há produtos estruturados, mas há versões, criar produtos baseados nas versões
      console.log('🔍 [processarDados] Criando produtos baseados nas versões:', data.versoes.length);
      
      // Agrupar versões por servico_id (produto)
      const versoesPorProduto = data.versoes.reduce((acc: any, versao: any) => {
        const produtoId = versao.servico_id || 'produto-principal';
        if (!acc[produtoId]) {
          acc[produtoId] = [];
        }
        acc[produtoId].push(versao);
        return acc;
      }, {});

      console.log('📋 [processarDados] Versões agrupadas por produto:', versoesPorProduto);

      // Criar produtos baseados nos grupos
      produtosProcessados = Object.keys(versoesPorProduto).map((produtoId, index) => {
        const versoesDoProduto = versoesPorProduto[produtoId];
        const versaoMaisRecente = versoesDoProduto[0]; // Já ordenado por data_criacao desc
        
        // Tentar extrair nome do produto do arquivo ou usar fallback
        const arquivoPrincipal = versaoMaisRecente.arquivos?.[0];
        let nomeProduto = `Produto ${index + 1}`;
        
        if (arquivoPrincipal?.nome_original) {
          const nomeArquivo = arquivoPrincipal.nome_original;
          const nomeSemExtensao = nomeArquivo.replace(/\.[^/.]+$/, '');
          
          // Detectar tipo de produto pelo nome do arquivo
          if (nomeSemExtensao.toLowerCase().includes('banner')) {
            nomeProduto = 'Banner';
          } else if (nomeSemExtensao.toLowerCase().includes('adesivo')) {
            nomeProduto = 'Adesivo';
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
          } else {
            // Usar parte do nome do arquivo
            const partesNome = nomeSemExtensao.split(/[-_\s]/);
            const partesFiltradas = partesNome.filter(parte => 
              !/^\d+$/.test(parte) && 
              !/^\d{8}$/.test(parte) && 
              !/^\d{6}$/.test(parte) && 
              parte.length > 2 &&
              !parte.toLowerCase().includes('thumb')
            );
            
            if (partesFiltradas.length > 0) {
              nomeProduto = partesFiltradas[0];
            }
          }
        }

        return {
          id: produtoId,
          nome: nomeProduto,
          versaoAtual: versaoMaisRecente.versao,
          status: versaoMaisRecente.status as 'APROVADA' | 'ENVIADA_CLIENTE' | 'REVISAO_SOLICITADA',
          statusColor: getStatusColor(versaoMaisRecente.status)
        };
      });

      console.log('✅ [processarDados] Produtos criados baseados nas versões:', produtosProcessados);
    } else {
      // Fallback: criar produto único baseado na versão atual
      const produtoUnico: ProdutoArte = {
        id: data.versao.id,
        nome: nomeProduto,
        versaoAtual: data.versao.versao,
        status: data.versao.status as 'APROVADA' | 'ENVIADA_CLIENTE' | 'REVISAO_SOLICITADA',
        statusColor: getStatusColor(data.versao.status)
      };

      produtosProcessados = [produtoUnico];
      console.log('✅ [processarDados] Produto único criado:', produtoUnico);
    }

    setProdutos(produtosProcessados);

    // NÃO carregar todas as versões de uma vez - isso será feito quando um produto for selecionado
    // Apenas preparar os dados para uso posterior

    // Selecionar o primeiro produto automaticamente
    if (produtosProcessados.length > 0) {
      setProdutoSelecionado(produtosProcessados[0].id);
    }

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

  // Carregar versões de um produto específico
  const carregarVersoesProduto = async (produtoId: string) => {
    console.log('📋 Carregando versões para produto:', produtoId);
    
    if (!arteData) return;
    
    // Se há múltiplas versões, filtrar por produto
    if (arteData.versoes && Array.isArray(arteData.versoes) && arteData.versoes.length > 0) {
      const versoesDoProduto = arteData.versoes.filter((versao: any) => 
        versao.servico_id === produtoId
      );
      
      console.log('📋 Versões filtradas para produto:', {
        produtoId,
        quantidade: versoesDoProduto.length,
        versoes: versoesDoProduto.map(v => ({ id: v.id, versao: v.versao, servico_id: v.servico_id }))
      });
      
      // Atualizar versões com as versões do produto selecionado
      const versoesProcessadas: VersaoArte[] = versoesDoProduto.map((versao: any) => {
        console.log('🔍 [carregarVersoesProduto] Processando versão:', {
          id: versao.id,
          versao: versao.versao,
          data_criacao: versao.data_criacao,
          tipo_data: typeof versao.data_criacao,
          data_criacao_keys: versao.data_criacao && typeof versao.data_criacao === 'object' ? Object.keys(versao.data_criacao) : 'N/A'
        });
        
        // Converter data_criacao para string se for um objeto vazio (problema de serialização BigInt)
        let dataCriacao = versao.data_criacao;
        if (typeof dataCriacao === 'object' && dataCriacao !== null && Object.keys(dataCriacao).length === 0) {
          console.warn('🔧 [carregarVersoesProduto] Data vazia detectada, usando data atual como fallback');
          dataCriacao = new Date().toISOString();
        } else if (typeof dataCriacao === 'object' && dataCriacao !== null) {
          // Se é um objeto com propriedades, tentar extrair a data
          const dateValue = dataCriacao.$date || dataCriacao.value || dataCriacao.toString();
          if (dateValue) {
            dataCriacao = new Date(dateValue).toISOString();
          } else {
            console.warn('🔧 [carregarVersoesProduto] Objeto de data incompreensível, usando data atual');
            dataCriacao = new Date().toISOString();
          }
        }

        return {
          id: versao.id,
          versao: versao.versao,
          status: versao.status,
          descricao: versao.descricao,
          data_criacao: dataCriacao,
          autor: versao.autor || arteData.autor,
          nomeArquivo: versao.arquivos?.[0]?.nome_original,
          arquivos: versao.arquivos || []
        };
      });
      
      setVersoes(versoesProcessadas);
      
      // Selecionar a primeira versão do produto
      if (versoesProcessadas.length > 0) {
        setVersaoSelecionada(versoesProcessadas[0].id);
      }
    } else {
      // Se não há múltiplas versões, usar apenas a versão atual
      // Converter data_criacao para string se for um objeto vazio
      let dataCriacao = arteData.versao.data_criacao;
      if (typeof dataCriacao === 'object' && dataCriacao !== null && Object.keys(dataCriacao).length === 0) {
        console.warn('🔧 [carregarVersoesProduto] Data vazia detectada (versão única), usando data atual como fallback');
        dataCriacao = new Date().toISOString();
      } else if (typeof dataCriacao === 'object' && dataCriacao !== null) {
        const dateValue = dataCriacao.$date || dataCriacao.value || dataCriacao.toString();
        if (dateValue) {
          dataCriacao = new Date(dateValue).toISOString();
        } else {
          console.warn('🔧 [carregarVersoesProduto] Objeto de data incompreensível (versão única), usando data atual');
          dataCriacao = new Date().toISOString();
        }
      }

      const versaoAtual: VersaoArte = {
        id: arteData.versao.id,
        versao: arteData.versao.versao,
        status: arteData.versao.status,
        descricao: arteData.versao.descricao,
        data_criacao: dataCriacao,
        autor: arteData.autor,
        nomeArquivo: arteData.arquivos?.[0]?.nome_original,
        arquivos: arteData.arquivos || []
      };

      setVersoes([versaoAtual]);
      setVersaoSelecionada(versaoAtual.id);
    }
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

  // Carregar versões quando um produto for selecionado
  useEffect(() => {
    if (produtoSelecionado && arteData) {
      carregarVersoesProduto(produtoSelecionado);
    }
  }, [produtoSelecionado, arteData]);

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
