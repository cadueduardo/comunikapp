'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCepInstalacao } from '@/hooks/useCepInstalacao';
import type { EnderecoLoteForm } from '@/lib/instalacao/instalacao.types';
import { ENDERECO_LOTE_VAZIO } from '@/lib/instalacao/instalacao.types';
import { IconLoader2, IconMapPin } from '@tabler/icons-react';

interface EnderecoInstalacaoFormProps {
  valorInicial: EnderecoLoteForm;
  buscarCep: (cep: string) => Promise<{
    sucesso: boolean;
    endereco?: {
      cep: string;
      logradouro: string;
      complemento: string;
      bairro: string;
      cidade: string;
      uf: string;
    };
    erro?: string;
    permitir_preenchimento_manual: boolean;
  }>;
  onSalvar: (dados: EnderecoLoteForm) => Promise<void>;
  somenteLeitura?: boolean;
  exibirQuantidade?: boolean;
  quantidadeMaxima?: number;
  rotuloSalvar?: string;
}

export function EnderecoInstalacaoForm({
  valorInicial,
  buscarCep,
  onSalvar,
  somenteLeitura = false,
  exibirQuantidade = false,
  quantidadeMaxima,
  rotuloSalvar = 'Salvar endereço',
}: EnderecoInstalacaoFormProps) {
  const [form, setForm] = useState<EnderecoLoteForm>(valorInicial);
  const [salvando, setSalvando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const formInicialRef = useRef(JSON.stringify(valorInicial));

  useEffect(() => {
    const serializado = JSON.stringify(valorInicial);
    if (serializado !== formInicialRef.current) {
      setForm(valorInicial);
      formInicialRef.current = serializado;
    }
  }, [valorInicial]);

  const { buscandoCep, modoManual, erroCep, handleCepChange } =
    useCepInstalacao({ buscarCep });

  function atualizar(parcial: Partial<EnderecoLoteForm>) {
    setForm((prev) => ({ ...prev, ...parcial }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (somenteLeitura) return;

    const obrigatorios: Array<[keyof EnderecoLoteForm, string]> = [
      ['logradouro', 'Logradouro'],
      ['numero', 'Número'],
      ['bairro', 'Bairro'],
      ['cidade', 'Cidade'],
      ['uf', 'UF'],
    ];
    const faltando = obrigatorios
      .filter(([campo]) => !String(form[campo] ?? '').trim())
      .map(([, rotulo]) => rotulo);

    if (faltando.length > 0) {
      setErroValidacao(
        `Preencha os campos obrigatórios: ${faltando.join(', ')}. Sem número, informe "S/N".`,
      );
      return;
    }
    setErroValidacao(null);

    setSalvando(true);
    try {
      await onSalvar({
        cep: form.cep ?? '',
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento ?? '',
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        uf: form.uf.trim(),
        quantidade_alocada: form.quantidade_alocada ?? 1,
      });
      formInicialRef.current = JSON.stringify(form);
    } catch (err) {
      // Exibe o erro inline; sem rethrow para não derrubar a árvore React.
      setErroValidacao(
        err instanceof Error ? err.message : 'Falha ao salvar endereço.',
      );
    } finally {
      setSalvando(false);
    }
  }

  const desabilitado = somenteLeitura || buscandoCep;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full min-w-0 flex-col gap-4 overflow-hidden"
    >
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2 sm:col-span-2">
          <Label htmlFor="cep-instalacao">CEP</Label>
          <div className="relative min-w-0">
            <Input
              id="cep-instalacao"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={form.cep}
              disabled={desabilitado}
              onChange={async (e) => {
                await handleCepChange(e.target.value, atualizar);
              }}
              className="w-full min-w-0 pr-10"
            />
            {buscandoCep && (
              <IconLoader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {erroCep && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="break-words text-xs">
                {erroCep}
              </AlertDescription>
            </Alert>
          )}
          {modoManual && !erroCep && (
            <p className="text-xs text-muted-foreground">
              Modo manual — preencha todos os campos de endereço.
            </p>
          )}
        </div>

        <div className="min-w-0 space-y-2 sm:col-span-2">
          <Label htmlFor="logradouro-instalacao">Logradouro</Label>
          <Input
            id="logradouro-instalacao"
            value={form.logradouro}
            disabled={desabilitado}
            onChange={(e) => atualizar({ logradouro: e.target.value })}
            className="w-full min-w-0"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="numero-instalacao">Número</Label>
          <Input
            id="numero-instalacao"
            placeholder="Ex.: 123 ou S/N"
            value={form.numero}
            disabled={desabilitado}
            onChange={(e) => atualizar({ numero: e.target.value })}
            className="w-full min-w-0"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="complemento-instalacao">Complemento</Label>
          <Input
            id="complemento-instalacao"
            value={form.complemento}
            disabled={desabilitado}
            onChange={(e) => atualizar({ complemento: e.target.value })}
            className="w-full min-w-0"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="bairro-instalacao">Bairro</Label>
          <Input
            id="bairro-instalacao"
            value={form.bairro}
            disabled={desabilitado}
            onChange={(e) => atualizar({ bairro: e.target.value })}
            className="w-full min-w-0"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="cidade-instalacao">Cidade</Label>
          <Input
            id="cidade-instalacao"
            value={form.cidade}
            disabled={desabilitado}
            onChange={(e) => atualizar({ cidade: e.target.value })}
            className="w-full min-w-0"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="uf-instalacao">UF</Label>
          <Input
            id="uf-instalacao"
            maxLength={2}
            value={form.uf}
            disabled={desabilitado}
            onChange={(e) =>
              atualizar({ uf: e.target.value.toUpperCase().slice(0, 2) })
            }
            className="w-full min-w-0 uppercase"
          />
        </div>

        {exibirQuantidade && (
          <div className="min-w-0 space-y-2">
            <Label htmlFor="quantidade-instalacao">
              Quantidade alocada
              {quantidadeMaxima != null && quantidadeMaxima > 0 && (
                <span className="ml-1 font-normal text-muted-foreground">
                  (máx. {quantidadeMaxima})
                </span>
              )}
            </Label>
            <Input
              id="quantidade-instalacao"
              type="number"
              min={1}
              max={quantidadeMaxima}
              value={form.quantidade_alocada}
              disabled={desabilitado}
              onChange={(e) => {
                const bruto = Math.max(1, Number(e.target.value) || 1);
                const limitado =
                  quantidadeMaxima != null && quantidadeMaxima > 0
                    ? Math.min(bruto, quantidadeMaxima)
                    : bruto;
                atualizar({ quantidade_alocada: limitado });
              }}
              className="w-full min-w-0"
            />
          </div>
        )}
      </div>

      {erroValidacao && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="break-words text-xs">
            {erroValidacao}
          </AlertDescription>
        </Alert>
      )}

      {!somenteLeitura && (
        <Button
          type="submit"
          disabled={salvando || buscandoCep}
          className="h-11 w-full min-w-0 sm:w-auto"
        >
          {salvando ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <IconMapPin className="mr-2 h-4 w-4" />
              {rotuloSalvar}
            </>
          )}
        </Button>
      )}
    </form>
  );
}

export { ENDERECO_LOTE_VAZIO };
