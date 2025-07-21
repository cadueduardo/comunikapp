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

interface Mensagem {
  id: string;
  mensagem: string;
  tipo: 'CLIENTE' | 'VENDEDOR' | 'SISTEMA';
  autor_nome?: string;
  autor_email?: string;
  visualizada: boolean;
  anexos?: string[];
  criado_em: string;
}

interface ChatFlutuanteProps {
  orcamentoId: string;
  isPublic?: boolean; // Se true, é para cliente público
}

export function ChatFlutuante({ orcamentoId, isPublic = false }: ChatFlutuanteProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Sempre inicia fechado para evitar problemas
  const [isMinimized, setIsMinimized] = useState(false);
  const [anexo, setAnexo] = useState<File | null>(null);
  const [novasMensagens, setNovasMensagens] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      carregarMensagens();
    }
  }, [orcamentoId, isOpen, isMinimized]);

  // Marcar como lidas quando o chat está aberto
  useEffect(() => {
    if (isOpen && !isMinimized && mensagens.length > 0) {
      marcarComoLidas();
    }
  }, [isOpen, isMinimized, mensagens.length]);

  // Polling manual simples para atualização
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const interval = setInterval(() => {
      carregarMensagens();
    }, 10000); // Verificar a cada 10 segundos

    return () => clearInterval(interval);
  }, [isOpen, isMinimized]);

  // SSE para atualização em tempo real - DESABILITADO TEMPORARIAMENTE
  // useEffect(() => {
  //   if (!orcamentoId) return;

  //   const eventSource = new EventSource(`http://localhost:3001/orcamentos/${orcamentoId}/events`);
    
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
    scrollToBottom();
  }, [mensagens]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const carregarMensagens = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/orcamentos/${orcamentoId}/mensagens`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Verificar se há novas mensagens
        const novasMensagensCount = data.filter((msg: Mensagem) => 
          !mensagens.some(existing => existing.id === msg.id) && msg.tipo !== 'SISTEMA'
        ).length;
        
        if (novasMensagensCount > 0 && !isMinimized) {
          setNovasMensagens(novasMensagensCount);
        }
        
        setMensagens(data);
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
      const mensagensNaoLidas = mensagens.filter(msg => !msg.visualizada && msg.tipo !== 'SISTEMA');
      
      for (const mensagem of mensagensNaoLidas) {
        await fetch(`http://localhost:3001/orcamentos/${orcamentoId}/mensagens/${mensagem.id}/visualizar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Erro ao marcar como lidas:', error);
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;

    try {
      setEnviando(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/orcamentos/${orcamentoId}/mensagens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mensagem: novaMensagem,
          tipo: isPublic ? 'CLIENTE' : 'VENDEDOR',
          autor_nome: isPublic ? 'Cliente' : undefined,
        })
      });

      if (response.ok) {
        setNovaMensagem('');
        setAnexo(null);
        await carregarMensagens();
        // Removido toast de sucesso
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
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
                        {mensagem.anexos && mensagem.anexos.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {mensagem.anexos.map((anexo, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-blue-600">
                                <Download className="w-3 h-3" />
                                <span>{anexo.split('/').pop()}</span>
                              </div>
                            ))}
                          </div>
                        )}
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