import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WEBSOCKET_DISABLED = false;
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

interface UseCalculoWebSocketOptions {
  lojaId?: string;
  usuarioId?: string;
}

export interface CalculoWebSocketHook {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  executarCalculo: (data: any) => void;
  executarCalculoOrcamento: (data: any) => void;
  isConnected: boolean;
  resultadoProduto: any;
  resultadoOrcamento: any;
}

export const useCalculoWebSocket = (
  options: UseCalculoWebSocketOptions = {},
): CalculoWebSocketHook => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>(
    'disconnected',
  );
  const [isConnected, setIsConnected] = useState(false);
  const [resultadoProduto, setResultadoProduto] = useState<any>(null);
  const [resultadoOrcamento, setResultadoOrcamento] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const identifiersRef = useRef<{ lojaId?: string; usuarioId?: string }>({
    lojaId: options.lojaId,
    usuarioId: options.usuarioId,
  });

  const resolveIdentifiers = useCallback(() => {
    const lojaId =
      options.lojaId ??
      (typeof window !== 'undefined' ? localStorage.getItem('loja_id') ?? undefined : undefined);
    const usuarioId =
      options.usuarioId ??
      (typeof window !== 'undefined' ? localStorage.getItem('user_id') ?? undefined : undefined);

    identifiersRef.current = { lojaId, usuarioId };
    return identifiersRef.current;
  }, [options.lojaId, options.usuarioId]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionStatus((prev) => (prev === 'disconnected' ? prev : 'disconnected'));
    setIsConnected(false);
    setResultadoProduto(null);
    setResultadoOrcamento(null);
    isConnectingRef.current = false;
    hasConnectedRef.current = false;
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current) {
      return;
    }

    const token =
      (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null) ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null);

    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    const { lojaId, usuarioId } = resolveIdentifiers();

    if (!lojaId || !usuarioId) {
      setConnectionStatus('disconnected');
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus('connecting');
    shouldReconnectRef.current = true;

    const socket = io(`${API_BASE_URL}/calculo-v2`, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      reconnection: false,
      query: {
        token,
        lojaId,
        usuarioId,
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setIsConnected(true);
      isConnectingRef.current = false;
      hasConnectedRef.current = true;
    });

    socket.on('status', (message: any) => {
      if (message?.conectado) {
        setConnectionStatus('connected');
        setIsConnected(true);
      }
    });

    socket.on('calculo_concluido', (message: any) => {
      setResultadoProduto(message);
      setResultadoOrcamento(message);
    });

    socket.on('erro', () => {
      setConnectionStatus('error');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      setResultadoProduto(null);
      setResultadoOrcamento(null);
      isConnectingRef.current = false;
      hasConnectedRef.current = false;

      if (shouldReconnectRef.current) {
        setTimeout(() => {
          if (!hasConnectedRef.current && shouldReconnectRef.current) {
            connect();
          }
        }, 5000);
      }
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
      isConnectingRef.current = false;
      if (shouldReconnectRef.current) {
        setTimeout(() => {
          if (!hasConnectedRef.current && shouldReconnectRef.current) {
            connect();
          }
        }, 3000);
      }
    });

    socket.on('erro-autenticacao', () => {
      setConnectionStatus('error');
      isConnectingRef.current = false;
    });
  }, [resolveIdentifiers]);

  useEffect(() => {
    if (WEBSOCKET_DISABLED) {
      return () => undefined;
    }

    const { lojaId, usuarioId } = resolveIdentifiers();

    if (lojaId && usuarioId) {
      connect();
    } else {
      setConnectionStatus('disconnected');
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, resolveIdentifiers]);

  const executarCalculo = useCallback(
    (data: any) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('calcular_preview', data);
      }
    },
    [isConnected],
  );

  const executarCalculoOrcamento = useCallback(
    (data: any) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('calcular_preview', data);
      }
    },
    [isConnected],
  );

  if (WEBSOCKET_DISABLED) {
    return {
      connectionStatus: 'disconnected',
      executarCalculo: () => undefined,
      executarCalculoOrcamento: () => undefined,
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
