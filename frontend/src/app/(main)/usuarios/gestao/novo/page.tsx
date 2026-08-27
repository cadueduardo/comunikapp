'use client';

import { useEffect, useState } from 'react';
import { extrairListaPaginada } from '@/lib/lista-paginada';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';

const ROTULOS_FUNCAO: Record<string, string> = {
  VENDAS: 'Vendas',
  FINANCEIRO: 'Financeiro',
  PRODUCAO: 'Produção',
  ESTOQUE: 'Estoque',
  ADMINISTRADOR: 'Administrador',
};

export default function NovoUsuarioPage() {
  const { user: currentUser } = useUser();
  const atorPodeConcederAdmin = currentUser?.funcao === 'ADMINISTRADOR';
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [funcao, setFuncao] = useState('VENDAS');
  const [perfilIds, setPerfilIds] = useState<string[]>([]);
  const [perfis, setPerfis] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await apiRequest('/usuarios/perfis?limit=100');
      if (!res.ok) return;
      const lista = extrairListaPaginada<{ id: string; nome: string }>(
        await res.json(),
      );
      setPerfis(lista.items);
    };
    void load();
  }, []);

  const handleCreate = async () => {
    if (!nome || !email) {
      toast.error('Preencha nome e e-mail');
      return;
    }
    if (senha.length < 8) {
      toast.error('A senha deve ter ao menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: nome,
          email,
          telefone: telefone || undefined,
          funcao,
          senha,
          perfilIds,
        }),
      });
      if (res.ok) {
        toast.success('Usuário criado e ativo');
        window.location.href = '/usuarios/gestao';
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.message || 'Erro ao criar usuário');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Usuário"
        backHref="/usuarios/gestao"
        icon={<Users className="h-8 w-8" />}
      />
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 max-w-xl">
          <Alert>
            <AlertDescription>
              O convite por e-mail (sem definir senha) agora é feito apenas pela
              Gestão ComunikApp. Nesta tela você cria o usuário já ativo,
              informando a senha inicial.
            </AlertDescription>
          </Alert>
        </div>
        <div className="grid max-w-xl gap-3">
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="novo-usuario-nome">
              Nome completo
            </label>
            <Input
              id="novo-usuario-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Maria Souza"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="novo-usuario-email">
              E-mail
            </label>
            <Input
              id="novo-usuario-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="novo-usuario-telefone">
              Telefone (opcional)
            </label>
            <Input
              id="novo-usuario-telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="novo-usuario-funcao">
              Função
            </label>
            <select
              id="novo-usuario-funcao"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
            >
              {(['VENDAS', 'FINANCEIRO', 'PRODUCAO', 'ESTOQUE'] as const).map(
                (valor) => (
                  <option key={valor} value={valor}>
                    {ROTULOS_FUNCAO[valor]}
                  </option>
                ),
              )}
              {atorPodeConcederAdmin ? (
                <option value="ADMINISTRADOR">
                  {ROTULOS_FUNCAO.ADMINISTRADOR}
                </option>
              ) : null}
            </select>
            <p className="text-xs text-muted-foreground">
              A função define o piso temporário. Permissões granulares vêm dos
              perfis. Somente um administrador da loja pode conceder a função
              de administrador.
            </p>
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm">Perfis (opcional)</legend>
            {perfis.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum perfil disponível ainda.
              </p>
            ) : (
              perfis.map((perfil) => (
                <label key={perfil.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={perfilIds.includes(perfil.id)}
                    onChange={(e) =>
                      setPerfilIds((atual) =>
                        e.target.checked
                          ? [...atual, perfil.id]
                          : atual.filter((id) => id !== perfil.id),
                      )
                    }
                  />
                  {perfil.nome}
                </label>
              ))
            )}
          </fieldset>
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="novo-usuario-senha">
              Senha inicial
            </label>
            <Input
              id="novo-usuario-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mín. 8 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/usuarios/gestao')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              Criar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
