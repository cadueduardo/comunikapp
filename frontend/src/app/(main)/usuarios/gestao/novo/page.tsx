'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/contexts/UserContext';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

export default function NovoUsuarioPage() {
  const { user } = useUser();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [funcao, setFuncao] = useState('VENDAS');
  const [definirSenha, setDefinirSenha] = useState(false);
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!nome || !email || !funcao) {
      toast.error('Preencha nome, e-mail e função');
      return;
    }
    const lojaId = (user as any)?.loja?.id || (user as any)?.loja_id;
    if (!lojaId) {
      toast.error('loja_id não encontrado');
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        nome_completo: nome,
        email,
        telefone: telefone || undefined,
        funcao,
        loja_id: lojaId,
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
    <div className="p-6 space-y-6">
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
            <select className="border rounded h-10 px-3 text-sm" value={funcao} onChange={(e) => setFuncao(e.target.value)}>
              {['ADMINISTRADOR','FINANCEIRO','PRODUCAO','VENDAS','ESTOQUE'].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
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


