'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Share2, Search, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { useOrcamentosV2, OrcamentoV2 } from './hooks/useOrcamentosV2';

interface OrcamentosV2TableProps {
  onDelete?: (id: string, nome: string) => void;
  onShare?: (orcamento: OrcamentoV2) => void;
}

export function OrcamentosV2Table({ onDelete, onShare }: OrcamentosV2TableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  // Usar hook para buscar dados reais do backend
  const { orcamentos, loading, error, refetch } = useOrcamentosV2();
  
  // Função para forçar atualização
  const handleRefresh = async () => {
    console.log('🔄 Forçando atualização dos dados...');
    await refetch();
  };
  
  // Debug: verificar dados recebidos
  console.log('🔍 OrcamentosV2Table - Dados recebidos:', {
    orcamentos,
    loading,
    error,
    count: orcamentos?.length || 0
  });



  const filteredData = useMemo(() => {
    let filtered = orcamentos;

    // Debug: verificar dados antes da filtragem
    console.log('🔍 Debug - Dados antes da filtragem:', {
      orcamentos,
      searchTerm,
      statusFilter,
      filtered
    });

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

    // Debug: verificar dados após filtragem
    console.log('🔍 Debug - Dados após filtragem:', {
      filtered,
      length: filtered.length
    });

    return filtered;
  }, [orcamentos, searchTerm, statusFilter]);



  const handleDelete = (id: string, nome: string) => {
    if (onDelete) {
      onDelete(id, nome);
    } else {
      console.log('Deletar orçamento:', id, nome);
    }
  };

  const handleShare = async (orcamento: OrcamentoV2) => {
    try {
      // Gerar link público do orçamento V2
      const linkPublico = `${window.location.origin}/orcamento-v2/${orcamento.id}`;
      
      // Tentar usar a Web Share API se disponível
      if (navigator.share) {
        await navigator.share({
          title: `Orçamento ${orcamento.numero} - ${orcamento.nome_servico}`,
          text: `Orçamento de ${formatCurrency(orcamento.preco_final)}`,
          url: linkPublico,
        });
      } else {
        // Fallback: copiar para área de transferência
        await navigator.clipboard.writeText(linkPublico);
        alert('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Fallback final: mostrar link em alert
      const linkPublico = `${window.location.origin}/orcamento-v2/${orcamento.id}`;
      alert(`Link do orçamento: ${linkPublico}`);
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando orçamentos...</span>
        </div>
      </div>
    );
  }

  // Mostrar erro
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-red-600 text-center">
          <div className="text-lg font-medium">Erro ao carregar orçamentos</div>
          <div className="text-sm text-gray-600 mt-1">{error}</div>
        </div>
        <Button onClick={refetch} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

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
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
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
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status do Orçamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atualizado em
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
                      {(() => {
                        // Lógica inteligente para status do orçamento
                        const status = orcamento.status || 'rascunho';
                        const statusAprovacao = orcamento.hasOwnProperty('status_aprovacao') ? orcamento.status_aprovacao : null;
                        
                        // Debug adicional
                        console.log('🔍 Debug - Orçamento no frontend:', {
                          id: orcamento.id,
                          status,
                          statusAprovacao,
                          hasStatusAprovacao: orcamento.hasOwnProperty('status_aprovacao'),
                          allKeys: Object.keys(orcamento)
                        });
                        
                        // Debug
                        console.log('🔍 Debug - Status do orçamento:', {
                          id: orcamento.id,
                          status,
                          statusAprovacao
                        });
                        
                        // Determinar o status final
                        let statusFinal, badgeVariant, badgeClass, icon;
                        
                        if (status === 'rascunho') {
                          statusFinal = 'Rascunho';
                          badgeVariant = 'outline';
                          badgeClass = 'text-xs bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors';
                          icon = '📝';
                        } else if (status === 'aprovado') {
                          statusFinal = 'Aprovado';
                          badgeVariant = 'default';
                          badgeClass = 'text-xs bg-green-100 text-green-800 border-green-200 cursor-pointer hover:bg-green-200 transition-colors';
                          icon = '✅';
                        } else if (status === 'rejeitado') {
                          statusFinal = 'Rejeitado';
                          badgeVariant = 'destructive';
                          badgeClass = 'text-xs cursor-pointer hover:bg-red-200 transition-colors';
                          icon = '❌';
                        } else if (status === 'negociando') {
                          statusFinal = 'Negociando';
                          badgeVariant = 'secondary';
                          badgeClass = 'text-xs bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors';
                          icon = '💬';
                        } else if (status === 'enviado') {
                          // Se está enviado, verificar status de aprovação
                          if (!statusAprovacao || statusAprovacao === 'PENDENTE') {
                            statusFinal = 'Enviado - Pendente';
                            badgeVariant = 'secondary';
                            badgeClass = 'text-xs bg-yellow-100 text-yellow-800 border-yellow-200 cursor-pointer hover:bg-yellow-200 transition-colors';
                            icon = '⏳';
                          } else if (statusAprovacao === 'APROVADO') {
                            statusFinal = 'Aprovado';
                            badgeVariant = 'default';
                            badgeClass = 'text-xs bg-green-100 text-green-800 border-green-200 cursor-pointer hover:bg-green-200 transition-colors';
                            icon = '✅';
                          } else if (statusAprovacao === 'REJEITADO') {
                            statusFinal = 'Rejeitado';
                            badgeVariant = 'destructive';
                            badgeClass = 'text-xs cursor-pointer hover:bg-red-200 transition-colors';
                            icon = '❌';
                          } else if (statusAprovacao === 'NEGOCIANDO') {
                            statusFinal = 'Negociando';
                            badgeVariant = 'secondary';
                            badgeClass = 'text-xs bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors';
                            icon = '💬';
                          } else {
                            statusFinal = 'Enviado';
                            badgeVariant = 'default';
                            badgeClass = 'text-xs bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors';
                            icon = '📤';
                          }
                        } else {
                          // Fallback para outros status
                          statusFinal = 'Enviado';
                          badgeVariant = 'default';
                          badgeClass = 'text-xs bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors';
                          icon = '📤';
                        }
                        
                        // Determinar link
                        const linkHref = status === 'rascunho' || statusAprovacao === 'NEGOCIANDO' 
                          ? `/orcamentos-v2/novo?id=${orcamento.id}`
                          : `/orcamentos-v2/${orcamento.id}`;
                        
                        return (
                          <Link href={linkHref} className="hover:opacity-80" onClick={() => console.log('🔍 Clicando para ver orcamento:', orcamento.id, 'link:', linkHref)}>
                            <Badge variant={badgeVariant} className={badgeClass}>
                              {icon} {statusFinal}
                            </Badge>
                          </Link>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {orcamento.criado_em || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {orcamento.atualizado_em || '-'}
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
                            <Link href={`/orcamentos-v2/novo?id=${orcamento.id}`} onClick={() => console.log('🔍 Menu - Clicando para editar orcamento:', orcamento.id)}>
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
            <span className="font-medium">{orcamentos.length}</span> orçamentos
          </div>
        </div>
      )}
    </div>
  );
}
