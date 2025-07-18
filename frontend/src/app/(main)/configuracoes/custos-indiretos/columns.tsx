'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

interface CustoIndireto {
  id: string;
  nome: string;
  categoria: string;
  valor_mensal: number;
  observacoes?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const columns: ColumnDef<CustoIndireto>[] = [
  {
    accessorKey: 'nome',
    header: 'Nome',
  },
  {
    accessorKey: 'categoria',
    header: 'Categoria',
  },
  {
    accessorKey: 'valor_mensal',
    header: 'Valor Mensal',
    cell: ({ row }) => {
      const valor = row.getValue('valor_mensal') as string | number;
      // Se o valor vier como string, tratar como valor em reais (não centavos)
      return formatCurrency(valor, true, true);
    },
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    cell: ({ row }) => {
      const ativo = row.getValue('ativo') as boolean;
      return (
        <Badge variant={ativo ? 'default' : 'secondary'}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const custoIndireto = row.original;

      const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este custo indireto?')) {
          return;
        }

        try {
          const token = localStorage.getItem('access_token');
          if (!token) return;

          const response = await fetch(`http://localhost:3001/custos-indiretos/${custoIndireto.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            toast.success('Custo indireto excluído com sucesso!');
            // Recarregar a página para atualizar a lista
            window.location.reload();
          } else {
            toast.error('Erro ao excluir custo indireto');
          }
        } catch (error) {
          console.error('Erro ao excluir custo indireto:', error);
          toast.error('Erro ao excluir custo indireto');
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/configuracoes/custos-indiretos/editar/${custoIndireto.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 