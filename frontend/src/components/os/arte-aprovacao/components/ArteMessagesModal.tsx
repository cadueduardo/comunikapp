'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Mensagem {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  data: string;
  lida: boolean;
  produtoId?: string;
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
  
  // Debug: Log dos props recebidos
  console.log('🔍 [ArteMessagesModal] Props recebidos:', {
    produtoId,
    produtoNome,
    osId,
    versaoId
  });
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar mensagens quando o modal abrir ou quando mudar a versão
  useEffect(() => {
    if (isOpen) {
      carregarMensagens();
    }
  }, [isOpen, produtoId, versaoId]);

  // Auto-scroll para a última mensagem quando mensagens mudarem
  useEffect(() => {
    if (mensagens.length > 0) {
      const mensagensContainer = document.querySelector('.mensagens-container');
      if (mensagensContainer) {
        mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
      }
    }
  }, [mensagens]);

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
      const mensagens: Mensagem[] = mensagensData.map((msg: any) => ({
        id: msg.id,
        autor: msg.autor_nome,
        autorTipo: msg.autor_tipo,
        mensagem: msg.mensagem,
        data: msg.created_at,
        lida: msg.lida,
        produtoId: msg.produto_id,
      }));

      setMensagens(mensagens);
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
      };

      // Adicionar mensagem à lista local imediatamente
      setMensagens(prev => [...prev, mensagemOtimista]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Comentários Recentes - {produtoNome}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Lista de mensagens */}
          <div className="flex-1 overflow-y-auto pr-4 mensagens-container">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a iniciar a conversa!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mensagens.map((mensagem) => (
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
                    </div>
                    <p className="text-sm">{mensagem.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input para nova mensagem */}
        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex space-x-2">
            <Textarea
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensagem();
                }
              }}
            />
            <Button
              onClick={enviarMensagem}
              disabled={!novaMensagem.trim() || enviando}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
