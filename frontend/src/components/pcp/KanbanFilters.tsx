'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconRefresh,
  IconSettings
} from '@tabler/icons-react';

export interface KanbanFilters {
  status?: string;
  prioridade?: string;
  setor?: string;
  operador?: string;
  busca?: string;
}

interface KanbanFiltersProps {
  filters: KanbanFilters;
  onFiltersChange: (filters: KanbanFilters) => void;
  onRefresh: () => void;
  loading?: boolean;
  stats?: {
    por_setor: Record<string, number>;
  };
}

export function KanbanFilters({
  filters,
  onFiltersChange,
  onRefresh,
  loading = false,
  stats
}: KanbanFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof KanbanFilters, value: string) => {
    const newFilters = { ...filters };
    if (value === 'all' || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filtros do Kanban
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.keys(filters).length} ativo(s)
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <IconSettings className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Simples' : 'Avançado'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Filtros básicos */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por OS, cliente ou produto..."
                  className="pl-9"
                  value={filters.busca || ''}
                  onChange={(e) => handleFilterChange('busca', e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="LIBERADA_PARA_PCP">Liberada para PCP</SelectItem>
                <SelectItem value="EM_WORKFLOW">Em Workflow</SelectItem>
                <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                <SelectItem value="REJEITADA">Rejeitada</SelectItem>
              </SelectContent>
            </Select>

            {/* Prioridade */}
            <Select
              value={filters.prioridade || 'all'}
              onValueChange={(value) => handleFilterChange('prioridade', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="CRITICA">Crítica</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros avançados */}
          {showAdvanced && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              {/* Setor */}
              <Select
                value={filters.setor || 'all'}
                onValueChange={(value) => handleFilterChange('setor', value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Setores</SelectItem>
                  {stats?.por_setor && Object.keys(stats.por_setor).map(setor => (
                    <SelectItem key={setor} value={setor}>
                      {setor} ({stats.por_setor[setor]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operador */}
              <Select
                value={filters.operador || 'all'}
                onValueChange={(value) => handleFilterChange('operador', value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Operadores</SelectItem>
                  {/* TODO: Carregar lista de operadores */}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ações */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <IconX className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
              
              <div className="text-sm text-gray-500">
                Filtros ativos: {Object.entries(filters).map(([key, value]) => 
                  `${key}: ${value}`
                ).join(', ')}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

