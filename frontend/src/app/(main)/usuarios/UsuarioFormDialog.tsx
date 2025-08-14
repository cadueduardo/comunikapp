'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { apiRequest } from '@/lib/api';

interface UsuarioFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => Promise<void> | void;
}

const FUNCOES = ['ADMINISTRADOR', 'FINANCEIRO', 'PRODUCAO', 'VENDAS', 'ESTOQUE'] as const;

export function UsuarioFormDialog({ open, onOpenChange, onCreated }: UsuarioFormDialogProps) {
  const { user } = useUser();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [funcao, setFuncao] = useState<typeof FUNCOES[number]>('VENDAS');
  const [definirSenha, setDefinirSenha] = useState(false);
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setNome('');
    setEmail('');
    setTelefone('');
    setFuncao('VENDAS');
    setDefinirSenha(false);
    setSenha('');
  };

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
        onOpenChange(false);
        reset();
        await onCreated();
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
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>Cadastre um novo usuário para sua loja</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
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
            <select className="border rounded h-10 px-3 text-sm" value={funcao} onChange={(e) => setFuncao(e.target.value as any)}>
              {FUNCOES.map((f) => (
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={loading}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


