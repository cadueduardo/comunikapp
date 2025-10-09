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
    FILA: {
      variant: 'secondary' as const,
      label: 'Na Fila',
      color: 'bg-gray-100 text-gray-800',
    },
    PRODUCAO: {
      variant: 'default' as const,
      label: 'Em Produção',
      color: 'bg-blue-100 text-blue-800',
    },
    ACABAMENTO: {
      variant: 'outline' as const,
      label: 'Acabamento',
      color: 'bg-yellow-100 text-yellow-800',
    },
    FINALIZADA: {
      variant: 'default' as const,
      label: 'Finalizada',
      color: 'bg-green-100 text-green-800',
    },
    CANCELADA: {
      variant: 'destructive' as const,
      label: 'Cancelada',
      color: 'bg-red-100 text-red-800',
    },
    AGUARDANDO_MATERIAL: {
      variant: 'outline' as const,
      label: 'Aguardando Material',
      color: 'bg-orange-100 text-orange-800',
    },
    PAUSADA: {
      variant: 'secondary' as const,
      label: 'Pausada',
      color: 'bg-gray-100 text-gray-600',
    },
    AGUARDANDO_APROVACAO_TECNICA: {
      variant: 'outline' as const,
      label: 'Aguardando Aprovação Técnica',
      color: 'bg-blue-100 text-blue-800',
    },
    APROVADA_TECNICA: {
      variant: 'default' as const,
      label: 'Aprovada Tecnicamente',
      color: 'bg-green-100 text-green-800',
    },
    REJEITADA: {
      variant: 'destructive' as const,
      label: 'Rejeitada',
      color: 'bg-red-100 text-red-800',
    },
  };

  return configs[status as keyof typeof configs] || {
    variant: 'secondary' as const,
    label: status,
    color: 'bg-gray-100 text-gray-800',
  };
};

// Função para formatar data
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Função para formatar data e hora
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const createColumns = (
  onDelete: (id: string) => void,
): ColumnDef<OrdemServico>[] => [
  {
    accessorKey: 'numero',
    header: 'Número',
    cell: ({ row }) => {
      const numero = row.getValue('numero') as string;
      return <div className="font-medium">#{numero}</div>;
    },
  },
  {
    accessorKey: 'nome_servico',
    header: 'Serviço',
    cell: ({ row }) => {
      const nome = row.getValue('nome_servico') as string;
      return (
        <div className="font-medium">{nome}</div>
      );
    },
  },
  {
    accessorKey: 'cliente_nome',
    header: 'Cliente',
    cell: ({ row }) => {
      const clienteNome = row.getValue('cliente_nome') as string;
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{clienteNome || 'N/A'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const config = getStatusConfig(status);

      return (
        <Badge variant={config.variant} className={config.color}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'data_abertura',
    header: 'Data de Abertura',
    cell: ({ row }) => {
      const data = row.getValue('data_abertura') as string;
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateTime(data)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'data_prazo',
    header: 'Prazo',
    cell: ({ row }) => {
      const dataPrazo = row.getValue('data_prazo') as string;
      if (!dataPrazo) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(dataPrazo)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'materiais_disponivel',
    header: 'Materiais',
    cell: ({ row }) => {
      const disponivel = row.getValue('materiais_disponivel') as boolean;
      return (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Badge variant={disponivel ? 'default' : 'destructive'}>
            {disponivel ? 'Disponível' : 'Faltando'}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const os = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/os/${os.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link href={`/os/${os.id}/editar`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>

          <ConfirmDialog
            title="Excluir Ordem de Serviço"
            description={`Tem certeza que deseja excluir a OS #${os.numero}? Esta ação não pode ser desfeita.`}
            onConfirm={() => onDelete(os.id)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </ConfirmDialog>
        </div>
      );
    },
  },
];

