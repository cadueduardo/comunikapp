'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UsuarioCamposAcesso } from '@/components/usuarios/UsuarioCamposAcesso';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';

const STATUS = [
  'ATIVO',
  'INATIVO',
  'PENDENTE_VERIFICACAO',
  'BLOQUEADO',
] as const;

type UsuarioProtecoes = {
  ehProprio: boolean;
  ehUltimoAdministradorAtivo: boolean;
  podeAlterarFuncao: boolean;
  podeAlterarPerfis: boolean;
  podeAlterarStatus: boolean;
};

type UsuarioForm = {
  nome_completo: string;
  email: string;
  telefone: string;
  funcao: string;
  status: string;
  perfilIds: string[];
};

function montarMotivoBloqueio(protecoes: UsuarioProtecoes | null): string | null {
  if (!protecoes) return null;
  if (protecoes.ehProprio && protecoes.ehUltimoAdministradorAtivo) {
    return 'Esta é a sua conta e o único administrador ativo da loja. Função, perfis e status ficam bloqueados para evitar perda do acesso master. Nome, e-mail e telefone podem ser editados.';
  }
  if (protecoes.ehProprio) {
    return 'Você não pode alterar a própria função, perfis ou status. Nome, e-mail e telefone podem ser editados.';
  }
  if (protecoes.ehUltimoAdministradorAtivo) {
    return 'Este é o único administrador ativo da loja. Função e status só podem mudar depois que existir outro administrador ativo.';
  }
  return null;
}

export default function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UsuarioForm>({
    nome_completo: '',
    email: '',
    telefone: '',
    funcao: 'VENDAS',
    status: 'ATIVO',
    perfilIds: [],
  });
  const [protecoes, setProtecoes] = useState<UsuarioProtecoes | null>(null);
  const isAdmin = currentUser?.funcao === 'ADMINISTRADOR';

  useEffect(() => {
    if (userLoading) return;
    if (!isAdmin) {
      toast.error('Somente administradores podem editar usuários');
      router.replace('/usuarios/gestao');
    }
  }, [userLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin || userLoading) return;
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
          setForm({
            nome_completo: data.nome_completo ?? '',
            email: data.email ?? '',
            telefone: data.telefone ?? '',
            funcao: data.funcao ?? 'VENDAS',
            status: data.status ?? 'ATIVO',
            perfilIds: Array.isArray(data.perfis)
              ? data.perfis
                  .map(
                    (p: {
                      perfil_id?: string;
                      perfil?: { id: string };
                    }) => p.perfil_id || p.perfil?.id,
                  )
                  .filter(Boolean)
              : [],
          });
          setProtecoes(
            data.protecoes && typeof data.protecoes === 'object'
              ? {
                  ehProprio: Boolean(data.protecoes.ehProprio),
                  ehUltimoAdministradorAtivo: Boolean(
                    data.protecoes.ehUltimoAdministradorAtivo,
                  ),
                  podeAlterarFuncao: Boolean(data.protecoes.podeAlterarFuncao),
                  podeAlterarPerfis: Boolean(data.protecoes.podeAlterarPerfis),
                  podeAlterarStatus: Boolean(data.protecoes.podeAlterarStatus),
                }
              : null,
          );
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
  }, [id, isAdmin, userLoading, router]);

  const motivoBloqueio = useMemo(
    () => montarMotivoBloqueio(protecoes),
    [protecoes],
  );

  const handleSave = async () => {
    if (!form.nome_completo?.trim() || !form.email?.trim()) {
      toast.error('Preencha nome e e-mail');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nome_completo: form.nome_completo.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || undefined,
      };
      if (protecoes?.podeAlterarFuncao !== false) {
        payload.funcao = form.funcao;
      }
      if (protecoes?.podeAlterarStatus !== false) {
        payload.status = form.status;
      }
      if (protecoes?.podeAlterarPerfis !== false) {
        payload.perfilIds = form.perfilIds;
      }

      const res = await apiRequest(`/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Erro ao salvar');
      }
      toast.success('Usuário atualizado');
      router.push(`/usuarios/${id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading || !isAdmin) {
    return (
      <div>
        <PageHeader
          title="Editar usuário"
          backHref="/usuarios/gestao"
          icon={<Users className="h-8 w-8" />}
        />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const statusBloqueado = protecoes?.podeAlterarStatus === false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar usuário"
        backHref={`/usuarios/${id}`}
        icon={<Users className="h-8 w-8" />}
      />
      <div className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome completo</Label>
          <Input
            id="nome"
            value={form.nome_completo}
            onChange={(e) =>
              setForm((f) => ({ ...f, nome_completo: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tel">Telefone</Label>
          <Input
            id="tel"
            value={form.telefone}
            onChange={(e) =>
              setForm((f) => ({ ...f, telefone: e.target.value }))
            }
          />
        </div>
        <UsuarioCamposAcesso
          funcao={form.funcao}
          onFuncaoChange={(funcao) => setForm((f) => ({ ...f, funcao }))}
          perfilIds={form.perfilIds}
          onPerfilIdsChange={(perfilIds) =>
            setForm((f) => ({ ...f, perfilIds }))
          }
          podeConcederAdmin={isAdmin}
          disabled={saving}
          bloquearFuncao={protecoes?.podeAlterarFuncao === false}
          bloquearPerfis={protecoes?.podeAlterarPerfis === false}
          motivoBloqueioPrivilegio={motivoBloqueio}
        />
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
            disabled={saving || statusBloqueado}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusBloqueado ? (
            <p className="text-xs text-muted-foreground">
              O status desta conta não pode ser alterado neste momento.
            </p>
          ) : null}
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/usuarios/${id}`)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
