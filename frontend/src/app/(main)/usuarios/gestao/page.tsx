'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, Plus, RefreshCw, List, Grid3X3 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import { usuarioColumns, UsuarioRow } from '../columns';
import { useIsMobile } from '@/hooks/use-media-query';

export default function UsuariosGestaoPage() {
  const [data, setData] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const isMobile = useIsMobile();

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

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

  const getStatusBadge = (status: string) => {
    const variant = status === 'ATIVO' ? 'default' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getFuncaoBadge = (funcao: string) => {
    const colors: { [key: string]: string } = {
      'ADMINISTRADOR': 'bg-red-100 text-red-800',
      'FINANCEIRO': 'bg-blue-100 text-blue-800',
      'PRODUCAO': 'bg-green-100 text-green-800',
      'VENDAS': 'bg-purple-100 text-purple-800',
      'ESTOQUE': 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[funcao] || 'bg-gray-100 text-gray-800'}`}>
        {funcao}
      </span>
    );
  };

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
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4 mr-2" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Cards
              </Button>
            </div>
          )}
        </div>
      }
      table={
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((usuario) => (
              <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{usuario.nome_completo}</CardTitle>
                      <p className="text-sm text-muted-foreground">{usuario.email}</p>
                    </div>
                    {getStatusBadge(usuario.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Função:</span>
                      {getFuncaoBadge(usuario.funcao)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Status:</span>
                      <span className="text-sm text-muted-foreground">{usuario.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/usuarios/${usuario.id}`}>
                        <Users className="w-4 h-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/usuarios/${usuario.id}/editar`}>
                        <Users className="w-4 h-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <DataTable<UsuarioRow, any> columns={usuarioColumns} data={filtered} />
        )
      }
    />
  );
}
