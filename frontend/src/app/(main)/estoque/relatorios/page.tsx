'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  AlertTriangle, 
  Clock, 
  Package, 
  TrendingDown, 
  TrendingUp,
  Download,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';

interface RelatorioBaixo {
  id: string;
  insumoNome: string;
  localizacaoCodigo: string;
  quantidadeAtual: number;
  estoqueMinimo: number;
  unidadeCompra: string;
  valorUnitario: number;
  diasSemMovimentacao: number;
}

interface RelatorioVencimento {
  id: string;
  insumoNome: string;
  localizacaoCodigo: string;
  numeroLote: string;
  dataValidade: string;
  diasRestantes: number;
  quantidadeLote: number;
  unidadeCompra: string;
}

interface RelatorioOcupacao {
  deposito: string;
  totalLocalizacoes: number;
  localizacoesOcupadas: number;
  localizacoesVazias: number;
  taxaOcupacao: number;
  capacidadeTotal: number;
  capacidadeUtilizada: number;
}

export default function RelatoriosPage() {
  const { user, loading: userLoading } = useUser();
  const [relatorioBaixo, setRelatorioBaixo] = useState<RelatorioBaixo[]>([]);
  const [relatorioVencimento, setRelatorioVencimento] = useState<RelatorioVencimento[]>([]);
  const [relatorioOcupacao, setRelatorioOcupacao] = useState<RelatorioOcupacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'baixo' | 'vencimento' | 'ocupacao'>('baixo');

  const fetchRelatorios = async () => {
    setLoading(true);
    try {
      const [responseBaixo, responseVencimento, responseOcupacao] = await Promise.all([
        apiRequest('/api/estoque/relatorios/baixo'),
        apiRequest('/api/estoque/relatorios/vencimento'),
        apiRequest('/api/estoque/relatorios/ocupacao'),
      ]);

      if (responseBaixo.ok) {
        const dataBaixo = await responseBaixo.json();
        setRelatorioBaixo(dataBaixo.data || dataBaixo);
      }

      if (responseVencimento.ok) {
        const dataVencimento = await responseVencimento.json();
        setRelatorioVencimento(dataVencimento.data || dataVencimento);
      }

      if (responseOcupacao.ok) {
        const dataOcupacao = await responseOcupacao.json();
        setRelatorioOcupacao(dataOcupacao.data || dataOcupacao);
      }

    } catch (error) {
      toast.error("Erro ao carregar relatórios");
      console.error("Erro ao carregar relatórios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user) {
      fetchRelatorios();
    }
  }, [userLoading, user]);

  const handleRefresh = async () => {
    await fetchRelatorios();
    toast.success('Relatórios atualizados!');
  };

  const handleExport = (tipo: string) => {
    // Implementar exportação para CSV/Excel
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusVencimento = (diasRestantes: number) => {
    if (diasRestantes <= 0) return { status: 'VENCIDO', variant: 'destructive' as const };
    if (diasRestantes <= 7) return { status: 'CRÍTICO', variant: 'destructive' as const };
    if (diasRestantes <= 30) return { status: 'ATENÇÃO', variant: 'secondary' as const };
    return { status: 'NORMAL', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Relatórios de Estoque
            </h1>
            <p className="text-gray-600 mt-1">
              Visualize relatórios detalhados do seu estoque
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => handleExport(activeTab)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('baixo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'baixo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Estoque Baixo
              <Badge variant="secondary">{relatorioBaixo.length}</Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('vencimento')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vencimento'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Próximo Vencimento
              <Badge variant="secondary">{relatorioVencimento.length}</Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ocupacao')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ocupacao'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ocupação por Depósito
              <Badge variant="secondary">{relatorioOcupacao.length}</Badge>
            </div>
          </button>
        </nav>
      </div>

      {/* Conteúdo dos Relatórios */}
      {activeTab === 'baixo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{relatorioBaixo.length}</div>
                <p className="text-xs text-muted-foreground">
                  Itens com estoque baixo
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(relatorioBaixo.reduce((sum, item) => sum + (item.valorUnitario * item.quantidadeAtual), 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor em estoque baixo
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média de Dias</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {relatorioBaixo.length > 0 
                    ? Math.round(relatorioBaixo.reduce((sum, item) => sum + item.diasSemMovimentacao, 0) / relatorioBaixo.length)
                    : 0
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Dias sem movimentação
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estoque Mínimo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Unitário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dias Sem Mov.
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorioBaixo.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.insumoNome}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.localizacaoCodigo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600 font-medium">
                          {item.quantidadeAtual} {item.unidadeCompra}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.estoqueMinimo} {item.unidadeCompra}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(item.valorUnitario)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.diasSemMovimentacao} dias
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vencimento' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{relatorioVencimento.length}</div>
                <p className="text-xs text-muted-foreground">
                  Lotes próximos do vencimento
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {relatorioVencimento.filter(item => item.diasRestantes <= 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lotes vencidos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Críticos</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {relatorioVencimento.filter(item => item.diasRestantes > 0 && item.diasRestantes <= 7).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vencem em 7 dias
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dias Restantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorioVencimento.map((item) => {
                    const { status, variant } = getStatusVencimento(item.diasRestantes);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.insumoNome}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.localizacaoCodigo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.numeroLote}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(item.dataValidade).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {item.diasRestantes <= 0 ? 'Vencido' : `${item.diasRestantes} dias`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.quantidadeLote} {item.unidadeCompra}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={variant}>{status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ocupacao' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Depósitos</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{relatorioOcupacao.length}</div>
                <p className="text-xs text-muted-foreground">
                  Depósitos ativos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {relatorioOcupacao.length > 0 
                    ? Math.round(relatorioOcupacao.reduce((sum, item) => sum + item.taxaOcupacao, 0) / relatorioOcupacao.length)
                    : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Ocupação média
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Localizações</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {relatorioOcupacao.reduce((sum, item) => sum + item.totalLocalizacoes, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de localizações
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatorioOcupacao.map((deposito) => (
              <Card key={deposito.deposito}>
                <CardHeader>
                  <CardTitle className="text-lg">{deposito.deposito}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Localizações:</span>
                      <span className="text-sm font-medium">
                        {deposito.localizacoesOcupadas}/{deposito.totalLocalizacoes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taxa de Ocupação:</span>
                      <span className="text-sm font-medium text-green-600">
                        {deposito.taxaOcupacao}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capacidade:</span>
                      <span className="text-sm font-medium">
                        {deposito.capacidadeUtilizada}/{deposito.capacidadeTotal}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${deposito.taxaOcupacao}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {((activeTab === 'baixo' && relatorioBaixo.length === 0) ||
        (activeTab === 'vencimento' && relatorioVencimento.length === 0) ||
        (activeTab === 'ocupacao' && relatorioOcupacao.length === 0)) && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Não há dados para exibir neste relatório
          </p>
        </div>
      )}
    </div>
  );
}
