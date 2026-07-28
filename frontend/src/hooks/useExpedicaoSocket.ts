import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  EXPEDICAO_SOCKET_URL,
  EXPEDICAO_WS_EVENTOS,
} from '@/lib/expedicao/expedicao-socket';
import { hasClientSession } from '@/lib/session-auth';

export interface ExpedicaoSocketEvento {
  tipo?: string;
  expedicao_id?: string;
  os_id?: string;
  status_anterior?: string;
  status_novo?: string;
  timestamp?: string;
}

/**
 * Escuta eventos da sala `loja_{lojaId}` e força re-fetch do kanban.
 * Auth: cookie HttpOnly via withCredentials (sem JWT no JS).
 */
export function useExpedicaoSocket(
  onRefresh: (evento?: ExpedicaoSocketEvento) => void | Promise<void>,
  habilitado = true,
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!habilitado || !EXPEDICAO_SOCKET_URL) {
      return;
    }

    if (!hasClientSession()) {
      return;
    }

    let socket: Socket | null = null;

    socket = io(EXPEDICAO_SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    const handleEvento = (payload: ExpedicaoSocketEvento) => {
      void onRefreshRef.current(payload);
    };

    socket.on(EXPEDICAO_WS_EVENTOS.ATUALIZADA, handleEvento);
    socket.on(EXPEDICAO_WS_EVENTOS.DEVOLVIDA, handleEvento);

    return () => {
      socket?.off(EXPEDICAO_WS_EVENTOS.ATUALIZADA, handleEvento);
      socket?.off(EXPEDICAO_WS_EVENTOS.DEVOLVIDA, handleEvento);
      socket?.disconnect();
      socket = null;
    };
  }, [habilitado]);
}
