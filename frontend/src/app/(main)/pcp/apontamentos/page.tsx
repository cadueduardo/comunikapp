'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  IconChartBar, 
  IconPlus,
  IconEye,
  IconEdit,
  IconPlayerPlay,
  IconPlayerPause,
  IconCheck,
  IconX,
  IconSearch,
  IconFilter
} from '@tabler/icons-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { pcpModuleNav } from '@/lib/module-nav';
import Link from 'next/link';
import { useState } from 'react';

export default function ApontamentosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const apontamentos = [
    {
      id: '1',
      tipo: 'INICIO',
      os_id: 'OS-2024-001234',
      etapa: 'Aprovação Técnica',
      usuario: 'João Silva',
      data: '2024-01-10 09:00',
      observacoes: 'Iniciando aprovação técnica do banner',
      quantidade_produzida: 0,
      tempo_gasto: 0
    },
    {
      id: '2',
      tipo: 'CONCLUSAO',
      os_id: 'OS-2024-001235',
      etapa: 'Corte CNC',
      usuario: 'Maria Santos',
      data: '2024-01-10 14:30',
      observacoes: 'Corte concluído com sucesso',
      quantidade_produzida: 1,
      tempo_gasto: 240
    },
    {
      id: '3',
      tipo: 'PAUSA',
      os_id: 'OS-2024-001236',
      etapa: 'Acabamento',
      usuario: 'Pedro Costa',
      data: '2024-01-10 16:45',
      observacoes: 'Pausa para almoço',
      quantidade_produzida: 0,
      tempo_gasto: 0
    },
    {
      id: '4',
      tipo: 'REFUGO',
      os_id: 'OS-2024-001237',
      etapa: 'Instalação',
      usuario: 'Ana Lima',
      data: '2024-01-10 11:20',
      observacoes: 'Peça danificada durante instalação',
      quantidade_produzida: 0,
      quantidade_refugo: 1,
      tempo_gasto: 30
    }
  ];

  const filteredApontamentos = apontamentos.filter(apontamento =>
    apontamento.os_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apontamento.etapa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apontamento.usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'INICIO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAUSA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RETOMADA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONCLUSAO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REFUGO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'INICIO':
        return <IconPlayerPlay className="h-4 w-4" />;
      case 'PAUSA':
        return <IconPlayerPause className="h-4 w-4" />;
      case 'RETOMADA':
        return <IconPlayerPlay className="h-4 w-4" />;
      case 'CONCLUSAO':
        return <IconCheck className="h-4 w-4" />;
      case 'REFUGO':
        return <IconX className="h-4 w-4" />;
      default:
        return <IconChartBar className="h-4 w-4" />;
    }
  };

  const formatTempo = (minutos: number) => {
    if (minutos === 0) return '-';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={pcpModuleNav}
        title="Apontamentos"
        subtitle="Registre e acompanhe apontamentos de produção"
        backHref="/pcp"
        actions={
          <Button asChild>
            <Link href="/pcp/apontamentos/novo">
              <IconPlus className="h-4 w-4 mr-2" />
              Novo Apontamento
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
                  placeholder="Buscar por OS, etapa ou usuário..."
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

      {/* Lista de Apontamentos */}
      <div className="grid grid-cols-1 gap-6">
        {filteredApontamentos.map((apontamento) => (
          <Card key={apontamento.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {getTipoIcon(apontamento.tipo)}
                    {apontamento.tipo} - {apontamento.etapa}
                  </CardTitle>
                  <CardDescription>
                    {apontamento.os_id} • {apontamento.usuario}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTipoColor(apontamento.tipo)}>
                    {apontamento.tipo}
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
                  <div className="text-sm font-medium text-gray-500">Data/Hora</div>
                  <div className="text-lg font-semibold">{apontamento.data}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Tempo Gasto</div>
                  <div className="text-lg font-semibold">{formatTempo(apontamento.tempo_gasto)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Quantidade Produzida</div>
                  <div className="text-lg font-semibold">{apontamento.quantidade_produzida}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Quantidade Refugo</div>
                  <div className="text-lg font-semibold text-red-600">
                    {apontamento.quantidade_refugo || 0}
                  </div>
                </div>
              </div>
              {apontamento.observacoes && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 mb-1">Observações</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {apontamento.observacoes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApontamentos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <IconChartBar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum apontamento encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece registrando seu primeiro apontamento'}
            </p>
            <Button asChild>
              <Link href="/pcp/apontamentos/novo">
                <IconPlus className="h-4 w-4 mr-2" />
                Registrar Apontamento
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
