import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { hasClientSession } from '@/lib/session-auth';
import { getClientSocketBaseUrl } from '@/lib/config';

export interface ArteMensagemSocketPayload {
  id?: string;
  os_id: string;
  produto_id: string;
  versao_id?: string | null;
  mensagem?: string;
  autor_tipo?: string;
  autor_nome?: string;
  lida?: boolean;
  loja_id?: string;
}

export interface ArteMensagensLidasSocketPayload {
  os_id: string;
  produto_id: string;
  versao_id?: string | null;
}

export interface ArteStatusAtualizadoSocketPayload {
  item_id: string;
  os_id: string;
  status_arte: string;
}

const resolveSocketBaseUrl = () => getClientSocketBaseUrl();

function normalizeMensagemPayload(data: unknown): ArteMensagemSocketPayload | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as { mensagem?: ArteMensagemSocketPayload };
  const msg = root.mensagem ?? (data as ArteMensagemSocketPayload);
  if (!msg?.os_id || !msg?.produto_id) return null;
  return msg;
}

interface UseArteKanbanSocketOptions {
  habilitado?: boolean;
  onNovaMensagem?: (mensagem: ArteMensagemSocketPayload) => void;
  onMensagensLidas?: (payload: ArteMensagensLidasSocketPayload) => void;
  onStatusAtualizado?: (payload: ArteStatusAtualizadoSocketPayload) => void;
}

/**
 * Escuta eventos da sala `loja_{lojaId}` no namespace arte-aprovacao.
 * Auth: cookie HttpOnly via withCredentials.
 */
export function useArteKanbanSocket({
  habilitado = true,
  onNovaMensagem,
  onMensagensLidas,
  onStatusAtualizado,
}: UseArteKanbanSocketOptions) {
  const onNovaMensagemRef = useRef(onNovaMensagem);
  const onMensagensLidasRef = useRef(onMensagensLidas);
  const onStatusAtualizadoRef = useRef(onStatusAtualizado);
  onNovaMensagemRef.current = onNovaMensagem;
  onMensagensLidasRef.current = onMensagensLidas;
  onStatusAtualizadoRef.current = onStatusAtualizado;

  useEffect(() => {
    if (!habilitado) return;

    const socketBaseUrl = resolveSocketBaseUrl();
    if (!socketBaseUrl) return;

    if (!hasClientSession()) return;

    const socket: Socket = io(`${socketBaseUrl}/arte-aprovacao`, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 10,
      withCredentials: true,
    });

    const handleNovaMensagem = (data: unknown) => {
      const mensagem = normalizeMensagemPayload(data);
      if (!mensagem) return;
      onNovaMensagemRef.current?.(mensagem);
    };

    const handleMensagensLidas = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const payload = data as ArteMensagensLidasSocketPayload;
      if (!payload.os_id || !payload.produto_id) return;
      onMensagensLidasRef.current?.(payload);
    };

    const handleStatusAtualizado = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const payload = data as ArteStatusAtualizadoSocketPayload;
      if (!payload.item_id || !payload.status_arte) return;
      onStatusAtualizadoRef.current?.(payload);
    };

    socket.on('nova_mensagem_arte', handleNovaMensagem);
    socket.on('mensagens_lidas_arte', handleMensagensLidas);
    socket.on('status_arte_atualizado', handleStatusAtualizado);

    return () => {
      socket.off('nova_mensagem_arte', handleNovaMensagem);
      socket.off('mensagens_lidas_arte', handleMensagensLidas);
      socket.off('status_arte_atualizado', handleStatusAtualizado);
      socket.disconnect();
    };
  }, [habilitado]);
}
