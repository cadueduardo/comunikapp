"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, List, Grid3X3, Users } from "lucide-react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { useIsMobile } from "@/hooks/use-media-query";
import { funcoesApi } from "@/lib/api-client";
import { centrosTrabalhoModuleNav } from "@/lib/module-nav";
import { formatTimeDisplay } from "@/components/ui/time-input";

interface Funcao {
  id: string;
  nome: string;
  custo_hora: number | string;
  descricao?: string;
  maquina?: { nome: string } | null;
  criado_em?: string;
  ativo?: boolean;
  // Campos do Centro de Trabalho
  tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'MANUAL';
  fator_acompanhamento?: number | string;
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
  setup_min?: number | string;
}

export default function FuncoesCTPage() {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>("table");
  const [toDelete, setToDelete] = useState<Funcao | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const data = await funcoesApi.getAll(token);
        setFuncoes(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Erro ao carregar funções");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return funcoes.filter((f) =>
      (f.nome || '').toLowerCase().includes(term) ||
      (f.maquina?.nome || '').toLowerCase().includes(term)
    );
  }, [funcoes, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await funcoesApi.delete(id, token);
      setFuncoes((prev) => prev.filter((x) => x.id !== id));
      toast.success('Função excluída com sucesso');
    } catch {
      toast.error('Erro ao excluir função');
    }
  };

  const columns: ColumnDef<Funcao>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.nome}</div>
      ),
    },
    {
      accessorKey: 'tipo_calculo',
      header: 'Tipo de Cálculo',
      cell: ({ row }) => {
        const tipo = row.original.tipo_calculo;
        const tipoTexto = {
          'ACOMPANHA_MAQUINA': 'Acompanha Máquina',
          'POR_M2': 'Por m²',
          'POR_UNIDADE': 'Por unidade',
          'MANUAL': 'Manual'
        }[tipo || 'MANUAL'] || 'Manual';
        
        return (
          <Badge variant={tipo === 'MANUAL' ? 'secondary' : 'default'} className="text-xs">
            {tipoTexto}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'horas_por_m2',
      header: 'Horas/m²',
      cell: ({ row }) => {
        const horas = row.original.horas_por_m2;
        return (
          <span className="text-sm font-mono">
            {horas ? formatTimeDisplay(horas) : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'horas_por_unidade',
      header: 'Horas/Un',
      cell: ({ row }) => {
        const horas = row.original.horas_por_unidade;
        return (
          <span className="text-sm font-mono">
            {horas ? formatTimeDisplay(horas) : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'eficiencia_percent',
      header: 'Eficiência',
      cell: ({ row }) => {
        const eff = row.original.eficiencia_percent;
        return (
          <span className="text-sm">
            {eff ? `${Number(eff)}%` : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'setup_min',
      header: 'Setup',
      cell: ({ row }) => {
        const setup = row.original.setup_min;
        return (
          <span className="text-sm font-mono">
            {setup ? formatTimeDisplay(Number(setup) / 60) : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'maquina',
      header: 'Máquina',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.maquina?.nome || '—'}</span>
      ),
    },
    {
      accessorKey: 'custo_hora',
      header: 'Custo/Hora',
      cell: ({ row }) => {
        const v = row.original.custo_hora;
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return <span className="font-medium">R$ {isFinite(n as number) ? (n as number).toFixed(2) : '0,00'}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/centros-de-trabalho/funcoes/editar/${row.original.id}`}>
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
      title="Funções"
      subtitle="Gerencie funções de trabalho e seus custos"
      icon={<Users className="h-7 w-7" />}
      backHref="/centros-de-trabalho"
      actions={
        <Link href="/centros-de-trabalho/funcoes/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Função
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
          placeholder="Buscar por nome ou máquina..."
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
          <h3 className="text-lg font-semibold mb-2">Nenhuma função cadastrada</h3>
          <p className="text-gray-600 mb-4">Cadastre sua primeira função.</p>
          <Link href="/centros-de-trabalho/funcoes/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Função
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const table = <DataTable<Funcao, unknown> columns={columns} data={filtered} />;

  return (
    <div className="space-y-6">
      {header}
      {toolbar}
      {filtered.length ? (
        viewMode === 'table' ? (
          table
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f) => (
              <Card key={f.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{f.nome}</CardTitle>
                      {f.maquina?.nome && (
                        <div className="text-xs text-gray-500 mt-1">Máquina: {f.maquina.nome}</div>
                      )}
                    </div>
                    {f.ativo !== undefined && (
                      <Badge variant={f.ativo ? 'default' : 'secondary'}>{f.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Tipo:</span>
                      <Badge variant={f.tipo_calculo === 'MANUAL' ? 'secondary' : 'default'} className="text-xs">
                        {{
                          'ACOMPANHA_MAQUINA': 'Acompanha Máquina',
                          'POR_M2': 'Por m²',
                          'POR_UNIDADE': 'Por unidade',
                          'MANUAL': 'Manual'
                        }[f.tipo_calculo || 'MANUAL'] || 'Manual'}
                      </Badge>
                    </div>
                    
                    {f.horas_por_m2 && (
                      <div className="flex justify-between">
                        <span>Horas/m²:</span>
                        <span className="font-mono">{formatTimeDisplay(f.horas_por_m2)}</span>
                      </div>
                    )}
                    
                    {f.horas_por_unidade && (
                      <div className="flex justify-between">
                        <span>Horas/Un:</span>
                        <span className="font-mono">{formatTimeDisplay(f.horas_por_unidade)}</span>
                      </div>
                    )}
                    
                    {f.eficiencia_percent && (
                      <div className="flex justify-between">
                        <span>Eficiência:</span>
                        <span>{Number(f.eficiencia_percent)}%</span>
                      </div>
                    )}
                    
                    {f.setup_min && (
                      <div className="flex justify-between">
                        <span>Setup:</span>
                        <span className="font-mono">{formatTimeDisplay(Number(f.setup_min) / 60)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between"><span>Custo/Hora:</span><span className="font-medium">R$ {typeof f.custo_hora === 'string' ? parseFloat(f.custo_hora).toFixed(2) : Number(f.custo_hora || 0).toFixed(2)}</span></div>
                    
                    {f.descricao && (
                      <div className="text-gray-600 pt-2 border-t">{f.descricao}</div>
                    )}
                    
                    <div className="pt-3 border-t flex gap-2">
                      <Link href={`/centros-de-trabalho/funcoes/editar/${f.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Editar</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => setToDelete(f)}>Excluir</Button>
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
        title="Excluir Função"
        description={toDelete ? `Tem certeza que deseja excluir a função "${toDelete.nome}"? Esta ação não pode ser desfeita.` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { if (toDelete) { handleDelete(toDelete.id); setToDelete(null); } }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
