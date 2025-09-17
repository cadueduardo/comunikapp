'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Trash2, Search, Filter, Calendar, User, DollarSign } from 'lucide-react';

// Dados mockados para demonstração
const mockOrcamentos = [
  {
    id: '1',
    numero: 'ORC-2024-001',
    nome_servico: 'Banner Promocional',
    cliente: 'Empresa ABC Ltda',
    status: 'PENDENTE',
    valor_total: 14658.00,
    data_criacao: '2024-01-15',
    atendente: 'João Silva',
    descricao: 'Banner promocional para campanha de marketing',
  },
  {
    id: '2',
    numero: 'ORC-2024-002',
    nome_servico: 'Painel ACM',
    cliente: 'Loja XYZ',
    status: 'APROVADO',
    valor_total: 8500.00,
    data_criacao: '2024-01-14',
    atendente: 'Maria Santos',
    descricao: 'Painel ACM com impressão personalizada',
  },
  {
    id: '3',
    numero: 'ORC-2024-003',
    nome_servico: 'Expositor PDV',
    cliente: 'Supermercado Central',
    status: 'EM_NEGOCIACAO',
    valor_total: 3200.00,
    data_criacao: '2024-01-13',
    atendente: 'Pedro Costa',
    descricao: 'Expositor para ponto de venda',
  },
];

const statusColors = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  APROVADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-red-100 text-red-800',
  EM_NEGOCIACAO: 'bg-blue-100 text-blue-800',
  CONCLUIDO: 'bg-gray-100 text-gray-800',
};

export function OrcamentosV2Cards() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const filteredOrcamentos = mockOrcamentos.filter(orcamento => {
    const matchesSearch = orcamento.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orcamento.nome_servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orcamento.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || orcamento.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por número, serviço ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="APROVADO">Aprovado</SelectItem>
                <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                <SelectItem value="EM_NEGOCIACAO">Em Negociação</SelectItem>
                <SelectItem value="CONCLUIDO">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrcamentos.map((orcamento) => (
          <Card key={orcamento.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{orcamento.nome_servico}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {orcamento.numero}
                    </Badge>
                    <Badge className={statusColors[orcamento.status as keyof typeof statusColors]}>
                      {orcamento.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Descrição */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {orcamento.descricao}
              </p>

              {/* Informações */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{orcamento.cliente}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {new Date(orcamento.data_criacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    R$ {orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrcamentos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum orçamento encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
