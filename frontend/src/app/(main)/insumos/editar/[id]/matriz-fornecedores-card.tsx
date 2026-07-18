'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
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
import {
  fornecedoresApi,
  insumosApi,
} from '@/lib/api-client';
import type { FornecedorApi } from '@/lib/api-client';

export interface MatrizFornecedorApi {
  loja_id: string;
  insumo_id: string;
  fornecedor_id: string;
  preco_custo: number | string;
  codigo_ref?: string | null;
  padrao: boolean;
  fornecedor?: {
    id: string;
    nome: string;
  };
}

interface MatrizRow {
  key: string;
  fornecedor_id: string;
  preco_custo: string;
  codigo_ref: string;
}

interface MatrizFornecedoresCardProps {
  insumoId: string;
  initialRows: MatrizFornecedorApi[];
  onSaved: (result: {
    fornecedorId: string;
    custo_unitario: number;
    fornecedores: MatrizFornecedorApi[];
  }) => void;
}

const createKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const toRows = (rows: MatrizFornecedorApi[]): MatrizRow[] =>
  rows.map((row) => ({
    key: createKey(),
    fornecedor_id: row.fornecedor_id,
    preco_custo: String(row.preco_custo),
    codigo_ref: row.codigo_ref ?? '',
  }));

export function MatrizFornecedoresCard({
  insumoId,
  initialRows,
  onSaved,
}: MatrizFornecedoresCardProps) {
  const [rows, setRows] = useState<MatrizRow[]>(() => toRows(initialRows));
  const [padraoKey, setPadraoKey] = useState<string>();
  const [fornecedores, setFornecedores] = useState<FornecedorApi[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextRows = toRows(initialRows);
    setRows(nextRows);
    const padraoIndex = initialRows.findIndex((row) => row.padrao);
    setPadraoKey(nextRows[Math.max(padraoIndex, 0)]?.key);
  }, [initialRows]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoadingFornecedores(false);
      return;
    }
    fornecedoresApi
      .getAll(token, 'INSUMO')
      .then(setFornecedores)
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os fornecedores.',
        );
      })
      .finally(() => setLoadingFornecedores(false));
  }, []);

  const usedSupplierIds = useMemo(
    () => new Set(rows.map((row) => row.fornecedor_id).filter(Boolean)),
    [rows],
  );

  const updateRow = (key: string, values: Partial<MatrizRow>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...values } : row)),
    );
  };

  const addRow = () => {
    const available = fornecedores.find(
      (fornecedor) => !usedSupplierIds.has(fornecedor.id),
    );
    if (!available) {
      toast.error('Não há outro fornecedor de insumos disponível.');
      return;
    }
    setRows((current) => [
      ...current,
      {
        key: createKey(),
        fornecedor_id: available.id,
        preco_custo: '',
        codigo_ref: '',
      },
    ]);
  };

  const removeRow = (key: string) => {
    if (rows.length === 1) {
      toast.error('A matriz deve manter ao menos um fornecedor.');
      return;
    }
    const nextRows = rows.filter((row) => row.key !== key);
    setRows(nextRows);
    if (padraoKey === key) setPadraoKey(nextRows[0].key);
  };

  const save = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    if (!padraoKey || !rows.some((row) => row.key === padraoKey)) {
      toast.error('Selecione exatamente um fornecedor padrão.');
      return;
    }
    if (rows.some((row) => !row.fornecedor_id)) {
      toast.error('Selecione o fornecedor em todas as linhas.');
      return;
    }
    if (usedSupplierIds.size !== rows.length) {
      toast.error('O mesmo fornecedor não pode aparecer mais de uma vez.');
      return;
    }

    const invalidPrice = rows.some((row) => {
      const price = Number(row.preco_custo);
      return !Number.isFinite(price) || price <= 0;
    });
    if (invalidPrice) {
      toast.error('Informe um preço de custo maior que zero em todas as linhas.');
      return;
    }

    setSaving(true);
    try {
      const result = (await insumosApi.vincularFornecedores(
        insumoId,
        {
          fornecedores: rows.map((row) => ({
            fornecedor_id: row.fornecedor_id,
            preco_custo: Number(row.preco_custo),
            ...(row.codigo_ref.trim()
              ? { codigo_ref: row.codigo_ref.trim() }
              : {}),
            padrao: row.key === padraoKey,
          })),
        },
        token,
      )) as {
        fornecedorId: string;
        custo_unitario: number;
        fornecedores: MatrizFornecedorApi[];
      };
      onSaved(result);
      toast.success('Matriz de fornecedores atualizada.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a matriz.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Fornecedores e Custos</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          O fornecedor marcado como padrão alimenta os novos cálculos. Os demais
          ficam disponíveis como alternativas de compra.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor={`fornecedor-${row.key}`}>Fornecedor</Label>
                <Select
                  value={row.fornecedor_id}
                  onValueChange={(value) =>
                    updateRow(row.key, { fornecedor_id: value })
                  }
                  disabled={loadingFornecedores || saving}
                >
                  <SelectTrigger id={`fornecedor-${row.key}`}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem
                        key={fornecedor.id}
                        value={fornecedor.id}
                        disabled={
                          fornecedor.id !== row.fornecedor_id &&
                          usedSupplierIds.has(fornecedor.id)
                        }
                      >
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`preco-${row.key}`}>Preço de custo</Label>
                <CustomCurrencyInput
                  id={`preco-${row.key}`}
                  value={row.preco_custo}
                  onValueChange={(value) =>
                    updateRow(row.key, { preco_custo: value })
                  }
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`codigo-${row.key}`}>Código/SKU</Label>
                <Input
                  id={`codigo-${row.key}`}
                  value={row.codigo_ref}
                  maxLength={191}
                  onChange={(event) =>
                    updateRow(row.key, { codigo_ref: event.target.value })
                  }
                  disabled={saving}
                />
              </div>

              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input
                  type="radio"
                  name="fornecedor-padrao"
                  checked={padraoKey === row.key}
                  onChange={() => setPadraoKey(row.key)}
                  disabled={saving}
                  className="h-4 w-4"
                />
                Padrão
              </label>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end"
                onClick={() => removeRow(row.key)}
                disabled={saving || rows.length === 1}
                aria-label="Remover fornecedor"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            disabled={saving || loadingFornecedores}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar fornecedor
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando matriz...' : 'Salvar matriz'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
