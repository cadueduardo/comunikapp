'use client';

import { useEffect, useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
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

export default function NovoPerfilPage() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [modulos, setModulos] = useState<ModuloCatalogoUi[]>([]);
  const [decisoes, setDecisoes] = useState<Record<string, Decisao>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/usuarios/perfis/catalogo');
        if (!res.ok) {
          throw new Error('Não foi possível carregar o catálogo de permissões');
        }
        const json = await res.json();
        const lista = (json.modulos ?? []) as ModuloCatalogoUi[];
        setModulos(lista);
        const inicial: Record<string, Decisao> = {};
        for (const modulo of lista) {
          for (const permissao of modulo.permissoes) {
            inicial[permissao.chave] = 'NAO_REVISADA';
          }
        }
        setDecisoes(inicial);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao carregar catálogo',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

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
      const res = await apiRequest('/usuarios/perfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          permissoes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Erro ao salvar perfil');
      }
      toast.success('Perfil criado');
      window.location.href = '/usuarios/perfis';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrudPage
      header={
        <PageHeader
          title="Novo Perfil de Acesso"
          backHref="/usuarios/perfis"
          icon={<Shield className="h-8 w-8" />}
          subtitle="Permissões vêm do catálogo da API; não há matriz CRUD genérica."
          actions={
            <Link href="/usuarios/perfis">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
            </Link>
          }
        />
      }
      table={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="perfil-nome">
                  Nome do Perfil
                </label>
                <Input
                  id="perfil-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Gerente de Produção"
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
                  placeholder="Descreva as responsabilidades deste perfil"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando catálogo…</p>
          ) : (
            <MatrizPermissoesPerfil
              modulos={modulos}
              decisoes={decisoes}
              onChange={(chave, estado) =>
                setDecisoes((prev) => ({ ...prev, [chave]: estado }))
              }
            />
          )}

          <div className="flex justify-end space-x-2">
            <Link href="/usuarios/perfis">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button onClick={salvar} disabled={saving || loading}>
              {saving ? 'Salvando…' : 'Salvar Perfil'}
            </Button>
          </div>
        </div>
      }
    />
  );
}
