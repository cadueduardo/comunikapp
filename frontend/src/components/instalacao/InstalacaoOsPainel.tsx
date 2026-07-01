'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstalacaoLotesTable } from '@/components/instalacao/InstalacaoLotesTable';
import { InstalacaoLotesConsultaGrid } from '@/components/instalacao/InstalacaoLotesConsultaGrid';
import { InstalacaoTimeline } from '@/components/instalacao/InstalacaoTimeline';
import { NovoLoteDialog } from '@/components/instalacao/NovoLoteDialog';
import { OcorrenciaRapidaDialog } from '@/components/instalacao/OcorrenciaRapidaDialog';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import type {
  EnderecoLoteForm,
  PainelOsInstalacao,
} from '@/lib/instalacao/instalacao.types';
import { IconLoader2, IconRefresh, IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import { STATUS_INSTALACAO_OS_LABEL } from '@/lib/instalacao/instalacao-labels';
import { toast } from 'sonner';

interface InstalacaoOsPainelProps {
  osId: string;
  /** Na OS: somente histórico; edição fica no módulo Instalação. */
  modo?: 'gestao' | 'consulta';
}

/**
 * Visão operacional da instalação na OS (chão de fábrica / logística).
 * Valores comerciais e fechamento financeiro ficam no módulo Financeiro.
 */
export function InstalacaoOsPainel({
  osId,
  modo = 'gestao',
}: InstalacaoOsPainelProps) {
  const somenteLeitura = modo === 'consulta';
  const [painel, setPainel] = useState<PainelOsInstalacao | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const painelData = await instalacaoApi.obterPainelOs(osId);
      setPainel(painelData);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao carregar instalação',
      );
    } finally {
      setCarregando(false);
    }
  }, [osId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function handleCriarLote(
    dados: Parameters<typeof instalacaoApi.criarLote>[0],
  ) {
    await instalacaoApi.criarLote(dados);
    await carregar();
  }

  async function handleAtualizarLote(loteId: string, dados: EnderecoLoteForm) {
    await instalacaoApi.atualizarLote(loteId, {
      cep: dados.cep,
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento || undefined,
      bairro: dados.bairro,
      cidade: dados.cidade,
      uf: dados.uf,
      quantidade_alocada: dados.quantidade_alocada,
    });
    await carregar();
  }

  async function handleRegistrarOcorrencia(dados: {
    os_id: string;
    item_instalacao_id?: string;
    tipo: string;
    descricao: string;
    fotos_evidencia?: string[];
  }) {
    await instalacaoApi.registrarOcorrencia(dados);
    toast.success('Ocorrência registrada.');
    await carregar();
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando instalação...
      </div>
    );
  }

  if (!painel) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Não foi possível carregar os dados de instalação.
        </CardContent>
      </Card>
    );
  }

  const itensSaldo = painel.itens_saldo ?? [];
  const quantidadePendenteAlocacao = itensSaldo.reduce(
    (acc, item) => acc + item.saldo_disponivel,
    0,
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 overflow-hidden">
      {somenteLeitura && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Visualização somente leitura. Para editar lotes, endereços ou
            registrar ocorrências, use o módulo Instalação.
          </p>
          <Button type="button" size="sm" className="shrink-0" asChild>
            <Link href={`/instalacao?os=${osId}`}>
              <IconExternalLink className="mr-1.5 h-4 w-4" />
              Abrir no módulo Instalação
            </Link>
          </Button>
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">Instalação</h3>
          {somenteLeitura ? (
            <div className="mt-1 space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {painel.os.nome_servico}
              </p>
              <p className="text-sm text-muted-foreground">
                OS {painel.os.numero}
                {painel.os.cliente_nome
                  ? ` · ${painel.os.cliente_nome}`
                  : ''}
                {painel.os.status_instalacao_os
                  ? ` · ${STATUS_INSTALACAO_OS_LABEL[painel.os.status_instalacao_os] ?? painel.os.status_instalacao_os}`
                  : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                Clique em um lote para ver ocorrências, evidências e assinatura.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Lotes, endereços de campo e registro de ocorrências
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void carregar()}
          >
            <IconRefresh className="mr-1.5 h-4 w-4" />
            Atualizar
          </Button>
          {!somenteLeitura && (
            <OcorrenciaRapidaDialog
              osId={osId}
              painel={painel}
              onRegistrar={handleRegistrarOcorrencia}
              onUpload={(arquivo) => instalacaoApi.uploadAnexo(arquivo)}
            />
          )}
        </div>
      </div>

      {itensSaldo.length > 0 && !somenteLeitura && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Quantidade pendente de alocação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {itensSaldo.map((item) => (
              <div
                key={item.item_os_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="min-w-0 text-foreground">
                  {item.produto_servico ?? 'Produto'}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  <span
                    className={
                      item.saldo_disponivel > 0
                        ? 'font-semibold text-amber-700 dark:text-amber-300'
                        : 'font-semibold text-emerald-700 dark:text-emerald-300'
                    }
                  >
                    {item.saldo_disponivel}
                  </span>
                  {' / '}
                  {item.quantidade_total} un. sem endereço de lote
                </span>
              </div>
            ))}
            {quantidadePendenteAlocacao === 0 && (
              <p className="text-xs text-muted-foreground">
                Toda a quantidade já foi distribuída em lotes de instalação.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {somenteLeitura ? (
        <div className="min-w-0 space-y-3 overflow-hidden">
          <h4 className="text-sm font-semibold text-foreground">
            Lotes de entrega
          </h4>
          <InstalacaoLotesConsultaGrid painel={painel} />
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="min-w-0 space-y-3 overflow-hidden">
            <h4 className="text-sm font-semibold text-foreground">Timeline</h4>
            <InstalacaoTimeline
              painel={painel}
              exibirValoresFinanceiros={false}
            />
          </div>
          <div className="min-w-0 space-y-3 overflow-hidden">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                Lotes de entrega
              </h4>
              <NovoLoteDialog
                itensSaldo={itensSaldo}
                buscarCep={(cep) => instalacaoApi.buscarCep(cep)}
                onCriar={handleCriarLote}
                disabled={quantidadePendenteAlocacao <= 0}
              />
            </div>
            <InstalacaoLotesTable
              painel={painel}
              buscarCep={(cep) => instalacaoApi.buscarCep(cep)}
              onAtualizarLote={handleAtualizarLote}
              somenteLeitura={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
