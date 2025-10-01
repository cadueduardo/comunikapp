'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  IconBuilding, 
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFilter
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const workflows = [
    {
      id: '1',
      nome: 'Banner ACM 3mm',
      descricao: 'Workflow padrão para produção de banners em ACM',
      os_id: 'OS-2024-001234',
      status: 'ATIVO',
      progresso: 75,
      etapas: 5,
      data_criacao: '2024-01-10',
      responsavel: 'João Silva'
    },
    {
      id: '2',
      nome: 'Letra Caixa LED',
      descricao: 'Workflow para letras caixa com iluminação LED',
      os_id: 'OS-2024-001235',
      status: 'PAUSADO',
      progresso: 30,
      etapas: 8,
      data_criacao: '2024-01-09',
      responsavel: 'Maria Santos'
    },
    {
      id: '3',
      nome: 'Adesivo Plotado',
      descricao: 'Workflow para adesivos plotados',
      os_id: 'OS-2024-001236',
      status: 'ATIVO',
      progresso: 90,
      etapas: 4,
      data_criacao: '2024-01-08',
      responsavel: 'Pedro Costa'
    },
    {
      id: '4',
      nome: 'Totem Promocional',
      descricao: 'Workflow para totens promocionais',
      os_id: 'OS-2024-001237',
      status: 'CONCLUIDO',
      progresso: 100,
      etapas: 6,
      data_criacao: '2024-01-07',
      responsavel: 'Ana Lima'
    }
  ];

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.os_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAUSADO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONCLUIDO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workflows
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie workflows de produção
          </p>
        </div>
        <Button asChild>
          <Link href="/pcp/workflows/novo">
            <IconPlus className="h-4 w-4 mr-2" />
            Novo Workflow
          </Link>
        </Button>
      </div>

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
                  placeholder="Buscar por nome ou OS..."
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

      {/* Lista de Workflows */}
      <div className="grid grid-cols-1 gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{workflow.nome}</CardTitle>
                  <CardDescription>{workflow.descricao}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(workflow.status)}>
                    {workflow.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <IconEye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">OS</div>
                  <div className="text-lg font-semibold">{workflow.os_id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Progresso</div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${workflow.progresso}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{workflow.progresso}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Etapas</div>
                  <div className="text-lg font-semibold">{workflow.etapas}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Responsável</div>
                  <div className="text-lg font-semibold">{workflow.responsavel}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <IconBuilding className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum workflow encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro workflow'}
            </p>
            <Button asChild>
              <Link href="/pcp/workflows/novo">
                <IconPlus className="h-4 w-4 mr-2" />
                Criar Workflow
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
