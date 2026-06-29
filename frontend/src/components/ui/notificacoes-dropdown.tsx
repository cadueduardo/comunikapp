'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useArteWebSocket } from '@/hooks/use-arte-websocket';
import { cn } from '@/lib/utils';

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

function corrigirMojibake(texto: string): string {
  if (!/[ÃÂâð]/.test(texto)) {
    return texto;
  }

  try {
    const bytes = Array.from(texto, (char) => {
      const code = char.charCodeAt(0);
      return code <= 255 ? `%${code.toString(16).padStart(2, '0')}` : char;
    }).join('');
    return decodeURIComponent(bytes);
  } catch {
    return texto;
  }
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
  const pageRef = useRef(1); // Ref para manter a página atual sem causar re-renders

  // WebSocket para notificações de arte em tempo real - memoizar valores do localStorage
  const websocketOptions = useMemo(() => ({
    lojaId: typeof window !== 'undefined' ? localStorage.getItem('loja_id') || undefined : undefined,
    usuarioId: typeof window !== 'undefined' ? localStorage.getItem('user_id') || undefined : undefined,
  }), []);

  const { novaMensagem: novaMensagemArte } = useArteWebSocket(websocketOptions);

  const carregarNotificacoes = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
        pageRef.current = 1; // Resetar ref também
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

      const currentPage = reset ? 1 : pageRef.current;
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
        pageRef.current += 1; // Incrementar ref
        setPage(pageRef.current); // Atualizar state para UI
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
  }, []); // Sem dependências para evitar loop infinito

  useEffect(() => {
    carregarNotificacoes(true); // Reset para carregar as primeiras notificações
    carregarContador();
  }, [carregarNotificacoes]);

  // Listener para novas mensagens de arte via WebSocket
  useEffect(() => {
    if (novaMensagemArte && novaMensagemArte.mensagem && novaMensagemArte.autor_nome) {
      // Mostrar toast de notificação para mensagens de arte
      if (novaMensagemArte.autor_tipo?.toLowerCase() === 'cliente') {
        const mensagemPreview = novaMensagemArte.mensagem.substring(0, 50) +
          (novaMensagemArte.mensagem.length > 50 ? '...' : '');

        toast.info(`Nova mensagem na aprovação de arte`, {
          description: `${novaMensagemArte.autor_nome}: ${mensagemPreview}`,
          action: {
            label: 'Ver',
            onClick: () => {
              // TODO: Navegar para a página de aprovação de arte específica
              console.log('Navegar para arte:', novaMensagemArte.versao_id);
            },
          },
        });

        // Atualizar contador de notificações
        setNaoVisualizadas(prev => prev + 1);

        // Recarregar notificações para incluir a nova
        carregarNotificacoes(true);
      }
    }
  }, [novaMensagemArte, carregarNotificacoes]);

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
      case 'NOVA_MENSAGEM_CLIENTE':
        return <MessageCircle className="w-4 h-4" />;
      case 'ORCAMENTO_APROVADO':
      case 'ARTE_APROVADA':
        return <CheckCircle className="w-4 h-4" />;
      case 'ORCAMENTO_REJEITADO':
      case 'ARTE_REJEITADA':
        return <XCircle className="w-4 h-4" />;
      case 'ORCAMENTO_NEGOCIANDO':
      case 'APROVACAO_SOLICITADA':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'NOVA_MENSAGEM':
      case 'NOVA_MENSAGEM_CLIENTE':
        return 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200';
      case 'ORCAMENTO_APROVADO':
      case 'ARTE_APROVADA':
        return 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/60 dark:text-green-200';
      case 'ORCAMENTO_REJEITADO':
      case 'ARTE_REJEITADA':
        return 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200';
      case 'ORCAMENTO_NEGOCIANDO':
      case 'APROVACAO_SOLICITADA':
        return 'border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200';
      default:
        return 'border-border bg-muted text-muted-foreground';
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
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="border-b border-border p-4">
            <h3 className="text-lg font-semibold text-foreground">Notificações</h3>
            {naoVisualizadas > 0 && (
              <p className="text-sm text-muted-foreground">{naoVisualizadas} não lidas</p>
            )}
          </div>

          <div
            ref={scrollContainerRef}
            className="max-h-96 overflow-y-auto"
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando notificações...
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              <div className="space-y-1">
                {notificacoes.map((notificacao, index) => (
                  <div
                    key={`${notificacao.id}-${index}`}
                    className={cn(
                      'border-b border-border p-3 last:border-b-0 hover:bg-muted/50',
                      !notificacao.visualizada &&
                        'bg-blue-50/90 dark:bg-blue-950/25',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0 text-muted-foreground">
                        {getIconeTipo(notificacao.tipo)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-sm font-medium text-foreground">
                            {corrigirMojibake(notificacao.titulo)}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getCorTipo(notificacao.tipo))}
                          >
                            {notificacao.tipo.replace('_', ' ')}
                          </Badge>
                          {!notificacao.visualizada && (
                            <Badge
                              variant="secondary"
                              className="text-xs dark:bg-primary dark:text-primary-foreground"
                            >
                              Nova
                            </Badge>
                          )}
                        </div>

                        <p className="mb-2 text-sm text-muted-foreground">
                          {corrigirMojibake(notificacao.mensagem)}
                        </p>

                        {(notificacao.orcamento_id || notificacao.dados_extras?.os_id) && (
                          <div className="mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Navegar para OS se for notificação de arte & aprovação
                                if (notificacao.dados_extras?.os_id) {
                                  const itemId = notificacao.dados_extras?.item_id as
                                    | string
                                    | undefined;
                                  window.location.href = itemId
                                    ? `/arte/trabalho/${notificacao.dados_extras.os_id}/${itemId}`
                                    : `/arte`;
                                } else if (notificacao.orcamento_id) {
                                  window.location.href = `/orcamentos-v2/novo?id=${notificacao.orcamento_id}`;
                                }
                                setIsOpen(false);
                              }}
                              className="text-xs"
                            >
                              {notificacao.dados_extras?.os_id ? 'Abrir arte' : 'Ver Orçamento'}
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatarData(notificacao.criado_em)}
                          </span>

                          <div className="flex items-center gap-1">
                            {!notificacao.visualizada && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => marcarComoVisualizada(notificacao.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletarNotificacao(notificacao.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicador de carregamento para mais notificações */}
                {loadingMore && (
                  <div className="border-t border-border bg-muted/40 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Carregando mais notificações...</span>
                    </div>
                  </div>
                )}

                {/* Indicador quando não há mais notificações */}
                {!hasMore && notificacoes.length > 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
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
