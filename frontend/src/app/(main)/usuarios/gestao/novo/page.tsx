'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

export default function NovoUsuarioPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [definirSenha, setDefinirSenha] = useState(false);
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!nome || !email) {
      toast.error('Preencha nome e e-mail');
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        nome_completo: nome,
        email,
        telefone: telefone || undefined,
        funcao: 'ADMINISTRADOR',
      };
      if (definirSenha) {
        if (senha.length < 8) {
          toast.error('A senha deve ter ao menos 8 caracteres');
          setLoading(false);
          return;
        }
        payload.senha = senha;
      }
      const res = await apiRequest('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(definirSenha ? 'Usuário criado e ativo' : 'Convite enviado por e-mail');
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
      <PageHeader title="Novo Usuário" backHref="/usuarios/gestao" icon={<Users className="h-8 w-8" />} />
      <div className="rounded-lg border bg-white p-6">
        <div className="grid gap-3 max-w-xl">
          <div className="grid gap-1">
            <label className="text-sm">Nome completo</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Souza" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">E-mail</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Telefone (opcional)</label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Função</label>
            <Input value="ADMINISTRADOR" disabled />
            <p className="text-xs text-muted-foreground">
              Nesta fase inicial, todos os usuários criados terão perfil ADMINISTRADOR.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input id="definirSenha" type="checkbox" checked={definirSenha} onChange={(e) => setDefinirSenha(e.target.checked)} />
            <label htmlFor="definirSenha" className="text-sm">Definir senha agora (senão enviaremos convite por e-mail)</label>
          </div>
          {definirSenha && (
            <div className="grid gap-1">
              <label className="text-sm">Senha</label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mín. 8 caracteres" />
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => (window.location.href = '/usuarios/gestao')} disabled={loading}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={loading}>Criar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}




