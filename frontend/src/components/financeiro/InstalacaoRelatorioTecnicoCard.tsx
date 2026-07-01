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
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import {
  STATUS_INSTALACAO_OS_LABEL,
  STATUS_INSTALACAO_OS_TONE,
  TIPO_OCORRENCIA_LABEL,
} from '@/lib/instalacao/instalacao-labels';
import type {
  PainelOsInstalacao,
  RelatorioTecnicoEmitido,
  SplitFiscalOs,
  StatusInstalacaoOs,
} from '@/lib/instalacao/instalacao.types';
import { formatarMoeda } from '@/lib/financeiro/financeiro-format';
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
  const [carregando, setCarregando] = useState(true);
  const [aprovando, setAprovando] = useState(false);
  const [confirmarAberto, setConfirmarAberto] = useState(false);
  const [painel, setPainel] = useState<PainelOsInstalacao | null>(null);
  const [splitFiscal, setSplitFiscal] = useState<SplitFiscalOs | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioTecnicoEmitido | null>(
    null,
  );
  const [versaoDados, setVersaoDados] = useState(0);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [painelData, splitData, relatorioData] = await Promise.all([
        instalacaoApi.obterPainelOs(osId),
        instalacaoApi.obterSplitFiscal(osId).catch(() => null),
        instalacaoApi.obterRelatorioEmitido(osId),
      ]);
      setPainel(painelData);
      setSplitFiscal(splitData);
      setRelatorio(relatorioData);
    } catch (err) {
      setPainel(null);
      setSplitFiscal(null);
      setRelatorio(null);
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
      (acc, occ) => acc + Number(occ.preco_cliente ?? 0),
      0,
    );
  }, [painel]);

  const podeAprovar =
    statusOs === 'AGUARDANDO_RELATORIO_TECNICO' && !aprovando && !carregando;

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
              <p className="text-xs text-muted-foreground">Extras cobráveis em campo</p>
              <p className="text-sm font-medium text-foreground">
                {formatarMoeda(valorExtrasCampo)}
              </p>
            </div>
          </div>

          {painel.ocorrencias.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resumo de ocorrências
              </p>
              <ul className="max-h-36 space-y-1.5 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 text-sm">
                {painel.ocorrencias.map((occ) => (
                  <li
                    key={occ.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0"
                  >
                    <span className="text-foreground">
                      {TIPO_OCORRENCIA_LABEL[occ.tipo] ?? occ.tipo}
                      {occ.descricao ? ` — ${occ.descricao}` : ''}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatarMoeda(Number(occ.preco_cliente ?? 0))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {splitFiscal && (
            <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
              <p className="mb-2 font-medium text-foreground">Split fiscal sugerido</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="text-muted-foreground">
                  NF-e (produto):{' '}
                  <span className="font-medium text-foreground">
                    {formatarMoeda(splitFiscal.total_nfe)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  NFS-e (serviço):{' '}
                  <span className="font-medium text-foreground">
                    {formatarMoeda(splitFiscal.total_nfs)}
                  </span>
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {splitFiscal.instrucao_nfe}
              </p>
              <p className="text-xs text-muted-foreground">
                {splitFiscal.instrucao_nfs}
              </p>
            </div>
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
            <p className="text-xs text-muted-foreground">
              O PDF do relatório técnico será gerado ao confirmar a aprovação do
              faturamento.
            </p>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {podeAprovar
                ? 'Aprovação libera a parcela de saldo para A_FATURAR e finaliza a expedição.'
                : jaConcluida
                  ? 'Encerramento financeiro já registrado para esta OS.'
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
              {valorExtrasCampo > 0.01 && (
                <>
                  , consolidará{' '}
                  <strong className="text-foreground">
                    {formatarMoeda(valorExtrasCampo)}
                  </strong>{' '}
                  em cobranças extras de campo
                </>
              )}{' '}
              e liberará a entrega na expedição. O relatório técnico em PDF será
              emitido automaticamente. Deseja prosseguir?
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
    </>
  );
}
