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
  RotateCcw,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { OsDetalheModals } from '@/components/ui/os/OsDetalheModals';

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
  ativo?: boolean;
  motivo_inativacao?: string | null;
  inativado_em?: string | null;
  arte_resumo?: {
    status_agregado: string;
    label: string;
    total_com_arte: number;
    aprovadas: number;
    pendentes: number;
  };
  liberacao_resumo?: {
    total: number;
    liberados: number;
    pendentes: number;
    parcial: boolean;
  };
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
    PARCIALMENTE_LIBERADA: {
      variant: 'outline' as const,
      label: 'Parcialmente liberada',
      color: 'bg-purple-100 text-purple-800',
    },
    LIBERADA_PARA_PCP: {
      variant: 'default' as const,
      label: 'Liberada para PCP',
      color: 'bg-indigo-100 text-indigo-800',
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

// Status que BLOQUEIAM aprovacao tecnica (sincronizado com backend
// os.service.aprovarOSTecnica e aprovacao-tecnica.service.aprovarTecnica).
// Qualquer outro status permite aprovar - mas se nao for fluxo padrao,
// a aprovacao e retroativa e nao retrocede o status operacional.
const STATUS_BLOQUEIA_APROVACAO = new Set([
  'FINALIZADA',
  'CANCELADA',
  'REJEITADA',
  'APROVADA_TECNICA',
]);

// Status do fluxo padrao - usado para destacar quando a aprovacao
// avancara o workflow vs quando sera apenas regularizacao retroativa.
const STATUS_FLUXO_PADRAO = new Set([
  'AGUARDANDO_APROVACAO_TECNICA',
  'FILA',
  'PARCIALMENTE_LIBERADA',
]);

function StatusCell({ os }: { os: OrdemServico }) {
  const [modalOpen, setModalOpen] = useState(false);
  const status = (os.status || '').toUpperCase();
  const config = getStatusConfig(status);
  const inativa = os.ativo === false;
  const clicavel = status === 'PARCIALMENTE_LIBERADA';

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {clicavel ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex"
            title="Ver detalhe da liberação por produto"
          >
            <Badge variant={config.variant} className={`${config.color} cursor-pointer hover:opacity-90`}>
              {config.label}
            </Badge>
          </button>
        ) : (
          <Badge variant={config.variant} className={config.color}>
            {config.label}
          </Badge>
        )}
        {inativa && (
          <Badge variant="outline" className="text-muted-foreground">
            Inativa
          </Badge>
        )}
      </div>
      <OsDetalheModals
        osId={os.id}
        osNumero={os.numero}
        tipo="liberacao"
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

function ArteStatusCell({ os }: { os: OrdemServico }) {
  const [modalOpen, setModalOpen] = useState(false);
  const resumo = os.arte_resumo;

  if (!resumo || resumo.status_agregado === 'NAO_APLICA') {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const cores: Record<string, string> = {
    OK: 'bg-green-50 text-green-700 border-green-200',
    PENDENTE: 'bg-amber-50 text-amber-800 border-amber-200',
    PARCIAL: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex"
        title="Ver status de arte por produto"
      >
        <Badge
          variant="outline"
          className={`cursor-pointer hover:opacity-90 ${cores[resumo.status_agregado] || ''}`}
        >
          <Palette className="h-3 w-3 mr-1" />
          {resumo.label}
        </Badge>
      </button>
      <OsDetalheModals
        osId={os.id}
        osNumero={os.numero}
        tipo="arte"
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

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

  // PENDENTE: bloqueia apenas em status terminais (ja decididos ou cancelados).
  // Para os demais (inclusive PRODUCAO, ACABAMENTO etc. em dados legados),
  // permite aprovacao retroativa - o backend mantem o status operacional.
  if (STATUS_BLOQUEIA_APROVACAO.has(statusOs)) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-50 text-gray-600 border-gray-200"
        title="OS em status terminal - nao aprovavel"
      >
        Pendente
      </Badge>
    );
  }

  const eFluxoPadrao = STATUS_FLUXO_PADRAO.has(statusOs);
  const eLiberarRestante = statusOs === 'PARCIALMENTE_LIBERADA';

  if (eLiberarRestante && aprovacao === 'PENDENTE') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAprovar(os)}
        className="h-8"
        title="Liberar produtos restantes para produção"
      >
        <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
        Liberar restante
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onAprovar(os)}
      className="h-8"
      title={
        eFluxoPadrao
          ? 'Aprovar e liberar para producao'
          : 'OS ja avancou no operacional - aprovacao registrara a decisao sem alterar o status'
      }
    >
      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
      Aprovar OS
    </Button>
  );
}

// Componente: dropdown de acoes secundarias
function AcoesDropdown({
  os,
  onInativar,
  onReativar,
}: {
  os: OrdemServico;
  onInativar: (id: string, motivo: string) => Promise<void>;
  onReativar: (id: string) => Promise<void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const inativa = os.ativo === false;

  const handleConfirmInativar = async () => {
    const motivoLimpo = motivo.trim();
    if (!motivoLimpo) return;
    try {
      setProcessando(true);
      await onInativar(os.id, motivoLimpo);
      setConfirmOpen(false);
      setMotivo('');
    } finally {
      setProcessando(false);
    }
  };

  const handleReativar = async () => {
    try {
      setProcessando(true);
      await onReativar(os.id);
    } finally {
      setProcessando(false);
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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/os/${os.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Link>
          </DropdownMenuItem>
          {!inativa && (
            <>
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
                Inativar
              </DropdownMenuItem>
            </>
          )}
          {inativa && (
            <DropdownMenuItem onClick={() => void handleReativar()} disabled={processando}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {processando ? 'Reativando...' : 'Reativar'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inativar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              A OS #{os.numero} sairá do PCP, expedição e alertas. Os dados
              permanecem no sistema e podem ser reativados depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`motivo-inativar-${os.id}`}>Motivo</Label>
            <Textarea
              id={`motivo-inativar-${os.id}`}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: OS de teste — limpeza solicitada"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={processando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmInativar()}
              disabled={processando || !motivo.trim()}
            >
              {processando ? 'Inativando...' : 'Inativar OS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const createColumns = (
  onInativar: (id: string, motivo: string) => Promise<void>,
  onReativar: (id: string) => Promise<void>,
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
    cell: ({ row }) => <StatusCell os={row.original} />,
  },
  {
    id: 'arte_status',
    header: 'Arte Status',
    cell: ({ row }) => <ArteStatusCell os={row.original} />,
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
      return <AcoesDropdown os={os} onInativar={onInativar} onReativar={onReativar} />;
    },
  },
];
