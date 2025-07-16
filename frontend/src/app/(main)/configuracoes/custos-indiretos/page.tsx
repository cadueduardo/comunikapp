'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, DollarSign, Building2, Wrench, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface CustoIndireto {
  id: string;
  nome: string;
  valor_mensal: number | { toString(): string };
  categoria: 'LOCACAO' | 'SERVICOS' | 'MANUTENCAO' | 'OUTROS';
  ativo: boolean;
  regra_rateio: 'PROPORCIONAL_TEMPO' | 'PROPORCIONAL_VALOR' | 'FIXO';
  observacoes?: string;
  criado_em: string;
}

const categoriaIcons = {
  LOCACAO: Building2,
  SERVICOS: DollarSign,
  MANUTENCAO: Wrench,
  OUTROS: Package,
};

const categoriaLabels = {
  LOCACAO: 'Locação',
  SERVICOS: 'Serviços',
  MANUTENCAO: 'Manutenção',
  OUTROS: 'Outros',
};

const regraRateioLabels = {
  PROPORCIONAL_TEMPO: 'Proporcional ao Tempo',
  PROPORCIONAL_VALOR: 'Proporcional ao Valor',
  FIXO: 'Valor Fixo',
};

export default function CustosIndiretosPage() {
  const [custosIndiretos, setCustosIndiretos] = useState<CustoIndireto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    custoId: string | null;
    custoNome: string;
  }>({
    open: false,
    custoId: null,
    custoNome: '',
  });

  const fetchCustosIndiretos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/custos-indiretos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCustosIndiretos(data);
      } else {
        toast.error('Erro ao carregar custos indiretos');
      }
    } catch (error) {
      console.error('Erro ao buscar custos indiretos:', error);
      toast.error('Erro ao carregar custos indiretos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/custos-indiretos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Custo indireto excluído com sucesso!');
        fetchCustosIndiretos();
      } else {
        // Tenta ler a mensagem de erro do backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erro ao excluir custo indireto';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao excluir custo indireto:', error);
      toast.error('Erro ao excluir custo indireto');
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      custoId: id,
      custoNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      custoId: null,
      custoNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.custoId) {
      await handleDelete(deleteDialog.custoId);
      closeDeleteDialog();
    }
  };

  const getCustosPorCategoria = () => {
    const categorias: Record<string, CustoIndireto[]> = {};
    custosIndiretos.forEach(custo => {
      if (!categorias[custo.categoria]) {
        categorias[custo.categoria] = [];
      }
      categorias[custo.categoria].push(custo);
    });
    return categorias;
  };

  const getTotalMensal = () => {
    const total = custosIndiretos
      .filter(custo => custo.ativo)
      .reduce((total, custo) => total + Number(custo.valor_mensal || 0), 0);
    return Number.isFinite(total) ? total : 0;
  };

  useEffect(() => {
    fetchCustosIndiretos();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Custos Indiretos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os custos indiretos e suas regras de rateio.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const custosPorCategoria = getCustosPorCategoria();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Custos Indiretos</h1>
        <p className="text-gray-600 mt-1">
          Gerencie os custos indiretos e suas regras de rateio.
        </p>
      </div>

      <div className="mb-6">
        <Link href="/configuracoes/custos-indiretos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Custo Indireto
          </Button>
        </Link>
      </div>

      {custosIndiretos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">Nenhum custo indireto cadastrado.</p>
            <Link href="/configuracoes/custos-indiretos/novo">
              <Button>Cadastrar Primeiro Custo Indireto</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumo dos Custos Indiretos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Mensal</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(getTotalMensal())}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Custos Ativos</p>
                  <p className="text-2xl font-bold">
                    {custosIndiretos.filter(c => c.ativo).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Categorias</p>
                  <p className="text-2xl font-bold">
                    {Object.keys(custosPorCategoria).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custos por Categoria */}
          {Object.entries(custosPorCategoria).map(([categoria, custos]) => {
            const IconComponent = categoriaIcons[categoria as keyof typeof categoriaIcons];
            const totalCategoria = (custos as CustoIndireto[]).reduce((sum, custo) => sum + Number(custo.valor_mensal || 0), 0);

            return (
              <Card key={categoria}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {categoriaLabels[categoria as keyof typeof categoriaLabels]}
                    <Badge variant="secondary">
                      {formatCurrency(totalCategoria)}/mês
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(custos as CustoIndireto[]).map((custo) => (
                      <div key={custo.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{custo.nome}</h3>
                          <div className="flex space-x-2">
                            <Link href={`/configuracoes/custos-indiretos/editar/${custo.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(custo.id, custo.nome)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Valor Mensal:</span>
                            <span className="font-semibold">
                              {formatCurrency(Number(custo.valor_mensal))}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Regra de Rateio:</span>
                                                         <span className="text-sm">
                               {regraRateioLabels[custo.regra_rateio as keyof typeof regraRateioLabels]}
                             </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Status:</span>
                            <Badge variant={custo.ativo ? "default" : "secondary"}>
                              {custo.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          
                          {custo.observacoes && (
                            <div className="text-sm text-gray-600 mt-2">
                              {custo.observacoes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Custo Indireto"
        description={`Tem certeza que deseja excluir o custo indireto "${deleteDialog.custoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
} 