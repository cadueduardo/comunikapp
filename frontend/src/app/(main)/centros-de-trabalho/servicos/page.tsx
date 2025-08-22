'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Wrench, Plus, Search, List, Grid3X3, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-media-query";
import { servicosManuaisApi } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

interface ServicoManual {
  id: string;
  nome: string;
  tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'MANUAL';
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
  custo_hora?: number | string;
  descricao?: string;
  ativo?: boolean;
}

export default function ServicosPage() {
  const [registros, setRegistros] = useState<ServicoManual[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>("table");
  const [toDelete, setToDelete] = useState<ServicoManual | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const data = await servicosManuaisApi.getAll(token);
        setRegistros(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Erro ao carregar serviços manuais");
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return registros.filter((r) => (r.nome || '').toLowerCase().includes(t));
  }, [registros, searchTerm]);

  const toNumber = (v: any): number => {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    const unified = String(v).trim().replace(/\s+/g, '').replace(',', '.');
    const clean = unified.replace(/[^0-9.\-]/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const calcularCustoEstimado = (r: ServicoManual): { label: string; valor: number | null } => {
    const ch = toNumber(r.custo_hora);
    const eff = Math.max(toNumber(r.eficiencia_percent) / 100 || 1, 0.01);
    if (r.tipo_calculo === 'POR_M2') {
      const hm2 = toNumber(r.horas_por_m2);
      return { label: 'm²', valor: ch * (hm2 / eff) };
    }
    if (r.tipo_calculo === 'POR_UNIDADE') {
      const hun = toNumber(r.horas_por_unidade);
      return { label: 'un', valor: ch * (hun / eff) };
    }
    return { label: '', valor: null };
  };

  const mapTipoCalculo = (v?: ServicoManual['tipo_calculo']) => {
    switch (v) {
      case 'POR_M2':
        return 'Por m²';
      case 'POR_UNIDADE':
        return 'Por unidade';
      case 'ACOMPANHA_MAQUINA':
        return 'Acompanha máquina';
      case 'MANUAL':
        return 'Manual';
      default:
        return '—';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await servicosManuaisApi.delete(id, token);
      setRegistros((prev) => prev.filter((x) => x.id !== id));
      toast.success('Serviço manual excluído com sucesso');
    } catch {
      toast.error('Erro ao excluir serviço manual');
    }
  };

  const columns: ColumnDef<ServicoManual>[] = [
    { accessorKey: 'nome', header: 'Nome' },
    {
      accessorKey: 'custo_hora',
      header: 'Custo/Hora',
      cell: ({ row }) => {
        const v = row.original.custo_hora as any;
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return <span>R$ {isFinite(n as number) ? (n as number).toFixed(2) : '0,00'}</span>;
      },
    },
    {
      id: 'tipo_calculo',
      header: 'Tipo de Cálculo',
      cell: ({ row }) => <span>{mapTipoCalculo(row.original.tipo_calculo)}</span>,
    },
    {
      id: 'custo_estimado',
      header: 'Custo Estimado',
      cell: ({ row }) => {
        const { label, valor } = calcularCustoEstimado(row.original);
        return valor != null
          ? <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}{label && <span className="text-xs text-gray-500"> / {label}</span>}</span>
          : <span className="text-gray-400">—</span>;
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right w-full">Ações</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2 w-full">
          <Link href={`/centros-de-trabalho/servicos/editar/${row.original.id}`}>
            <Button variant="outline" size="sm">Editar</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setToDelete(row.original)}>Excluir</Button>
        </div>
      ),
    },
  ];

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
            <h1 className="text-3xl font-bold">Serviços Manuais</h1>
            <p className="text-gray-600 mt-1">Defina serviços manuais e seus parâmetros de cálculo</p>
          </div>
        </div>
      </div>
      <Link href="/centros-de-trabalho/servicos/novo">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </Link>
    </div>
  );

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>
      {!isMobile && (
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>
            <List className="h-4 w-4 mr-2" />
            Tabela
          </Button>
          <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')}>
            <Grid3X3 className="h-4 w-4 mr-2" />
            Cards
          </Button>
        </div>
      )}
    </div>
  );

  const table = <DataTable<ServicoManual, unknown> columns={columns} data={filtered} />;

  const emptyState = (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhum serviço manual</h3>
          <p className="text-gray-600 mb-4">Cadastre seu primeiro serviço.</p>
          <Link href="/centros-de-trabalho/servicos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Serviço
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {header}
      {toolbar}
      {filtered.length ? (
        viewMode === 'table' ? (
          table
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{r.nome}</CardTitle>
                      <div className="text-xs text-gray-500 mt-1">{mapTipoCalculo(r.tipo_calculo)}</div>
                    </div>
                    {r.ativo !== undefined && (
                      <Badge variant={r.ativo ? 'default' : 'secondary'}>{r.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Custo/Hora:</span><span>R$ {typeof r.custo_hora === 'string' ? parseFloat(r.custo_hora).toFixed(2) : Number(r.custo_hora || 0).toFixed(2)}</span></div>
                    {(() => { const ce = calcularCustoEstimado(r); return ce.valor != null ? (
                      <div className="flex justify-between"><span>Custo Estimado:</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ce.valor)}{ce.label && <span className="text-xs text-gray-500"> / {ce.label}</span>}</span></div>
                    ) : null; })()}
                    <div className="pt-3 border-t flex gap-2">
                      <Link href={`/centros-de-trabalho/servicos/editar/${r.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Editar</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => setToDelete(r)}>Excluir</Button>
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
        title="Excluir Serviço Manual"
        description={toDelete ? `Tem certeza que deseja excluir "${toDelete.nome}"?` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { if (toDelete) { handleDelete(toDelete.id); setToDelete(null); } }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}


