'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';

type UsuarioDetalhe = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  funcao: string;
  status: string;
  email_verificado?: boolean;
};

export default function UsuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [usuario, setUsuario] = useState<UsuarioDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.funcao === 'ADMINISTRADOR';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/usuarios/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error('Usuário não encontrado');
            router.replace('/usuarios/gestao');
            return;
          }
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || 'Erro ao carregar usuário');
        }
        const data = await res.json();
        if (!cancelled) {
          setUsuario({
            id: data.id,
            nome_completo: data.nome_completo,
            email: data.email,
            telefone: data.telefone ?? null,
            funcao: data.funcao,
            status: data.status,
            email_verificado: data.email_verificado,
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erro ao carregar usuário';
        toast.error(msg);
        router.replace('/usuarios/gestao');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (loading || !usuario) {
    return (
      <div className="p-6">
        <PageHeader
          title="Usuário"
          backHref="/usuarios/gestao"
          icon={<Users className="h-8 w-8" />}
        />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={usuario.nome_completo}
        backHref="/usuarios/gestao"
        icon={<Users className="h-8 w-8" />}
        subtitle={usuario.email}
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href={`/usuarios/${usuario.id}/editar`}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          ) : null
        }
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">Dados do usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Nome</span>
            <span className="font-medium text-right">{usuario.nome_completo}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">E-mail</span>
            <span className="font-medium text-right break-all">{usuario.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Telefone</span>
            <span className="font-medium text-right">{usuario.telefone || '—'}</span>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <span className="text-muted-foreground">Função</span>
            <Badge variant="secondary">{usuario.funcao}</Badge>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={usuario.status === 'ATIVO' ? 'default' : 'secondary'}>
              {usuario.status}
            </Badge>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <span className="text-muted-foreground">E-mail verificado</span>
            <span>{usuario.email_verificado ? 'Sim' : 'Não'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
