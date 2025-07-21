'use client';

import { Orcamento } from '@/app/(main)/orcamentos/columns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, Trash2, Share2, User, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface OrcamentoCardProps {
  orcamento: Orcamento;
  onDelete: (id: string, nome: string) => void;
  onShare: (orcamento: Orcamento) => void;
}

export function OrcamentoCard({ orcamento, onDelete, onShare }: OrcamentoCardProps) {
  const getStatusBadge = () => {
    const status = orcamento.status_aprovacao;
    if (!status || status === 'PENDENTE') {
      return <Badge variant="secondary">Pendente</Badge>;
    }
    
    if (status === 'NEGOCIANDO') {
      return (
        <Link href={`/orcamentos/${orcamento.id}/editar?chat=true`}>
          <Badge 
            variant="secondary"
            className="text-xs cursor-pointer hover:bg-blue-100"
          >
            🔄 Negociando
          </Badge>
        </Link>
      );
    }
    
    return (
      <Badge 
        variant={
          status === 'APROVADO' ? 'default' :
          status === 'REJEITADO' ? 'destructive' :
          'secondary'
        }
        className={
          status === 'APROVADO' ? 'text-xs bg-green-100 text-green-800 border-green-200' :
          status === 'REJEITADO' ? 'text-xs' :
          'text-xs'
        }
      >
        {status === 'APROVADO' ? '✅ Aprovado' :
         status === 'REJEITADO' ? '❌ Rejeitado' :
         status}
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header com número e ações */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">#{orcamento.numero}</Badge>
            {getStatusBadge()}
          </div>
          <h3 className="font-medium text-gray-900 truncate">
            {orcamento.nome_servico}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onShare(orcamento)}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/orcamentos/${orcamento.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/orcamentos/${orcamento.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(orcamento.id, orcamento.nome_servico)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Descrição */}
      {orcamento.descricao && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {orcamento.descricao}
        </p>
      )}

      {/* Informações principais */}
      <div className="space-y-2">
        {/* Cliente */}
        {orcamento.cliente && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{orcamento.cliente.nome}</span>
          </div>
        )}

        {/* Data */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(orcamento.criado_em).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Valor e ações */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(orcamento.preco_final)}
          </span>
        </div>
        
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => onShare(orcamento)}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Link href={`/orcamentos/${orcamento.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/orcamentos/${orcamento.id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(orcamento.id, orcamento.nome_servico)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 