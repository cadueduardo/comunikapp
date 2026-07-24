"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { DollarSign, Plus, Search, List, Grid3X3 } from "lucide-react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { useIsMobile } from "@/hooks/use-media-query";
import { custosIndiretosApi } from "@/lib/api-client";
import { centrosTrabalhoModuleNav } from "@/lib/module-nav";
import { Badge } from "@/components/ui/badge";

interface CustoIndireto {
  id: string;
  nome: string;
  categoria: string;
  valor_mensal: number | string;
  observacoes?: string;
  ativo: boolean;
  criado_em?: string;
}

export default function CustosIndiretosCTPage() {
  const [registros, setRegistros] = useState<CustoIndireto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>("table");
  const [toDelete, setToDelete] = useState<CustoIndireto | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const data = await custosIndiretosApi.getAll(token);
        setRegistros(Array.isArray(data) ? data : []);
      } catch (e) {
        toast.error("Erro ao carregar custos indiretos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return registros.filter((c) =>
      (c.nome || '').toLowerCase().includes(term) ||
      (c.categoria || '').toLowerCase().includes(term)
    );
  }, [registros, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await custosIndiretosApi.delete(id, token);
      setRegistros((prev) => prev.filter((x) => x.id !== id));
      toast.success('Custo indireto excluído com sucesso');
    } catch (e) {
      toast.error('Erro ao excluir custo indireto');
    }
  };

  const columns: ColumnDef<CustoIndireto>[] = [
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'categoria', header: 'Categoria' },
    {
      accessorKey: 'valor_mensal',
      header: 'Valor Mensal',
      cell: ({ row }) => {
        const v = row.original.valor_mensal;
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return <span>R$ {isFinite(n as number) ? (n as number).toFixed(2) : '0,00'}</span>;
      },
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.ativo ? 'default' : 'secondary'}>
          {row.original.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/configuracoes/custos-indiretos/editar/${row.original.id}`}>
            <Button variant="outline" size="sm">Editar</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setToDelete(row.original)}>Excluir</Button>
        </div>
      ),
    },
  ];

  const header = (
    <ModuleHeader
      nav={centrosTrabalhoModuleNav}
      title="Custos Indiretos"
      subtitle="Administre custos indiretos mensais"
      icon={<DollarSign className="h-7 w-7" />}
      backHref="/centros-de-trabalho"
      actions={
        <Link href="/centros-de-trabalho/custos-indiretos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Custo Indireto
          </Button>
        </Link>
      }
    />
  );

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
          <h3 className="text-lg font-semibold mb-2">Nenhum custo indireto</h3>
          <p className="text-gray-600 mb-4">Cadastre seu primeiro custo indireto.</p>
          <Link href="/centros-de-trabalho/custos-indiretos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Custo
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const table = <DataTable<CustoIndireto, any> columns={columns} data={filtered} />;

  return (
    <div className="space-y-6">
      {header}
      {toolbar}
      {filtered.length ? (
        viewMode === 'table' ? (
          table
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{c.nome}</CardTitle>
                      <div className="text-xs text-gray-500 mt-1">{c.categoria}</div>
                    </div>
                    <Badge variant={c.ativo ? 'default' : 'secondary'}>{c.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Valor Mensal:</span><span>R$ {typeof c.valor_mensal === 'string' ? parseFloat(c.valor_mensal).toFixed(2) : Number(c.valor_mensal || 0).toFixed(2)}</span></div>
                    {c.observacoes && <div className="text-gray-600">{c.observacoes}</div>}
                    <div className="pt-3 border-t flex gap-2">
                      <Link href={`/centros-de-trabalho/custos-indiretos/editar/${c.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Editar</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => setToDelete(c)}>Excluir</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        emptyState
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir Custo Indireto"
        description={toDelete ? `Tem certeza que deseja excluir "${toDelete.nome}"? Esta ação não pode ser desfeita.` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { if (toDelete) { handleDelete(toDelete.id); setToDelete(null); } }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
