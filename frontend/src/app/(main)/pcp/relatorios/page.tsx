'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IconChartBar, 
  IconDownload,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconUsers,
  IconBuilding
} from '@tabler/icons-react';

export default function RelatoriosPage() {
  const relatorios = [
    {
      id: '1',
      nome: 'Eficiência por Etapa',
      descricao: 'Análise de eficiência de cada etapa do workflow',
      tipo: 'performance',
      dados: {
        total_etapas: 15,
        eficiencia_media: 87.5,
        tendencia: 'up',
        variacao: '+5.2%'
      }
    },
    {
      id: '2',
      nome: 'Tempo Médio de Produção',
      descricao: 'Tempo médio gasto em cada tipo de produto',
      tipo: 'tempo',
      dados: {
        tempo_medio: 4.5,
        unidade: 'horas',
        tendencia: 'down',
        variacao: '-12%'
      }
    },
    {
      id: '3',
      nome: 'Apontamentos por Usuário',
      descricao: 'Quantidade de apontamentos realizados por usuário',
      tipo: 'usuarios',
      dados: {
        total_usuarios: 8,
        apontamentos_por_usuario: 12.5,
        tendencia: 'up',
        variacao: '+8%'
      }
    },
    {
      id: '4',
      nome: 'Refugo e Qualidade',
      descricao: 'Análise de refugo e indicadores de qualidade',
      tipo: 'qualidade',
      dados: {
        taxa_refugo: 2.3,
        unidade: '%',
        tendencia: 'down',
        variacao: '-15%'
      }
    }
  ];

  const getTendenciaIcon = (tendencia: string) => {
    return tendencia === 'up' ? 
      <IconTrendingUp className="h-4 w-4 text-green-600" /> : 
      <IconTrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTendenciaColor = (tendencia: string) => {
    return tendencia === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'performance':
        return <IconChartBar className="h-6 w-6" />;
      case 'tempo':
        return <IconClock className="h-6 w-6" />;
      case 'usuarios':
        return <IconUsers className="h-6 w-6" />;
      case 'qualidade':
        return <IconBuilding className="h-6 w-6" />;
      default:
        return <IconChartBar className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios PCP
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Análise e relatórios de produção
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <IconCalendar className="h-4 w-4 mr-2" />
            Filtrar Período
          </Button>
          <Button>
            <IconDownload className="h-4 w-4 mr-2" />
            Exportar Todos
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Média</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-green-600 flex items-center">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              +5.2% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5h</div>
            <p className="text-xs text-green-600 flex items-center">
              <IconTrendingDown className="h-3 w-3 mr-1" />
              -12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apontamentos</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-green-600 flex items-center">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              +8% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Refugo</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3%</div>
            <p className="text-xs text-green-600 flex items-center">
              <IconTrendingDown className="h-3 w-3 mr-1" />
              -15% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relatorios.map((relatorio) => (
          <Card key={relatorio.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTipoIcon(relatorio.tipo)}
                  <div>
                    <CardTitle className="text-xl">{relatorio.nome}</CardTitle>
                    <CardDescription>{relatorio.descricao}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <IconDownload className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      {relatorio.tipo === 'performance' ? 'Etapas Analisadas' :
                       relatorio.tipo === 'tempo' ? 'Tempo Médio' :
                       relatorio.tipo === 'usuarios' ? 'Usuários Ativos' :
                       'Taxa de Refugo'}
                    </div>
                    <div className="text-2xl font-bold">
                      {relatorio.dados.total_etapas || relatorio.dados.tempo_medio || relatorio.dados.total_usuarios || relatorio.dados.taxa_refugo}
                      {relatorio.dados.unidade && ` ${relatorio.dados.unidade}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Variação</div>
                    <div className={`text-lg font-semibold flex items-center ${getTendenciaColor(relatorio.dados.tendencia)}`}>
                      {getTendenciaIcon(relatorio.dados.tendencia)}
                      {relatorio.dados.variacao}
                    </div>
                  </div>
                </div>
                
                {relatorio.tipo === 'performance' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${relatorio.dados.eficiencia_media}%` }}
                    />
                  </div>
                )}
                
                {relatorio.tipo === 'usuarios' && (
                  <div className="text-sm text-gray-500">
                    {relatorio.dados.apontamentos_por_usuario} apontamentos por usuário
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Eficiência por Período</CardTitle>
            <CardDescription>
              Evolução da eficiência nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <IconChartBar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de eficiência</p>
                <p className="text-sm text-gray-400">(Implementar gráfico)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Tempo</CardTitle>
            <CardDescription>
              Tempo gasto em cada etapa do workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <IconClock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de distribuição</p>
                <p className="text-sm text-gray-400">(Implementar gráfico)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
