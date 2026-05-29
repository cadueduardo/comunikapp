'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteOrcamentoDialog } from '@/components/ui/delete-orcamento-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { orcamentosApi } from '@/lib/api-client';
import { Edit, Filter, Loader2, MoreHorizontal, Search, Share2, Trash2 } from 'lucide-react';
import { OrcamentoV2, useOrcamentosV2 } from './hooks/useOrcamentosV2';

type StatusFilter = 'todos' | 'rascunho' | 'enviado';
const DESCRICAO_MAX_CHARS = 32;

interface OrcamentosV2TableProps {
  onDelete?: (id: string, nome: string) => void;
  onShare?: (orcamento: OrcamentoV2) => void;
}

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
  href: string;
}

function resolveStatusConfig(orcamento: OrcamentoV2): StatusConfig {
  const status = orcamento.status ?? 'rascunho';
  const approval = orcamento.status_aprovacao ?? null;
  const viewHref = `/orcamentos-v2/${orcamento.id}`;
  const editHref = `/orcamentos-v2/novo?id=${orcamento.id}`;

  if (status === 'rascunho') {
    return {
      label: 'Rascunho',
      variant: 'outline',
      className:
        'text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors',
      href: editHref,
    };
  }

  if (status === 'aprovado') {
    return {
      label: 'Aprovado',
      variant: 'default',
      className:
        'text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900/50 transition-colors',
      href: editHref,
    };
  }

  if (status === 'rejeitado') {
    return {
      label: 'Rejeitado',
      variant: 'destructive',
      className: 'text-xs hover:bg-red-200 transition-colors',
      href: viewHref,
    };
  }

  if (status === 'negociando') {
    return {
      label: 'Negociando',
      variant: 'secondary',
      className:
        'text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/50 transition-colors',
      href: editHref,
    };
  }

  if (status === 'enviado') {
    if (!approval || approval === 'PENDENTE') {
      return {
        label: 'Enviado - Pendente',
        variant: 'secondary',
        className:
          'text-xs bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800 dark:hover:bg-amber-900/50 transition-colors',
        href: editHref,
      };
    }

    if (approval === 'APROVADO') {
      return {
        label: 'Enviado - Aprovado',
        variant: 'default',
        className:
        'text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900/50 transition-colors',
        href: editHref,
      };
    }

    if (approval === 'REJEITADO') {
      return {
        label: 'Enviado - Rejeitado',
        variant: 'destructive',
        className: 'text-xs hover:bg-red-200 transition-colors',
        href: viewHref,
      };
    }

    if (approval === 'NEGOCIANDO') {
      return {
        label: 'Enviado - Negociando',
        variant: 'secondary',
        className:
        'text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/50 transition-colors',
        href: editHref,
      };
    }
  }

  return {
    label: 'Enviado',
    variant: 'secondary',
    className: 'text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors',
    href: editHref,
  };
}

function truncateText(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}...`;
}

export function OrcamentosV2Table({ onDelete, onShare }: OrcamentosV2TableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; orcamentoId?: string; nome?: string; loading?: boolean }>({ open: false });
  const { orcamentos, loading, error, refetch } = useOrcamentosV2();

  const filteredData = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    let data = [...orcamentos];

    if (normalizedTerm) {
      data = data.filter((item) => {
        const matchesTitulo = item.nome_servico.toLowerCase().includes(normalizedTerm);
        const matchesCliente = item.cliente?.nome?.toLowerCase().includes(normalizedTerm);
        const matchesNumero = item.numero.toLowerCase().includes(normalizedTerm);
        return matchesTitulo || matchesCliente || matchesNumero;
      });
    }

    if (statusFilter === 'rascunho') {
      data = data.filter((item) => !item.status || item.status === 'rascunho');
    } else if (statusFilter === 'enviado') {
      data = data.filter((item) => item.status === 'enviado');
    }

    return data;
  }, [orcamentos, searchTerm, statusFilter]);

  const handleRefresh = async () => {
    await refetch();
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({ open: true, orcamentoId: id, nome, loading: false });
  };

  const confirmDelete = async (motivo: string) => {
    if (!deleteDialog.orcamentoId) {
      return;
    }

    setDeleteDialog((previous) => ({ ...previous, loading: true }));

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticacao nao encontrado.');
      }

      await orcamentosApi.v2.delete(deleteDialog.orcamentoId, token, { motivo });
      toast.success('Orcamento excluido com sucesso.');
      onDelete?.(deleteDialog.orcamentoId, deleteDialog.nome ?? '');
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir o orcamento.';
      toast.error(message);
    } finally {
      setDeleteDialog({ open: false, loading: false });
    }
  };

  const handleShare = async (orcamento: OrcamentoV2) => {
    if (onShare) {
      onShare(orcamento);
      return;
    }

    try {
      const publicLink = `${window.location.origin}/orcamento-v2/${orcamento.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Orcamento ${orcamento.numero} - ${orcamento.nome_servico}`,
          text: `Orcamento de ${formatCurrency(orcamento.preco_final)}`,
          url: publicLink,
        });
        return;
      }

      await navigator.clipboard.writeText(publicLink);
      toast.success('Link copiado para a area de transferencia.');
    } catch (err) {
      const fallbackLink = `${window.location.origin}/orcamento-v2/${orcamento.id}`;
      console.error('Erro ao compartilhar orcamento:', err);
      alert(`Link do orcamento: ${fallbackLink}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando orcamentos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Erro ao carregar orcamentos</div>
          <div className="mt-1 text-sm text-muted-foreground">{error}</div>
        </div>
        <Button onClick={refetch} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por servico, cliente ou numero..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Filtrar por status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
              <SelectItem value="enviado">Enviados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="crud-table-shell">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Numero</th>
                <th>Servico</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Atualizado em</th>
                <th className="text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-lg font-medium">Nenhum orcamento encontrado</div>
                      <div className="text-sm">Ajuste os filtros ou crie um novo orcamento.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((orcamento) => {
                  const statusConfig = resolveStatusConfig(orcamento);
                  const descricao = orcamento.descricao?.trim();
                  const descricaoCurta = descricao
                    ? truncateText(descricao, DESCRICAO_MAX_CHARS)
                    : '';

                  return (
                  <tr key={orcamento.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant="secondary">#{orcamento.numero}</Badge>
                    </td>
                      <td className="px-6 py-4 max-w-[48rem]">
                        <div className="font-medium">{orcamento.nome_servico}</div>
                        {descricao && (
                          <div
                            className="text-sm text-muted-foreground truncate"
                            title={descricao}
                          >
                            {descricaoCurta}
                          </div>
                        )}
                    </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {orcamento.cliente?.nome ?? '-'}
                    </td>
                      <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(orcamento.preco_final)}
                      </span>
                    </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link href={statusConfig.href} className="inline-block">
                          <Badge variant={statusConfig.variant} className={statusConfig.className}>
                            {statusConfig.label}
                            </Badge>
                          </Link>
                    </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {orcamento.criado_em ?? '-'}
                    </td>
                       <td className="whitespace-nowrap px-6 py-4">
                         {(orcamento as OrcamentoV2 & { data_atualizacao?: string }).data_atualizacao ?? '-'}
                    </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleShare(orcamento)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartilhar
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                              <Link href={`/orcamentos-v2/novo?id=${orcamento.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                              onClick={() => openDeleteDialog(orcamento.id, orcamento.nome_servico)}
                              className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Mostrando <span className="font-medium">{filteredData.length}</span> de{' '}
            <span className="font-medium">{orcamentos.length}</span> orcamentos
          </div>
        </div>
      )}

      <DeleteOrcamentoDialog
        open={deleteDialog.open}
        orcamentoNome={deleteDialog.nome}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false })}
        loading={deleteDialog.loading}
      />
    </div>
  );
}
