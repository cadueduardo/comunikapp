'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConcluirLoteDialog } from '@/components/instalacao/ConcluirLoteDialog';
import { EnderecoInstalacaoForm } from '@/components/instalacao/EnderecoInstalacaoForm';
import { OcorrenciaRapidaDialog } from '@/components/instalacao/OcorrenciaRapidaDialog';
import {
  STATUS_INSTALACAO_LABEL,
  STATUS_INSTALACAO_TONE,
  TIPO_OCORRENCIA_LABEL,
} from '@/lib/instalacao/instalacao-labels';
import { instaladorApi } from '@/lib/instalacao/instalador-api';
import type { LoteInstaladorDetalhe } from '@/lib/instalacao/instalacao.types';
import { loteParaEnderecoForm } from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';
import {
  IconArrowLeft,
  IconLoader2,
  IconPlayerPlay,
  IconCircleCheck,
} from '@tabler/icons-react';
import { toast } from 'sonner';

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

export default function InstaladorLotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const loteId = params.id;

  const [lote, setLote] = useState<LoteInstaladorDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [dialogConcluir, setDialogConcluir] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await instaladorApi.obterLote(loteId);
      setLote(dados);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lote não encontrado',
      );
      router.push('/instalador');
    } finally {
      setCarregando(false);
    }
  }, [loteId, router]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function handleIniciar() {
    setProcessando(true);
    try {
      await instaladorApi.iniciarLote(loteId);
      toast.success('Trabalho iniciado.');
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao iniciar');
    } finally {
      setProcessando(false);
    }
  }

  async function handleConcluir(dados: {
    fotos_evidencia?: string[];
    assinatura_url?: string;
  }) {
    setProcessando(true);
    try {
      await instaladorApi.concluirLote(loteId, dados);
      toast.success('Instalação concluída com sucesso.');
      setDialogConcluir(false);
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao concluir');
      throw err;
    } finally {
      setProcessando(false);
    }
  }

  if (carregando || !lote) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando lote...
      </div>
    );
  }

  const os = lote.item_os.os;
  const tone = STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
  const podeIniciar = lote.status_instalacao === 'AGUARDANDO';
  const podeConcluir = lote.status_instalacao === 'EM_ANDAMENTO';
  const podeRegistrarOcorrencia =
    lote.status_instalacao === 'AGUARDANDO' ||
    lote.status_instalacao === 'EM_ANDAMENTO';
  const enderecoSomenteLeitura =
    lote.status_instalacao === 'CONCLUIDO' ||
    lote.status_instalacao === 'LOGISTICA_NEGATIVA';

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-lg flex-col gap-4 overflow-x-hidden px-3 py-4 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href="/instalador">
            <IconArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-foreground">
            OS {os.numero}
          </h1>
          <p className="line-clamp-2 break-words text-xs text-muted-foreground">
            {os.nome_servico}
          </p>
        </div>
        <Badge className={cn('shrink-0', TONE_CLASSES[tone])}>
          {STATUS_INSTALACAO_LABEL[lote.status_instalacao]}
        </Badge>
      </div>

      <Card className="w-full min-w-0 border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">
            Local de instalação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnderecoInstalacaoForm
            key={`${lote.id}-${lote.criado_em}`}
            valorInicial={loteParaEnderecoForm(lote)}
            buscarCep={(cep) => instaladorApi.buscarCep(cep)}
            somenteLeitura={enderecoSomenteLeitura}
            onSalvar={async (dados) => {
              await instaladorApi.atualizarEndereco(loteId, dados);
              toast.success('Endereço salvo.');
              await carregar();
            }}
          />
        </CardContent>
      </Card>

      {(podeIniciar || podeConcluir || podeRegistrarOcorrencia) && (
        <div className="flex w-full min-w-0 flex-col gap-2">
          {podeIniciar && (
            <Button
              type="button"
              className="h-12 w-full min-w-0 text-base"
              disabled={processando}
              onClick={() => void handleIniciar()}
            >
              {processando ? (
                <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <IconPlayerPlay className="mr-2 h-5 w-5" />
              )}
              Iniciar trabalho
            </Button>
          )}
          {podeRegistrarOcorrencia && (
            <OcorrenciaRapidaDialog
              osId={os.id}
              loteIdFixo={loteId}
              loteRotuloFixo={`${lote.logradouro}, ${lote.numero}`}
              rotuloBotao="Registrar ocorrência"
              varianteBotao="outline"
              classNameBotao="h-12 w-full min-w-0 text-base"
              onUpload={(arquivo) => instaladorApi.uploadAnexo(arquivo)}
              onRegistrar={async (dados) => {
                await instaladorApi.registrarOcorrencia(dados);
                toast.success('Ocorrência registrada.');
                await carregar();
              }}
            />
          )}
          {podeConcluir && (
            <Button
              type="button"
              variant="default"
              className="h-12 w-full min-w-0 bg-emerald-600 text-base hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              disabled={processando}
              onClick={() => setDialogConcluir(true)}
            >
              <IconCircleCheck className="mr-2 h-5 w-5" />
              Concluir trabalho
            </Button>
          )}
        </div>
      )}

      {(podeRegistrarOcorrencia || lote.ocorrencias.length > 0) && (
        <Card className="w-full min-w-0 border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">
              Ocorrências registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lote.ocorrencias.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma ocorrência ainda. Use o botão acima para relatar
                imprevistos da visita.
              </p>
            ) : (
              lote.ocorrencias.map((occ) => (
                <div
                  key={occ.id}
                  className="rounded-lg border border-border bg-muted/30 p-3"
                >
                  <p className="text-sm font-medium text-foreground">
                    {TIPO_OCORRENCIA_LABEL[occ.tipo] ?? occ.tipo}
                  </p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {occ.descricao}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <ConcluirLoteDialog
        open={dialogConcluir}
        lote={lote}
        loading={processando}
        onClose={() => setDialogConcluir(false)}
        onUploadAnexo={(arquivo) => instaladorApi.uploadAnexo(arquivo)}
        onConfirm={handleConcluir}
      />
    </div>
  );
}
