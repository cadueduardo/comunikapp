'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  MessageCircle, 
  User, 
  Bot, 
  X, 
  Minimize2, 
  Maximize2,
  Paperclip,
  Download,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocket } from '@/hooks/use-websocket';
import { buildApiUrl } from '@/lib/config';

interface Anexo {
  nome_arquivo: string;
  url_arquivo: string;
  tipo_arquivo?: string;
  tamanho?: number;
  _isTemporary?: boolean; // Flag para anexos temporários (antes de serem salvos no servidor)
}

interface Mensagem {
  id: string;
  mensagem: string;
  tipo: 'CLIENTE' | 'VENDEDOR' | 'SISTEMA';
  autor_nome?: string;
  autor_email?: string;
  visualizada: boolean;
  anexos?: (string | Anexo)[]; // Suporta tanto strings (legado) quanto objetos Anexo
  criado_em: string;
}

interface ChatFlutuanteProps {
  orcamentoId: string;
  isPublic?: boolean; // Se true, é para cliente público
  shouldOpen?: boolean; // Se true, deve abrir o chat
}

export function ChatFlutuante({ orcamentoId, isPublic = false, shouldOpen = false }: ChatFlutuanteProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Sempre inicia fechado
  const [isMinimized, setIsMinimized] = useState(false);
  const [anexo, setAnexo] = useState<File | null>(null);
  const [novasMensagens, setNovasMensagens] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Abrir chat quando shouldOpen for true (apenas uma vez por mudança)
  useEffect(() => {
    if (shouldOpen && !isOpen) {
      console.log('🔍 ChatFlutuante - Abrindo chat por comando externo');
      setIsOpen(true);
    }
    // Não fechar automaticamente se shouldOpen for false
  }, [shouldOpen]); // Removido isOpen da dependência para evitar loop

  // WebSocket hook
  const { isConnected, emitTyping, emitMessageRead } = useWebSocket({
    orcamentoId,
    isPublic,
    onNewMessage: (data) => {
      // console.log('🔍 Polling recebeu nova mensagem:', data.message);
      // console.log('🔍 IDs existentes atuais:', mensagens.map(m => m.id));
      
      // Verificar se a mensagem já existe para evitar duplicação
      const mensagemJaExiste = mensagens.some(msg => msg.id === data.message.id);
      
      // console.log('🔍 Mensagem já existe?', mensagemJaExiste, 'ID:', data.message.id);
      
      if (!mensagemJaExiste) {
        // Adicionar nova mensagem à lista
        const novaMensagem: Mensagem = {
          ...data.message,
          tipo: data.message.tipo as 'CLIENTE' | 'VENDEDOR' | 'SISTEMA',
        };
        
        console.log('🔍 Adicionando nova mensagem do polling:', novaMensagem);
        
        // Usar função de atualização para garantir que não há duplicação
        setMensagens(prev => {
          // Verificar novamente se a mensagem já existe
          const jaExiste = prev.some(msg => msg.id === data.message.id);
          if (jaExiste) {
            console.log('🔍 Mensagem já existe no estado, ignorando:', data.message.id);
            return prev;
          }
          
          const novasMensagens = [...prev, novaMensagem];
          console.log('🔍 Mensagens após adição:', novasMensagens.map(m => ({ id: m.id, mensagem: m.mensagem })));
          return novasMensagens;
        });
        
        setNovasMensagens(prev => prev + 1);
        
        // Se o chat estiver aberto, marcar como lida
        if (isOpen && !isMinimized) {
          emitMessageRead(data.message.id);
        }
      } else {
        console.log('🔍 Mensagem duplicada ignorada:', data.message.id);
      }
    },
    onMessageRead: (messageId) => {
      console.log('🔍 Marcando mensagem como lida:', messageId);
      // Atualizar status de leitura
      setMensagens(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, visualizada: true } : msg
        )
      );
    },
    onUserTyping: (data) => {
      setIsTyping(data.isTyping);
    },
    onError: (error) => {
      console.error('❌ Erro WebSocket:', error);
      toast.error('Erro de conexão em tempo real');
    },
  });

  // Carregar mensagens iniciais
  useEffect(() => {
    if (orcamentoId) {
      carregarMensagens();
    }
  }, [orcamentoId]);

  // Verificar duplicação de mensagens
  useEffect(() => {
    const ids = mensagens.map(m => m.id);
    const idsUnicos = new Set(ids);
    
    if (ids.length !== idsUnicos.size) {
      console.error('❌ DUPLICAÇÃO DETECTADA!');
      console.log('IDs duplicados:', ids.filter((id, index) => ids.indexOf(id) !== index));
      
      // Remover duplicatas
      const mensagensUnicas = mensagens.filter((msg, index) => 
        mensagens.findIndex(m => m.id === msg.id) === index
      );
      
      console.log('🔧 Removendo duplicatas, mantendo apenas:', mensagensUnicas.length, 'mensagens');
      setMensagens(mensagensUnicas);
    }
  }, [mensagens]);

  // Marcar como lidas quando o chat está aberto
  useEffect(() => {
    if (isOpen && !isMinimized && mensagens.length > 0) {
      marcarComoLidas();
    }
  }, [isOpen, isMinimized, mensagens.length]);

  // Indicador de digitação
  useEffect(() => {
    if (novaMensagem.length > 0) {
      emitTyping(true);
      const timeout = setTimeout(() => emitTyping(false), 1000);
      return () => clearTimeout(timeout);
    } else {
      emitTyping(false);
    }
  }, [novaMensagem, emitTyping]);

  // SSE para atualização em tempo real - DESABILITADO TEMPORARIAMENTE
  // useEffect(() => {
  //   if (!orcamentoId) return;

  //   const eventSource = new EventSource(buildApiUrl(`/orcamentos/${orcamentoId}/events`));
    
  //   eventSource.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data);
        
  //       if (data.type === 'new_messages') {
  //         setNovasMensagens(data.count);
  //         // Só recarregar se o chat estiver aberto e não minimizado
  //         if (isOpen && !isMinimized) {
  //           setTimeout(() => carregarMensagens(), 1000); // Delay para evitar loop
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Erro ao processar SSE:', error);
  //     }
  //   };

  //   eventSource.onerror = (error) => {
  //     console.error('Erro na conexão SSE:', error);
  //     eventSource.close();
  //   };

  //   return () => {
  //     eventSource.close();
  //   };
  // }, [orcamentoId]); // Apenas orcamentoId como dependência

  useEffect(() => {
    // Comportamento padrão de chat: scroll para o final apenas quando há novas mensagens
    if (isOpen && !isMinimized && mensagens.length > 0) {
      // Scroll imediato para evitar delay visual
      scrollToBottom();
    }
  }, [mensagens.length, isOpen, isMinimized]); // Usar mensagens.length em vez de mensagens

  // Scroll quando abre/desminimiza o chat
  useEffect(() => {
    if (isOpen && !isMinimized && mensagens.length > 0) {
      scrollToBottom();
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  const carregarMensagens = async () => {
    try {
      setLoading(true);
      
      // Usar endpoint correto baseado no modo - SEGUINDO PADRÃO DO LEGADO
      const endpoint = isPublic 
        ? buildApiUrl(`/orcamentos-v2/${orcamentoId}/mensagens/publico`)
        : buildApiUrl(`/orcamentos-v2/${orcamentoId}/mensagens`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Adicionar token apenas se não for público
      if (!isPublic) {
        const token = localStorage.getItem('access_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(endpoint, { headers });

      if (response.ok) {
        const responseData = await response.json();
        // console.log('🔍 Dados brutos recebidos do backend:', responseData);
        
        // Extrair array de mensagens da resposta
        // O backend retorna {mensagens: [...], total: ..., etc}
        const data = responseData.mensagens || responseData.data || responseData;
        // console.log('🔍 Dados extraídos:', data);
        
        // Verificar se data é um array
        if (!Array.isArray(data)) {
          console.error('❌ Dados não são um array:', data);
          setMensagens([]);
          return;
        }
        
        // Processar anexos das mensagens (parsear JSON strings para objetos)
        const mensagensProcessadas = data.map((msg: Mensagem) => {
          // console.log('🔍 Processando mensagem:', msg.id, 'criado_em:', msg.criado_em, 'tipo:', typeof msg.criado_em);
          
          if (msg.anexos && typeof msg.anexos === 'string') {
            try {
              msg.anexos = JSON.parse(msg.anexos);
              // console.log('🔍 Anexos parseados:', msg.anexos);
            } catch (e) {
              console.error('Erro ao parsear anexos JSON:', e);
              msg.anexos = [];
            }
          }
          return msg;
        });
        
        console.log('🔍 Mensagens processadas:', mensagensProcessadas);
        
        // Verificar se há novas mensagens
        const novasMensagensCount = mensagensProcessadas.filter((msg: Mensagem) => 
          !mensagens.some(existing => existing.id === msg.id) && msg.tipo !== 'SISTEMA'
        ).length;
        
        if (novasMensagensCount > 0 && !isMinimized) {
          setNovasMensagens(novasMensagensCount);
        }
        
        setMensagens(mensagensProcessadas);
      } else {
        console.error('Erro ao carregar mensagens:', response.status, response.statusText);
        toast.error('Erro ao carregar mensagens');
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLidas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Filtrar apenas mensagens que não são temporárias e não estão visualizadas
      const mensagensNaoLidas = mensagens.filter(msg => 
        !msg.visualizada && 
        msg.tipo !== 'SISTEMA' && 
        !msg.id.startsWith('temp_') // Não tentar marcar mensagens temporárias
      );
      
      console.log('👁️ Marcando como lidas:', mensagensNaoLidas.length, 'mensagens');
      
      for (const mensagem of mensagensNaoLidas) {
        try {
          const response = await fetch(buildApiUrl(`/orcamentos-v2/chat/${orcamentoId}/mensagens/${mensagem.id}/visualizar`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('✅ Mensagem marcada como lida:', mensagem.id);
          } else {
            console.warn('⚠️ Erro ao marcar mensagem como lida:', mensagem.id, response.status);
          }
        } catch (error) {
          console.warn('⚠️ Erro individual ao marcar mensagem como lida:', mensagem.id, error);
        }
      }
    } catch (error) {
      console.error('❌ Erro geral ao marcar como lidas:', error);
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() && !anexo) return;

    const mensagemOriginal = novaMensagem; // Guardar mensagem original para restaurar se falhar
    const anexoOriginal = anexo; // Guardar anexo original para restaurar se falhar
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`; // Criar ID temporário mais único

    try {
      setEnviando(true);
      
      console.log('🔍 Enviando mensagem com ID temporário:', tempId);
      console.log('🔍 Anexo presente:', !!anexo, anexo?.name);
      
      // Adicionar mensagem temporária localmente (com estrutura correta para anexos)
      const mensagemTemporaria: Mensagem = {
        id: tempId,
        mensagem: novaMensagem || (anexo ? `📎 ${anexo.name}` : ''),
        tipo: isPublic ? 'CLIENTE' : 'VENDEDOR',
        autor_nome: isPublic ? 'Cliente' : undefined,
        autor_email: undefined,
        visualizada: false,
        anexos: anexo ? [{
          nome_arquivo: anexo.name,
          url_arquivo: URL.createObjectURL(anexo), // URL temporária para preview
          tipo_arquivo: anexo.type,
          tamanho: anexo.size,
          _isTemporary: true // Flag para identificar anexo temporário
        }] : [],
        criado_em: new Date().toISOString(),
      };
      
      console.log('🔍 Adicionando mensagem temporária:', mensagemTemporaria);
      setMensagens(prev => [...prev, mensagemTemporaria]);
      setNovaMensagem('');
      setAnexo(null);
      
      // Usar endpoint correto baseado no modo - SEGUINDO PADRÃO DO LEGADO
      const endpoint = isPublic 
        ? buildApiUrl(`/orcamentos-v2/${orcamentoId}/mensagens/publico`)
        : buildApiUrl(`/orcamentos-v2/${orcamentoId}/mensagens`);
      
      // Preparar dados para envio
      let body: string | FormData;
      let headers: Record<string, string> = {};

      if (anexoOriginal) {
        // Se há anexo, usar FormData
        const formData = new FormData();
        formData.append('mensagem', mensagemOriginal || '');
        formData.append('tipo', isPublic ? 'CLIENTE' : 'VENDEDOR');
        if (isPublic) {
          formData.append('autor_nome', 'Cliente');
        }
        formData.append('arquivo', anexoOriginal);
        
        body = formData;
        // Não definir Content-Type para FormData - o browser define automaticamente
      } else {
        // Se não há anexo, usar JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          mensagem: mensagemOriginal,
          tipo: isPublic ? 'CLIENTE' : 'VENDEDOR',
          autor_nome: isPublic ? 'Cliente' : undefined,
        });
      }

      // Adicionar token apenas se não for público
      if (!isPublic) {
        const token = localStorage.getItem('access_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      console.log('🔍 Enviando para endpoint:', endpoint);
      console.log('🔍 Tipo de body:', anexoOriginal ? 'FormData com anexo' : 'JSON');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body
      });

      if (response.ok) {
        const mensagemEnviada = await response.json();
        console.log('✅ Mensagem enviada com sucesso:', mensagemEnviada);
        
        // ✅ SOLUÇÃO DEFINITIVA: NÃO recarregar mensagens após envio
        // A substituição da mensagem temporária pela real já é suficiente
        
        // Substituir mensagem temporária pela real (incluindo anexos corretos)
        setMensagens(prev => {
          const novasMensagens = prev.map(msg => {
            if (msg.id === tempId) {
              // Limpar URL temporária se existir
              if (msg.anexos) {
                msg.anexos.forEach(anexo => {
                  if (anexo._isTemporary && anexo.url_arquivo?.startsWith('blob:')) {
                    URL.revokeObjectURL(anexo.url_arquivo);
                  }
                });
              }
              
              // Substituir pela mensagem real do servidor
              return {
                ...mensagemEnviada,
                anexos: mensagemEnviada.anexos || []
              };
            }
            return msg;
          });
          console.log('🔍 Mensagens após substituição:', novasMensagens.map(m => ({ id: m.id, mensagem: m.mensagem, anexos: m.anexos?.length || 0 })));
          return novasMensagens;
        });
      } else {
        // Se falhou, limpar URLs temporárias e remover mensagem
        console.error('❌ Erro ao enviar mensagem:', response.status, response.statusText);
        
        // ✅ SOLUÇÃO DEFINITIVA: NÃO recarregar mensagens em caso de erro
        // A mensagem temporária já foi removida, não precisa recarregar
        
        setMensagens(prev => {
          const mensagemTemp = prev.find(msg => msg.id === tempId);
          if (mensagemTemp?.anexos) {
            mensagemTemp.anexos.forEach(anexo => {
              if (anexo._isTemporary && anexo.url_arquivo?.startsWith('blob:')) {
                URL.revokeObjectURL(anexo.url_arquivo);
              }
            });
          }
          return prev.filter(msg => msg.id !== tempId);
        });
        setNovaMensagem(mensagemOriginal); // Restaurar mensagem no input
        setAnexo(anexoOriginal); // Restaurar anexo no input
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      // Se falhou, limpar URLs temporárias e remover mensagem
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // ✅ CORREÇÃO: Tentar recarregar mensagens mesmo em caso de erro
      setTimeout(() => {
        carregarMensagens();
      }, 1000);
      
      setMensagens(prev => {
        const mensagemTemp = prev.find(msg => msg.id === tempId);
        if (mensagemTemp?.anexos) {
          mensagemTemp.anexos.forEach(anexo => {
            if (anexo._isTemporary && anexo.url_arquivo?.startsWith('blob:')) {
              URL.revokeObjectURL(anexo.url_arquivo);
            }
          });
        }
        return prev.filter(msg => msg.id !== tempId);
      });
      setNovaMensagem(mensagemOriginal); // Restaurar mensagem no input
      setAnexo(anexoOriginal); // Restaurar anexo no input
      toast.error('Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido. Use apenas JPG, PNG ou PDF.');
        return;
      }

      // Validar tamanho (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 5MB.');
        return;
      }

      setAnexo(file);
    }
  };

  const formatarData = (data: string) => {
    try {
      const dataObj = new Date(data);
      
      // Verificar se a data é válida
      if (isNaN(dataObj.getTime())) {
        console.warn('Data inválida recebida:', data);
        return 'Data inválida';
      }
      
      return dataObj.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data recebida:', data);
      return 'Data inválida';
    }
  };

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'CLIENTE':
        return <User className="w-4 h-4" />;
      case 'VENDEDOR':
        return <User className="w-4 h-4" />;
      case 'SISTEMA':
        return <Bot className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'CLIENTE':
        return 'bg-blue-100 text-blue-800';
      case 'VENDEDOR':
        return 'bg-green-100 text-green-800';
      case 'SISTEMA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNomeAutor = (mensagem: Mensagem) => {
    if (mensagem.autor_nome) return mensagem.autor_nome;
    return mensagem.tipo === 'CLIENTE' ? 'Cliente' : 'Vendedor';
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Botão flutuante quando minimizado */}
      {!isOpen && (
        <Button
          onClick={() => {
            console.log('Botão do chat clicado!');
            setIsOpen(true);
            setNovasMensagens(0); // Reset contador ao abrir
            carregarMensagens(); // Carregar mensagens ao abrir
          }}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 relative z-50"
          title="Abrir chat de negociação"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {novasMensagens > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {novasMensagens > 9 ? '9+' : novasMensagens}
            </Badge>
          )}
          {/* Indicador de conexão WebSocket */}
          <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </Button>
      )}

      {/* Chat expandido */}
      {isOpen && (
        <Card className="w-80 shadow-xl" style={{ maxHeight: 'calc(100vh - 2rem)', height: '400px' }}>
          <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat de Negociação
                  {isTyping && (
                    <span className="text-xs text-gray-500 animate-pulse">
                      Digitando...
                    </span>
                  )}
                </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={carregarMensagens}
                  className="h-6 w-6 p-0"
                  title="Atualizar mensagens"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0"
                >
                  {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('🔍 ChatFlutuante - Fechando chat');
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  className="h-6 w-6 p-0"
                  title="Fechar chat"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
              {/* Área de Mensagens */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 p-2 border rounded-lg" style={{ minHeight: '200px', maxHeight: 'calc(100vh - 200px)' }}>
                {loading ? (
                  <div className="text-center text-gray-500 text-sm">Carregando mensagens...</div>
                ) : mensagens.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm">Nenhuma mensagem ainda</div>
                ) : (
                  mensagens.map((mensagem) => (
                    <div key={mensagem.id} className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        {getIconeTipo(mensagem.tipo)}
                        <Badge variant="outline" className={`text-xs ${getCorTipo(mensagem.tipo)}`}>
                          {getNomeAutor(mensagem)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatarData(mensagem.criado_em)}
                        </span>
                        {mensagem.tipo === 'VENDEDOR' && (
                          <div className="flex items-center gap-1">
                            {mensagem.visualizada ? (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                                  <CheckCircle className="w-2 h-2 text-white" />
                                </div>
                                <span className="text-xs text-gray-500">Lida</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                <span className="text-xs text-gray-500">Enviada</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-sm whitespace-pre-line">{mensagem.mensagem}</p>
                        {(() => {
                          // Debug: verificar anexos da mensagem
                          // console.log('🔍 Renderizando mensagem:', mensagem.id, 'anexos:', mensagem.anexos);
                          
                          // Garantir que anexos seja um array
                          let anexosArray = [];
                          if (mensagem.anexos) {
                            if (Array.isArray(mensagem.anexos)) {
                              anexosArray = mensagem.anexos;
                              // console.log('🔍 Anexos já é array:', anexosArray);
                            } else if (typeof mensagem.anexos === 'string') {
                              try {
                                const parsed = JSON.parse(mensagem.anexos);
                                // Se o resultado for um objeto único, convertê-lo para array
                                anexosArray = Array.isArray(parsed) ? parsed : [parsed];
                                console.log('🔍 Anexos parseados de string:', anexosArray);
                              } catch (e) {
                                console.error('Erro ao parsear anexos JSON:', e);
                                anexosArray = [];
                              }
                            } else if (typeof mensagem.anexos === 'object' && mensagem.anexos !== null) {
                              // Se já é um objeto, convertê-lo para array
                              anexosArray = [mensagem.anexos];
                              // console.log('🔍 Anexos convertido de objeto para array:', anexosArray);
                            }
                          }
                          
                          // console.log('🔍 AnexosArray final:', anexosArray);
                          
                          return anexosArray && anexosArray.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {anexosArray.map((anexo, index) => {
                              // Debug: console.log('📎 Debug anexo:', anexo);
                              
                              // Processar anexo de forma mais robusta
                              let nomeArquivoOriginal, urlArquivo, isTemporary = false;
                              
                              if (typeof anexo === 'string') {
                                // Anexo antigo como string - usar o nome da URL
                                urlArquivo = anexo;
                                nomeArquivoOriginal = anexo.includes('/') ? anexo.split('/').pop() : anexo;
                              } else {
                                // Anexo como objeto - usar nome original e URL separadamente
                                nomeArquivoOriginal = anexo?.nome_arquivo || 'arquivo';
                                urlArquivo = anexo?.url_arquivo || anexo?.nome_arquivo || 'arquivo';
                                isTemporary = anexo?._isTemporary || false;
                              }
                              
                              // Construir URL completa para download
                              let downloadUrl;
                              if (isTemporary) {
                                // Anexo temporário - usar URL blob diretamente
                                downloadUrl = urlArquivo;
                              } else if (urlArquivo.startsWith('http')) {
                                // URL absoluta
                                downloadUrl = urlArquivo;
                              } else {
                                // URL relativa - construir URL completa
                                downloadUrl = buildApiUrl(urlArquivo);
                              }
                              
                              // Debug: console.log('📎 Nome original:', nomeArquivoOriginal, 'URL:', downloadUrl);
                              
                              return (
                                <a
                                  key={index}
                                  href={downloadUrl}
                                  download={nomeArquivoOriginal}
                                  className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  title={`📎 Clique para baixar: ${nomeArquivoOriginal}`}
                                  onClick={(e) => {
                                    console.log('📎 Clique no anexo:', nomeArquivoOriginal);
                                    console.log('📎 É temporário:', isTemporary);
                                    
                                    e.preventDefault();
                                    
                                    if (isTemporary) {
                                      // Anexo temporário - mostrar mensagem informativa
                                      alert('⏳ Arquivo ainda sendo enviado... Aguarde alguns segundos e tente novamente.');
                                      return;
                                    }
                                    
                                    // Anexo persistido - criar link para download
                                    const link = document.createElement('a');
                                    link.href = downloadUrl;
                                    link.download = nomeArquivoOriginal;
                                    link.target = '_blank';
                                    link.rel = 'noopener noreferrer';
                                    
                                    // Adicionar ao DOM temporariamente, clicar e remover
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    
                                    console.log('📎 Download iniciado para:', nomeArquivoOriginal);
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                  <span>{nomeArquivoOriginal}</span>
                                </a>
                              );
                              })}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Área de Input */}
              <div className="space-y-2">
                {/* Anexo selecionado */}
                {anexo && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-blue-600 flex-1 truncate">
                      {anexo.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnexo(null)}
                      className="h-4 w-4 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Input de mensagem */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="resize-none pr-10"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          enviarMensagem();
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById('file-input')?.click()}
                      className="absolute right-2 top-2 h-6 w-6 p-0"
                      title="Anexar arquivo"
                    >
                      <Paperclip className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Input
                      id="file-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <Button
                    onClick={enviarMensagem}
                    disabled={enviando || (!novaMensagem.trim() && !anexo)}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
} 