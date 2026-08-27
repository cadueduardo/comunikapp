'use client';

import React, { useEffect, useState } from 'react';
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
import { apiRequest } from '@/lib/api';
import { extrairListaPaginada } from '@/lib/lista-paginada';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';

const FUNCOES = [
  'ADMINISTRADOR',
  'FINANCEIRO',
  'PRODUCAO',
  'VENDAS',
  'ESTOQUE',
] as const;

const STATUS = [
  'ATIVO',
  'INATIVO',
  'PENDENTE_VERIFICACAO',
  'BLOQUEADO',
] as const;

type UsuarioForm = {
  nome_completo: string;
  email: string;
  telefone: string;
  funcao: string;
  status: string;
  perfilIds: string[];
};

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
  const [perfis, setPerfis] = useState<{ id: string; nome: string }[]>([]);

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
              ? data.perfis.map((p: { perfil_id?: string; perfil?: { id: string } }) =>
                  p.perfil_id || p.perfil?.id,
                ).filter(Boolean)
              : [],
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
  }, [id, isAdmin, userLoading, router]);

  useEffect(() => {
    const loadPerfis = async () => {
      const res = await apiRequest('/usuarios/perfis?limit=100');
      if (!res.ok) return;
      const lista = extrairListaPaginada<{ id: string; nome: string }>(
        await res.json(),
      );
      setPerfis(lista.items);
    };
    void loadPerfis();
  }, []);

  const handleSave = async () => {
    if (!form.nome_completo?.trim() || !form.email?.trim()) {
      toast.error('Preencha nome e e-mail');
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest(`/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: form.nome_completo.trim(),
          email: form.email.trim(),
          telefone: form.telefone.trim() || undefined,
          funcao: form.funcao,
          status: form.status,
          perfilIds: form.perfilIds,
        }),
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar usuário"
        backHref={`/usuarios/${id}`}
        icon={<Users className="h-8 w-8" />}
      />
      <div className="rounded-lg border bg-white p-6 max-w-xl space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome completo</Label>
          <Input
            id="nome"
            value={form.nome_completo}
            onChange={(e) => setForm((f) => ({ ...f, nome_completo: e.target.value }))}
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
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label>Função</Label>
          <Select
            value={form.funcao}
            onValueChange={(v) => setForm((f) => ({ ...f, funcao: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FUNCOES.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
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
        </div>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Perfis</legend>
          {perfis.map((perfil) => (
            <label key={perfil.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.perfilIds.includes(perfil.id)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    perfilIds: e.target.checked
                      ? [...f.perfilIds, perfil.id]
                      : f.perfilIds.filter((idAtual) => idAtual !== perfil.id),
                  }))
                }
              />
              {perfil.nome}
            </label>
          ))}
        </fieldset>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => router.push(`/usuarios/${id}`)} disabled={saving}>
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
