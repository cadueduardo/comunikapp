'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/crud/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { usuarioColumns, UsuarioRow } from '../columns';

export default function UsuariosGestaoPage() {
  const [data, setData] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

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
    <CrudPage
      header={
        <PageHeader
          title="Gestão de Usuários"
          backHref="/usuarios"
          icon={<Users className="h-8 w-8" />}
          subtitle="Cadastre e gerencie usuários da sua loja"
          actions={
            <>
              <Button variant="outline" onClick={fetchUsuarios} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
              <Link href="/usuarios/gestao/novo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Novo Usuário
                </Button>
              </Link>
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
      table={<DataTable<UsuarioRow, any> columns={usuarioColumns} data={filtered} />}
    />
  );
}


