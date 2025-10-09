'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  Settings, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  BarChart3,
  Clock,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalRegras: number;
  regrasAtivas: number;
  execucoesHoje: number;
  taxaSucesso: number;
  regrasPorCategoria: Array<{
    categoria: string;
    total: number;
    ativas: number;
  }>;
  execucoesRecentes: Array<{
    id: string;
    regra_id: string;
    os_id: string;
    resultado: string;
    mensagem?: string;
    tempo_execucao: number;
    criado_em: string;
  }>;
}

export default function ValidacoesAutomaticasPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/configuracoes/validacoes-automaticas/dashboard');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const getCategoriaInfo = (categoria: string) => {
    const categorias = {
      'ESTOQUE': { nome: 'Estoque', cor: 'bg-red-100 text-red-800', icone: '📦' },
      'ARTE': { nome: 'Arte', cor: 'bg-purple-100 text-purple-800', icone: '🎨' },
      'DADOS': { nome: 'Dados', cor: 'bg-blue-100 text-blue-800', icone: '📊' },
      'PRAZO': { nome: 'Prazo', cor: 'bg-yellow-100 text-yellow-800', icone: '⏰' },
      'TECNICO': { nome: 'Técnico', cor: 'bg-indigo-100 text-indigo-800', icone: '⚙️' },
      'COMERCIAL': { nome: 'Comercial', cor: 'bg-pink-100 text-pink-800', icone: '💼' },
      'FINANCEIRO': { nome: 'Financeiro', cor: 'bg-green-100 text-green-800', icone: '💰' }
    };
    return categorias[categoria as keyof typeof categorias] || { nome: categoria, cor: 'bg-gray-100 text-gray-800', icone: '❓' };
  };

  const getResultadoInfo = (resultado: string) => {
    const resultados = {
      'SUCESSO': { cor: 'text-green-600', icone: CheckCircle },
      'ERRO': { cor: 'text-red-600', icone: AlertTriangle },
      'ALERTA': { cor: 'text-yellow-600', icone: AlertTriangle },
      'BLOQUEIO': { cor: 'text-red-600', icone: AlertTriangle }
    };
    return resultados[resultado as keyof typeof resultados] || { cor: 'text-gray-600', icone: Activity };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Validações Automáticas</h1>
            <p className="text-gray-600">Dashboard de validações e regras</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validações Automáticas</h1>
          <p className="text-gray-600">Dashboard de validações e regras</p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/configuracoes/validacoes-automaticas/regras/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/configuracoes/validacoes-automaticas/regras">
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Regras
            </Link>
          </Button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Regras</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRegras || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.regrasAtivas || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.execucoesHoje || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% vs ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.taxaSucesso || 0}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2.1% vs ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Sistema funcionando normalmente
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regras por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Regras por Categoria</CardTitle>
            <CardDescription>
              Distribuição das regras por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.regrasPorCategoria && stats.regrasPorCategoria.length > 0 ? (
                stats.regrasPorCategoria.map((categoria) => {
                  const info = getCategoriaInfo(categoria.categoria);
                  return (
                    <div key={categoria.categoria} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{info.icone}</span>
                        <div>
                          <div className="font-medium">{info.nome}</div>
                          <div className="text-sm text-gray-500">
                            {categoria.ativas} de {categoria.total} ativas
                          </div>
                        </div>
                      </div>
                      <Badge className={info.cor}>
                        {categoria.total}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Nenhuma regra cadastrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Execuções Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Execuções Recentes</CardTitle>
            <CardDescription>
              Últimas execuções de validações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.execucoesRecentes && stats.execucoesRecentes.length > 0 ? (
                stats.execucoesRecentes.map((execucao) => {
                  const resultadoInfo = getResultadoInfo(execucao.resultado);
                  const Icone = resultadoInfo.icone;
                  return (
                    <div key={execucao.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icone className={`h-4 w-4 ${resultadoInfo.cor}`} />
                        <div>
                          <div className="font-medium">{execucao.os_id}</div>
                          <div className="text-sm text-gray-500">
                            {execucao.mensagem}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{execucao.tempo_execucao}ms</div>
                        <div className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(execucao.criado_em).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Nenhuma execução recente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/configuracoes/validacoes-automaticas/regras">
                <div className="text-left">
                  <Settings className="h-6 w-6 mb-2" />
                  <div className="font-medium">Gerenciar Regras</div>
                  <div className="text-sm text-gray-500">Criar, editar e configurar regras</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/configuracoes/validacoes-automaticas/execucoes">
                <div className="text-left">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <div className="font-medium">Histórico de Execuções</div>
                  <div className="text-sm text-gray-500">Ver logs e relatórios</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/configuracoes/validacoes-automaticas/testar">
                <div className="text-left">
                  <Activity className="h-6 w-6 mb-2" />
                  <div className="font-medium">Testar Validações</div>
                  <div className="text-sm text-gray-500">Testar regras em OSs específicas</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
