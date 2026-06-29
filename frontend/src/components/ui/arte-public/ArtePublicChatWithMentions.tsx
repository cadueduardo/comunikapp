'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { TiptapEditor } from '@/components/ui/tiptap/TiptapEditor';
import { useArteWebSocket } from '@/hooks/use-arte-websocket';
import { mapArteMensagemSocketToUi } from '@/lib/arte-mensagem-socket';

interface VersaoArte {
  id: string;
  versao: string;
  status: string;
  data_criacao: string;
  autor: {
    nome: string;
  };
}

interface MensagemArte {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  mensagemProcessada?: string;
  data: string;
  lida: boolean;
  mencoes?: string[];
}

interface ArtePublicChatWithMentionsProps {
  versaoId: string;
  token: string;
  versoesDisponiveis: VersaoArte[];
  produtoNome: string;
  produtoId?: string;
  onMensagemEnviada?: () => void;
}

function mapApiMensagem(msg: Record<string, unknown>): MensagemArte {
  const autorTipoRaw = String(msg.autor_tipo || '').toLowerCase();
  return {
    id: String(msg.id),
    autor: String(msg.autor_nome || 'Usuário'),
    autorTipo: autorTipoRaw === 'cliente' ? 'cliente' : 'equipe',
    mensagem: String(msg.mensagem || ''),
    data: String(msg.created_at || new Date().toISOString()),
    lida: Boolean(msg.lida ?? true),
    mencoes: [],
  };
}

export function ArtePublicChatWithMentions({
  versaoId,
  token,
  versoesDisponiveis,
  produtoNome,
  produtoId,
  onMensagemEnviada
}: ArtePublicChatWithMentionsProps) {
  const [mensagens, setMensagens] = useState<MensagemArte[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [initialLoading, setInitialLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);

  const mensagensRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    novaMensagem: novaMensagemSocket,
    entrarSalaVersao,
    sairSalaVersao,
  } = useArteWebSocket({ token, versaoId });

  const mentionsMemo = useMemo(() => {
    return versoesDisponiveis.map(v => ({
      id: v.id,
      label: `${v.versao} - ${produtoNome}`
    }));
  }, [versoesDisponiveis, produtoNome]);

  const handleUpdate = useCallback((html: string) => {
    setNovaMensagem(html);
  }, []);

  const carregarMensagens = useCallback(async (silent = false) => {
    if (!versaoId || !token) return;

    try {
      if (!silent) {
        setInitialLoading(true);
      }

      const url = `/api/arte-aprovacao/mensagens/publico/${token}/versao/${versaoId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setMensagens(data.data.map((msg: Record<string, unknown>) => mapApiMensagem(msg)));
      } else {
        setMensagens([]);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      if (!silent) {
        toast.error('Erro ao carregar mensagens');
      }
    } finally {
      if (!silent) {
        setInitialLoading(false);
      }
    }
  }, [token, versaoId]);

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || submitting) return;

    const mensagemHTML = novaMensagem.trim();
    const tempId = `temp-${Date.now()}`;
    setNovaMensagem('');
    setSubmitting(true);

    const mensagemOtimista: MensagemArte = {
      id: tempId,
      autor: 'Você',
      autorTipo: 'cliente',
      mensagem: mensagemHTML,
      data: new Date().toISOString(),
      lida: true,
    };

    setMensagens(prev => [...prev, mensagemOtimista]);

    try {
      const payload = {
        versao_id: versaoId,
        mensagem: mensagemHTML,
        produto_id: produtoId || versaoId,
      };

      const response = await fetch(`/api/arte-aprovacao/mensagens/publico/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success && data.data?.id) {
        setMensagens(prev =>
          prev.map(m =>
            m.id === tempId
              ? {
                  ...m,
                  id: data.data.id,
                  autor: data.data.autor_nome || m.autor,
                  data: data.data.created_at || m.data,
                }
              : m,
          ),
        );
        onMensagemEnviada?.();
      } else {
        setMensagens(prev => prev.filter(m => m.id !== tempId));
        setNovaMensagem(mensagemHTML);
        throw new Error(data.message || 'Erro ao enviar mensagem');
      }
    } catch (error: unknown) {
      console.error('Erro ao enviar mensagem:', error);
      setMensagens(prev => prev.filter(m => m.id !== tempId));
      setNovaMensagem(mensagemHTML);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens]);

  useEffect(() => {
    if (versaoId) {
      carregarMensagens();
    }
  }, [versaoId, carregarMensagens]);

  useEffect(() => {
    if (!isConnected || !versaoId) return;

    entrarSalaVersao(versaoId);
    return () => {
      sairSalaVersao(versaoId);
    };
  }, [isConnected, versaoId, entrarSalaVersao, sairSalaVersao]);

  useEffect(() => {
    if (!novaMensagemSocket || typeof novaMensagemSocket !== 'object') return;

    const msgVersaoId = String(
      (novaMensagemSocket as Record<string, unknown>).versao_id || '',
    );
    if (msgVersaoId && msgVersaoId !== versaoId) return;

    const ui = mapArteMensagemSocketToUi(
      novaMensagemSocket as Record<string, unknown>,
    );

    setMensagens(prev => {
      if (prev.some(m => m.id === ui.id)) return prev;
      if (ui.autorTipo === 'cliente') {
        const jaTemTemp = prev.some(
          m => m.id.startsWith('temp-') && m.mensagem === ui.mensagem,
        );
        if (jaTemTemp) {
          return prev.map(m =>
            m.id.startsWith('temp-') && m.mensagem === ui.mensagem
              ? { ...m, id: ui.id, autor: ui.autor, data: ui.data }
              : m,
          );
        }
      }
      return [...prev, ui];
    });
  }, [novaMensagemSocket, versaoId]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setChatExpanded(!chatExpanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Comentários</span>
            <Badge variant="secondary" className="text-xs">
              {mensagens.length}
            </Badge>
            {!isConnected && (
              <span className="text-xs text-amber-600">reconectando…</span>
            )}
          </div>
          {chatExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>

      {chatExpanded && (
        <>
          <div 
            ref={mensagensRef}
            className="flex-1 p-4 overflow-y-auto max-h-64"
          >
            {initialLoading ? (
              <div className="text-center text-gray-500 py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">Carregando mensagens...</p>
              </div>
            ) : mensagens.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum comentário ainda</p>
                <p className="text-xs text-gray-400 mt-1">
                  Use @V1 - {produtoNome} para mencionar versões
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {mensagens.map((mensagem) => (
                  <div
                    key={mensagem.id}
                    className={`flex ${mensagem.autorTipo === 'cliente' ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div className={`max-w-[70%] ${mensagem.autorTipo === 'cliente' ? 'ml-4 mr-4' : 'mr-4'}`}>
                      <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        mensagem.autorTipo === 'cliente'
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${
                            mensagem.autorTipo === 'cliente' ? 'text-white' : 'text-gray-700'
                          }`}>
                            {mensagem.autor}
                          </span>
                          <span className={`text-xs ${
                            mensagem.autorTipo === 'cliente' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(mensagem.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div 
                          className={`text-sm ${
                            mensagem.autorTipo === 'cliente' ? 'text-white' : 'text-gray-800'
                          }`}
                          dangerouslySetInnerHTML={{ 
                            __html: mensagem.mensagemProcessada || mensagem.mensagem || ""
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 relative">
            <div className="space-y-2">
              <TiptapEditor
                content={novaMensagem}
                onUpdate={handleUpdate}
                onSubmit={enviarMensagem}
                placeholder={`Digite sua mensagem... Use @ para mencionar versões`}
                mentions={mentionsMemo}
                editable={!submitting}
              />
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {submitting ? 'Enviando…' : 'Pressione Enter para enviar, Shift+Enter para nova linha'}
                </p>
                <p className="text-xs text-gray-500">
                  Use @ para mencionar versões
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
