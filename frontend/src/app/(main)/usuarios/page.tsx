'use client';

import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/crud/DataTable';
import { usuarioColumns, UsuarioRow } from './columns';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Plus } from 'lucide-react';
import { UsuarioFormDialog } from './UsuarioFormDialog';
import { PerfilAccessList } from './PerfilAccessList';

export default function UsuariosPage() {
  const [data, setData] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/usuarios');
      if (res.ok) {
        const json = await res.json();
        const rows: UsuarioRow[] = (json || []).map((u: any) => ({
          id: u.id,
          nome_completo: u.nome_completo,
          email: u.email,
          funcao: u.funcao,
          status: u.status,
        }));
        setData(rows);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (u) =>
        u.nome_completo.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.funcao || '').toLowerCase().includes(s) ||
        (u.status || '').toLowerCase().includes(s),
    );
  }, [data, search]);

  return (
    <>
    <CrudPage
      header={
        <PageHeader
          title="Usuários"
          backHref="/dashboard"
          icon={<Users className="h-8 w-8" />}
          subtitle="Gestão de usuários"
          actions={
            <>
              <Button variant="outline" onClick={fetchUsuarios} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
              <Button onClick={() => setOpenDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Novo Usuário
              </Button>
            </>
          }
        />
      }
      toolbar={
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nome, e-mail, função..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      }
      table={
        <div className="space-y-4">
          <PerfilAccessList />
          <DataTable<UsuarioRow, any> columns={usuarioColumns} data={filtered} />
        </div>
      }
    />
    <UsuarioFormDialog open={openDialog} onOpenChange={setOpenDialog} onCreated={fetchUsuarios} />
    </>
  );
}


