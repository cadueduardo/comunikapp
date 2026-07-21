'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { comprasApi } from '@/lib/api-client';

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [prioridade, setPrioridade] = useState('NORMAL');
  const [justificativa, setJustificativa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState('UN');
  const [tipo, setTipo] = useState<'DESPESA' | 'SERVICO'>('DESPESA');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    if (!descricao.trim()) {
      toast.error('Informe a descrição do item.');
      return;
    }

    setSaving(true);
    try {
      const criada = await comprasApi.createSolicitacao(
        {
          prioridade,
          origem_tipo: 'MANUAL',
          justificativa: justificativa || undefined,
          itens: [
            {
              tipo,
              descricao: descricao.trim(),
              quantidade: Number(quantidade),
              unidade: unidade.trim() || 'UN',
            },
          ],
        },
        token,
      );
      toast.success(`Solicitação ${criada.numero} criada.`);
      router.push(`/compras/solicitacoes/${criada.id}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar solicitação.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova solicitação</h1>
        <p className="mt-1 text-muted-foreground">
          Rascunho inicial com pelo menos um item (despesa ou serviço).
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={prioridade} onValueChange={setPrioridade}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="URGENTE">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="justificativa">Justificativa</Label>
          <Textarea
            id="justificativa"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={3}
          />
        </div>

        <div className="rounded-md border p-4 space-y-4">
          <h2 className="font-semibold">Item</h2>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as typeof tipo)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESPESA">Despesa</SelectItem>
                <SelectItem value="SERVICO">Serviço</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="0.001"
                step="0.001"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar rascunho'}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/compras/solicitacoes">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
