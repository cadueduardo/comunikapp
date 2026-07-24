'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  IconClipboardList, 
  IconPlus,
  IconEye,
  IconEdit,
  IconPlayerPlay,
  IconPlayerPause,
  IconCheck,
  IconSearch,
  IconFilter
} from '@tabler/icons-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { pcpModuleNav } from '@/lib/module-nav';
import Link from 'next/link';
import { useState } from 'react';

export default function EtapasPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const etapas = [
    {
      id: '1',
      nome: 'Aprovação Técnica',
      workflow: 'Banner ACM 3mm',
      os_id: 'OS-2024-001234',
      status: 'PENDENTE',
      responsavel: 'João Silva',
      prazo: '2h',
      ordem: 1,
      checklists: 3,
      concluidos: 0
    },
    {
      id: '2',
      nome: 'Corte CNC',
      workflow: 'Letra Caixa LED',
      os_id: 'OS-2024-001235',
      status: 'EM_ANDAMENTO',
      responsavel: 'Maria Santos',
      prazo: '4h',
      ordem: 2,
      checklists: 5,
      concluidos: 2
    },
    {
      id: '3',
      nome: 'Acabamento',
      workflow: 'Adesivo Plotado',
      os_id: 'OS-2024-001236',
      status: 'CONCLUIDA',
      responsavel: 'Pedro Costa',
      prazo: '1h',
      ordem: 3,
      checklists: 4,
      concluidos: 4
    },
    {
      id: '4',
      nome: 'Instalação',
      workflow: 'Totem Promocional',
      os_id: 'OS-2024-001237',
      status: 'PAUSADA',
      responsavel: 'Ana Lima',
      prazo: '6h',
      ordem: 4,
      checklists: 6,
      concluidos: 3
    }
  ];

  const filteredEtapas = etapas.filter(etapa =>
    etapa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etapa.os_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etapa.workflow.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'EM_ANDAMENTO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONCLUIDA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAUSADA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELADA':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <IconClipboardList className="h-4 w-4" />;
      case 'EM_ANDAMENTO':
        return <IconPlayerPlay className="h-4 w-4" />;
      case 'CONCLUIDA':
        return <IconCheck className="h-4 w-4" />;
      case 'PAUSADA':
        return <IconPlayerPause className="h-4 w-4" />;
      default:
        return <IconClipboardList className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={pcpModuleNav}
        title="Etapas"
        subtitle="Gerencie etapas de produção"
        backHref="/pcp"
        actions={
          <Button asChild>
            <Link href="/pcp/etapas/nova">
              <IconPlus className="h-4 w-4 mr-2" />
              Nova Etapa
            </Link>
          </Button>
        }
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por etapa, workflow ou OS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <IconFilter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Etapas */}
      <div className="grid grid-cols-1 gap-6">
        {filteredEtapas.map((etapa) => (
          <Card key={etapa.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {getStatusIcon(etapa.status)}
                    {etapa.nome}
                  </CardTitle>
                  <CardDescription>
                    {etapa.workflow} • {etapa.os_id}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(etapa.status)}>
                    {etapa.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <IconEye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Responsável</div>
                  <div className="text-lg font-semibold">{etapa.responsavel}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Prazo</div>
                  <div className="text-lg font-semibold">{etapa.prazo}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Ordem</div>
                  <div className="text-lg font-semibold">{etapa.ordem}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Checklists</div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold">
                      {etapa.concluidos}/{etapa.checklists}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(etapa.concluidos / etapa.checklists) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEtapas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <IconClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma etapa encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando sua primeira etapa'}
            </p>
            <Button asChild>
              <Link href="/pcp/etapas/nova">
                <IconPlus className="h-4 w-4 mr-2" />
                Criar Etapa
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
