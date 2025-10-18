import { useState, useEffect } from 'react';

interface Mensagem {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  data: string;
  lida: boolean;
  produtoId: string;
}

interface ProdutoMessages {
  produtoId: string;
  totalMensagens: number;
  mensagensNaoLidas: number;
  ultimaMensagem?: Mensagem;
}

interface UseArteMessagesReturn {
  produtosMessages: ProdutoMessages[];
  loading: boolean;
  error: string | null;
  refreshMessages: () => Promise<void>;
  marcarComoLida: (produtoId: string, mensagemId: string) => Promise<void>;
  enviarMensagem: (produtoId: string, mensagem: string) => Promise<void>;
}

export function useArteMessages(osId: string): UseArteMessagesReturn {
  const [produtosMessages, setProdutosMessages] = useState<ProdutoMessages[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    if (!osId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // console.log('🔄 [useArteMessages] Buscando mensagens não lidas para OS:', osId);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Buscar contagem de mensagens não lidas por produto (apenas do cliente)
      const response = await fetch(`/api/arte-aprovacao/mensagens/os/${osId}/nao-lidas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Erro ${response.status} ao carregar mensagens`;
        console.error('❌ Erro do backend:', errorData);
        throw new Error(errorMessage);
      }

      const mensagensNaoLidas = await response.json();
      
      // console.log('📊 [useArteMessages] Mensagens não lidas recebidas:', mensagensNaoLidas);
      
      // Converter para o formato esperado (apenas mensagens não lidas do cliente)
      const produtosMessagesData: ProdutoMessages[] = mensagensNaoLidas.map((item: any) => ({
        produtoId: item.produto_id, // Agora produto_id contém versao_id do backend
        totalMensagens: item.mensagens_nao_lidas, // Apenas mensagens não lidas do cliente
        mensagensNaoLidas: item.mensagens_nao_lidas,
      }));

      // console.log('✅ [useArteMessages] Contadores atualizados:', produtosMessagesData);
      // console.log('🔍 [useArteMessages] Debug produtosMessages:', produtosMessagesData.map(p => ({
      //   produtoId: p.produtoId,
      //   mensagensNaoLidas: p.mensagensNaoLidas,
      //   totalMensagens: p.totalMensagens
      // })));

      setProdutosMessages(produtosMessagesData);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (produtoId: string, mensagemId: string) => {
    try {
      // TODO: Implementar chamada para API
      console.log('Marcando mensagem como lida:', { produtoId, mensagemId });
      
      // Atualizar estado local
      setProdutosMessages(prev => 
        prev.map(produto => 
          produto.produtoId === produtoId 
            ? {
                ...produto,
                mensagensNaoLidas: Math.max(0, produto.mensagensNaoLidas - 1),
                ultimaMensagem: produto.ultimaMensagem?.id === mensagemId 
                  ? { ...produto.ultimaMensagem, lida: true }
                  : produto.ultimaMensagem
              }
            : produto
        )
      );
    } catch (err) {
      console.error('Erro ao marcar mensagem como lida:', err);
      throw err;
    }
  };

  const enviarMensagem = async (produtoId: string, mensagem: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/arte-aprovacao/mensagens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          os_id: osId,
          produto_id: produtoId,
          mensagem: mensagem,
          autor_tipo: 'EQUIPE',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar mensagem');
      }

      // Recarregar mensagens para atualizar o contador
      await fetchMessages();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [osId]);

  return {
    produtosMessages,
    loading,
    error,
    refreshMessages: fetchMessages,
    marcarComoLida,
    enviarMensagem,
  };
}
