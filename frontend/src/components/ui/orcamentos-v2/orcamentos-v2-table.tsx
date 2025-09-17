'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Share2, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export type OrcamentoV2 = {
  id: string;
  numero: string;
  nome_servico: string;
  descricao?: string;
  preco_final: number;
  criado_em: string;
  status?: string;
  status_aprovacao?: string;
  cliente?: {
    id: string;
    nome: string;
  };
};

interface OrcamentosV2TableProps {
  data?: OrcamentoV2[];
  onDelete?: (id: string, nome: string) => void;
  onShare?: (orcamento: OrcamentoV2) => void;
}

export function OrcamentosV2Table({ data = [], onDelete, onShare }: OrcamentosV2TableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Dados mockados para demonstração
  const mockData: OrcamentoV2[] = [
    {
      id: '1',
      numero: '001',
      nome_servico: 'Banner Personalizado',
      descricao: 'Banner de 3x1 metros com impressão digital',
      preco_final: 150.00,
      criado_em: '2024-01-15T10:00:00Z',
      status: 'enviado',
      status_aprovacao: 'PENDENTE',
      cliente: { id: '1', nome: 'Empresa ABC Ltda' }
    },
    {
      id: '2',
      numero: '002',
      nome_servico: 'Cartão de Visita',
      descricao: '500 cartões de visita em papel couché',
      preco_final: 89.90,
      criado_em: '2024-01-14T14:30:00Z',
      status: 'rascunho',
      status_aprovacao: undefined,
      cliente: { id: '2', nome: 'João Silva' }
    },
    {
      id: '3',
      numero: '003',
      nome_servico: 'Folheto Promocional',
      descricao: 'Folheto A4 frente e verso, 1000 unidades',
      preco_final: 320.00,
      criado_em: '2024-01-13T09:15:00Z',
      status: 'enviado',
      status_aprovacao: 'APROVADO',
      cliente: { id: '3', nome: 'Restaurante XYZ' }
    },
    {
      id: '4',
      numero: '004',
      nome_servico: 'Adesivo Vinil',
      descricao: 'Adesivo para fachada, 2x3 metros',
      preco_final: 180.00,
      criado_em: '2024-01-12T16:45:00Z',
      status: 'enviado',
      status_aprovacao: 'NEGOCIANDO',
      cliente: { id: '4', nome: 'Loja de Roupas Fashion' }
    }
  ];

  const tableData = (data && data.length > 0) ? data : mockData;



  const filteredData = useMemo(() => {
    let filtered = tableData;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(orcamento =>
        orcamento.nome_servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orcamento.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orcamento.numero.includes(searchTerm)
      );
    }

    // Filtro por status
    if (statusFilter !== 'todos') {
      if (statusFilter === 'rascunho') {
        filtered = filtered.filter(orcamento => !orcamento.status || orcamento.status === 'rascunho');
      } else if (statusFilter === 'enviado') {
        filtered = filtered.filter(orcamento => orcamento.status === 'enviado');
      }
    }

    return filtered;
  }, [tableData, searchTerm, statusFilter]);



  const handleDelete = (id: string, nome: string) => {
    if (onDelete) {
      onDelete(id, nome);
    } else {
      console.log('Deletar orçamento:', id, nome);
    }
  };

  const handleShare = (orcamento: OrcamentoV2) => {
    if (onShare) {
      onShare(orcamento);
    } else {
      console.log('Compartilhar orçamento:', orcamento);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por serviço, cliente ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
              <SelectItem value="enviado">Enviados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aprovação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                                 <tr>
                   <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-4xl">📋</div>
                      <div className="text-lg font-medium">Nenhum orçamento encontrado</div>
                      <div className="text-sm">Tente ajustar os filtros ou criar um novo orçamento</div>
                    </div>
                  </td>
                </tr>
              ) : (
                                 filteredData.map((orcamento) => (
                  <tr key={orcamento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">#{orcamento.numero}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{orcamento.nome_servico}</div>
                        {orcamento.descricao && (
                          <div className="text-sm text-gray-500">{orcamento.descricao}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {orcamento.cliente?.nome || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(orcamento.preco_final)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!orcamento.status || orcamento.status === 'rascunho' ? (
                        <Link href={`/orcamentos-v2/${orcamento.id}/editar`} className="hover:opacity-80">
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                            📝 Rascunho
                          </Badge>
                        </Link>
                      ) : (
                        <Link href={`/orcamentos-v2/${orcamento.id}`} className="hover:opacity-80">
                          <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors">
                            📤 Enviado
                          </Badge>
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {orcamento.status === 'rascunho' ? (
                        <Badge variant="secondary" className="text-xs">-</Badge>
                      ) : !orcamento.status_aprovacao || orcamento.status_aprovacao === 'PENDENTE' ? (
                        <Link href={`/orcamentos-v2/${orcamento.id}`} className="hover:opacity-80">
                          <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-gray-200 transition-colors">
                            ⏳ Pendente
                          </Badge>
                        </Link>
                      ) : (
                        (() => {
                          const status = orcamento.status_aprovacao;
                          const linkHref = status === 'NEGOCIANDO' 
                            ? `/orcamentos-v2/${orcamento.id}/editar`
                            : `/orcamentos-v2/${orcamento.id}`;
                          
                          return (
                            <Link href={linkHref} className="hover:opacity-80">
                              <Badge 
                                variant={
                                  status === 'APROVADO' ? 'default' :
                                  status === 'REJEITADO' ? 'destructive' :
                                  'secondary'
                                }
                                className={`cursor-pointer transition-colors ${
                                  status === 'APROVADO' ? 'text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-200' :
                                  status === 'REJEITADO' ? 'text-xs hover:bg-red-200' :
                                  status === 'NEGOCIANDO' ? 'text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' :
                                  'text-xs hover:bg-gray-200'
                                }`}
                              >
                                {status === 'APROVADO' ? '✅ Aprovado' :
                                 status === 'REJEITADO' ? '❌ Rejeitado' :
                                 status === 'NEGOCIANDO' ? '💬 Negociando' :
                                 status}
                              </Badge>
                            </Link>
                          );
                        })()
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {new Date(orcamento.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleShare(orcamento)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartilhar
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/orcamentos-v2/${orcamento.id}/editar`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(orcamento.id, orcamento.nome_servico)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{filteredData.length}</span> de{' '}
            <span className="font-medium">{tableData.length}</span> orçamentos
          </div>
        </div>
      )}
    </div>
  );
}
