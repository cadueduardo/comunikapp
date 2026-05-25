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
import { formatTimeDisplay } from "@/components/ui/time-input";

interface ServicoManual {
  id: string;
  nome: string;
  tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'POR_PECA_COM_CATEGORIA' | 'MANUAL';
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
  custo_hora?: number | string;
  descricao?: string;
  ativo?: boolean;
  setup_min?: number | string;
  categorias?: Array<{nome: string; ate_m2: number; tempo_min: number}>;
}

export default function ServicosPage() {
  const [registros, setRegistros] = useState<ServicoManual[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>("table");
  const [toDelete, setToDelete] = useState<ServicoManual | null>(null);
  const [modalCategorias, setModalCategorias] = useState<ServicoManual | null>(null);
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
      case 'POR_PECA_COM_CATEGORIA':
        return 'Por peça com categoria';
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{mapTipoCalculo(row.original.tipo_calculo)}</span>
          {row.original.tipo_calculo === 'POR_PECA_COM_CATEGORIA' && row.original.categorias && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalCategorias(row.original)}
              className="text-xs"
            >
              Ver Categorias
            </Button>
          )}
        </div>
      ),
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
    <div className="space-y-6">
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
                    <div className="flex justify-between">
                      <span>Tipo:</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.tipo_calculo === 'MANUAL' ? 'secondary' : 'default'} className="text-xs">
                          {mapTipoCalculo(r.tipo_calculo)}
                        </Badge>
                        {r.tipo_calculo === 'POR_PECA_COM_CATEGORIA' && r.categorias && r.categorias.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalCategorias(r)}
                            className="text-xs h-6 px-2"
                          >
                            Ver Categorias
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {r.horas_por_m2 && (
                      <div className="flex justify-between">
                        <span>Horas/m²:</span>
                        <span className="font-mono">{formatTimeDisplay(r.horas_por_m2)}</span>
                      </div>
                    )}
                    
                    {r.horas_por_unidade && (
                      <div className="flex justify-between">
                        <span>Horas/Un:</span>
                        <span className="font-mono">{formatTimeDisplay(r.horas_por_unidade)}</span>
                      </div>
                    )}
                    
                    {r.eficiencia_percent && (
                      <div className="flex justify-between">
                        <span>Eficiência:</span>
                        <span>{Number(r.eficiencia_percent)}%</span>
                      </div>
                    )}
                    
                    {r.setup_min && (
                      <div className="flex justify-between">
                        <span>Setup:</span>
                        <span className="font-mono">{formatTimeDisplay(r.setup_min / 60)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between"><span>Custo/Hora:</span><span className="font-medium">R$ {typeof r.custo_hora === 'string' ? parseFloat(r.custo_hora).toFixed(2) : Number(r.custo_hora || 0).toFixed(2)}</span></div>
                    
                    {(() => { const ce = calcularCustoEstimado(r); return ce.valor != null ? (
                      <div className="flex justify-between"><span>Custo Estimado:</span><span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ce.valor)}{ce.label && <span className="text-xs text-gray-500"> / {ce.label}</span>}</span></div>
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

      {/* Modal de Categorias */}
      {modalCategorias && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categorias - {modalCategorias.nome}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Faixas de área e tempo configuradas</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalCategorias(null)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modalCategorias.categorias && modalCategorias.categorias.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 pb-2 border-b">
                    <div>Categoria</div>
                    <div>Até (m²)</div>
                    <div>Tempo</div>
                  </div>
                  {modalCategorias.categorias.map((cat, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-medium">{cat.nome}</div>
                      <div>{cat.ate_m2.toFixed(1)}m²</div>
                      <div>{Math.floor(cat.tempo_min / 60).toString().padStart(2, '0')}:{Math.round(cat.tempo_min % 60).toString().padStart(2, '0')}</div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <p className="font-medium">Como funciona:</p>
                    <p>O sistema seleciona automaticamente a categoria baseada na área individual da peça e aplica o tempo correspondente multiplicado pela quantidade.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma categoria configurada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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


