'use client';

import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import {
  MatrizPermissoesPerfil,
  ModuloCatalogoUi,
} from '@/components/usuarios/MatrizPermissoesPerfil';

type Decisao = 'CONCEDIDA' | 'NEGADA' | 'NAO_REVISADA';

export default function EditarPerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [versao, setVersao] = useState<number | undefined>();
  const [modulos, setModulos] = useState<ModuloCatalogoUi[]>([]);
  const [decisoes, setDecisoes] = useState<Record<string, Decisao>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [perfilRes, catalogoRes] = await Promise.all([
          apiRequest(`/usuarios/perfis/${id}`),
          apiRequest(`/usuarios/perfis/catalogo?perfilId=${encodeURIComponent(id)}`),
        ]);
        if (!perfilRes.ok) {
          throw new Error('Perfil não encontrado');
        }
        if (!catalogoRes.ok) {
          throw new Error('Não foi possível carregar o catálogo');
        }
        const perfil = await perfilRes.json();
        if (perfil.sistema) {
          toast.error('Perfis de sistema não podem ser editados');
          router.replace(`/usuarios/perfis/${id}`);
          return;
        }
        setNome(perfil.nome ?? '');
        setDescricao(perfil.descricao ?? '');
        setAtivo(perfil.ativo !== false);
        setVersao(perfil.versao);
        const json = await catalogoRes.json();
        const lista = (json.modulos ?? []) as ModuloCatalogoUi[];
        setModulos(lista);
        const inicial: Record<string, Decisao> = {};
        for (const modulo of lista) {
          for (const permissao of modulo.permissoes) {
            inicial[permissao.chave] = permissao.estado;
          }
        }
        setDecisoes(inicial);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar');
        router.replace('/usuarios/perfis');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, router]);

  const salvar = async () => {
    if (nome.trim().length < 2) {
      toast.error('Informe o nome do perfil');
      return;
    }
    setSaving(true);
    try {
      const permissoes = Object.entries(decisoes)
        .filter(([, estado]) => estado !== 'NAO_REVISADA')
        .map(([chave, estado]) => {
          const [modulo, ...resto] = chave.split('.');
          return {
            modulo,
            acao: resto.join('.'),
            permitido: estado === 'CONCEDIDA',
          };
        });
      const res = await apiRequest(`/usuarios/perfis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          ativo,
          versao,
          permissoes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Erro ao salvar perfil');
      }
      toast.success('Perfil atualizado');
      router.push(`/usuarios/perfis/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar perfil"
        backHref={`/usuarios/perfis/${id}`}
        icon={<Shield className="h-8 w-8" />}
        subtitle="Permissões vêm do catálogo da API."
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="perfil-nome">
                  Nome
                </label>
                <Input
                  id="perfil-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="perfil-descricao">
                  Descrição
                </label>
                <Textarea
                  id="perfil-descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="mt-1"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                Perfil ativo
              </label>
            </CardContent>
          </Card>
          <MatrizPermissoesPerfil
            modulos={modulos}
            decisoes={decisoes}
            onChange={(chave, estado) =>
              setDecisoes((prev) => ({ ...prev, [chave]: estado }))
            }
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push(`/usuarios/perfis/${id}`)}>
              Cancelar
            </Button>
            <Button onClick={() => void salvar()} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
