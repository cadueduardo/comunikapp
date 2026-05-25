'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Package,
  MoreHorizontal,
  Printer,
  ShieldCheck,
  CheckCircle2,
  XCircle,
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
  // Campos para coluna de Aprovacao
  aprovacao_tecnica_status?: string | null;
  aprovacao_tecnica_por?: string | null;
  aprovacao_tecnica_em?: string | null;
  aprovacao_tecnica_obs?: string | null;
  tipo_os?: string | null;
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

// Status da OS em que ainda faz sentido aprovar tecnicamente.
// Sincronizado com backend (os.service.aprovarOSTecnica) e
// aprovacao-tecnica.service.aprovarTecnica.
const STATUS_PERMITE_APROVACAO = new Set([
  'AGUARDANDO_APROVACAO_TECNICA',
  'FILA',
]);

// Componente: celula da coluna "Aprovacao"
function AprovacaoCell({
  os,
  onAprovar,
}: {
  os: OrdemServico;
  onAprovar: (os: OrdemServico) => void;
}) {
  const tipoOs = (os.tipo_os || 'COMERCIAL').toUpperCase();
  const aprovacao = (os.aprovacao_tecnica_status || 'PENDENTE').toUpperCase();
  const statusOs = (os.status || '').toUpperCase();

  // OS interna nao usa aprovacao tecnica - usa aprovacao gerencial em outro fluxo
  if (tipoOs === 'INTERNA') {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  if (aprovacao === 'APROVADA') {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
        title={
          os.aprovacao_tecnica_em
            ? `Aprovada em ${formatDateTime(os.aprovacao_tecnica_em)}`
            : 'Aprovada'
        }
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Aprovada
      </Badge>
    );
  }

  if (aprovacao === 'REJEITADA') {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
        title={os.aprovacao_tecnica_obs || 'Rejeitada'}
      >
        <XCircle className="h-3 w-3 mr-1" />
        Rejeitada
      </Badge>
    );
  }

  // PENDENTE: so mostra botao se o status operacional ainda permite aprovar.
  // Status como PRODUCAO/ACABAMENTO/FINALIZADA NAO devem reabrir aprovacao,
  // mesmo que aprovacao_tecnica_status esteja PENDENTE em dados legados.
  if (STATUS_PERMITE_APROVACAO.has(statusOs)) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAprovar(os)}
        className="h-8"
      >
        <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
        Aprovar OS
      </Button>
    );
  }

  // Caso atipico: aprovacao_tecnica_status = PENDENTE mas OS ja avancou.
  // Mostra badge informativa para o usuario nao ficar bloqueado nem confuso.
  return (
    <Badge
      variant="outline"
      className="bg-gray-50 text-gray-600 border-gray-200"
      title="OS ja avancou alem da etapa de aprovacao"
    >
      Pendente
    </Badge>
  );
}

// Componente: dropdown de acoes secundarias
function AcoesDropdown({
  os,
  onDelete,
}: {
  os: OrdemServico;
  onDelete: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setExcluindo(true);
      await onDelete(os.id);
      setConfirmOpen(false);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Abrir menu de ações"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/os/${os.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/os/${os.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/os/${os.id}/imprimir`}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a OS #{os.numero}? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={excluindo}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={excluindo}
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const createColumns = (
  onDelete: (id: string) => void,
  onAprovar: (os: OrdemServico) => void,
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
      return <div className="font-medium">{nome}</div>;
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
    id: 'aprovacao',
    header: 'Aprovação',
    cell: ({ row }) => {
      const os = row.original;
      return <AprovacaoCell os={os} onAprovar={onAprovar} />;
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const os = row.original;
      return <AcoesDropdown os={os} onDelete={onDelete} />;
    },
  },
];
