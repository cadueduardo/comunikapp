'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useArteWebSocket } from '@/hooks/use-arte-websocket';
import { apiRequest } from '@/lib/api';
import { TiptapEditor } from '@/components/ui/tiptap/TiptapEditor';

interface Mensagem {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  mensagemProcessada?: string; // Mensagem com menÃ§Ãµes processadas
  data: string;
  lida: boolean;
  produtoId?: string;
  versaoId?: string;
  versoesMencionadas?: string[]; // VersÃµes mencionadas na mensagem
}

interface ArteMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtoId: string;
  produtoNome: string;
  osId: string;
  versaoId?: string; // ID da versÃ£o especÃ­fica
  clienteNome?: string; // Nome do cliente
  empresaNome?: string; // Nome da empresa
  versoesDisponiveis?: Array<{ id: string; versao: string; descricao?: string; produtoNome?: string }>; // VersÃµes disponÃ­veis para menÃ§Ãµes
  onNotificacoesZeradas?: (versaoId: string) => void; // Callback para zerar notificaÃ§Ãµes
}

export function ArteMessagesModal({ 
  isOpen, 
  onClose, 
  produtoId, 
  produtoNome, 
  osId, 
  versaoId,
  clienteNome,
  empresaNome,
  versoesDisponiveis = [],
  onNotificacoesZeradas
}: ArteMessagesModalProps) {
  
  // Debug removido para reduzir spam no console
  
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para sistema de menÃ§Ãµes
  
  const mensagensRef = useRef<HTMLDivElement>(null);

  // WebSocket para tempo real - memoizar valores do localStorage
  const websocketOptions = useMemo(() => ({
    versaoId: versaoId,
    lojaId: typeof window !== 'undefined' ? localStorage.getItem('loja_id') || undefined : undefined,
    usuarioId: typeof window !== 'undefined' ? localStorage.getItem('user_id') || undefined : undefined,
  }), [versaoId]);

  const {
    connectionStatus,
    isConnected,
    novaMensagem: novaMensagemWS,
    usuariosTyping,
    marcarMensagemLida,
    entrarSalaVersao,
    sairSalaVersao,
  } = useArteWebSocket(websocketOptions);

  // useEffect serÃ¡ movido para depois das declaraÃ§Ãµes das funÃ§Ãµes


  // Auto-scroll para a Ãºltima mensagem quando mensagens mudarem (otimizado)
  useEffect(() => {
    if (mensagensRef.current && isOpen) {
      const timeoutId = setTimeout(() => {
        if (mensagensRef.current) {
          mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [mensagens.length, isOpen]); // Incluir isOpen para garantir que sÃ³ role quando o modal estiver aberto

  // Listener para novas mensagens via WebSocket (otimizado)
  useEffect(() => {
    if (!novaMensagemWS || !isOpen) return;

    // Extrair a mensagem real do wrapper
    let mensagemReal = novaMensagemWS;
    if (novaMensagemWS.mensagem && typeof novaMensagemWS.mensagem === 'object') {
      mensagemReal = novaMensagemWS.mensagem;
    }
    
    if (!mensagemReal?.mensagem) return;

    // Filtrar apenas mensagens da versÃ£o atual
    if (versaoId && mensagemReal.versao_id !== versaoId) return;
    
    const autorTipo = mensagemReal.autor_tipo?.toLowerCase() === 'cliente' ? 'cliente' : 'equipe';
    
    const novaMsg: Mensagem = {
      id: mensagemReal.id || `temp-${Date.now()}`,
      autor: mensagemReal.autor_nome || 'Desconhecido',
      autorTipo: autorTipo as 'cliente' | 'equipe',
      mensagem: mensagemReal.mensagem,
      mensagemProcessada: mensagemReal.mensagemProcessada ?? mensagemReal.mensagem,
      data: mensagemReal.created_at || new Date().toISOString(),
      lida: mensagemReal.lida || false,
      produtoId: mensagemReal.produto_id,
      versaoId: mensagemReal.versao_id,
      versoesMencionadas: mensagemReal.versoesMencionadas,
    };
    
    // Adicionar mensagem (otimizado)
    setMensagens(prev => {
      if (prev.some(msg => msg.id === novaMsg.id)) return prev;
      return [...prev, novaMsg];
    });
    
    // Marcar como lida se for do cliente
    if (autorTipo === 'cliente' && mensagemReal.id) {
      marcarMensagemLida(mensagemReal.id);
    }
  }, [novaMensagemWS, isOpen, versaoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarMensagens = useCallback(async () => {
      try {
        setLoading(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticaÃ§Ã£o nÃ£o encontrado');
      }

      // Se tiver versaoId, buscar mensagens da versÃ£o especÃ­fica
      const url = versaoId 
        ? `/api/arte-aprovacao/mensagens/versao/${versaoId}`
        : `/api/arte-aprovacao/mensagens/os/${osId}/produto/${produtoId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens');
      }

      const mensagensData = await response.json();
      
      // Converter para o formato esperado
      const mensagensCarregadas: Mensagem[] = mensagensData.map((msg: {
        id: string;
        autor_nome: string;
        autor_tipo: string;
        mensagem: string;
        mensagem_processada?: string;
        data_criacao: string;
        lida: boolean;
        created_at: string;
        produto_id: string;
        versao_id: string;
      }) => ({
        id: msg.id,
        autor: msg.autor_nome,
        autorTipo: msg.autor_tipo?.toLowerCase() === 'cliente' ? 'cliente' : 'equipe',
        mensagem: msg.mensagem,
        mensagemProcessada: msg.mensagem_processada ?? msg.mensagem,
        data: msg.created_at,
        lida: msg.lida,
        produtoId: msg.produto_id,
        versaoId: msg.versao_id
      }));

      // âœ… CORRIGIDO: Sempre substituir mensagens pela versÃ£o especÃ­fica
      // NÃ£o mesclar com mensagens de outras versÃµes
      setMensagens(mensagensCarregadas);
      
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [versaoId, osId, produtoId]);

  // âœ… FunÃ§Ã£o para marcar todas as mensagens como lidas
  const marcarTodasMensagensComoLidas = useCallback(async () => {
    try {
      // Marcar todas as mensagens nÃ£o lidas do cliente como lidas
      
      const response = await apiRequest('/arte-aprovacao/mensagens/marcar-lidas-produto', {
        method: 'POST',
        body: JSON.stringify({
          os_id: osId,
          produto_id: produtoId,
          versao_id: versaoId,
        }),
      });

      if (response.ok) {
        // Atualizar estado local
        setMensagens(prev => 
          prev.map(msg => ({ ...msg, lida: true }))
        );
        
        // Chamar callback para zerar notificaÃ§Ãµes no componente pai
        if (onNotificacoesZeradas && versaoId) {
          onNotificacoesZeradas(versaoId);
        }
      } else {
        console.error('âŒ Erro ao marcar mensagens como lidas:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  }, [osId, produtoId, versaoId, onNotificacoesZeradas]);

  // Carregar mensagens quando o modal abrir (sem dependÃªncias para evitar loop)
  useEffect(() => {
    if (isOpen) {
      carregarMensagens();
      marcarTodasMensagensComoLidas();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket room management
  useEffect(() => {
    if (isOpen && versaoId && isConnected) {
      entrarSalaVersao(versaoId);
      return () => sairSalaVersao(versaoId);
    }
  }, [isOpen, versaoId, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;

    // O Tiptap jÃ¡ envia HTML formatado, vamos usar direto
    const mensagemHTML = novaMensagem;
    
    // Debug: Log do HTML que estÃ¡ sendo enviado
    
    if (!mensagemHTML.trim()) return;

    // Limpar campo ANTES de enviar
    setNovaMensagem('');

    try {
      setEnviando(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticaÃ§Ã£o nÃ£o encontrado');
      }

      const response = await apiRequest('/arte-aprovacao/mensagens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          os_id: osId,
          produto_id: produtoId,
          versao_id: versaoId,
          mensagem: mensagemHTML, // Enviar HTML do Tiptap
          autor_tipo: 'EQUIPE'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      // Recarregar mensagens
      await carregarMensagens();

      // ForÃ§ar scroll para baixo apÃ³s enviar mensagem
      setTimeout(() => {
        if (mensagensRef.current) {
          mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
        }
      }, 200);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // const mensagensNaoLidas = mensagens.filter(m => !m.lida).length;
  
  // Usar mensagens diretamente (sem processamento adicional)
  const mensagensUnicas = mensagens;

  // Memoizar mentions para evitar re-renders desnecessÃ¡rios
  const mentionsMemo = useMemo(() => 
    versoesDisponiveis.map(v => ({
      id: v.id,
      label: `${v.versao} - ${v.produtoNome || produtoNome}` // Usar nome do produto especÃ­fico da versÃ£o
    })), [versoesDisponiveis, produtoNome]
  );

  // Memoizar onUpdate para evitar re-renders desnecessÃ¡rios
  const handleUpdate = useCallback((html: string) => {
    setNovaMensagem(html);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <style jsx global>{`
            .mensagens-container {
              overflow-x: hidden;
              word-wrap: break-word;
              word-break: break-word;
            }

            .mensagens-container * {
              max-width: 100%;
              overflow-wrap: break-word;
            }

            .mention {
              display: inline-flex;
              align-items: center;
              padding: 0.25rem 0.5rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 500;
              background-color: #dbeafe;
              color: #1e40af;
              border: 1px solid #bfdbfe;
              margin: 0 0.125rem;
            }
          `}</style>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>ComentÃ¡rios Recentes - {produtoNome}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Status de conexÃ£o */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-500">
                {connectionStatus === 'connected' ? 'Conectado' : 
                 connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
              </span>
            </div>
            {usuariosTyping.length > 0 && (
              <div className="text-xs text-gray-500">
                {usuariosTyping.map(u => u.tipo).join(', ')} estÃ¡ digitando...
              </div>
            )}
          </div>

          {/* Lista de mensagens */}
          <div ref={mensagensRef} className="flex-1 overflow-y-auto pr-4 mensagens-container">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : mensagensUnicas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a iniciar a conversa!</p>
            </div>
          ) : (
            mensagensUnicas.map((mensagem) => {
              const isCliente = mensagem.autorTipo === 'cliente';
              
              return (
                <div
                  key={mensagem.id}
                  className={`flex mb-4 ${isCliente ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-2 max-w-[75%] ${
                      isCliente ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCliente ? 'bg-green-100' : 'bg-blue-100'
                      }`}
                    >
                      {isCliente ? (
                        <User className="w-4 h-4 text-green-700" />
                      ) : (
                        <Building2 className="w-4 h-4 text-blue-700" />
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`flex flex-col ${
                        isCliente ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isCliente
                            ? 'bg-green-500 text-white rounded-tr-none'
                            : 'bg-gray-100 text-gray-900 rounded-tl-none'
                        } ${!mensagem.lida && isCliente ? 'ring-2 ring-green-400' : ''}`}
                      >
                        <div className="text-xs font-semibold mb-1 opacity-75">
                          {isCliente 
                            ? (clienteNome ? clienteNome.split(' ')[0] : 'Cliente')
                            : (empresaNome || 'Equipe')
                          }
                        </div>
                        <div
                          className="text-sm break-words"
                          dangerouslySetInnerHTML={{ __html: mensagem.mensagemProcessada ?? mensagem.mensagem ?? "" }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 px-2">
                        {formatarData(mensagem.data)}
                        {!mensagem.lida && isCliente && (
                          <span className="ml-2 text-green-600">â— NÃ£o lida</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input para nova mensagem */}
        <div className="flex-shrink-0 border-t pt-4 relative">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <TiptapEditor
                content={novaMensagem}
                onUpdate={handleUpdate}
                onSubmit={enviarMensagem}
                placeholder="Digite @ para mencionar uma versÃ£o..."
                mentions={mentionsMemo}
              />
            </div>
            <Button
              onClick={enviarMensagem}
              disabled={!novaMensagem.trim() || enviando || !isConnected}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
            <p className="text-xs text-gray-500">
              Use @ para mencionar versÃµes
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
