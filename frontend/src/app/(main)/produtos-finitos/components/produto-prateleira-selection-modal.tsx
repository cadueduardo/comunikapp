'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { produtosFinitosApi } from '@/lib/api-client';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';

export type ProdutoPrateleira = {
  id: string;
  nome: string;
  sku: string;
  ean?: string | null;
  descricao?: string | null;
  descricao_resumida?: string | null;
  preco_venda: number | string;
  preco_promocional?: number | string | null;
  preco_custo?: number | string | null;
  estoque_atual: number;
  categoria?: { id: string; nome: string } | null;
  preco_unitario?: number;
  preco_efetivo?: number;
  imagens?: Array<{ id: string; url_imagem: string; ordem: number }>;
};

interface ProdutoPrateleiraSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (produto: ProdutoPrateleira) => void;
}

function resolverPrecoEfetivo(produto: ProdutoPrateleira): number {
  const venda = Number(produto.preco_efetivo ?? produto.preco_venda);
  const promo =
    produto.preco_promocional != null
      ? Number(produto.preco_promocional)
      : null;
  if (promo != null && promo > 0 && promo < venda) return promo;
  return venda;
}

export function ProdutoPrateleiraSelectionModal({
  open,
  onClose,
  onSelect,
}: ProdutoPrateleiraSelectionModalProps) {
  const [produtos, setProdutos] = useState<ProdutoPrateleira[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Token de autenticação não encontrado.');
          return;
        }
        const resposta = (await produtosFinitosApi.getAll(token, {
          ativo: true,
          limit: 100,
        })) as { data?: ProdutoPrateleira[] };
        setProdutos(resposta.data || []);
      } catch {
        toast.error('Erro ao buscar produtos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return produtos.filter((p) =>
      [p.nome, p.sku, p.ean, p.categoria?.nome]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [produtos, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adicionar produto de prateleira</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, SKU ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando produtos...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado.
          </p>
        ) : (
          <div className="grid gap-3">
            {filtered.map((produto) => {
              const preco = resolverPrecoEfetivo(produto);
              return (
                <Card key={produto.id} className="hover:border-primary/40">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <ProdutoFinitoThumb
                        url={produto.imagens?.[0]?.url_imagem || null}
                        alt={produto.nome}
                        className="h-16 w-16 shrink-0 rounded-md border"
                      />
                      <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{produto.nome}</span>
                        <Badge variant="outline">SKU: {produto.sku}</Badge>
                      </div>
                      {produto.categoria?.nome ? (
                        <p className="text-xs text-muted-foreground">
                          {produto.categoria.nome}
                        </p>
                      ) : null}
                      <p className="text-sm">
                        {formatCurrency(preco)} · Estoque: {produto.estoque_atual}
                      </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        onSelect({ ...produto, preco_unitario: preco, preco_custo: produto.preco_custo });
                        onClose();
                      }}
                    >
                      Adicionar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
