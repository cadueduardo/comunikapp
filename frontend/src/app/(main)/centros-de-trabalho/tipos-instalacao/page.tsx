'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Edit, Grid3X3, Hammer, List, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-media-query';
import { tiposInstalacaoApi } from '@/lib/api-client';

type TipoInstalacao = {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  exige_endereco: boolean;
  exige_agendamento: boolean;
  regra_cobranca?: string | null;
  preco_padrao?: string | number | null;
  custo_mao_obra_padrao?: string | number | null;
  custo_deslocamento_padrao?: string | number | null;
  tempo_estimado_min?: string | number | null;
  quantidade_pessoas_padrao?: string | number | null;
};

const formatarMoeda = (valor?: string | number | null) => {
  const parsed = Number(String(valor ?? '').replace(',', '.'));
  if (!Number.isFinite(parsed)) return 'R$ 0,00';
  return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const regraLabels: Record<string, string> = {
  FIXO: 'Fixo',
  POR_M2: 'Por m²',
  POR_ML: 'Por ml',
  POR_UNIDADE: 'Por unidade',
  POR_HORA: 'Por hora',
  MANUAL: 'Manual',
};

export default function TiposInstalacaoPage() {
  const [itens, setItens] = useState<TipoInstalacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [toDelete, setToDelete] = useState<TipoInstalacao | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const data = (await tiposInstalacaoApi.getAll(token)) as unknown;
        const lista = Array.isArray(data)
          ? data
          : Array.isArray((data as { data?: unknown })?.data)
            ? (data as { data: TipoInstalacao[] }).data
            : [];
        setItens(lista as TipoInstalacao[]);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return itens.filter((item) =>
      [item.nome, item.descricao]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [itens, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await tiposInstalacaoApi.delete(id, token);
      setItens((prev) => prev.filter((item) => item.id !== id));
      toast.success('Tipo de instalação removido com sucesso.');
    } catch {
      toast.error('Erro ao remover tipo de instalação.');
    }
  };

  const columns = useMemo<ColumnDef<TipoInstalacao>[]>(
    () => [
      {
        header: 'Nome',
        accessorKey: 'nome',
        cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'ativo',
        cell: ({ row }) => (
          <Badge className={row.original.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {row.original.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        header: 'Regra',
        accessorKey: 'regra_cobranca',
        cell: ({ row }) => regraLabels[row.original.regra_cobranca || 'FIXO'] || row.original.regra_cobranca || 'Fixo',
      },
      {
        header: 'Preço',
        accessorKey: 'preco_padrao',
        cell: ({ row }) => formatarMoeda(row.original.preco_padrao),
      },
      {
        header: 'Mão de obra',
        accessorKey: 'custo_mao_obra_padrao',
        cell: ({ row }) => formatarMoeda(row.original.custo_mao_obra_padrao),
      },
      {
        header: 'Deslocamento',
        accessorKey: 'custo_deslocamento_padrao',
        cell: ({ row }) => formatarMoeda(row.original.custo_deslocamento_padrao),
      },
      {
        header: 'Tempo',
        accessorKey: 'tempo_estimado_min',
        cell: ({ row }) =>
          row.original.tempo_estimado_min ? `${row.original.tempo_estimado_min} min` : '-',
      },
      {
        header: 'Ações',
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Link href={`/centros-de-trabalho/tipos-instalacao/editar/${row.original.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setToDelete(row.original)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/centros-de-trabalho">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Hammer className="h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold">Tipos de Instalação</h1>
            <p className="text-gray-600 mt-1">Gerencie instalação, aplicação e deslocamento por produto</p>
          </div>
        </div>
      </div>
      <Link href="/centros-de-trabalho/tipos-instalacao/novo">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </Link>
    </div>
  );

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full sm:w-64"
        />
      </div>
      {!isMobile && (
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4 mr-2" />
            Tabela
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Cards
          </Button>
        </div>
      )}
    </div>
  );

  const emptyState = (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhum tipo cadastrado</h3>
          <p className="text-gray-600 mb-4">Cadastre o primeiro tipo de instalação.</p>
          <Link href="/centros-de-trabalho/tipos-instalacao/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Tipo
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const cards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{item.nome}</CardTitle>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.descricao || 'Sem descrição'}</p>
              </div>
              <Badge className={item.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {item.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Preço:</span><span>{formatarMoeda(item.preco_padrao)}</span></div>
              <div className="flex justify-between"><span>Regra:</span><span>{regraLabels[item.regra_cobranca || 'FIXO'] || item.regra_cobranca || 'Fixo'}</span></div>
              <div className="flex justify-between"><span>Mão de obra:</span><span>{formatarMoeda(item.custo_mao_obra_padrao)}</span></div>
              <div className="flex justify-between"><span>Deslocamento:</span><span>{formatarMoeda(item.custo_deslocamento_padrao)}</span></div>
              <div className="flex justify-between"><span>Tempo:</span><span>{item.tempo_estimado_min ? `${item.tempo_estimado_min} min` : '-'}</span></div>
              <div className="pt-3 border-t flex gap-2">
                <Link href={`/centros-de-trabalho/tipos-instalacao/editar/${item.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Editar</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setToDelete(item)}>Excluir</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <CrudPage
        header={header}
        toolbar={toolbar}
        table={
          carregando ? (
            <Card><CardContent className="py-8 text-sm text-muted-foreground">Carregando...</CardContent></Card>
          ) : filtered.length ? (
            isMobile || viewMode === 'cards'
              ? cards
              : <DataTable<TipoInstalacao, unknown> columns={columns} data={filtered} />
          ) : (
            emptyState
          )
        }
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir Tipo de Instalação"
        description={toDelete ? `Tem certeza que deseja excluir "${toDelete.nome}"?` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => {
          if (toDelete) {
            handleDelete(toDelete.id);
            setToDelete(null);
          }
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
