import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WEBSOCKET_DISABLED = false;

const resolveSocketBaseUrl = () => {
  const configuredUrl = (
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).replace(/\/$/, '');

  if (!configuredUrl || configuredUrl === '/api') {
    if (process.env.NODE_ENV !== 'production') {
      // Em device/mobile na mesma rede, localhost aponta para o telefone — não para o PC.
      // Prefira NEXT_PUBLIC_WS_URL com IP da máquina (ex.: http://192.168.x.x:4000).
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

interface UseCalculoWebSocketOptions {
  lojaId?: string;
  usuarioId?: string;
}

export interface CalculoWebSocketHook {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  executarCalculo: (data: unknown) => void;
  executarCalculoOrcamento: (data: unknown) => void;
  isConnected: boolean;
  resultadoProduto: unknown;
  resultadoOrcamento: unknown;
}

/**
 * Socket compartilhado — evita 2 conexões (form + Preview) no mobile.
 */
let sharedSocket: Socket | null = null;
let sharedRefCount = 0;

export const useCalculoWebSocket = (
  options: UseCalculoWebSocketOptions = {},
): CalculoWebSocketHook => {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [resultadoProduto, setResultadoProduto] = useState<unknown>(null);
  const [resultadoOrcamento, setResultadoOrcamento] = useState<unknown>(null);

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
      (typeof window !== 'undefined'
        ? (localStorage.getItem('loja_id') ?? undefined)
        : undefined);
    const usuarioId =
      options.usuarioId ??
      (typeof window !== 'undefined'
        ? (localStorage.getItem('user_id') ?? undefined)
        : undefined);

    identifiersRef.current = { lojaId, usuarioId };
    return identifiersRef.current;
  }, [options.lojaId, options.usuarioId]);

  const disconnect = useCallback(() => {
    sharedRefCount = Math.max(0, sharedRefCount - 1);
    if (sharedRefCount > 0) {
      return;
    }

    shouldReconnectRef.current = false;
    if (sharedSocket) {
      sharedSocket.removeAllListeners();
      sharedSocket.disconnect();
      sharedSocket = null;
    }

    setConnectionStatus('disconnected');
    setIsConnected(false);
    isConnectingRef.current = false;
    hasConnectedRef.current = false;
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current) {
      return;
    }

    const token =
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null) ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem('access_token')
        : null);

    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    const { lojaId, usuarioId } = resolveIdentifiers();

    if (!lojaId || !usuarioId) {
      setConnectionStatus('disconnected');
      return;
    }

    if (sharedSocket?.connected) {
      setConnectionStatus('connected');
      setIsConnected(true);
      return;
    }

    const baseUrl = resolveSocketBaseUrl();
    if (!baseUrl) {
      setConnectionStatus('disconnected');
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus('connecting');
    shouldReconnectRef.current = true;

    // Polling primeiro: mais estável em Safari/mobile e redes com proxy.
    // extraHeaders NÃO funciona no browser — usar auth.
    const socket = io(`${baseUrl}/calculo-v2`, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      timeout: 12000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      auth: { token },
      query: {
        token,
        lojaId,
        usuarioId,
      },
    });

    sharedSocket = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setIsConnected(true);
      isConnectingRef.current = false;
      hasConnectedRef.current = true;
    });

    socket.on('status', (message: { conectado?: boolean }) => {
      if (message?.conectado) {
        setConnectionStatus('connected');
        setIsConnected(true);
      }
    });

    socket.on('calculo_concluido', (message: unknown) => {
      setResultadoProduto(message);
      setResultadoOrcamento(message);
    });

    socket.on('erro', () => {
      setConnectionStatus('error');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      isConnectingRef.current = false;
      hasConnectedRef.current = false;
      // Mantém último resultado — preview local continua válido.
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
      isConnectingRef.current = false;
    });

    socket.on('erro-autenticacao', () => {
      setConnectionStatus('error');
      isConnectingRef.current = false;
      shouldReconnectRef.current = false;
    });
  }, [resolveIdentifiers]);

  useEffect(() => {
    if (WEBSOCKET_DISABLED) {
      return () => undefined;
    }

    sharedRefCount += 1;
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
    (data: unknown) => {
      if (sharedSocket?.connected) {
        sharedSocket.emit('calcular_preview', data);
      }
    },
    [],
  );

  const executarCalculoOrcamento = useCallback(
    (data: unknown) => {
      if (sharedSocket?.connected) {
        sharedSocket.emit('calcular_preview', data);
      }
    },
    [],
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
