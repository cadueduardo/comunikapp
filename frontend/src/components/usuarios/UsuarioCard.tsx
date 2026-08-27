'use client';

import { Mail, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UsuarioAcoesMenu } from '@/components/usuarios/UsuarioAcoesMenu';
import type { UsuarioRow } from '@/app/(main)/usuarios/columns';

export function UsuarioCard({
  usuario,
  onDesativar,
  onReativar,
  removingId,
}: {
  usuario: UsuarioRow;
  onDesativar: (usuario: UsuarioRow) => void;
  onReativar: (usuario: UsuarioRow) => void;
  removingId?: string | null;
}) {
  return (
    <article className="space-y-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium">{usuario.nome_completo}</h3>
          <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {usuario.email}
          </p>
        </div>
        <UsuarioAcoesMenu
          usuario={usuario}
          onDesativar={onDesativar}
          onReativar={onReativar}
          removingId={removingId}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          {usuario.funcao}
        </Badge>
        <Badge variant={usuario.status === 'ATIVO' ? 'default' : 'secondary'}>
          {usuario.status}
        </Badge>
      </div>
    </article>
  );
}
