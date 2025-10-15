'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, User, Clock, AtSign } from 'lucide-react';
import { toast } from 'sonner';

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
}

export function ArtePublicChat({
  mensagens,
  onEnviarMensagem,
  versoesDisponiveis
}: ArtePublicChatProps) {
  const [novaMensagem, setNovaMensagem] = useState('');
  const [mostrarAutocomplete, setMostrarAutocomplete] = useState(false);
  const [posicaoCursor, setPosicaoCursor] = useState(0);
  const [versoesFiltradas, setVersoesFiltradas] = useState<VersaoHistorico[]>([]);
  const [enviando, setEnviando] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mensagensRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para novas mensagens
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNovaMensagem(value);
    setPosicaoCursor(cursorPos);
    
    // Verificar se está digitando menção
    const textoAntesCursor = value.substring(0, cursorPos);
    const match = textoAntesCursor.match(/@art(\d*)$/);
    
    if (match) {
      const numeroDigitado = match[1];
      const versoesFiltradas = versoesDisponiveis.filter(v => 
        v.versao.replace('v', '').startsWith(numeroDigitado)
      );
      setVersoesFiltradas(versoesFiltradas);
      setMostrarAutocomplete(true);
    } else {
      setMostrarAutocomplete(false);
    }
  };

  const inserirMenção = (versao: VersaoHistorico) => {
    const textoAntesCursor = novaMensagem.substring(0, posicaoCursor);
    const textoDepoisCursor = novaMensagem.substring(posicaoCursor);
    const textoAntesMenção = textoAntesCursor.replace(/@art\d*$/, '');
    
    const novaMensagemTexto = `${textoAntesMenção}@${versao.versao} ${textoDepoisCursor}`;
    setNovaMensagem(novaMensagemTexto);
    setMostrarAutocomplete(false);
    
    // Focar novamente no textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const processarMenções = (mensagem: string): { mensagemProcessada: string; mencoes: string[] } => {
    const regex = /@art(\d+)/g;
    const mencoes: string[] = [];
    let mensagemProcessada = mensagem;
    
    let match;
    while ((match = regex.exec(mensagem)) !== null) {
      const numeroVersao = match[1];
      const versao = versoesDisponiveis.find(v => 
        v.versao.replace('v', '') === numeroVersao
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
      const { mencoes } = processarMenções(novaMensagem);
      
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
      {/* Mensagens */}
      <div 
        ref={mensagensRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {mensagens.length === 0 ? (
          <div className="text-center py-8">
            <AtSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Use @v1, @v2 para referenciar versões específicas
            </p>
          </div>
        ) : (
          mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={`
                flex space-x-3
                ${mensagem.autor_tipo === 'CLIENTE' ? 'justify-end' : 'justify-start'}
              `}
            >
              {mensagem.autor_tipo === 'EQUIPE' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              )}
              
              <div className={`
                max-w-xs lg:max-w-md px-3 py-2 rounded-lg
                ${mensagem.autor_tipo === 'CLIENTE' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
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
              
              {mensagem.autor_tipo === 'CLIENTE' && (
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
                  onClick={() => inserirMenção(versao)}
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
            placeholder="Digite sua mensagem... Use @v1, @v2 para referenciar versões"
            className="resize-none min-h-[60px] pr-12"
            disabled={enviando}
          />
          
          <Button
            onClick={handleEnviar}
            disabled={!novaMensagem.trim() || enviando}
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

