'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  ChevronDown, 
  ChevronUp,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

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
  data: string;
  lida: boolean;
  mencoes?: string[];
}

interface ArtePublicChatWithMentionsProps {
  versaoId: string;
  token: string;
  versoesDisponiveis: VersaoArte[];
  produtoNome: string;
  onMensagemEnviada?: () => void;
}

export function ArtePublicChatWithMentions({
  versaoId,
  token,
  versoesDisponiveis,
  produtoNome,
  onMensagemEnviada
}: ArtePublicChatWithMentionsProps) {
  
  const [mensagens, setMensagens] = useState<MensagemArte[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mensagensRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens da versão específica
  const carregarMensagens = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/arte-aprovacao/comentarios/public/${versaoId}/${token}`);
      const data = await response.json();

      if (data.success) {
        const mensagensProcessadas: MensagemArte[] = data.data.map((comentario: any) => ({
          id: comentario.id,
          autor: comentario.usuario?.nome || 'Usuário',
          autorTipo: comentario.tipo === 'CLIENTE' ? 'cliente' : 'equipe',
          mensagem: comentario.comentario,
          data: comentario.data_comentario,
          lida: true,
          mencoes: extrairMencoes(comentario.comentario)
        }));
        
        setMensagens(mensagensProcessadas);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  // Extrair menções do texto
  const extrairMencoes = (texto: string): string[] => {
    const regex = /@(V\d+-\w+)/g;
    const mencoes: string[] = [];
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      mencoes.push(match[1]);
    }
    
    return mencoes;
  };

  // Processar menções no texto
  const processarMencoes = (texto: string): string => {
    return texto.replace(/@(V\d+-\w+)/g, (match, versaoRef) => {
      const versao = versoesDisponiveis.find(v => `${v.versao}-${produtoNome}` === versaoRef);
      if (versao) {
        return `<a href="#versao-${versao.id}" class="mention-link text-blue-600 hover:text-blue-800 underline cursor-pointer" data-versao-id="${versao.id}">${match}</a>`;
      }
      return match;
    });
  };

  // Detectar digitação de @
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNovaMensagem(value);
    setCursorPosition(cursorPos);

    // Detectar @art para mostrar autocomplete
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (textAfterAt.length <= 3 && !textAfterAt.includes(' ')) {
        // Mostrar autocomplete
        const rect = e.target.getBoundingClientRect();
        setAutocompletePosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  // Inserir menção no texto
  const inserirMencao = (versao: VersaoArte) => {
    const textBeforeCursor = novaMensagem.substring(0, cursorPosition);
    const textAfterCursor = novaMensagem.substring(cursorPosition);
    
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const mencao = `@${versao.versao}-${produtoNome}`;
    
    const novoTexto = textBeforeCursor.substring(0, lastAtIndex) + mencao + ' ' + textAfterCursor;
    
    setNovaMensagem(novoTexto);
    setShowAutocomplete(false);
    
    // Focar no textarea novamente
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAtIndex + mencao.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Enviar mensagem
  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;

    const mensagemTexto = novaMensagem.trim();
    setNovaMensagem('');
    setShowAutocomplete(false);

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/arte-aprovacao/comentarios/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versao_id: versaoId,
          comentario: mensagemTexto,
          token_publico: token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Comentário adicionado com sucesso!');
        await carregarMensagens();
        onMensagemEnviada?.();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens]);

  // Carregar mensagens iniciais
  useEffect(() => {
    if (versaoId) {
      carregarMensagens();
    }
  }, [versaoId]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header do Chat */}
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
          {/* Lista de Mensagens */}
          <div 
            ref={mensagensRef}
            className="flex-1 p-4 overflow-y-auto max-h-64"
          >
            {loading ? (
              <div className="text-center text-gray-500 py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">Carregando mensagens...</p>
              </div>
            ) : mensagens.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum comentário ainda</p>
                <p className="text-xs text-gray-400 mt-1">
                  Use @V1-{produtoNome} para mencionar versões
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {mensagens.map((mensagem) => (
                  <div
                    key={mensagem.id}
                    className={`p-3 rounded-lg ${
                      mensagem.autorTipo === 'cliente'
                        ? 'bg-blue-50 border-l-4 border-blue-200'
                        : 'bg-gray-50 border-l-4 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {mensagem.autor}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(mensagem.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div 
                      className="text-sm text-gray-800"
                      dangerouslySetInnerHTML={{ 
                        __html: processarMencoes(mensagem.mensagem) 
                      }}
                    />
                    {mensagem.mencoes && mensagem.mencoes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mensagem.mencoes.map((mencao, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {mencao}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input de Mensagem */}
          <div className="p-4 border-t border-gray-200 relative">
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={novaMensagem}
                onChange={handleTextChange}
                onKeyPress={handleKeyPress}
                placeholder={`Digite sua mensagem... Use @V1-${produtoNome} para mencionar versões`}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={submitting}
              />
              
              {/* Autocomplete */}
              {showAutocomplete && (
                <div 
                  className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto"
                  style={{
                    top: autocompletePosition.top + 10,
                    left: autocompletePosition.left,
                    minWidth: '200px'
                  }}
                >
                  {versoesDisponiveis.map((versao) => (
                    <button
                      key={versao.id}
                      onClick={() => inserirMencao(versao)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <span className="font-medium">{versao.versao}</span>
                      <span className="text-gray-500">- {produtoNome}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex items-end justify-between gap-2">
                <p className="text-xs text-gray-500 flex-1">
                  Pressione Enter para enviar • Use @V1-{produtoNome} para mencionar versões
                </p>
                <Button
                  onClick={enviarMensagem}
                  disabled={!novaMensagem.trim() || submitting}
                  size="sm"
                  className="flex-shrink-0 h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
