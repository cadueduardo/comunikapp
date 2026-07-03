'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InstalacaoSplitFiscalCard } from '@/components/instalacao/InstalacaoSplitFiscalCard';
import { PrecificarOcorrenciaDialog } from '@/components/instalacao/PrecificarOcorrenciaDialog';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import {
  STATUS_FINANCEIRO_OCORRENCIA_LABEL,
  STATUS_FINANCEIRO_OCORRENCIA_TONE,
  STATUS_INSTALACAO_OS_LABEL,
  STATUS_INSTALACAO_OS_TONE,
  TIPO_OCORRENCIA_LABEL,
} from '@/lib/instalacao/instalacao-labels';
import type {
  FilaPrecificacaoItem,
  MargemRealOs,
  OcorrenciaGestao,
  OsAditivaResumo,
  PainelOsInstalacao,
  RelatorioTecnicoEmitido,
  SplitFiscalOs,
  StatusInstalacaoOs,
} from '@/lib/instalacao/instalacao.types';
import {
  ocorrenciaElegivelPrecificacao,
  podeGerarOsAditiva,
  temBloqueioAprovacaoFinanceira,
  valorCobravelCliente,
} from '@/lib/instalacao/instalacao-financeiro.util';
import { contarLotesAguardandoConclusaoCampo } from '@/lib/instalacao/instalacao-lote-utils';
import { formatarMoeda } from '@/lib/financeiro/financeiro-format';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import {
  IconCheck,
  IconFileTypePdf,
  IconLoader2,
  IconReceipt,
} from '@tabler/icons-react';

const TONE_BADGE: Record<string, string> = {
  default:
    'border-border bg-muted text-foreground dark:bg-muted/60',
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
  success:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  destructive:
    'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200',
};

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

interface InstalacaoRelatorioTecnicoCardProps {
  osId: string;
  osNumero?: string | null;
  onAprovado?: () => void;
  className?: string;
}

export function InstalacaoRelatorioTecnicoCard({
  osId,
  osNumero,
  onAprovado,
  className,
}: InstalacaoRelatorioTecnicoCardProps) {
  const { user } = useUser();
  const podeFinanceiro = ['ADMINISTRADOR', 'FINANCEIRO'].includes(
    String(user?.funcao ?? '').toUpperCase(),
  );

  const [carregando, setCarregando] = useState(true);
  const [aprovando, setAprovando] = useState(false);
  const [gerandoAditiva, setGerandoAditiva] = useState(false);
  const [gerandoPrevia, setGerandoPrevia] = useState(false);
  const [confirmarAberto, setConfirmarAberto] = useState(false);
  const [confirmarAditivaAberto, setConfirmarAditivaAberto] = useState(false);
  const [painel, setPainel] = useState<PainelOsInstalacao | null>(null);
  const [splitFiscal, setSplitFiscal] = useState<SplitFiscalOs | null>(null);
  const [margemReal, setMargemReal] = useState<MargemRealOs | null>(null);
  const [osAditivas, setOsAditivas] = useState<OsAditivaResumo[]>([]);
  const [osAditivaHabilitada, setOsAditivaHabilitada] = useState(false);
  const [habilitandoAditiva, setHabilitandoAditiva] = useState(false);
  const [precificarItem, setPrecificarItem] =
    useState<FilaPrecificacaoItem | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioTecnicoEmitido | null>(
    null,
  );
  const [versaoDados, setVersaoDados] = useState(0);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [painelData, splitData, relatorioData, margemData, aditivasData, configData] =
        await Promise.all([
          instalacaoApi.obterPainelOs(osId),
          instalacaoApi.obterSplitFiscal(osId).catch(() => null),
          instalacaoApi.obterRelatorioEmitido(osId),
          instalacaoApi.obterMargemReal(osId).catch(() => null),
          instalacaoApi.listarOsAditivas(osId).catch(() => []),
          instalacaoApi.obterConfiguracaoInstalacao().catch(() => ({
            exigir_sinal_producao: false,
            os_aditiva_habilitada: false,
          })),
        ]);
      setPainel(painelData);
      setSplitFiscal(splitData);
      setRelatorio(relatorioData);
      setMargemReal(margemData);
      setOsAditivas(aditivasData);
      setOsAditivaHabilitada(configData.os_aditiva_habilitada === true);
    } catch (err) {
      setPainel(null);
      setSplitFiscal(null);
      setRelatorio(null);
      setMargemReal(null);
      setOsAditivas([]);
      setOsAditivaHabilitada(false);
      toast.error(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar dados de instalação.',
      );
    } finally {
      setCarregando(false);
    }
  }, [osId]);

  useEffect(() => {
    void carregar();
  }, [carregar, versaoDados]);

  const statusOs: StatusInstalacaoOs | null =
    painel?.os.status_instalacao_os ?? null;

  const valorExtrasCampo = useMemo(() => {
    if (!painel) return 0;
    return painel.ocorrencias.reduce(
      (acc, occ) =>
        occ.status_financeiro === 'PRECIFICADO'
          ? acc + Number(occ.preco_cliente ?? 0)
          : acc,
      0,
    );
  }, [painel]);

  const bloqueioFinanceiro = useMemo(
    () =>
      osAditivaHabilitada && painel
        ? temBloqueioAprovacaoFinanceira(painel.ocorrencias)
        : false,
    [painel, osAditivaHabilitada],
  );

  const lotesAguardandoConclusao = useMemo(
    () => (painel ? contarLotesAguardandoConclusaoCampo(painel.lotes) : 0),
    [painel],
  );

  const temOcorrenciasCampo = (painel?.ocorrencias.length ?? 0) > 0;

  function mapOcorrenciaParaPrecificacao(
    occ: OcorrenciaGestao,
    painelData: PainelOsInstalacao,
  ): FilaPrecificacaoItem {
    const lote = occ.item_instalacao
      ? painelData.lotes.find((l) => l.id === occ.item_instalacao?.id)
      : null;
    return {
      id: occ.id,
      os_id: osId,
      os_numero: painelData.os.numero,
      cliente_nome: painelData.os.cliente_nome,
      tipo: occ.tipo,
      descricao: occ.descricao,
      quantidade: occ.quantidade,
      status_financeiro: occ.status_financeiro,
      custo_sugerido: occ.custo_sugerido,
      preco_sugerido: occ.preco_sugerido,
      custo_interno: occ.custo_interno,
      preco_cliente: occ.preco_cliente,
      versao: occ.versao,
      criado_em: occ.criado_em,
      item_instalacao: occ.item_instalacao
        ? {
            id: occ.item_instalacao.id,
            logradouro: occ.item_instalacao.logradouro,
            numero: occ.item_instalacao.numero,
            cidade: lote?.cidade ?? '',
          }
        : null,
    };
  }

  const podeGerarAditiva =
    osAditivaHabilitada &&
    podeFinanceiro &&
    painel != null &&
    podeGerarOsAditiva(painel.ocorrencias) &&
    !gerandoAditiva &&
    !carregando;

  const podeAprovar =
    statusOs === 'AGUARDANDO_RELATORIO_TECNICO' &&
    !aprovando &&
    !carregando &&
    !bloqueioFinanceiro;

  const jaConcluida =
    statusOs === 'CONCLUIDA' || Boolean(relatorio?.pdf_token);

  async function handleAprovar() {
    setAprovando(true);
    try {
      const resultado = await instalacaoApi.aprovarFinanceiroOs(osId);
      toast.success(
        'Faturamento aprovado. Saldo liberado para emissão e expedição finalizada.',
      );
      setRelatorio({
        id: resultado.os_id,
        pdf_url: resultado.pdf_url ?? '',
        pdf_token: resultado.pdf_token ?? '',
        total_nfe: resultado.split_fiscal?.total_nfe ?? 0,
        total_nfs: resultado.split_fiscal?.total_nfs ?? 0,
        gerado_em: resultado.aprovacao_financeira_em,
      });
      if (resultado.split_fiscal) {
        setSplitFiscal(resultado.split_fiscal);
      }
      setVersaoDados((v) => v + 1);
      onAprovado?.();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Falha ao aprovar o faturamento da instalação.',
      );
    } finally {
      setAprovando(false);
      setConfirmarAberto(false);
    }
  }

  const temExtrasPrecificados =
    painel != null &&
    podeGerarOsAditiva(painel.ocorrencias);

  async function handleGerarPreviaPdf() {
    setGerandoPrevia(true);
    try {
      const resultado = await instalacaoApi.gerarPreviaRelatorioTecnico(osId);
      await instalacaoApi.abrirRelatorioPdf(resultado.pdf_token);
      toast.success(
        'Prévia do relatório gerada. Envie ao cliente para conferência antes de aprovar.',
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Falha ao gerar a prévia do relatório.',
      );
    } finally {
      setGerandoPrevia(false);
    }
  }

  async function handleGerarOsAditiva() {
    setGerandoAditiva(true);
    try {
      const resultado = await instalacaoApi.gerarOsAditiva(osId);
      toast.success(
        `OS Aditiva ${resultado.os_aditiva_numero} gerada com ${formatarMoeda(resultado.valor_total)}.`,
      );
      setVersaoDados((v) => v + 1);
      onAprovado?.();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Falha ao gerar OS Aditiva.',
      );
    } finally {
      setGerandoAditiva(false);
      setConfirmarAditivaAberto(false);
    }
  }

  async function handleHabilitarOsAditiva() {
    setHabilitandoAditiva(true);
    try {
      const resultado = await instalacaoApi.atualizarOsAditivaHabilitada(true);
      setOsAditivaHabilitada(true);
      toast.success(
        resultado.ocorrencias_migradas && resultado.ocorrencias_migradas > 0
          ? `OS Aditiva habilitada. ${resultado.ocorrencias_migradas} intercorrência(s) reabertas para precificação.`
          : 'OS Aditiva habilitada nesta loja.',
      );
      setVersaoDados((v) => v + 1);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Não foi possível habilitar a OS Aditiva.',
      );
    } finally {
      setHabilitandoAditiva(false);
    }
  }

  if (carregando) {
    return (
      <Card className={cn('border-border bg-card', className)}>
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <IconLoader2 className="h-4 w-4 animate-spin" />
          Carregando encerramento de instalação...
        </CardContent>
      </Card>
    );
  }

  if (!painel) {
    return null;
  }

  const semInstalacao =
    painel.lotes.length === 0 &&
    painel.ocorrencias.length === 0 &&
    !statusOs;

  if (semInstalacao) {
    return null;
  }

  const tone = statusOs
    ? (STATUS_INSTALACAO_OS_TONE[statusOs] ?? 'default')
    : 'default';
  const labelStatus = statusOs
    ? (STATUS_INSTALACAO_OS_LABEL[statusOs] ?? statusOs)
    : 'Sem status de instalação';

  const numeroExibicao = osNumero ?? painel.os.numero;

  return (
    <>
      <Card className={cn('border-border bg-card', className)}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <IconReceipt className="h-5 w-5 shrink-0" />
                Relatório técnico e faturamento
              </CardTitle>
              <CardDescription>
                OS {numeroExibicao}
                {painel.os.cliente_nome ? ` — ${painel.os.cliente_nome}` : ''}
              </CardDescription>
            </div>
            <Badge className={cn('shrink-0', TONE_BADGE[tone])} variant="outline">
              {labelStatus}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!osAditivaHabilitada && temOcorrenciasCampo && (
            <div className="flex flex-col gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-amber-900 dark:text-amber-100">
                Para lançar valores das intercorrências e gerar sub-OS, habilite
                o split financeiro (OS Aditiva) nesta loja. As ocorrências
                registradas antes da habilitação serão reabertas para
                precificação.
              </p>
              {podeFinanceiro && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-amber-600"
                  disabled={habilitandoAditiva}
                  onClick={() => void handleHabilitarOsAditiva()}
                >
                  {habilitandoAditiva ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Habilitando...
                    </>
                  ) : (
                    'Habilitar OS Aditiva'
                  )}
                </Button>
              )}
            </div>
          )}

          {lotesAguardandoConclusao > 0 && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
              <strong className="font-medium">
                {lotesAguardandoConclusao} lote(s)
              </strong>{' '}
              ainda não foram concluídos com assinatura no aplicativo{' '}
              <strong className="font-medium">/instalador</strong>. O faturamento
              principal só libera após todos os endereços encerrados em campo.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Lotes em campo</p>
              <p className="text-sm font-medium text-foreground">
                {painel.lotes.length} endereço(s)
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Ocorrências registradas</p>
              <p className="text-sm font-medium text-foreground">
                {painel.ocorrencias.length}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Extras precificados (pend. aditiva)</p>
              <p className="text-sm font-medium text-foreground">
                {formatarMoeda(valorExtrasCampo)}
              </p>
            </div>
          </div>

          {margemReal && (
            <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
              <p className="mb-1 font-medium text-foreground">Margem real da OS</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Custo operacional = mão de obra + deslocamento dos produtos com
                instalação no orçamento. Margem = (receita OS + aditivas − custos)
                ÷ receita total.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <p className="text-muted-foreground">
                  Receita OS aditivas:{' '}
                  <span className="font-medium text-foreground">
                    {formatarMoeda(margemReal.receita_os_aditivas ?? 0)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Custo operacional inst.:{' '}
                  <span className="font-medium text-foreground">
                    {formatarMoeda(margemReal.custo_operacional_instalacao ?? 0)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Margem:{' '}
                  <span className="font-medium text-foreground">
                    {margemReal.margem_percentual.toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          )}

          <InstalacaoSplitFiscalCard
            split={splitFiscal}
            osAditivas={osAditivaHabilitada ? osAditivas : []}
          />

          {painel.ocorrencias.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resumo de ocorrências
              </p>
              <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 text-sm">
                {painel.ocorrencias.map((occ) => {
                  const tone =
                    STATUS_FINANCEIRO_OCORRENCIA_TONE[occ.status_financeiro] ??
                    'default';
                  const valorExibir =
                    occ.status_financeiro === 'PRECIFICADO' ||
                    occ.status_financeiro === 'FATURADO'
                      ? Number(occ.preco_cliente ?? 0)
                      : valorCobravelCliente(occ);
                  const podePrecificarEsta =
                    podeFinanceiro &&
                    ocorrenciaElegivelPrecificacao(occ, osAditivaHabilitada);
                  return (
                  <li
                    key={occ.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-foreground">
                        {TIPO_OCORRENCIA_LABEL[occ.tipo] ?? occ.tipo}
                        {occ.descricao ? ` — ${occ.descricao}` : ''}
                      </span>
                      <Badge
                        className={cn('text-xs', TONE_CLASSES[tone])}
                        variant="outline"
                      >
                        {STATUS_FINANCEIRO_OCORRENCIA_LABEL[
                          occ.status_financeiro
                        ] ?? occ.status_financeiro}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums text-muted-foreground">
                        {formatarMoeda(valorExibir)}
                      </span>
                      {podePrecificarEsta && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2 text-xs"
                          onClick={() =>
                            setPrecificarItem(
                              mapOcorrenciaParaPrecificacao(occ, painel),
                            )
                          }
                        >
                          Precificar
                        </Button>
                      )}
                    </div>
                  </li>
                  );
                })}
              </ul>
            </div>
          )}

          {bloqueioFinanceiro && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
              Existem ocorrências aguardando precificação. Conclua na aba
              Pendências antes de aprovar o faturamento.
            </p>
          )}

          {temExtrasPrecificados && !bloqueioFinanceiro && (
            <p className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-950 dark:text-blue-100">
              Há intercorrências precificadas. Ao aprovar o faturamento, a OS
              Aditiva será gerada automaticamente para cobrar os extras. Use
              &quot;Gerar OS Aditiva&quot; abaixo se quiser antecipar só a
              cobrança dos extras.
            </p>
          )}

          {podeGerarAditiva && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setConfirmarAditivaAberto(true)}
            >
              Gerar OS Aditiva para extras
            </Button>
          )}

          {relatorio?.pdf_token ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void instalacaoApi.abrirRelatorioPdf(relatorio.pdf_token)}
            >
              <IconFileTypePdf className="mr-2 h-4 w-4" />
              Baixar relatório técnico (PDF)
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={gerandoPrevia || carregando}
                onClick={() => void handleGerarPreviaPdf()}
              >
                {gerandoPrevia ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando prévia...
                  </>
                ) : (
                  <>
                    <IconFileTypePdf className="mr-2 h-4 w-4" />
                    Baixar prévia para o cliente
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Prévia com intercorrências e valores para conferência. O PDF
                oficial é emitido na aprovação do faturamento.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {podeAprovar
                ? 'Aprovação libera o saldo principal; extras viram OS Aditiva se houver.'
                : bloqueioFinanceiro
                  ? 'Precifique todas as intercorrências antes de aprovar.'
                  : jaConcluida
                    ? 'Encerramento financeiro já registrado para esta OS.'
                    : lotesAguardandoConclusao > 0
                      ? `${lotesAguardandoConclusao} lote(s) aguardam conclusão com assinatura no instalador.`
                      : 'Aguardando conclusão de todos os lotes em campo.'}
            </p>
            <Button
              type="button"
              disabled={!podeAprovar}
              onClick={() => setConfirmarAberto(true)}
            >
              {jaConcluida && !podeAprovar ? (
                <>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Faturamento aprovado
                </>
              ) : (
                'Aprovar faturamento'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmarAberto} onOpenChange={setConfirmarAberto}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar aprovação de faturamento</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação moverá a parcela de saldo para{' '}
              <strong className="text-foreground">A_FATURAR</strong>
              {temExtrasPrecificados && (
                <>
                  , gerará automaticamente a{' '}
                  <strong className="text-foreground">OS Aditiva</strong> com os
                  extras precificados ({formatarMoeda(valorExtrasCampo)})
                </>
              )}{' '}
              e liberará a entrega na expedição. O relatório técnico oficial em
              PDF será emitido neste momento. Deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={aprovando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={aprovando}
              onClick={(event) => {
                event.preventDefault();
                void handleAprovar();
              }}
            >
              {aprovando ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar aprovação'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmarAditivaAberto}
        onOpenChange={setConfirmarAditivaAberto}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar OS Aditiva</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Será criada uma OS Aditiva ({numeroExibicao}-A*) com valor total de{' '}
              <strong className="text-foreground">
                {formatarMoeda(valorExtrasCampo)}
              </strong>{' '}
              referente às ocorrências precificadas. A cobrança ficará separada da
              OS principal de produção. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={gerandoAditiva}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={gerandoAditiva}
              onClick={(event) => {
                event.preventDefault();
                void handleGerarOsAditiva();
              }}
            >
              {gerandoAditiva ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Confirmar geração'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PrecificarOcorrenciaDialog
        item={precificarItem}
        aberto={precificarItem != null}
        onAbertoChange={(aberto) => {
          if (!aberto) setPrecificarItem(null);
        }}
        onSucesso={() => {
          setPrecificarItem(null);
          setVersaoDados((v) => v + 1);
        }}
        podeAbonar={podeFinanceiro}
      />
    </>
  );
}
