'use client';

import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PerfilAcoesMenu } from '@/components/usuarios/PerfilAcoesMenu';
import type { PerfilRow } from '@/app/(main)/usuarios/perfis/columns';

export function PerfilCard({
  perfil,
  onExcluir,
  removingId,
}: {
  perfil: PerfilRow;
  onExcluir: (perfil: PerfilRow) => void;
  removingId?: string | null;
}) {
  return (
    <article className="space-y-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium">{perfil.nome}</h3>
          {perfil.descricao ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {perfil.descricao}
            </p>
          ) : null}
        </div>
        <PerfilAcoesMenu
          perfil={perfil}
          onExcluir={onExcluir}
          removingId={removingId}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={perfil.ativo ? 'default' : 'secondary'}>
          {perfil.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
        {perfil.sistema ? <Badge variant="outline">Sistema</Badge> : null}
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {perfil.usuariosCount} usuário(s)
        </span>
      </div>
    </article>
  );
}
