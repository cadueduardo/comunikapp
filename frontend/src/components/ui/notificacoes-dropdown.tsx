'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { notificacoesApi } from '@/lib/api-client';

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  orcamento_id?: string;
  visualizada: boolean;
  criado_em: string;
  dados_extras?: Record<string, unknown>;
}

export function NotificacoesDropdown() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoVisualizadas, setNaoVisualizadas] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const carregarNotificacoes = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('Token não encontrado, pulando carregamento de notificações');
        return;
      }

      // Validar se o token não está vazio
      if (token.trim() === '') {
        console.log('Token vazio, pulando carregamento de notificações');
        return;
      }

      console.log('Tentando carregar notificações com token:', token.substring(0, 20) + '...');
      
      const currentPage = reset ? 1 : page;
      const limit = 10;
      const offset = (currentPage - 1) * limit;
      
      // Usar paginação real do backend
      const data = await notificacoesApi.getAll(token, limit, offset);
      
      if (reset) {
        setNotificacoes(data as Notificacao[]);
      } else {
        setNotificacoes(prev => {
          const novasNotificacoes = data as Notificacao[];
          const idsExistentes = new Set(prev.map(n => n.id));
          const notificacoesUnicas = novasNotificacoes.filter(n => !idsExistentes.has(n.id));
          return [...prev, ...notificacoesUnicas];
        });
      }
      
      // Verificar se há mais dados para carregar
      if ((data as Notificacao[]).length < limit) {
        setHasMore(false);
      }
      
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      
      // Se for erro de autenticação, limpar o token
      if (error instanceof Error && error.message.includes('401')) {
        localStorage.removeItem('access_token');
        console.log('Token inválido removido do localStorage');
      }
      
      // Se for erro de rede, mostrar mensagem específica
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Erro de conectividade com a API. Verifique se o backend está rodando.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => {
    carregarNotificacoes(true); // Reset para carregar as primeiras notificações
    carregarContador();
  }, [carregarNotificacoes]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const carregarContador = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token || token.trim() === '') {
        console.log('Token não encontrado ou vazio, pulando carregamento do contador');
        return;
      }

      const data = await notificacoesApi.getUnreadCount(token);
      setNaoVisualizadas((data as { count: number }).count);
    } catch (error) {
      console.error('Erro ao carregar contador:', error);
      
      // Se for erro de autenticação, limpar o token
      if (error instanceof Error && error.message.includes('401')) {
        localStorage.removeItem('access_token');
        console.log('Token inválido removido do localStorage');
      }
    }
  };

  const marcarComoVisualizada = async (notificacaoId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await notificacoesApi.markAsRead(notificacaoId, token);
        await carregarNotificacoes(true); // Reset para recarregar tudo
        await carregarContador();
      }
    } catch (error) {
      console.error('Erro ao marcar como visualizada:', error);
    }
  };

  const deletarNotificacao = async (notificacaoId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await notificacoesApi.delete(notificacaoId, token);
        await carregarNotificacoes(true); // Reset para recarregar tudo
        await carregarContador();
        toast.success('Notificação removida');
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  };

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'NOVA_MENSAGEM':
        return <MessageCircle className="w-4 h-4" />;
      case 'ORCAMENTO_APROVADO':
        return <CheckCircle className="w-4 h-4" />;
      case 'ORCAMENTO_REJEITADO':
        return <XCircle className="w-4 h-4" />;
      case 'ORCAMENTO_NEGOCIANDO':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'NOVA_MENSAGEM':
        return 'bg-blue-100 text-blue-800';
      case 'ORCAMENTO_APROVADO':
        return 'bg-green-100 text-green-800';
      case 'ORCAMENTO_REJEITADO':
        return 'bg-red-100 text-red-800';
      case 'ORCAMENTO_NEGOCIANDO':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Função para carregar mais notificações quando o usuário faz scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Verificar se chegou ao final (com margem de 50px)
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loadingMore) {
      carregarNotificacoes(false);
    }
  }, [hasMore, loadingMore, carregarNotificacoes]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {naoVisualizadas > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {naoVisualizadas > 9 ? '9+' : naoVisualizadas}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Notificações</h3>
            {naoVisualizadas > 0 && (
              <p className="text-sm text-gray-600">{naoVisualizadas} não lidas</p>
            )}
          </div>

          <div 
            ref={scrollContainerRef}
            className="max-h-96 overflow-y-auto"
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Carregando notificações...
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhuma notificação
              </div>
            ) : (
              <div className="space-y-1">
                {notificacoes.map((notificacao, index) => (
                  <div
                    key={`${notificacao.id}-${index}`}
                    className={`p-3 border-b last:border-b-0 hover:bg-gray-50 ${
                      !notificacao.visualizada ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIconeTipo(notificacao.tipo)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {notificacao.titulo}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCorTipo(notificacao.tipo)}`}
                          >
                            {notificacao.tipo.replace('_', ' ')}
                          </Badge>
                          {!notificacao.visualizada && (
                            <Badge variant="secondary" className="text-xs">
                              Nova
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notificacao.mensagem}
                        </p>
                        
                        {notificacao.orcamento_id && (
                          <div className="mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.location.href = `/orcamentos-v2/novo?id=${notificacao.orcamento_id}`;
                                setIsOpen(false);
                              }}
                              className="text-xs"
                            >
                              Ver Orçamento
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatarData(notificacao.criado_em)}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {!notificacao.visualizada && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => marcarComoVisualizada(notificacao.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletarNotificacao(notificacao.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Indicador de carregamento para mais notificações */}
                {loadingMore && (
                  <div className="p-4 text-center bg-blue-50 border-t border-blue-100">
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Carregando mais notificações...</span>
                    </div>
                  </div>
                )}
                
                {/* Indicador quando não há mais notificações */}
                {!hasMore && notificacoes.length > 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Todas as notificações foram carregadas
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 