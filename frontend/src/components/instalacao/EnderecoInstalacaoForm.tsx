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
}

export function EnderecoInstalacaoForm({
  valorInicial,
  buscarCep,
  onSalvar,
  somenteLeitura = false,
  exibirQuantidade = false,
}: EnderecoInstalacaoFormProps) {
  const [form, setForm] = useState<EnderecoLoteForm>(valorInicial);
  const [salvando, setSalvando] = useState(false);
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

    setSalvando(true);
    try {
      await onSalvar({
        cep: form.cep ?? '',
        logradouro: form.logradouro ?? '',
        numero: form.numero ?? '',
        complemento: form.complemento ?? '',
        bairro: form.bairro ?? '',
        cidade: form.cidade ?? '',
        uf: form.uf ?? '',
        quantidade_alocada: form.quantidade_alocada ?? 1,
      });
      formInicialRef.current = JSON.stringify(form);
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
            <Label htmlFor="quantidade-instalacao">Quantidade alocada</Label>
            <Input
              id="quantidade-instalacao"
              type="number"
              min={1}
              value={form.quantidade_alocada}
              disabled={desabilitado}
              onChange={(e) =>
                atualizar({
                  quantidade_alocada: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-full min-w-0"
            />
          </div>
        )}
      </div>

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
              Salvar endereço
            </>
          )}
        </Button>
      )}
    </form>
  );
}

export { ENDERECO_LOTE_VAZIO };
