import { useCallback, useEffect, useRef } from 'react';
import { buildApiUrl } from '@/lib/config';

interface WebSocketMessage {
  message: {
    id: string;
    mensagem: string;
    tipo: string;
    autor_nome?: string;
    visualizada: boolean;
    criado_em: string;
  };
  timestamp: string;
}

interface UseWebSocketOptions {
  orcamentoId?: string;
  isPublic?: boolean;
  onNewMessage?: (message: WebSocketMessage) => void;
  onMessageRead?: (messageId: string) => void;
  onUserTyping?: (data: { clientId: string; isTyping: boolean }) => void;
  onUserJoined?: (data: { clientId: string }) => void;
  onUserLeft?: (data: { clientId: string }) => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Função para verificar novas mensagens via polling
  const checkNewMessages = useCallback(async () => {
    if (!options.orcamentoId) {
      console.log('Polling: OrcamentoId não fornecido');
      return;
    }

    try {
      // console.log('🔍 Polling: Verificando novas mensagens para orçamento:', options.orcamentoId);
      
      const token = options.isPublic ? null : localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        // console.log('🔍 Polling: Token encontrado');
      } else {
        // console.log('🔍 Polling: Sem token (modo público)');
      }

      // Usar endpoint público se estiver em modo público - SEGUINDO PADRÃO DO LEGADO
      const endpoint = options.isPublic 
        ? `/orcamentos-v2/${options.orcamentoId}/mensagens/publico`
        : `/orcamentos-v2/${options.orcamentoId}/mensagens`;

      const fullUrl = buildApiUrl(endpoint);

      // Adicionar timeout para evitar requisições muito longas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos

      const response = await fetch(fullUrl, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const responseData = await response.json();
        console.log('🔍 Polling: Dados brutos recebidos:', responseData);
        
        // Extrair mensagens da resposta
        const mensagens = responseData.mensagens || responseData.data || responseData;
        
        // Log para debug
        console.log(`🔍 Polling: ${mensagens?.length || 'undefined'} mensagens recebidas para orçamento ${options.orcamentoId}`);
        
        // Verificar se há mensagens novas
        if (mensagens && Array.isArray(mensagens) && mensagens.length > 0) {
          // Ordenar mensagens por data para garantir ordem correta
          const mensagensOrdenadas = [...mensagens].sort((a, b) => 
            new Date(a.criado_em || a.data_envio).getTime() - new Date(b.criado_em || b.data_envio).getTime()
          );
          
          const ultimaMensagem = mensagensOrdenadas[mensagensOrdenadas.length - 1];
          
          console.log(`🔍 Polling: Última mensagem ID: ${ultimaMensagem.id}, Last ID: ${lastMessageIdRef.current}`);
          
          if (lastMessageIdRef.current !== ultimaMensagem.id) {
            console.log(`✅ Polling: Nova mensagem detectada! ID: ${ultimaMensagem.id}`);
            lastMessageIdRef.current = ultimaMensagem.id;
            
            // Simular evento de nova mensagem
            const webSocketMessage: WebSocketMessage = {
              message: {
                id: ultimaMensagem.id,
                mensagem: ultimaMensagem.mensagem,
                tipo: ultimaMensagem.tipo,
                autor_nome: ultimaMensagem.autor_nome,
                visualizada: ultimaMensagem.visualizada,
                criado_em: ultimaMensagem.criado_em,
              },
              timestamp: new Date().toISOString(),
            };
            
            console.log(`📨 Polling: Chamando onNewMessage com:`, webSocketMessage);
            options.onNewMessage?.(webSocketMessage);
          } else {
            console.log(`🔍 Polling: Nenhuma mensagem nova`);
          }
        } else {
          console.log(`🔍 Polling: Nenhuma mensagem encontrada`);
        }
      } else {
        console.error('❌ Polling: Erro na resposta:', response.status);
      }
    } catch (error) {
      // Verificar se é um erro de abort ou outro tipo
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏰ Polling: Requisição cancelada por timeout');
        return;
      }
      
      console.error('❌ Polling: Erro ao verificar novas mensagens:', error);
      options.onError?.(error as Error);
    }
  }, [options.orcamentoId, options.isPublic, options.onNewMessage, options.onError]);

  // Iniciar polling quando o componente montar
  useEffect(() => {
    if (options.orcamentoId && typeof window !== 'undefined') {
      // Pequeno delay para garantir que o componente está totalmente montado
      const initialDelay = setTimeout(() => {
        checkNewMessages();
      }, 100);
      
      // Configurar polling a cada 5 segundos (reduzido de 3s para 5s)
      pollingIntervalRef.current = setInterval(checkNewMessages, 5000);
      
      return () => {
        clearTimeout(initialDelay);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [checkNewMessages]);

  const connect = useCallback(() => {
    // Conectado via polling
  }, []);

  const disconnect = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const emitTyping = useCallback((isTyping: boolean) => {
    // Typing não implementado no polling
  }, []);

  const emitMessageRead = useCallback(async (messageId: string) => {
    if (!options.orcamentoId) return;

    // Não tentar marcar mensagens temporárias como lidas
    if (messageId.startsWith('temp_')) {
      console.log('⚠️ Polling: Ignorando mensagem temporária:', messageId);
      return;
    }

    try {
      const token = options.isPublic ? null : localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Usar endpoint correto baseado no modo
      const endpoint = options.isPublic
        ? `/orcamentos-v2/${options.orcamentoId}/publico/mensagens/${messageId}/visualizar`
        : `/orcamentos-v2/chat/${options.orcamentoId}/mensagens/${messageId}/visualizar`;

      const fullUrl = buildApiUrl(endpoint);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        console.error('❌ Polling: Erro ao marcar como lida:', response.status);
      }
    } catch (error) {
      console.error('❌ Polling: Erro ao marcar mensagem como lida:', error);
    }
  }, [options.orcamentoId, options.isPublic]);

  const ping = useCallback(() => {
    // Ping não implementado no polling
  }, []);

  return {
    isConnected: true, // Sempre true para polling
    isConnecting: false,
    emitTyping,
    emitMessageRead,
    ping,
    connect,
    disconnect,
  };
} 