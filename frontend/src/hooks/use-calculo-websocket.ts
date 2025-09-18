import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ✅ REATIVAR WEBSOCKET - Vamos resolver o problema real!
const WEBSOCKET_DISABLED = false;

export interface CalculoWebSocketHook {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  executarCalculo: (data: any) => void;
  executarCalculoOrcamento: (data: any) => void;
  isConnected: boolean;
  resultadoProduto: any;
  resultadoOrcamento: any;
}

export const useCalculoWebSocket = (): CalculoWebSocketHook => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [resultadoProduto, setResultadoProduto] = useState<any>(null);
  const [resultadoOrcamento, setResultadoOrcamento] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    console.log('🔧 Hook WebSocket - Tentando conectar...');

    if (isConnectingRef.current || hasConnectedRef.current) {
      console.log('🔧 Hook WebSocket - Já conectando ou conectado, ignorando...');
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus('connecting');
    console.log('🔧 Hook WebSocket - Iniciando conexão...');

    try {
      // ✅ OBTER TOKEN JWT PARA AUTENTICAÇÃO
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      console.log('🔧 Hook WebSocket - Token encontrado:', token ? 'Sim' : 'Não');

      if (!token) {
        console.error('❌ Token de acesso não encontrado para WebSocket');
        setConnectionStatus('error');
        isConnectingRef.current = false;
        return;
      }

      // Conectar ao namespace específico do cálculo com token
      console.log('🔧 Hook WebSocket - Criando socket para:', 'http://localhost:4000/calculo-v2');
      const socket = io('http://localhost:4000/calculo-v2', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: false, // ✅ DESABILITAR RECONEXÃO AUTOMÁTICA
        reconnectionAttempts: 0,
        reconnectionDelay: 0,
        query: {
          token: token, // ✅ ENVIAR TOKEN VIA QUERY PARAMS
          lojaId: 'loja_atual', // TODO: Obter da sessão
          usuarioId: 'usuario_atual', // TODO: Obter da sessão
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`, // ✅ ENVIAR TOKEN VIA HEADERS TAMBÉM
        },
      });
      console.log('🔧 Hook WebSocket - Socket criado, aguardando eventos...');

      socketRef.current = socket;

      // Event listeners
      socket.on('connect', () => {
        console.log('🔌 Conectado ao WebSocket do Motor de Cálculo');
        setConnectionStatus('connected');
        setIsConnected(true);
        isConnectingRef.current = false;
        hasConnectedRef.current = true;
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão WebSocket:', error);
        setConnectionStatus('error');
        isConnectingRef.current = false;
      });

      socket.on('conectado', (message) => {
        console.log('✅ Conectado ao Motor de Cálculo:', message);
      });

      socket.on('resultado-produto', (message: any) => {
        console.log('📊 Resultado produto recebido via WebSocket:', message);
        setResultadoProduto(message);
      });

      socket.on('resultado-orcamento', (message: any) => {
        console.log('📊 Resultado orçamento recebido via WebSocket:', message);
        setResultadoOrcamento(message);
      });

      socket.on('erro-calculo', (message: any) => {
        console.error('❌ Erro de cálculo via WebSocket:', message);
      });

      socket.on('erro-autenticacao', (message: any) => {
        console.error('❌ Erro de autenticação WebSocket:', message);
        setConnectionStatus('error');
        isConnectingRef.current = false;
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Desconectado do WebSocket:', reason);
        setConnectionStatus('disconnected');
        setIsConnected(false);
        hasConnectedRef.current = false;
        isConnectingRef.current = false;

        // ✅ RECONEXÃO CONTROLADA APENAS PARA DESCONEXÕES DO SERVIDOR
        if (reason === 'io server disconnect') {
          console.log('🔄 Servidor desconectou, tentando reconectar em 5s...');
          setTimeout(() => {
            if (!hasConnectedRef.current) {
              connect();
            }
          }, 5000);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão WebSocket:', error);
        setConnectionStatus('error');
        isConnectingRef.current = false;

        // ✅ RECONEXÃO CONTROLADA PARA ERROS DE CONEXÃO
        console.log('🔄 Erro de conexão, tentando reconectar em 3s...');
        setTimeout(() => {
          if (!hasConnectedRef.current) {
            connect();
          }
        }, 3000);
      });

    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      setConnectionStatus('error');
      isConnectingRef.current = false;
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionStatus('disconnected');
    setIsConnected(false);
    hasConnectedRef.current = false;
    isConnectingRef.current = false;
  }, []);

  // Executar cálculo de produto
  const executarCalculo = useCallback((data: any) => {
    if (socketRef.current && isConnected) {
      console.log('🚀 Enviando cálculo de produto via WebSocket:', data);
      socketRef.current.emit('calcular-produto', data);
    } else {
      console.warn('⚠️ WebSocket não conectado, não é possível executar cálculo');
    }
  }, [isConnected]);

  // Executar cálculo de orçamento
  const executarCalculoOrcamento = useCallback((data: any) => {
    if (socketRef.current && isConnected) {
      console.log('🚀 Enviando cálculo de orçamento via WebSocket:', data);
      socketRef.current.emit('calcular-orcamento', data);
    } else {
      console.warn('⚠️ WebSocket não conectado, não é possível executar cálculo');
    }
  }, [isConnected]);

  // Auto-conectar quando o hook é montado
  useEffect(() => {
    console.log('🔧 Hook WebSocket - useEffect executado, tentando conectar...');
    connect();

    return () => {
      console.log('🔧 Hook WebSocket - useEffect cleanup, desconectando...');
      disconnect();
    };
  }, [connect, disconnect]);

  // ✅ REATIVAR WEBSOCKET - Vamos resolver o problema real!
  if (WEBSOCKET_DISABLED) {
    return {
      connectionStatus: 'disconnected',
      executarCalculo: () => {
        console.log('🔧 WEBSOCKET DESABILITADO - Usando HTTP em vez de WebSocket');
        // TODO: Implementar chamada HTTP para cálculo
      },
      executarCalculoOrcamento: () => {
        console.log('🔧 WEBSOCKET DESABILITADO - Usando HTTP em vez de WebSocket');
        // TODO: Implementar chamada HTTP para orçamento
      },
      isConnected: false,
      resultadoProduto: null,
      resultadoOrcamento: null,
    };
  }

  return {
    connectionStatus,
    executarCalculo,
    executarCalculoOrcamento,
    isConnected,
    resultadoProduto,
    resultadoOrcamento,
  };
};
