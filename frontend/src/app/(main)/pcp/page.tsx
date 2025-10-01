'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IconBuilding, 
  IconClipboardList, 
  IconChartBar, 
  IconSettings,
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash
} from '@tabler/icons-react';
import Link from 'next/link';

export default function PCPPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PCP - Planejamento e Controle de Produção
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie workflows, etapas e apontamentos de produção
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/pcp/workflows/novo">
              <IconPlus className="h-4 w-4 mr-2" />
              Novo Workflow
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows Ativos</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Etapas em Andamento</CardTitle>
            <IconClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 atrasadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apontamentos Hoje</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +12% vs ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <IconSettings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              +5% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seções Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflows Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows Recentes</CardTitle>
            <CardDescription>
              Últimos workflows criados e em execução
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: '1', nome: 'Banner ACM 3mm', os: 'OS-2024-001234', status: 'ATIVO', progresso: 75 },
                { id: '2', nome: 'Letra Caixa LED', os: 'OS-2024-001235', status: 'PAUSADO', progresso: 30 },
                { id: '3', nome: 'Adesivo Plotado', os: 'OS-2024-001236', status: 'ATIVO', progresso: 90 },
              ].map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{workflow.nome}</div>
                    <div className="text-sm text-gray-500">{workflow.os}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${workflow.progresso}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={workflow.status === 'ATIVO' ? 'default' : 'secondary'}>
                      {workflow.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <IconEye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Etapas Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle>Etapas Pendentes</CardTitle>
            <CardDescription>
              Etapas que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: '1', nome: 'Aprovação Técnica', os: 'OS-2024-001234', responsavel: 'João Silva', prazo: '2h' },
                { id: '2', nome: 'Corte CNC', os: 'OS-2024-001235', responsavel: 'Maria Santos', prazo: '4h' },
                { id: '3', nome: 'Acabamento', os: 'OS-2024-001236', responsavel: 'Pedro Costa', prazo: '1h' },
              ].map((etapa) => (
                <div key={etapa.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{etapa.nome}</div>
                    <div className="text-sm text-gray-500">{etapa.os} • {etapa.responsavel}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      {etapa.prazo}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades do PCP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/pcp/workflows">
                <IconBuilding className="h-6 w-6 mb-2" />
                Gerenciar Workflows
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/pcp/etapas">
                <IconClipboardList className="h-6 w-6 mb-2" />
                Visualizar Etapas
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/pcp/apontamentos">
                <IconChartBar className="h-6 w-6 mb-2" />
                Registrar Apontamentos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
