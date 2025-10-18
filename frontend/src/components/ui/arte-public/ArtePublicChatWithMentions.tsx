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
  mensagemProcessada?: string; // Mensagem com menções processadas
  data: string;
  lida: boolean;
  mencoes?: string[];
}

interface ArtePublicChatWithMentionsProps {
  versaoId: string;
  token: string;
  versoesDisponiveis: VersaoArte[];
  produtoNome: string;
  produtoId?: string; // ID do produto para enviar mensagens
  onMensagemEnviada?: () => void;
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [indiceSelecionado, setIndiceSelecionado] = useState(0);
  const [versoesFiltradas, setVersoesFiltradas] = useState<VersaoArte[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mensagensRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens da versão específica
  const carregarMensagens = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Carregando mensagens - Token:', token, 'VersaoId:', versaoId);
      
      // Usar endpoint público de mensagens
      const url = `/api/arte-aprovacao/mensagens/publico/${token}/versao/${versaoId}`;
      console.log('🔍 URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('🔍 Resposta do endpoint:', data);

      if (data.success && Array.isArray(data.data)) {
        const mensagensProcessadas: MensagemArte[] = data.data.map((msg: any) => ({
          id: msg.id,
          autor: msg.autor_nome || 'Usuário',
          autorTipo: msg.autor_tipo?.toLowerCase() === 'cliente' ? 'cliente' : 'equipe',
          mensagem: msg.mensagem,
          data: msg.created_at,
          lida: msg.lida || true,
          mencoes: extractMentions(msg.mensagem)
        }));
        
        setMensagens(mensagensProcessadas);
        console.log('✅ Mensagens carregadas via endpoint público:', mensagensProcessadas.length);
        console.log('📋 IDs das mensagens:', mensagensProcessadas.map(m => m.id));
      } else {
        console.warn('⚠️ Nenhuma mensagem encontrada ou erro na resposta:', data);
        setMensagens([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  // Extrair menções do texto
  const extractMentions = (texto: string): string[] => {
    const regex = /@(V\d+-\w+)/g;
    const mencoes: string[] = [];
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      mencoes.push(match[1]);
    }
    
    return mencoes;
  };

  // Processar menções no texto
  const processMentions = (texto: string): string => {
    // Suportar tanto @V1-Banner quanto @V1 - Banner
    return texto.replace(/@(V\d+)(?:\s*-\s*([^-\s]+(?:\s+[^-\s]+)*))(?=\s|$)/g, (match, versaoNum, descricao) => {
      const versao = versoesDisponiveis.find(v => v.versao === versaoNum);
      if (versao) {
        const descricaoFinal = descricao || produtoNome;
        return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">@${versaoNum} - ${descricaoFinal}</span>`;
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

    // Detectar @ para mostrar autocomplete
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        // Filtrar versões baseado no texto após @
        const versoesFiltradas = versoesDisponiveis.filter(v => 
          textAfterAt === '' || v.versao.toLowerCase().includes(textAfterAt.toLowerCase())
        );
        setVersoesFiltradas(versoesFiltradas);
        
        // Mostrar autocomplete se há versões filtradas
        if (versoesFiltradas.length > 0) {
          const rect = e.target.getBoundingClientRect();
          setAutocompletePosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX
          });
          setShowAutocomplete(true);
          setIndiceSelecionado(0);
        } else {
          setShowAutocomplete(false);
        }
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  // Inserir menção no texto
  const insertMention = (versao: VersaoArte) => {
    const textBeforeCursor = novaMensagem.substring(0, cursorPosition);
    const textAfterCursor = novaMensagem.substring(cursorPosition);
    
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const mencao = `${versao.versao} - ${produtoNome}`;
    
    const novoTexto = textBeforeCursor.substring(0, lastAtIndex) + '@' + mencao + ' ' + textAfterCursor;
    
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

  // Navegação por teclado no autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showAutocomplete || versoesFiltradas.length === 0) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceSelecionado(prev => 
          prev < versoesFiltradas.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceSelecionado(prev => 
          prev > 0 ? prev - 1 : versoesFiltradas.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (versoesFiltradas[indiceSelecionado]) {
          insertMention(versoesFiltradas[indiceSelecionado]);
        }
        break;
      case 'Escape':
        setShowAutocomplete(false);
        break;
    }
  };

  // Enviar mensagem
  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;

    const mensagemTexto = novaMensagem.trim();
    setNovaMensagem('');
    setShowAutocomplete(false);

    try {
      setSubmitting(true);
      
      console.log('🔍 Enviando mensagem - Token:', token, 'VersaoId:', versaoId, 'ProdutoId:', produtoId);
      
      const payload = {
        versao_id: versaoId,
        mensagem: mensagemTexto,
        produto_id: produtoId || versaoId, // Usar produtoId se fornecido
      };
      
      console.log('🔍 Payload:', payload);
      
      // Usar endpoint de mensagens públicas
      const url = `/api/arte-aprovacao/mensagens/publico/${token}`;
      console.log('🔍 URL de envio:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('🔍 Status da resposta:', response.status);

      const data = await response.json();
      console.log('🔍 Resposta completa do envio:', data);

      if (data.success) {
        console.log('✅ Mensagem enviada com sucesso, ID:', data.data?.id);
        console.log('📦 Resposta completa:', JSON.stringify(data));
        
        toast.success('Mensagem enviada com sucesso!');
        
        console.log('🔄 Recarregando mensagens...');
        await carregarMensagens();
        console.log('✅ Mensagens recarregadas');
        
        onMensagemEnviada?.();
      } else {
        console.error('❌ Erro na resposta:', data.message);
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
                            __html: mensagem.mensagemProcessada || processMentions(mensagem.mensagem)
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
                    </div>
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
                onKeyDown={handleKeyDown}
                placeholder={`Digite sua mensagem... Use @V1 - ${produtoNome} para mencionar versões`}
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
                  {versoesFiltradas.map((versao, index) => (
                    <button
                      key={versao.id}
                      onClick={() => insertMention(versao)}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${
                        index === indiceSelecionado 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">
                        @{versao.versao} - {produtoNome}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex items-end justify-between gap-2">
                <p className="text-xs text-gray-500 flex-1">
                  Pressione Enter para enviar • Use @V1 - {produtoNome} para mencionar versões
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
