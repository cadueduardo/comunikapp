'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

type Perfil = { id: string; nome: string; sistema: boolean; ativo: boolean };

export function PerfilAccessList() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);

  const load = async () => {
    const res = await apiRequest('/usuarios/perfis');
    if (res.ok) {
      const json = await res.json();
      setPerfis(json);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-medium mb-3">Perfis de Acesso</h3>
      <div className="flex flex-wrap gap-2">
        {perfis.map((p) => (
          <Badge key={p.id} variant={p.ativo ? 'default' : 'secondary'}>
            {p.nome}{p.sistema ? ' (sistema)' : ''}
          </Badge>
        ))}
      </div>
    </div>
  );
}




