'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fornecedoresApi, type FornecedorApi } from '@/lib/api-client';

export interface MatrizFornecedorDraft {
  fornecedor_id: string;
  preco_custo: string;
  codigo_ref: string;
}

interface MatrizFornecedoresDraftProps {
  rows: MatrizFornecedorDraft[];
  onChange: (rows: MatrizFornecedorDraft[]) => void;
}

export function MatrizFornecedoresDraft({
  rows,
  onChange,
}: MatrizFornecedoresDraftProps) {
  const [fornecedores, setFornecedores] = useState<FornecedorApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fornecedoresApi
      .getAll(token, 'INSUMO')
      .then(setFornecedores)
      .catch(() => toast.error('Não foi possível carregar os fornecedores.'))
      .finally(() => setLoading(false));
  }, []);

  const usados = useMemo(
    () => new Set(rows.map((row) => row.fornecedor_id).filter(Boolean)),
    [rows],
  );

  const update = (index: number, value: Partial<MatrizFornecedorDraft>) => {
    onChange(rows.map((row, current) => (current === index ? { ...row, ...value } : row)));
  };

  const add = () => {
    const disponivel = fornecedores.find((item) => !usados.has(item.id));
    if (!disponivel) {
      toast.message('Cadastre ou habilite outro fornecedor de insumos.');
      return;
    }
    onChange([
      ...rows,
      { fornecedor_id: disponivel.id, preco_custo: '', codigo_ref: '' },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fornecedores alternativos</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          O fornecedor e o custo informados acima serão o padrão. Inclua aqui
          alternativas para Compras comparar e substituir sem perder o histórico.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={`${row.fornecedor_id}-${index}`}
            className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select
                value={row.fornecedor_id}
                onValueChange={(value) => update(index, { fornecedor_id: value })}
                disabled={loading}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem
                      key={fornecedor.id}
                      value={fornecedor.id}
                      disabled={
                        fornecedor.id !== row.fornecedor_id && usados.has(fornecedor.id)
                      }
                    >
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preço de custo</Label>
              <CustomCurrencyInput
                value={row.preco_custo}
                onValueChange={(value) => update(index, { preco_custo: value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Código/SKU</Label>
              <Input
                value={row.codigo_ref}
                maxLength={191}
                onChange={(event) => update(index, { codigo_ref: event.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="self-end"
              onClick={() => onChange(rows.filter((_, current) => current !== index))}
              aria-label="Remover fornecedor alternativo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={add} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar fornecedor
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/fornecedores/novo" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Cadastrar novo fornecedor
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
