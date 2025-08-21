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
      console.log('🔍 Polling: Verificando novas mensagens para orçamento:', options.orcamentoId);
      
      const token = options.isPublic ? null : localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔍 Polling: Token encontrado');
      } else {
        console.log('🔍 Polling: Sem token (modo público)');
      }

      // Usar endpoint público se estiver em modo público
      const endpoint = options.isPublic 
        ? `/orcamentos/${options.orcamentoId}/mensagens/publico`
        : `/orcamentos/${options.orcamentoId}/mensagens`;

      const fullUrl = buildApiUrl(endpoint);
      console.log('🔍 Polling: Usando endpoint:', fullUrl);

      // Adicionar timeout para evitar requisições muito longas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch(fullUrl, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('🔍 Polling: Status da resposta:', response.status);

      if (response.ok) {
        const mensagens = await response.json();
        console.log('🔍 Polling: Mensagens recebidas:', mensagens.length);
        
        // Verificar se há mensagens novas
        if (mensagens.length > 0) {
          const ultimaMensagem = mensagens[mensagens.length - 1];
          console.log('🔍 Polling: Última mensagem ID:', ultimaMensagem.id);
          console.log('🔍 Polling: Last message ID ref:', lastMessageIdRef.current);
          
          if (lastMessageIdRef.current !== ultimaMensagem.id) {
            console.log('✅ Polling: Nova mensagem detectada!');
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
            
            console.log('📨 Polling: Chamando onNewMessage com:', webSocketMessage);
            options.onNewMessage?.(webSocketMessage);
          } else {
            console.log('🔍 Polling: Nenhuma mensagem nova');
          }
        } else {
          console.log('🔍 Polling: Nenhuma mensagem encontrada');
        }
      } else {
        console.error('❌ Polling: Erro na resposta:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Polling: Detalhes do erro:', errorText);
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
      console.log('🚀 Polling: Iniciando para orçamento:', options.orcamentoId);
      
      // Pequeno delay para garantir que o componente está totalmente montado
      const initialDelay = setTimeout(() => {
        checkNewMessages();
      }, 100);
      
      // Configurar polling a cada 3 segundos
      pollingIntervalRef.current = setInterval(checkNewMessages, 3000);
      console.log('⏰ Polling: Intervalo configurado (3s)');
      
      return () => {
        clearTimeout(initialDelay);
        console.log('🛑 Polling: Limpando intervalo');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      console.log('⚠️ Polling: OrcamentoId não fornecido ou não está no browser, não iniciando');
    }
  }, [checkNewMessages]);

  const connect = useCallback(() => {
    console.log('🔌 Polling: Conectando...');
  }, []);

  const disconnect = useCallback(() => {
    console.log('🔌 Polling: Desconectando...');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const emitTyping = useCallback((isTyping: boolean) => {
    console.log('⌨️ Polling: Typing:', isTyping);
  }, []);

  const emitMessageRead = useCallback(async (messageId: string) => {
    if (!options.orcamentoId) return;

    // Não tentar marcar mensagens temporárias como lidas
    if (messageId.startsWith('temp_')) {
      console.log('⚠️ Polling: Ignorando mensagem temporária:', messageId);
      return;
    }

    try {
      console.log('👁️ Polling: Marcando mensagem como lida:', messageId);

      const token = options.isPublic ? null : localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Usar endpoint correto baseado no modo
      const endpoint = options.isPublic
        ? `/orcamentos/${options.orcamentoId}/mensagens/publico/${messageId}/visualizar`
        : `/orcamentos/${options.orcamentoId}/mensagens/${messageId}/visualizar`;

      const fullUrl = buildApiUrl(endpoint);
      console.log('👁️ Polling: Usando endpoint para marcar como lida:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        console.log('✅ Polling: Mensagem marcada como lida');
      } else {
        console.error('❌ Polling: Erro ao marcar como lida:', response.status);
      }
    } catch (error) {
      console.error('❌ Polling: Erro ao marcar mensagem como lida:', error);
    }
  }, [options.orcamentoId, options.isPublic]);

  const ping = useCallback(() => {
    console.log('💓 Polling: Ping');
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