'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

export default function NovoUsuarioPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

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
          funcao: 'ADMINISTRADOR',
          senha,
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
            <Input id="novo-usuario-funcao" value="ADMINISTRADOR" disabled />
            <p className="text-xs text-muted-foreground">
              Nesta fase inicial, todos os usuários criados terão perfil
              ADMINISTRADOR.
            </p>
          </div>
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
