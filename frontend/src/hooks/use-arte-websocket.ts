import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { normalizeArteMensagemSocketPayload } from '@/lib/arte-mensagem-socket';

const resolveSocketBaseUrl = () => {
  const configuredUrl = (process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  if (!configuredUrl || configuredUrl === '/api') {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          return `${window.location.protocol}//${host}:4000`;
        }
      }
      return 'http://localhost:4000';
    }
    return '';
  }

  if (configuredUrl.endsWith('/api')) {
    return configuredUrl.slice(0, -4);
  }

  return configuredUrl;
};

interface UseArteWebSocketOptions {
  versaoId?: string;
  token?: string; // Para cliente público
  lojaId?: string;
  usuarioId?: string;
}

export interface ArteWebSocketHook {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean;
  novaMensagem: any | null;
  contadorAtualizado: any | null;
  mensagensLidas: string[];
  usuariosTyping: Array<{ clientId: string; tipo: string; isTyping: boolean }>;
  marcarMensagemLida: (mensagemId: string) => void;
  entrarSalaVersao: (versaoId: string) => void;
  sairSalaVersao: (versaoId: string) => void;
  toggleTyping: (isTyping: boolean) => void;
  ping: () => void;
}

export const useArteWebSocket = (
  options: UseArteWebSocketOptions = {},
): ArteWebSocketHook => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>(
    'disconnected',
  );
  const [isConnected, setIsConnected] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState<any | null>(null);
  const [contadorAtualizado, setContadorAtualizado] = useState<any | null>(null);
  const [mensagensLidas, setMensagensLidas] = useState<string[]>([]);
  const [usuariosTyping, setUsuariosTyping] = useState<Array<{ clientId: string; tipo: string; isTyping: boolean }>>([]);

  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const currentVersaoIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionStatus((prev) => (prev === 'disconnected' ? prev : 'disconnected'));
    setIsConnected(false);
    setNovaMensagem(null);
    setMensagensLidas([]);
    setUsuariosTyping([]);
    isConnectingRef.current = false;
    hasConnectedRef.current = false;
    currentVersaoIdRef.current = null;
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current) {
      return;
    }

    const token = options.token || 
      (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null) ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null);

    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus('connecting');
    shouldReconnectRef.current = true;

    const baseUrl = resolveSocketBaseUrl();
    if (!baseUrl) {
      setConnectionStatus('disconnected');
      isConnectingRef.current = false;
      return;
    }

    const socket = io(`${baseUrl}/arte-aprovacao`, {
      // Polling primeiro: mais estável em mobile/Safari
      transports: ['polling', 'websocket'],
      upgrade: true,
      timeout: 8000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 1,
      reconnectionDelay: 2500,
      auth: {
        token: token,
      },
      query: {
        lojaId: options.lojaId,
        usuarioId: options.usuarioId,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setIsConnected(true);
      isConnectingRef.current = false;
      hasConnectedRef.current = true;
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      setNovaMensagem(null);
      setMensagensLidas([]);
      setUsuariosTyping([]);
      isConnectingRef.current = false;
      hasConnectedRef.current = false;
    });

    socket.on('connect_error', (error) => {
      setConnectionStatus('error');
      isConnectingRef.current = false;
      shouldReconnectRef.current = false;
      try {
        socket.io.opts.reconnection = false;
      } catch {
        /* ignore */
      }
      // Sem console.error: no mobile o Next overlay trata "xhr poll error" como Issue.
      void error;
    });

    // Eventos específicos do arte
    socket.on('nova_mensagem_arte', (data) => {
      const normalized = normalizeArteMensagemSocketPayload(data);
      setNovaMensagem(normalized);
      
      // Limpar mensagem após um tempo para permitir nova notificação
      setTimeout(() => {
        setNovaMensagem(null);
      }, 100);
    });

    socket.on('mensagem_marcada_lida', (data) => {
      setMensagensLidas(prev => [...prev, data.mensagemId]);
    });

    socket.on('user_typing_arte', (data) => {
      setUsuariosTyping(prev => {
        const filtered = prev.filter(u => u.clientId !== data.clientId);
        if (data.isTyping) {
          return [...filtered, { 
            clientId: data.clientId, 
            tipo: data.tipo, 
            isTyping: data.isTyping 
          }];
        }
        return filtered;
      });
    });

    socket.on('user_joined_arte', () => {
      /* sala join — silencioso */
    });

    socket.on('user_left_arte', (data) => {
      setUsuariosTyping(prev => prev.filter(u => u.clientId !== data.clientId));
    });

    socket.on('contador_atualizado', (data) => {
      setContadorAtualizado(data);
      setTimeout(() => setContadorAtualizado(null), 100);
    });

    socket.on('pong_arte', () => {
      /* heartbeat */
    });

    socket.on('error', () => {
      setConnectionStatus('error');
    });

  }, [options.token, options.lojaId, options.usuarioId]); // Dependências específicas para evitar re-criação desnecessária

  useEffect(() => {
    const { lojaId, usuarioId, token } = options;

    // Evitar múltiplas conexões
    if (socketRef.current?.connected) {
      return;
    }

    if (lojaId && usuarioId) {
      connect();
    } else if (token) {
      // Cliente público com token
      connect();
    } else {
      setConnectionStatus('disconnected');
    }

    return () => {
      disconnect();
    };
  }, [options.lojaId, options.usuarioId, options.token]); // Dependências específicas para evitar re-execuções desnecessárias

  // Removido: enviarMensagem - mensagens são enviadas via API HTTP, não WebSocket

  const marcarMensagemLida = useCallback((mensagemId: string) => {
    if (socketRef.current && isConnected && currentVersaoIdRef.current) {
      socketRef.current.emit('mensagem_lida', {
        versaoId: currentVersaoIdRef.current,
        mensagemId: mensagemId,
      });
    }
  }, [isConnected]);

  const entrarSalaVersao = useCallback((versaoId: string) => {
    if (socketRef.current && isConnected) {
      currentVersaoIdRef.current = versaoId;
      socketRef.current.emit('join_arte_versao', { versaoId });
      console.log(`🚪 Entrando na sala da versão: ${versaoId}`);
    }
  }, [isConnected]);

  const sairSalaVersao = useCallback((versaoId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_arte_versao', { versaoId });
      if (currentVersaoIdRef.current === versaoId) {
        currentVersaoIdRef.current = null;
      }
      console.log(`🚪 Saindo da sala da versão: ${versaoId}`);
    }
  }, [isConnected]);

  const toggleTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current && isConnected && currentVersaoIdRef.current) {
      socketRef.current.emit('typing_arte', {
        versaoId: currentVersaoIdRef.current,
        isTyping: isTyping,
      });

      // Auto-stop typing após 3 segundos
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          toggleTyping(false);
        }, 3000);
      }
    }
  }, [isConnected]);

  const ping = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('ping_arte');
    }
  }, [isConnected]);

  return {
    connectionStatus,
    isConnected,
    novaMensagem,
    contadorAtualizado,
    mensagensLidas,
    usuariosTyping,
    marcarMensagemLida,
    entrarSalaVersao,
    sairSalaVersao,
    toggleTyping,
    ping,
  };
};
