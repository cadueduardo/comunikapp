'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/utils';
import { insumosApi } from '@/lib/api-client';

type OpcaoFornecedor = {
  fornecedor_id: string;
  fornecedor_nome: string;
  preco_compra: number;
  preco_unitario_uso: number;
  codigo_ref?: string | null;
  padrao: boolean;
  menor_preco: boolean;
  atualizado_em: string;
};

type OpcoesResponse = {
  insumo_id: string;
  total_opcoes: number;
  opcoes: OpcaoFornecedor[];
};

type Props = {
  insumoId: string;
  itemIndex: number;
  materialIndex: number;
  unidadeCompra?: string;
  unidadeUso?: string;
};

export function FornecedorPrevistoMaterial({
  insumoId,
  itemIndex,
  materialIndex,
  unidadeCompra,
  unidadeUso,
}: Props) {
  const form = useFormContext();
  const base = `itens_produto.${itemIndex}.materiais.${materialIndex}`;
  const fornecedorAtual = form.watch(`${base}.fornecedor_previsto_id`) as
    | string
    | undefined;
  const nomeSnapshot = form.watch(`${base}.fornecedor_nome_snapshot`) as
    | string
    | undefined;
  const [dados, setDados] = useState<OpcoesResponse | null>(null);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const aplicarOpcao = (opcao: OpcaoFornecedor, marcarAlterado: boolean) => {
    const config = {
      shouldDirty: marcarAlterado,
      shouldTouch: marcarAlterado,
      shouldValidate: true,
    };
    form.setValue(`${base}.fornecedor_previsto_id`, opcao.fornecedor_id, config);
    form.setValue(
      `${base}.fornecedor_nome_snapshot`,
      opcao.fornecedor_nome,
      config,
    );
    form.setValue(`${base}.codigo_ref_snapshot`, opcao.codigo_ref || '', config);
    form.setValue(`${base}.preco_compra_snapshot`, opcao.preco_compra, config);
    form.setValue(
      `${base}.preco_unitario_previsto`,
      opcao.preco_unitario_uso,
      config,
    );
  };

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      const token = localStorage.getItem('access_token');
      if (!token || !insumoId) return;
      setCarregando(true);
      setErro(null);
      try {
        const response =
          (await insumosApi.getOpcoesFornecedoresOrcamento(
            insumoId,
            token,
            fornecedorAtual,
          )) as OpcoesResponse;
        if (cancelado) return;
        setDados(response);
        const selecionada =
          response.opcoes.find(
            (opcao) => opcao.fornecedor_id === fornecedorAtual,
          ) ??
          response.opcoes.find((opcao) => opcao.padrao) ??
          response.opcoes[0];
        if (selecionada && !fornecedorAtual) {
          aplicarOpcao(selecionada, false);
        }
      } catch (error) {
        if (cancelado) return;
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os fornecedores.',
        );
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };
    void carregar();
    return () => {
      cancelado = true;
    };
    // A troca manual de fornecedor não deve refazer a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insumoId]);

  const opcaoAtual = useMemo(
    () =>
      dados?.opcoes.find(
        (opcao) => opcao.fornecedor_id === fornecedorAtual,
      ) ?? null,
    [dados, fornecedorAtual],
  );
  const nomeFonte = opcaoAtual?.fornecedor_nome || nomeSnapshot;

  if (carregando) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando fonte do custo…
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        {erro}
      </div>
    );
  }

  if (!dados || dados.opcoes.length === 0) return null;

  return (
    <div className="rounded-md border bg-muted/20">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 text-xs">
          <span className="text-muted-foreground">Fonte do custo: </span>
          <span className="font-medium">{nomeFonte || 'Fornecedor padrão'}</span>
          {opcaoAtual ? (
            <span className="text-muted-foreground">
              {' '}
              · {formatCurrency(opcaoAtual.preco_compra)}/
              {unidadeCompra || 'compra'}
            </span>
          ) : null}
        </div>
        {dados.total_opcoes > 1 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setAberto((valor) => !valor)}
          >
            Comparar fornecedores ({Math.min(dados.total_opcoes, 3)})
            {aberto ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            1 fornecedor cadastrado
          </span>
        )}
      </div>

      {aberto ? (
        <div className="border-t px-3 py-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Escolha o custo previsto para este orçamento. O padrão global do
            insumo não será alterado.
          </p>
          <RadioGroup
            value={fornecedorAtual || ''}
            onValueChange={(fornecedorId) => {
              const opcao = dados.opcoes.find(
                (item) => item.fornecedor_id === fornecedorId,
              );
              if (opcao) aplicarOpcao(opcao, true);
            }}
            className="gap-2"
          >
            {dados.opcoes.map((opcao) => (
              <label
                key={opcao.fornecedor_id}
                className="flex cursor-pointer items-start gap-3 rounded-md border bg-background px-3 py-2 hover:bg-accent/50"
              >
                <RadioGroupItem
                  value={opcao.fornecedor_id}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium">
                      {opcao.fornecedor_nome}
                    </span>
                    {opcao.padrao ? <Badge variant="secondary">Padrão</Badge> : null}
                    {opcao.menor_preco ? (
                      <Badge variant="outline">Menor preço</Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Compra: {formatCurrency(opcao.preco_compra)}/
                    {unidadeCompra || 'un'} · Custo aplicado:{' '}
                    {formatCurrency(opcao.preco_unitario_uso)}/
                    {unidadeUso || 'un'}
                    {opcao.codigo_ref ? ` · SKU ${opcao.codigo_ref}` : ''}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
          {dados.total_opcoes > dados.opcoes.length ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Exibindo as três opções rápidas definidas para comparação.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
