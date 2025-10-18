'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, User, Clock, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { useArteWebSocket } from '@/hooks/use-arte-websocket';

interface VersaoHistorico {
  id: string;
  versao: string;
  data: string;
  autor: string;
  status: string;
  thumbnail: string;
  isAtual: boolean;
}

interface MensagemArte {
  id: string;
  autor_nome: string;
  autor_tipo: 'CLIENTE' | 'EQUIPE';
  mensagem: string;
  mensagem_processada?: string;
  data_comentario: string;
  mencoes_versoes?: string[];
}

interface ArtePublicChatProps {
  mensagens: MensagemArte[];
  onEnviarMensagem: (mensagem: string, mencoes?: string[]) => void;
  versoesDisponiveis: VersaoHistorico[];
  versaoAtualId?: string;
  tokenAprovacao?: string;
}

export function ArtePublicChat({
  mensagens,
  onEnviarMensagem,
  versoesDisponiveis,
  versaoAtualId,
  tokenAprovacao
}: ArtePublicChatProps) {
  const [novaMensagem, setNovaMensagem] = useState('');
  const [mostrarAutocomplete, setMostrarAutocomplete] = useState(false);
  const [posicaoCursor, setPosicaoCursor] = useState(0);
  const [versoesFiltradas, setVersoesFiltradas] = useState<VersaoHistorico[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensagensLocais, setMensagensLocais] = useState<MensagemArte[]>(mensagens);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mensagensRef = useRef<HTMLDivElement>(null);

  // WebSocket para cliente público
  const {
    connectionStatus,
    isConnected,
    novaMensagem: novaMensagemWS,
    usuariosTyping,
    marcarMensagemLida,
    entrarSalaVersao,
    sairSalaVersao,
    toggleTyping,
  } = useArteWebSocket({
    versaoId: versaoAtualId,
    token: tokenAprovacao, // Token público para cliente
  });

  // Atualizar mensagens locais quando props mudarem
  useEffect(() => {
    setMensagensLocais(mensagens);
  }, [mensagens]);

  // Auto-scroll para novas mensagens
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagensLocais]);

  // Entrar/sair da sala da versão quando mudar
  useEffect(() => {
    if (versaoAtualId && isConnected) {
      entrarSalaVersao(versaoAtualId);
    }
    
    return () => {
      if (versaoAtualId && isConnected) {
        sairSalaVersao(versaoAtualId);
      }
    };
  }, [versaoAtualId, isConnected, entrarSalaVersao, sairSalaVersao]);

  // Listener para novas mensagens via WebSocket
  useEffect(() => {
    if (novaMensagemWS) {
      const novaMsg: MensagemArte = {
        id: novaMensagemWS.id,
        autor_nome: novaMensagemWS.autor_nome,
        autor_tipo: novaMensagemWS.autor_tipo,
        mensagem: novaMensagemWS.mensagem,
        mensagem_processada: novaMensagemWS.mensagemProcessada,
        data_comentario: novaMensagemWS.created_at,
        mencoes_versoes: novaMensagemWS.versoesMencionadas,
      };
      
      setMensagensLocais(prev => [...prev, novaMsg]);
      
      // Marcar como lida se for da equipe (cliente lê mensagem da equipe)
      if (novaMensagemWS.autor_tipo?.toLowerCase() === 'equipe') {
        marcarMensagemLida(novaMensagemWS.id);
      }
    }
  }, [novaMensagemWS, marcarMensagemLida]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNovaMensagem(value);
    setPosicaoCursor(cursorPos);
    
    // Verificar se está digitando menção
    const textoAntesCursor = value.substring(0, cursorPos);
    const match = textoAntesCursor.match(/@[vV](\d*)$/);
    
    if (match) {
      const numeroDigitado = match[1];
      const versoesFiltradas = versoesDisponiveis.filter(v => 
        v.versao.replace('V', '').replace('v', '').startsWith(numeroDigitado)
      );
      setVersoesFiltradas(versoesFiltradas);
      setMostrarAutocomplete(true);
    } else {
      setMostrarAutocomplete(false);
    }
    
    // Indicador de digitação
    toggleTyping(true);
  };

  const insertMention = (versao: VersaoHistorico) => {
    const textoAntesCursor = novaMensagem.substring(0, posicaoCursor);
    const textoDepoisCursor = novaMensagem.substring(posicaoCursor);
    const textoAntesMencao = textoAntesCursor.replace(/@[vV]\d*$/, '');
    
    const novaMensagemTexto = `${textoAntesMencao}@${versao.versao} ${textoDepoisCursor}`;
    setNovaMensagem(novaMensagemTexto);
    setMostrarAutocomplete(false);
    
    // Focar novamente no textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const processMentions = (mensagem: string): { mensagemProcessada: string; mencoes: string[] } => {
    const regex = /@[vV](\d+)/g;
    const mencoes: string[] = [];
    let mensagemProcessada = mensagem;
    
    let match;
    while ((match = regex.exec(mensagem)) !== null) {
      const numeroVersao = match[1];
      const versao = versoesDisponiveis.find(v => 
        v.versao.replace('V', '').replace('v', '') === numeroVersao
      );
      
      if (versao) {
        mencoes.push(versao.id);
        const link = `<span class="mention-link bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs cursor-pointer" data-versao-id="${versao.id}">@${versao.versao}</span>`;
        mensagemProcessada = mensagemProcessada.replace(match[0], link);
      }
    }
    
    return { mensagemProcessada, mencoes };
  };

  const handleEnviar = async () => {
    if (!novaMensagem.trim()) return;

    try {
      setEnviando(true);
      const { mencoes } = processMentions(novaMensagem);
      
      // Parar indicador de digitação
      toggleTyping(false);
      
      await onEnviarMensagem(novaMensagem, mencoes);
      setNovaMensagem('');
      setMostrarAutocomplete(false);
      
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status de conexão */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-600">
            {connectionStatus === 'connected' ? 'Conectado' : 
             connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
          </span>
        </div>
        {usuariosTyping.length > 0 && (
          <div className="text-xs text-gray-500">
            {usuariosTyping.map(u => u.tipo).join(', ')} está digitando...
          </div>
        )}
      </div>

      {/* Mensagens */}
      <div 
        ref={mensagensRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {mensagensLocais.length === 0 ? (
          <div className="text-center py-8">
            <AtSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Use @V1, @V2 para referenciar versões específicas
            </p>
          </div>
        ) : (
          mensagensLocais.map((mensagem) => (
            <div
              key={mensagem.id}
              className={`
                flex space-x-3
                ${mensagem.autor_tipo?.toLowerCase() === 'cliente' ? 'justify-end' : 'justify-start'}
              `}
            >
              {mensagem.autor_tipo?.toLowerCase() === 'equipe' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              )}
              
              <div className={`
                max-w-[70%] px-4 py-3 rounded-2xl shadow-sm mx-4
                ${mensagem.autor_tipo?.toLowerCase() === 'cliente' 
                  ? 'bg-blue-500 text-white rounded-br-md' 
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }
              `}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium">
                    {mensagem.autor_nome}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatarData(mensagem.data_comentario)}
                  </span>
                </div>
                
                <div 
                  className="text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: mensagem.mensagem_processada || mensagem.mensagem 
                  }}
                />
                
                {mensagem.mencoes_versoes && mensagem.mencoes_versoes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300 border-opacity-30">
                    <div className="flex flex-wrap gap-1">
                      {mensagem.mencoes_versoes.map(versaoId => {
                        const versao = versoesDisponiveis.find(v => v.id === versaoId);
                        return versao ? (
                          <Badge key={versaoId} variant="secondary" className="text-xs">
                            {versao.versao}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {mensagem.autor_tipo?.toLowerCase() === 'cliente' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input de Mensagem */}
      <div className="border-t border-gray-200 p-4">
        <div className="relative">
          {/* Autocomplete */}
          {mostrarAutocomplete && versoesFiltradas.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
              {versoesFiltradas.map(versao => (
                <div 
                  key={versao.id}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => insertMention(versao)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">@{versao.versao}</span>
                    <span className="text-xs text-gray-500">{versao.data}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Textarea
            ref={textareaRef}
            value={novaMensagem}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem... Use @V1, @V2 para referenciar versões"
            className="resize-none min-h-[60px] pr-12"
            disabled={enviando}
          />
          
          <Button
            onClick={handleEnviar}
            disabled={!novaMensagem.trim() || enviando || !isConnected}
            size="sm"
            className="absolute bottom-2 right-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}


