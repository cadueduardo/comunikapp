'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  IconClipboardList, 
  IconPlayerPlay, 
  IconCircleCheck, 
  IconX,
  IconAlertTriangle,
  IconClock,
  IconBuilding
} from '@tabler/icons-react';

export interface KanbanStats {
  total: number;
  fila: number;
  producao: number;
  concluida: number;
  rejeitada: number;
  atrasadas: number;
  criticas: number;
  por_setor: Record<string, number>;
}

interface KanbanStatsProps {
  stats: KanbanStats;
  loading?: boolean;
}

export function KanbanStats({ stats, loading = false }: KanbanStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de OS',
      value: stats.total,
      icon: <IconClipboardList className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Em Fila',
      value: stats.fila,
      icon: <IconClock className="h-5 w-5" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: 'Em Produção',
      value: stats.producao,
      icon: <IconPlayerPlay className="h-5 w-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Concluídas',
      value: stats.concluida,
      icon: <IconCircleCheck className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Atrasadas',
      value: stats.atrasadas,
      icon: <IconAlertTriangle className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Críticas',
      value: stats.criticas,
      icon: <IconX className="h-5 w-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Estatísticas principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.title}
                  </div>
                </div>
                <div className={`${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estatísticas por setor */}
      {Object.keys(stats.por_setor).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <IconBuilding className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Distribuição por Setor</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(stats.por_setor).map(([setor, quantidade]) => (
                <div key={setor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{setor}</span>
                  <Badge variant="secondary" className="font-semibold">
                    {quantidade}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas importantes */}
      {(stats.atrasadas > 0 || stats.criticas > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Atenção Necessária</h3>
                <p className="text-sm text-orange-700">
                  {stats.atrasadas > 0 && `${stats.atrasadas} OS atrasadas`}
                  {stats.atrasadas > 0 && stats.criticas > 0 && ' • '}
                  {stats.criticas > 0 && `${stats.criticas} OS críticas`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

