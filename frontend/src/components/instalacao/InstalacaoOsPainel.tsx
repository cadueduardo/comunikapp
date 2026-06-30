'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstalacaoLotesTable } from '@/components/instalacao/InstalacaoLotesTable';
import { InstalacaoTimeline } from '@/components/instalacao/InstalacaoTimeline';
import { OcorrenciaRapidaDialog } from '@/components/instalacao/OcorrenciaRapidaDialog';
import { InstalacaoSplitFiscalCard } from '@/components/instalacao/InstalacaoSplitFiscalCard';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import type {
  EnderecoLoteForm,
  MargemRealOs,
  PainelOsInstalacao,
  RelatorioTecnicoEmitido,
  SplitFiscalOs,
} from '@/lib/instalacao/instalacao.types';
import { IconDownload, IconLoader2, IconRefresh, IconReport } from '@tabler/icons-react';
import { toast } from 'sonner';

interface InstalacaoOsPainelProps {
  osId: string;
}

export function InstalacaoOsPainel({ osId }: InstalacaoOsPainelProps) {
  const [painel, setPainel] = useState<PainelOsInstalacao | null>(null);
  const [margem, setMargem] = useState<MargemRealOs | null>(null);
  const [splitFiscal, setSplitFiscal] = useState<SplitFiscalOs | null>(null);
  const [relatorioEmitido, setRelatorioEmitido] =
    useState<RelatorioTecnicoEmitido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [abrindoPdf, setAbrindoPdf] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [painelData, margemData, splitData, relatorioData] =
        await Promise.all([
          instalacaoApi.obterPainelOs(osId),
          instalacaoApi.obterMargemReal(osId).catch(() => null),
          instalacaoApi.obterSplitFiscal(osId).catch(() => null),
          instalacaoApi.obterRelatorioEmitido(osId).catch(() => null),
        ]);
      setPainel(painelData);
      setMargem(margemData);
      setSplitFiscal(splitData);
      setRelatorioEmitido(relatorioData);
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

  async function handleRelatorioTecnico() {
    setGerandoRelatorio(true);
    try {
      const resultado = await instalacaoApi.gerarRelatorioTecnico(osId);
      toast.success('Relatório técnico emitido. Saldo liberado para faturamento.');
      if (resultado.split_fiscal) {
        setSplitFiscal(resultado.split_fiscal);
      }
      await carregar();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao gerar relatório',
      );
    } finally {
      setGerandoRelatorio(false);
    }
  }

  async function handleAbrirPdf() {
    const token =
      relatorioEmitido?.pdf_token ??
      (relatorioEmitido?.pdf_url
        ? relatorioEmitido.pdf_url.split('/').pop()
        : null);
    if (!token) return;

    setAbrindoPdf(true);
    try {
      await instalacaoApi.abrirRelatorioPdf(token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao abrir PDF');
    } finally {
      setAbrindoPdf(false);
    }
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

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 overflow-hidden">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">Instalação</h3>
          <p className="text-sm text-muted-foreground">
            Timeline de campo, lotes e fechamento técnico
          </p>
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
          <OcorrenciaRapidaDialog
            osId={osId}
            painel={painel}
            onRegistrar={handleRegistrarOcorrencia}
            onUpload={(arquivo) => instalacaoApi.uploadAnexo(arquivo)}
          />
          <Button
            type="button"
            size="sm"
            disabled={gerandoRelatorio || Boolean(relatorioEmitido)}
            onClick={() => void handleRelatorioTecnico()}
          >
            {gerandoRelatorio ? (
              <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <IconReport className="mr-1.5 h-4 w-4" />
            )}
            {relatorioEmitido ? 'Relatório emitido' : 'Relatório técnico'}
          </Button>
          {relatorioEmitido && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={abrindoPdf}
              onClick={() => void handleAbrirPdf()}
            >
              {abrindoPdf ? (
                <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <IconDownload className="mr-1.5 h-4 w-4" />
              )}
              Baixar PDF
            </Button>
          )}
        </div>
      </div>

      {margem && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Margem real (pós-campo)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Orçado</p>
              <p className="font-semibold text-foreground">
                R$ {margem.valor_orcado.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Extras campo</p>
              <p className="font-semibold text-foreground">
                R$ {margem.custos_extras_campo.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lucro real</p>
              <p className="font-semibold text-foreground">
                R$ {margem.lucro_real.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margem</p>
              <p className="font-semibold text-foreground">
                {margem.margem_percentual.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <InstalacaoSplitFiscalCard split={splitFiscal} />

      <div className="grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-3 overflow-hidden">
          <h4 className="text-sm font-semibold text-foreground">Timeline</h4>
          <InstalacaoTimeline painel={painel} />
        </div>
        <div className="min-w-0 space-y-3 overflow-hidden">
          <h4 className="text-sm font-semibold text-foreground">Lotes de entrega</h4>
          <InstalacaoLotesTable
            painel={painel}
            buscarCep={(cep) => instalacaoApi.buscarCep(cep)}
            onAtualizarLote={handleAtualizarLote}
          />
        </div>
      </div>
    </div>
  );
}
