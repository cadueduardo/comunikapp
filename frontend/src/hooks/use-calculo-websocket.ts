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
  /** Se false, não abre socket (preview usa cálculo local). Default: true. */
  autoConnect?: boolean;
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
let sharedConnecting = false;

export const useCalculoWebSocket = (
  options: UseCalculoWebSocketOptions = {},
): CalculoWebSocketHook => {
  const autoConnect = options.autoConnect !== false;
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [resultadoProduto, setResultadoProduto] = useState<unknown>(null);
  const [resultadoOrcamento, setResultadoOrcamento] = useState<unknown>(null);

  const hasConnectedRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const identifiersRef = useRef<{ lojaId?: string; usuarioId?: string }>({
    lojaId: options.lojaId,
    usuarioId: options.usuarioId,
  });

  const setStatusSafe = useCallback(
    (next: 'connecting' | 'connected' | 'disconnected' | 'error') => {
      setConnectionStatus((prev) => (prev === next ? prev : next));
      setIsConnected((prev) => {
        const want = next === 'connected';
        return prev === want ? prev : want;
      });
    },
    [],
  );

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

    setStatusSafe('disconnected');
    sharedConnecting = false;
    hasConnectedRef.current = false;
  }, [setStatusSafe]);

  const connect = useCallback(() => {
    if (sharedConnecting || sharedSocket?.connected) {
      if (sharedSocket?.connected) {
        setStatusSafe('connected');
      }
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
      setStatusSafe('disconnected');
      return;
    }

    const { lojaId, usuarioId } = resolveIdentifiers();

    if (!lojaId || !usuarioId) {
      setStatusSafe('disconnected');
      return;
    }

    const baseUrl = resolveSocketBaseUrl();
    if (!baseUrl) {
      setStatusSafe('disconnected');
      return;
    }

    sharedConnecting = true;
    setStatusSafe('connecting');
    shouldReconnectRef.current = true;

    // Polling primeiro: mais estável em Safari/mobile e redes com proxy.
    // extraHeaders NÃO funciona no browser — usar auth.
    // reconnection limitado: evita spam de "xhr poll error" no overlay do Next.
    const socket = io(`${baseUrl}/calculo-v2`, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      timeout: 8000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 1,
      reconnectionDelay: 2500,
      auth: { token },
      query: {
        token,
        lojaId,
        usuarioId,
      },
    });

    sharedSocket = socket;

    socket.on('connect', () => {
      setStatusSafe('connected');
      sharedConnecting = false;
      hasConnectedRef.current = true;
    });

    socket.on('status', (message: { conectado?: boolean }) => {
      if (message?.conectado) {
        setStatusSafe('connected');
      }
    });

    socket.on('calculo_concluido', (message: unknown) => {
      setResultadoProduto(message);
      setResultadoOrcamento(message);
    });

    socket.on('erro', () => {
      setStatusSafe('error');
    });

    socket.on('disconnect', () => {
      setStatusSafe('disconnected');
      sharedConnecting = false;
      hasConnectedRef.current = false;
      // Mantém último resultado — preview local continua válido.
    });

    socket.on('connect_error', () => {
      setStatusSafe('error');
      sharedConnecting = false;
      // Para tentativas extras — cálculo local segue no preview.
      try {
        socket.io.opts.reconnection = false;
      } catch {
        /* ignore */
      }
    });

    socket.on('erro-autenticacao', () => {
      setStatusSafe('error');
      sharedConnecting = false;
      shouldReconnectRef.current = false;
      try {
        socket.io.opts.reconnection = false;
      } catch {
        /* ignore */
      }
    });
  }, [resolveIdentifiers, setStatusSafe]);

  useEffect(() => {
    if (WEBSOCKET_DISABLED || !autoConnect) {
      return () => undefined;
    }

    sharedRefCount += 1;
    const { lojaId, usuarioId } = resolveIdentifiers();

    if (lojaId && usuarioId) {
      connect();
    } else {
      setStatusSafe('disconnected');
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect, resolveIdentifiers, setStatusSafe]);

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
