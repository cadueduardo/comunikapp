'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Copy,
  DollarSign,
  Edit,
  Filter,
  Loader2,
  Search,
  Share2,
  User,
} from 'lucide-react';
import {
  MobileFiltersClearButton,
  MobileFiltersControl,
} from '@/components/layout/MobileFiltersControl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDuplicarOrcamento } from '@/hooks/use-duplicar-orcamento';
import { formatCurrency } from '@/lib/utils';
import { useOrcamentosV2 } from './hooks/useOrcamentosV2';

const statusColors = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  APROVADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-red-100 text-red-800',
  EM_NEGOCIACAO: 'bg-blue-100 text-blue-800',
  NEGOCIANDO: 'bg-blue-100 text-blue-800',
  CONCLUIDO: 'bg-gray-100 text-gray-800',
  rascunho: 'bg-gray-100 text-gray-800',
  enviado: 'bg-blue-100 text-blue-800',
};

function OrcamentosFiltrosFields({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="orcamentos-busca">Busca</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="orcamentos-busca"
            placeholder="Número, serviço ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="APROVADO">Aprovado</SelectItem>
            <SelectItem value="REJEITADO">Rejeitado</SelectItem>
            <SelectItem value="NEGOCIANDO">Negociando</SelectItem>
            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function OrcamentosV2Cards() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('todos');

  const { orcamentos, loading, error, refetch } = useOrcamentosV2();
  const { duplicar, isDuplicando } = useDuplicarOrcamento();

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count += 1;
    if (statusFilter !== 'todos') count += 1;
    return count;
  }, [searchTerm, statusFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
  };

  const handleShare = async (orcamento: {
    id: string;
    numero: string;
    nome_servico: string;
    preco_final: number;
  }) => {
    try {
      const linkPublico = `${window.location.origin}/orcamento-v2/${orcamento.id}`;

      if (navigator.share) {
        await navigator.share({
          title: `Orçamento ${orcamento.numero} - ${orcamento.nome_servico}`,
          text: `Orçamento de ${formatCurrency(orcamento.preco_final)}`,
          url: linkPublico,
        });
      } else {
        await navigator.clipboard.writeText(linkPublico);
        alert('Link copiado para a área de transferência!');
      }
    } catch (shareError) {
      console.error('Erro ao compartilhar:', shareError);
      const linkPublico = `${window.location.origin}/orcamento-v2/${orcamento.id}`;
      alert(`Link do orçamento: ${linkPublico}`);
    }
  };

  const filteredOrcamentos = orcamentos.filter((orcamento) => {
    const matchesSearch =
      orcamento.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orcamento.nome_servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orcamento.cliente?.nome &&
        orcamento.cliente.nome
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'todos' || orcamento.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando orçamentos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="text-center text-red-600">
          <div className="text-lg font-medium">Erro ao carregar orçamentos</div>
          <div className="mt-1 text-sm text-gray-600">{error}</div>
        </div>
        <Button onClick={refetch} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden pb-16 md:pb-0">
      {/* Desktop: filtros inline */}
      <Card className="hidden min-w-0 overflow-hidden md:block">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="orcamentos-busca-desktop">Busca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="orcamentos-busca-desktop"
                  placeholder="Buscar por número, serviço ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full space-y-2 sm:w-48">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="APROVADO">Aprovado</SelectItem>
                  <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                  <SelectItem value="NEGOCIANDO">Negociando</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: FAB de filtros sempre acessível */}
      <MobileFiltersControl
        activeCount={activeFiltersCount}
        title="Filtros"
        description="Busque e filtre os orçamentos."
        footer={
          <div className="flex w-full flex-col gap-2">
            <MobileFiltersClearButton
              onClear={clearFilters}
              disabled={activeFiltersCount === 0}
            />
          </div>
        }
      >
        <OrcamentosFiltrosFields
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </MobileFiltersControl>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrcamentos.map((orcamento) => (
          <Card
            key={orcamento.id}
            className="min-w-0 overflow-hidden transition-shadow hover:shadow-lg"
          >
            <CardHeader className="pb-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="mb-2 break-words text-lg">
                    {orcamento.nome_servico}
                  </CardTitle>
                  <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="max-w-full truncate text-xs"
                    >
                      {orcamento.numero}
                    </Badge>
                    <Badge
                      className={`max-w-full truncate ${statusColors[orcamento.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {orcamento.status === 'rascunho'
                        ? 'Rascunho'
                        : orcamento.status === 'enviado'
                          ? 'Enviado'
                          : orcamento.status === 'NEGOCIANDO'
                            ? 'Negociando'
                            : orcamento.status?.replace('_', ' ') ||
                              'Sem status'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="min-w-0 space-y-4">
              <p className="line-clamp-2 break-words text-sm text-gray-600">
                {orcamento.descricao}
              </p>

              <div className="min-w-0 space-y-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="min-w-0 truncate text-gray-700">
                    {orcamento.cliente?.nome || 'Cliente não informado'}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="text-gray-700">
                    {orcamento.criado_em || '-'}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(orcamento.preco_final)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-0 flex-1 basis-[calc(50%-0.25rem)]"
                  asChild
                >
                  <Link href={`/orcamentos-v2/novo?id=${orcamento.id}`}>
                    <Edit className="mr-1 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-0 flex-1 basis-[calc(50%-0.25rem)]"
                  disabled={isDuplicando(orcamento.id)}
                  onClick={() =>
                    void duplicar(orcamento.id, { onSuccess: () => refetch() })
                  }
                >
                  {isDuplicando(orcamento.id) ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="mr-1 h-4 w-4" />
                  )}
                  Duplicar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(orcamento)}
                  className="text-primary"
                  title="Compartilhar"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrcamentos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-lg font-medium">
                Nenhum orçamento encontrado
              </p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
