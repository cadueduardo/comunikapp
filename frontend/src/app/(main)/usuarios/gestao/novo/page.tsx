'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UsuarioCamposAcesso } from '@/components/usuarios/UsuarioCamposAcesso';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';

export default function NovoUsuarioPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const atorPodeConcederAdmin = currentUser?.funcao === 'ADMINISTRADOR';
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [funcao, setFuncao] = useState('VENDAS');
  const [perfilIds, setPerfilIds] = useState<string[]>([]);
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
          funcao,
          senha,
          perfilIds,
        }),
      });
      if (res.ok) {
        toast.success('Usuário criado e ativo');
        router.push('/usuarios/gestao');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(
          typeof err?.message === 'string'
            ? err.message
            : 'Erro ao criar usuário',
        );
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar usuário');
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
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 max-w-xl">
          <Alert>
            <AlertDescription>
              O convite por e-mail (sem definir senha) agora é feito apenas pela
              Gestão ComunikApp. Nesta tela você cria o usuário já ativo,
              informando a senha inicial.
            </AlertDescription>
          </Alert>
        </div>
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-2">
            <Label htmlFor="novo-usuario-nome">Nome completo</Label>
            <Input
              id="novo-usuario-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Maria Souza"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="novo-usuario-email">E-mail</Label>
            <Input
              id="novo-usuario-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="novo-usuario-telefone">Telefone (opcional)</Label>
            <Input
              id="novo-usuario-telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <UsuarioCamposAcesso
            funcao={funcao}
            onFuncaoChange={setFuncao}
            perfilIds={perfilIds}
            onPerfilIdsChange={setPerfilIds}
            podeConcederAdmin={atorPodeConcederAdmin}
            disabled={loading}
          />
          <div className="grid gap-2">
            <Label htmlFor="novo-usuario-senha">Senha inicial</Label>
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
              onClick={() => router.push('/usuarios/gestao')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()} disabled={loading}>
              Criar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
