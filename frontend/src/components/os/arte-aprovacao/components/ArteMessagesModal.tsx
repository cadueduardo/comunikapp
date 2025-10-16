'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, User, Clock, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { useArteWebSocket } from '@/hooks/use-arte-websocket';

interface Mensagem {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  mensagemProcessada?: string; // Mensagem com menções processadas
  data: string;
  lida: boolean;
  produtoId?: string;
  versaoId?: string;
  versoesMencionadas?: string[]; // Versões mencionadas na mensagem
}

interface ArteMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtoId: string;
  produtoNome: string;
  osId: string;
  versaoId?: string; // ID da versão específica
}

export function ArteMessagesModal({ 
  isOpen, 
  onClose, 
  produtoId, 
  produtoNome, 
  osId,
  versaoId 
}: ArteMessagesModalProps) {
  
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para sistema de menções
  const [mostrarAutocomplete, setMostrarAutocomplete] = useState(false);
  const [posicaoCursor, setPosicaoCursor] = useState(0);
  const [versoesFiltradas, setVersoesFiltradas] = useState<Array<{id: string, versao: string}>>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mensagensRef = useRef<HTMLDivElement>(null);

  // WebSocket para tempo real
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
    versaoId: versaoId,
    lojaId: localStorage.getItem('loja_id') || undefined,
    usuarioId: localStorage.getItem('user_id') || undefined,
  });

  // Carregar mensagens quando o modal abrir ou quando mudar a versão
  useEffect(() => {
    if (isOpen) {
      carregarMensagens();
      
      // Entrar na sala da versão via WebSocket
      if (versaoId && isConnected) {
        entrarSalaVersao(versaoId);
      }
    }
    
    return () => {
      // Sair da sala quando modal fechar
      if (versaoId && isConnected) {
        sairSalaVersao(versaoId);
      }
    };
  }, [isOpen, produtoId, versaoId, isConnected, entrarSalaVersao, sairSalaVersao]);

  // Auto-scroll para a última mensagem quando mensagens mudarem
  useEffect(() => {
    if (mensagens.length > 0 && mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens]);

  // Listener para novas mensagens via WebSocket
  useEffect(() => {
    if (novaMensagemWS) {
      console.log('🔍 Debug novaMensagemWS:', novaMensagemWS);
      
      // Extrair a mensagem real do wrapper
      let mensagemReal = novaMensagemWS;
      if (novaMensagemWS.mensagem && typeof novaMensagemWS.mensagem === 'object') {
        mensagemReal = novaMensagemWS.mensagem;
        console.log('🔍 Mensagem extraída do wrapper:', mensagemReal);
      }
      
      if (mensagemReal && mensagemReal.mensagem) {
        const autorTipo = mensagemReal.autor_tipo 
          ? (typeof mensagemReal.autor_tipo === 'string' 
              ? mensagemReal.autor_tipo.toLowerCase() 
              : 'equipe')
          : 'equipe';
        
        const novaMsg: Mensagem = {
          id: mensagemReal.id || `temp-${Date.now()}`,
          autor: mensagemReal.autor_nome || 'Desconhecido',
          autorTipo: autorTipo as 'cliente' | 'equipe',
          mensagem: mensagemReal.mensagem,
          mensagemProcessada: mensagemReal.mensagemProcessada,
          data: mensagemReal.created_at || new Date().toISOString(),
          lida: mensagemReal.lida || false,
          produtoId: mensagemReal.produto_id,
          versaoId: mensagemReal.versao_id,
          versoesMencionadas: mensagemReal.versoesMencionadas,
        };
        
        console.log('🔍 Debug novaMsg final:', novaMsg);
        
        // Evitar duplicatas - verificar se a mensagem já existe
        setMensagens(prev => {
          const mensagemExiste = prev.some(msg => 
            msg.id === novaMsg.id || 
            (msg.mensagem === novaMsg.mensagem && 
             msg.autor === novaMsg.autor && 
             Math.abs(new Date(msg.data).getTime() - new Date(novaMsg.data).getTime()) < 5000) // 5 segundos de tolerância
          );
          
          if (mensagemExiste) {
            console.log('⚠️ Mensagem duplicada ignorada:', novaMsg.id);
            return prev;
          }
          
          console.log('✅ Nova mensagem adicionada:', novaMsg.id);
          return [...prev, novaMsg];
        });
        
        // Marcar como lida se for do cliente
        if (mensagemReal.autor_tipo === 'CLIENTE' && mensagemReal.id) {
          marcarMensagemLida(mensagemReal.id);
        }
      } else {
        console.warn('⚠️ novaMensagemWS sem mensagem válida:', novaMensagemWS);
      }
    }
  }, [novaMensagemWS, marcarMensagemLida]);

  // Sistema de menções
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
      // TODO: Buscar versões disponíveis da OS
      const versoesDisponiveis = [
        { id: 'v1', versao: 'V1' },
        { id: 'v2', versao: 'V2' },
        { id: 'v3', versao: 'V3' },
      ];
      
      const versoesFiltradas = versoesDisponiveis.filter(v => 
        v.versao.replace('V', '').startsWith(numeroDigitado)
      );
      setVersoesFiltradas(versoesFiltradas);
      setMostrarAutocomplete(true);
    } else {
      setMostrarAutocomplete(false);
    }
    
    // Indicador de digitação
    toggleTyping(true);
  };

  const inserirMenção = (versao: {id: string, versao: string}) => {
    const textoAntesCursor = novaMensagem.substring(0, posicaoCursor);
    const textoDepoisCursor = novaMensagem.substring(posicaoCursor);
    const textoAntesMenção = textoAntesCursor.replace(/@[vV]\d*$/, '');
    
    const novaMensagemTexto = `${textoAntesMenção}@${versao.versao} ${textoDepoisCursor}`;
    setNovaMensagem(novaMensagemTexto);
    setMostrarAutocomplete(false);
    
    // Focar novamente no textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const processarMenções = (mensagem: string): { mensagemProcessada: string; mencoes: string[] } => {
    const regex = /@[vV](\d+)/g;
    const mencoes: string[] = [];
    let mensagemProcessada = mensagem;
    
    let match;
    while ((match = regex.exec(mensagem)) !== null) {
      const versaoNumero = match[1];
      const versaoCompleta = `V${versaoNumero}`;
      
      if (!mencoes.includes(versaoCompleta)) {
        mencoes.push(versaoCompleta);
      }
      
      // Substituir a menção por um link formatado
      mensagemProcessada = mensagemProcessada.replace(
        match[0], 
        `<span class="mention" data-versao="${versaoCompleta}">@${versaoCompleta}</span>`
      );
    }
    
    return {
      mensagemProcessada,
      mencoes
    };
  };

  const carregarMensagens = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Se tiver versaoId, buscar mensagens da versão específica
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
      const mensagensCarregadas: Mensagem[] = mensagensData.map((msg: any) => ({
        id: msg.id,
        autor: msg.autor_nome,
        autorTipo: msg.autor_tipo,
        mensagem: msg.mensagem,
        data: msg.created_at,
        lida: msg.lida,
        produtoId: msg.produto_id,
      }));

      // Mesclar com mensagens existentes, evitando duplicatas
      setMensagens(prev => {
        const mensagensExistentes = prev.filter(existente => 
          !mensagensCarregadas.some(carregada => carregada.id === existente.id)
        );
        
        // Combinar mensagens existentes + novas mensagens carregadas
        const mensagensCombinadas = [...mensagensExistentes, ...mensagensCarregadas];
        
        // Ordenar por data
        return mensagensCombinadas.sort((a, b) => 
          new Date(a.data).getTime() - new Date(b.data).getTime()
        );
      });
      
      console.log('✅ Mensagens carregadas e mescladas:', mensagensCarregadas.length);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;

    const mensagemTexto = novaMensagem.trim();
    setNovaMensagem(''); // Limpar campo imediatamente para melhor UX
    setMostrarAutocomplete(false); // Fechar autocomplete

    try {
      setEnviando(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Criar mensagem otimista (adicionar à lista localmente)
      const mensagemOtimista: Mensagem = {
        id: `temp-${Date.now()}`,
        autor: 'Você',
        autorTipo: 'equipe',
        mensagem: mensagemTexto,
        data: new Date().toISOString(),
        lida: true,
        produtoId: produtoId,
        versaoId: versaoId,
      };

      // Adicionar mensagem à lista local imediatamente
      setMensagens(prev => [...prev, mensagemOtimista]);

      // Parar indicador de digitação
      toggleTyping(false);

      const response = await fetch('/api/arte-aprovacao/mensagens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          os_id: osId,
          produto_id: produtoId,
          versao_id: versaoId, // Incluir versão específica
          mensagem: mensagemTexto,
          autor_tipo: 'EQUIPE',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar mensagem');
      }

      const novaMensagemData = await response.json();
      
      // Substituir mensagem temporária pela real
      setMensagens(prev => 
        prev.map(m => 
          m.id === mensagemOtimista.id 
            ? {
                id: novaMensagemData.id,
                autor: novaMensagemData.autor_nome,
                autorTipo: novaMensagemData.autor_tipo.toLowerCase(),
                mensagem: novaMensagemData.mensagem,
                data: novaMensagemData.created_at,
                lida: novaMensagemData.lida,
                produtoId: novaMensagemData.produto_id,
              }
            : m
        )
      );
      
      console.log('✅ Mensagem otimista substituída pela real:', novaMensagemData.id);
      
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      
      // Remover mensagem temporária em caso de erro
      setMensagens(prev => prev.filter(m => m.id !== `temp-${Date.now()}`));
      setNovaMensagem(mensagemTexto); // Restaurar mensagem no campo
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

  const mensagensNaoLidas = mensagens.filter(m => !m.lida).length;
  
  // Garantir chaves únicas para renderização
  const mensagensUnicas = mensagens.reduce((acc, mensagem) => {
    const existe = acc.find(m => m.id === mensagem.id);
    if (!existe) {
      acc.push(mensagem);
    } else {
      console.warn('⚠️ Mensagem duplicada removida na renderização:', mensagem.id);
    }
    return acc;
  }, [] as Mensagem[]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Comentários Recentes - {produtoNome}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Status de conexão */}
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
                {usuariosTyping.map(u => u.tipo).join(', ')} está digitando...
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
            <div className="space-y-4">
              {mensagensUnicas.map((mensagem) => (
                <div
                  key={mensagem.id}
                  className={`flex ${mensagem.autorTipo === 'cliente' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      mensagem.autorTipo === 'cliente'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
                    } ${!mensagem.lida && mensagem.autorTipo === 'cliente' ? 'border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {mensagem.autor}
                      </span>
                      <Clock className="h-3 w-3" />
                      <span className="text-xs opacity-75">
                        {formatarData(mensagem.data)}
                      </span>
                      {mensagem.versoesMencionadas && mensagem.versoesMencionadas.length > 0 && (
                        <AtSign className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                    <div 
                      className="text-sm"
                      dangerouslySetInnerHTML={{ 
                        __html: mensagem.mensagemProcessada || mensagem.mensagem 
                      }}
                    />
                    {mensagem.versoesMencionadas && mensagem.versoesMencionadas.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mensagem.versoesMencionadas.map(versao => (
                          <Badge key={versao} variant="outline" className="text-xs">
                            @{versao}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input para nova mensagem */}
        <div className="flex-shrink-0 border-t pt-4 relative">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={novaMensagem}
                onChange={handleInputChange}
                placeholder="Digite sua mensagem... Use @V1 para mencionar versões"
                className="flex-1 min-h-[80px] pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarMensagem();
                  } else if (e.key === 'Escape') {
                    setMostrarAutocomplete(false);
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    toggleTyping(false);
                  }
                }}
              />
              
              {/* Autocomplete de menções */}
              {mostrarAutocomplete && versoesFiltradas.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  <div className="max-h-32 overflow-y-auto">
                    {versoesFiltradas.map((versao) => (
                      <button
                        key={versao.id}
                        onClick={() => inserirMenção(versao)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <AtSign className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{versao.versao}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              Use @V1, @V2 para mencionar versões
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
