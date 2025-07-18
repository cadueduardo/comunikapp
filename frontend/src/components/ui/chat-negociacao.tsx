'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, User, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface Mensagem {
  id: string;
  mensagem: string;
  tipo: 'CLIENTE' | 'VENDEDOR' | 'SISTEMA';
  criado_em: string;
  usuario?: {
    id: string;
    nome_completo: string;
    email: string;
  };
}

interface ChatNegociacaoProps {
  orcamentoId: string;
  onMensagemEnviada?: () => void;
}

export function ChatNegociacao({ orcamentoId, onMensagemEnviada }: ChatNegociacaoProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarMensagens();
  }, [orcamentoId]);

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
        setMensagens(data);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
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
          tipo: 'VENDEDOR'
        })
      });

      if (response.ok) {
        setNovaMensagem('');
        await carregarMensagens();
        onMensagemEnviada?.();
        toast.success('Mensagem enviada com sucesso');
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat de Negociação
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg">
          {loading ? (
            <div className="text-center text-gray-500">Carregando mensagens...</div>
          ) : mensagens.length === 0 ? (
            <div className="text-center text-gray-500">Nenhuma mensagem ainda</div>
          ) : (
            mensagens.map((mensagem) => (
              <div key={mensagem.id} className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  {getIconeTipo(mensagem.tipo)}
                  <Badge variant="outline" className={getCorTipo(mensagem.tipo)}>
                    {mensagem.tipo}
                  </Badge>
                  {mensagem.usuario && (
                    <span className="text-sm text-gray-600">
                      {mensagem.usuario.nome_completo}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatarData(mensagem.criado_em)}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-line">{mensagem.mensagem}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Área de Input */}
        <div className="flex gap-2">
          <Textarea
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensagem();
              }
            }}
          />
          <Button
            onClick={enviarMensagem}
            disabled={enviando || !novaMensagem.trim()}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 