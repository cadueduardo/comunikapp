"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CrudPage } from "@/components/crud/CrudPage";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Plus, Trash2, List, Grid3X3, Search, Wrench, ArrowLeft } from "lucide-react";
import { maquinasApi } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useIsMobile } from "@/hooks/use-media-query";
import { toast } from "sonner";

type Maquina = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  custo_hora: number | string;
  capacidade?: string;
  observacoes?: string;
  modo_producao?: "M2_H" | "ML_H" | "MANUAL" | null;
  setup_min?: number | string | null;
  velocidade_m2_h?: number | string | null;
  eficiencia_percent?: number | string | null;
};

const statusLabels: Record<string, string> = {
  ATIVA: "Ativa",
  MANUTENCAO: "Manutenção",
  INATIVA: "Inativa",
};

const statusColors: Record<string, string> = {
  ATIVA: "bg-green-100 text-green-800",
  MANUTENCAO: "bg-yellow-100 text-yellow-800",
  INATIVA: "bg-red-100 text-red-800",
};

export default function MaquinasCTPage() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toDelete, setToDelete] = useState<Maquina | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const data = await maquinasApi.getAll(token);
        setMaquinas(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return maquinas.filter((m) =>
      (m.nome || '').toLowerCase().includes(term) ||
      (m.tipo || '').toLowerCase().includes(term) ||
      (m.modo_producao || '').toString().toLowerCase().includes(term)
    );
  }, [maquinas, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await maquinasApi.delete(id, token);
      setMaquinas((prev) => prev.filter((x) => x.id !== id));
      toast.success('Máquina excluída com sucesso');
    } catch (e) {
      toast.error('Erro ao excluir máquina');
    }
  };

  const columns = useMemo<ColumnDef<Maquina>[]>(
    () => [
      {
        header: "Nome",
        accessorKey: "nome",
        cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
      },
      {
        header: "Tipo",
        accessorKey: "tipo",
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <Badge className={statusColors[row.original.status] || "bg-muted"}>
            {statusLabels[row.original.status] || row.original.status}
          </Badge>
        ),
      },
      {
        header: "Modo",
        accessorKey: "modo_producao",
        cell: ({ row }) => row.original.modo_producao || "—",
      },
      {
        header: "Veloc.(m²/h)",
        accessorKey: "velocidade_m2_h",
        cell: ({ row }) => (row.original.velocidade_m2_h ? Number(row.original.velocidade_m2_h).toFixed(2) : "—"),
      },
      {
        header: "Eficiência(%)",
        accessorKey: "eficiencia_percent",
        cell: ({ row }) => (row.original.eficiencia_percent ? Number(row.original.eficiencia_percent).toFixed(0) : "—"),
      },
      {
        header: "Setup(min)",
        accessorKey: "setup_min",
        cell: ({ row }) => (row.original.setup_min ? Number(row.original.setup_min).toFixed(0) : "—"),
      },
      {
        header: "Custo/Hora",
        accessorKey: "custo_hora",
        cell: ({ row }) => `R$ ${Number(row.original.custo_hora).toFixed(2)}`,
      },
      {
        header: "Ações",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Link href={`/centros-de-trabalho/maquinas/editar/${row.original.id}`}>
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
    []
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
          <Wrench className="h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold">Máquinas</h1>
            <p className="text-gray-600 mt-1">Gerencie máquinas e modos de impressão</p>
          </div>
        </div>
      </div>
      <Link href="/centros-de-trabalho/maquinas/novo">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Máquina
        </Button>
      </Link>
    </div>
  );

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, tipo ou modo..."
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

  const table = <DataTable<Maquina, any> columns={columns} data={filtered} />;

  const emptyState = (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhuma máquina cadastrada</h3>
          <p className="text-gray-600 mb-4">Cadastre sua primeira máquina.</p>
          <Link href="/centros-de-trabalho/maquinas/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Máquinas
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <CrudPage
        header={header}
        toolbar={toolbar}
        table={filtered.length ? (
          viewMode === 'table' ? (
            table
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <Card key={m.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{m.nome}</CardTitle>
                        <div className="text-sm text-gray-500 mt-1">
                          <div className="font-medium">{m.tipo}</div>
                          <div className="text-xs text-gray-400">Modo: {m.modo_producao || '—'}</div>
                        </div>
                      </div>
                      <Badge className={statusColors[m.status] || 'bg-muted'}>
                        {statusLabels[m.status] || m.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span>Veloc.(m²/h):</span><span>{m.velocidade_m2_h ? Number(m.velocidade_m2_h).toFixed(2) : '—'}</span></div>
                      <div className="flex justify-between"><span>Eficiência(%):</span><span>{m.eficiencia_percent ? Number(m.eficiencia_percent).toFixed(0) : '—'}</span></div>
                      <div className="flex justify-between"><span>Setup(min):</span><span>{m.setup_min ? Number(m.setup_min).toFixed(0) : '—'}</span></div>
                      <div className="flex justify-between"><span>Custo/Hora:</span><span>R$ {Number(m.custo_hora).toFixed(2)}</span></div>
                      <div className="pt-3 border-t flex gap-2">
                        <Link href={`/centros-de-trabalho/maquinas/editar/${m.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">Editar</Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => setToDelete(m)}>Excluir</Button>
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
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir Máquina"
        description={toDelete ? `Tem certeza que deseja excluir a máquina "${toDelete.nome}"? Esta ação não pode ser desfeita.` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { if (toDelete) { handleDelete(toDelete.id); setToDelete(null); } }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}



