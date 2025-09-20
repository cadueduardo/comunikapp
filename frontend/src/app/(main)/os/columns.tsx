'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Package,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export interface OrdemServico {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nome?: string;
  orcamento_id?: string;
  data_abertura: string;
  data_prazo?: string;
  status: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  nome_servico: string;
  quantidade: number;
  materiais_disponivel: boolean;
  criado_em: string;
  atualizado_em: string;
}

// Função para obter configuração de status
const getStatusConfig = (status: string) => {
  const configs = {
    'FILA': { 
      variant: 'secondary' as const, 
      label: 'Na Fila',
      color: 'bg-gray-100 text-gray-800'
    },
    'PRODUCAO': { 
      variant: 'default' as const, 
      label: 'Em Produção',
      color: 'bg-blue-100 text-blue-800'
    },
    'ACABAMENTO': { 
      variant: 'outline' as const, 
      label: 'Acabamento',
      color: 'bg-yellow-100 text-yellow-800'
    },
    'FINALIZADA': { 
      variant: 'default' as const, 
      label: 'Finalizada',
      color: 'bg-green-100 text-green-800'
    },
    'CANCELADA': { 
      variant: 'destructive' as const, 
      label: 'Cancelada',
      color: 'bg-red-100 text-red-800'
    },
    'AGUARDANDO_MATERIAL': { 
      variant: 'outline' as const, 
      label: 'Aguardando Material',
      color: 'bg-orange-100 text-orange-800'
    },
    'PAUSADA': { 
      variant: 'secondary' as const, 
      label: 'Pausada',
      color: 'bg-purple-100 text-purple-800'
    },
  };

  return configs[status] || { 
    variant: 'outline' as const, 
    label: status,
    color: 'bg-gray-100 text-gray-800'
  };
};

export const createColumns = (
  onDelete: (id: string, numero: string) => void
): ColumnDef<OrdemServico>[] => [
  {
    accessorKey: 'numero',
    header: 'Número',
    cell: ({ row }) => {
      const os = row.original;
      return (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-500" />
          <span className="font-medium">#{os.numero}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'nome_servico',
    header: 'Produto/Serviço',
    cell: ({ row }) => {
      const os = row.original;
      return (
        <div>
          <div className="font-medium">{os.nome_servico}</div>
          <div className="text-sm text-gray-500">
            Qtd: {os.quantidade}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'cliente_nome',
    header: 'Cliente',
    cell: ({ row }) => {
      const clienteNome = row.original.cliente_nome || 'Cliente não informado';
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>{clienteNome}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const config = getStatusConfig(status);
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: 'data_prazo',
    header: 'Prazo',
    cell: ({ row }) => {
      const prazo = row.original.data_prazo;
      if (!prazo) return <span className="text-gray-400">-</span>;

      const dataPrazo = new Date(prazo);
      const hoje = new Date();
      const isAtrasada = dataPrazo < hoje;
      const isVencendo = dataPrazo <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className={`text-sm ${isAtrasada ? 'text-red-600 font-medium' : isVencendo ? 'text-yellow-600' : 'text-gray-700'}`}>
            {dataPrazo.toLocaleDateString('pt-BR')}
          </span>
          {isAtrasada && <AlertTriangle className="h-4 w-4 text-red-500" />}
          {isVencendo && !isAtrasada && <Clock className="h-4 w-4 text-yellow-500" />}
        </div>
      );
    },
  },
  {
    accessorKey: 'materiais_disponivel',
    header: 'Materiais',
    cell: ({ row }) => {
      const disponivel = row.original.materiais_disponivel;
      return (
        <div className="flex items-center gap-2">
          {disponivel ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600 text-sm">Disponível</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600 text-sm">Verificar</span>
            </>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const os = row.original;
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);

      return (
        <div className="flex items-center gap-1">
          <Link href={`/os/${os.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          
          {os.status !== 'FINALIZADA' && os.status !== 'CANCELADA' && (
            <>
              <Link href={`/os/${os.id}/editar`}>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Excluir Ordem de Serviço"
                description={`Tem certeza que deseja excluir a OS #${os.numero}? Esta ação não pode ser desfeita.`}
                onConfirm={() => {
                  onDelete(os.id, os.numero);
                  setShowDeleteDialog(false);
                }}
              />
            </>
          )}
        </div>
      );
    },
  },
];
