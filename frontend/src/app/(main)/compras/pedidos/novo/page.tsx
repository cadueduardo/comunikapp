'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { comprasApi, fornecedoresApi, type FornecedorApi } from '@/lib/api-client';

export default function NovoPedidoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fornecedores, setFornecedores] = useState<FornecedorApi[]>([]);
  const [fornecedorId, setFornecedorId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState('UN');
  const [preco, setPreco] = useState('0');
  const [tipo, setTipo] = useState<'DESPESA' | 'SERVICO'>('DESPESA');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    void fornecedoresApi
      .getAll(token)
      .then((data) => setFornecedores(data.filter((f) => f.ativo !== false)))
      .catch((error) => {
        console.error(error);
        toast.error('Erro ao carregar fornecedores.');
      });
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    if (!fornecedorId) {
      toast.error('Selecione o fornecedor.');
      return;
    }

    setSaving(true);
    try {
      const criado = await comprasApi.createPedido(
        {
          fornecedor_id: fornecedorId,
          itens: [
            {
              tipo,
              descricao_snapshot: descricao.trim(),
              quantidade: Number(quantidade),
              unidade_snapshot: unidade.trim() || 'UN',
              preco_unitario: Number(preco),
            },
          ],
        },
        token,
      );
      toast.success(`Pedido ${criado.numero} criado.`);
      router.push(`/compras/pedidos/${criado.id}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar pedido.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Novo pedido</h1>
        <p className="mt-1 text-muted-foreground">
          Rascunho com fornecedor e pelo menos um item.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Select value={fornecedorId} onValueChange={setFornecedorId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Qtd</Label>
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
            <div className="space-y-2">
              <Label htmlFor="preco">Preço unit.</Label>
              <Input
                id="preco"
                type="number"
                min="0"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
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
            <Link href="/compras/pedidos">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
