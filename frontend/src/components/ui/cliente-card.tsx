'use client';

import { Cliente } from '@/app/(main)/clientes/columns';
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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClienteCardProps {
  cliente: Cliente;
  onDelete: (id: string) => void;
}

export function ClienteCard({ cliente, onDelete }: ClienteCardProps) {
  const router = useRouter();
  const fichaHref = `/clientes/${cliente.id}`;
  const novoOrcamentoHref = `/orcamentos-v2/novo?cliente_id=${cliente.id}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200';
      case 'PROSPECT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200';
      case 'INATIVO':
        return 'bg-muted text-muted-foreground';
      case 'BLOQUEADO':
        return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const abrirFicha = () => router.push(fichaHref);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={abrirFicha}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          abrirFicha();
        }
      }}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 space-y-3 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3
            className="font-medium text-foreground truncate pr-8"
            title={cliente.nome}
          >
            {cliente.nome}
          </h3>
          <div className="flex gap-2 mt-1">
            <Badge className={getStatusColor(cliente.status_cliente)}>
              {cliente.status_cliente}
            </Badge>
            <Badge variant="outline">
              {cliente.tipo_pessoa === 'PESSOA_FISICA' ? 'P. Física' : 'P. Jurídica'}
            </Badge>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={fichaHref}>Ver ficha</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={novoOrcamentoHref}>
                  <FileText className="mr-2 h-4 w-4" />
                  Novo orçamento
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/clientes/editar/${cliente.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar cadastro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(cliente.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>{cliente.documento}</span>
        </div>
        {cliente.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{cliente.email}</span>
          </div>
        )}
        {cliente.telefone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{cliente.telefone}</span>
          </div>
        )}
        {cliente.cidade && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{cliente.cidade}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Desde: {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div
        className="flex gap-1 pt-2 border-t border-border"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={novoOrcamentoHref}>
            <FileText className="h-4 w-4 mr-1" />
            Orçamento
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clientes/editar/${cliente.id}`}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Link>
        </Button>
      </div>
    </div>
  );
}
