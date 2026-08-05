'use client';

import {
  Building2,
  Calendar,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  ClienteAcoesMenu,
  type Cliente,
} from '@/app/(main)/clientes/columns';
import type { ClienteApi } from '@/lib/api-client';

interface ClienteCardProps {
  cliente: Cliente | ClienteApi;
  onInativar?: (cliente: ClienteApi) => void;
  onTransferir?: (cliente: ClienteApi) => void;
  podeEditar?: boolean;
  /** @deprecated use onInativar */
  onDelete?: (id: string) => void;
}

function statusClienteClass(status: string) {
  switch (status) {
    case 'ATIVO':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
    case 'PROSPECT':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200';
    case 'INATIVO':
      return 'bg-muted text-muted-foreground';
    case 'BLOQUEADO':
      return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function ClienteCard({
  cliente,
  onInativar,
  onTransferir,
  podeEditar = true,
  onDelete,
}: ClienteCardProps) {
  const router = useRouter();
  const fichaHref = `/clientes/${cliente.id}`;

  const handleInativar = onInativar
    ? onInativar
    : onDelete
      ? (c: ClienteApi) => onDelete(c.id)
      : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(fichaHref)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(fichaHref);
        }
      }}
      className="cursor-pointer space-y-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate pr-2 font-medium text-foreground" title={cliente.nome}>
            {cliente.nome}
          </h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge className={statusClienteClass(cliente.status_cliente)}>
              {cliente.status_cliente}
            </Badge>
            <Badge variant="outline">
              {cliente.tipo_pessoa === 'PESSOA_FISICA'
                ? 'P. Física'
                : 'P. Jurídica'}
            </Badge>
          </div>
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ClienteAcoesMenu
            cliente={cliente}
            onInativar={handleInativar}
            onTransferir={onTransferir}
            podeEditar={podeEditar}
          />
        </div>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{cliente.documento}</span>
        </div>
        {cliente.responsavel_comercial?.nome ? (
          <div className="truncate">
            Responsável comercial: {cliente.responsavel_comercial.nome}
          </div>
        ) : (
          <div>Sem responsável comercial</div>
        )}
        {cliente.email ? (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{cliente.email}</span>
          </div>
        ) : null}
        {cliente.telefone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{cliente.telefone}</span>
          </div>
        ) : null}
        {cliente.cidade ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {cliente.cidade}
              {cliente.estado ? `/${cliente.estado}` : ''}
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            Desde {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
}
