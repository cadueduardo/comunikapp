'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Pencil, UserMinus, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiRequest } from '@/lib/api';
import { extrairListaPaginada } from '@/lib/lista-paginada';
import { toast } from 'sonner';

type UsuarioVinculo = {
  usuario_id: string;
  usuario: {
    id: string;
    nome_completo: string;
    email: string;
    status: string;
  };
};

type PerfilDetalhe = {
  id: string;
  nome: string;
  descricao?: string | null;
  sistema: boolean;
  ativo: boolean;
  versao?: number;
  usuarios: UsuarioVinculo[];
};

type UsuarioOpcao = {
  id: string;
  nome_completo: string;
  email: string;
};

export default function PerfilDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [usuarioId, setUsuarioId] = useState('');
  const [opcoes, setOpcoes] = useState<UsuarioOpcao[]>([]);
  const [remover, setRemover] = useState<UsuarioVinculo | null>(null);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/usuarios/perfis/${id}`);
      if (!res.ok) {
        throw new Error('Perfil não encontrado');
      }
      setPerfil(await res.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar');
      router.replace('/usuarios/perfis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, [id]);

  useEffect(() => {
    const loadUsuarios = async () => {
      const res = await apiRequest('/usuarios?limit=100');
      if (!res.ok) return;
      const lista = extrairListaPaginada<UsuarioOpcao>(await res.json());
      setOpcoes(lista.items);
    };
    void loadUsuarios();
  }, []);

  const associar = async () => {
    if (!usuarioId) {
      toast.error('Selecione um usuário');
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest(`/usuarios/perfis/${id}/usuarios/${usuarioId}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Não foi possível associar');
      }
      toast.success('Usuário associado');
      setUsuarioId('');
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao associar');
    } finally {
      setSaving(false);
    }
  };

  const confirmarRemocao = async () => {
    if (!remover) return;
    setSaving(true);
    try {
      const res = await apiRequest(
        `/usuarios/perfis/${id}/usuarios/${remover.usuario.id}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Não foi possível desassociar');
      }
      toast.success('Usuário desassociado');
      setRemover(null);
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desassociar');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !perfil) {
    return (
      <div>
        <PageHeader
          title="Perfil"
          backHref="/usuarios/perfis"
          icon={<Shield className="h-8 w-8" />}
        />
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={perfil.nome}
        backHref="/usuarios/perfis"
        icon={<Shield className="h-8 w-8" />}
        subtitle={perfil.descricao || 'Perfil de acesso'}
        actions={
          perfil.sistema ? null : (
            <Button asChild>
              <Link href={`/usuarios/perfis/${perfil.id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Tipo</span>
            <Badge variant={perfil.sistema ? 'outline' : 'secondary'}>
              {perfil.sistema ? 'Sistema' : 'Customizado'}
            </Badge>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={perfil.ativo ? 'default' : 'secondary'}>
              {perfil.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários associados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="associar-usuario">
              Usuário para associar
            </label>
            <select
              id="associar-usuario"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
            >
              <option value="">Selecionar usuário</option>
              {opcoes
                .filter(
                  (opcao) =>
                    !perfil.usuarios.some((v) => v.usuario.id === opcao.id),
                )
                .map((opcao) => (
                  <option key={opcao.id} value={opcao.id}>
                    {opcao.nome_completo} ({opcao.email})
                  </option>
                ))}
            </select>
            <Button onClick={() => void associar()} disabled={saving || !usuarioId}>
              <UserPlus className="mr-2 h-4 w-4" />
              Associar
            </Button>
          </div>
          {perfil.usuarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum usuário associado a este perfil.
            </p>
          ) : (
            <ul className="space-y-2">
              {perfil.usuarios.map((vinculo) => (
                <li
                  key={vinculo.usuario.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{vinculo.usuario.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">{vinculo.usuario.email}</p>
                  </div>
                  {!perfil.sistema && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRemover(vinculo)}
                    >
                      <UserMinus className="mr-1 h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!remover}
        title="Desassociar usuário"
        description={
          remover
            ? `Remover ${remover.usuario.nome_completo} deste perfil?`
            : ''
        }
        confirmText="Desassociar"
        cancelText="Cancelar"
        loading={saving}
        onCancel={() => setRemover(null)}
        onConfirm={confirmarRemocao}
      />
    </div>
  );
}
