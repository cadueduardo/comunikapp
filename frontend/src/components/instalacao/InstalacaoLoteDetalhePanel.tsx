'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnexoInstalacaoImagem } from '@/components/instalacao/AnexoInstalacaoImagem';
import { AprovarConclusaoLoteDialog } from '@/components/instalacao/AprovarConclusaoLoteDialog';
import {
  MOTIVO_SEM_ASSINATURA_LABEL,
  ORIGEM_CONCLUSAO_LOTE_LABEL,
  STATUS_INSTALACAO_LABEL,
  STATUS_INSTALACAO_TONE,
} from '@/lib/instalacao/instalacao-labels';
import {
  contarLotesAguardandoConclusaoCampo,
  formatarDataPrevisaoLote,
  montarEnderecoResumido,
} from '@/lib/instalacao/instalacao-lote-utils';
import {
  IconArrowLeft,
  IconCalendar,
  IconClipboardList,
  IconMapPin,
  IconPhoto,
  IconSignature,
  IconUsers,
  IconCircleCheck,
} from '@tabler/icons-react';
import { InstalacaoLoteOcorrenciasHistorico } from '@/components/instalacao/InstalacaoLoteOcorrenciasHistorico';
import { InstalacaoLoteEvidenciasGaleria } from '@/components/instalacao/InstalacaoLoteEvidenciasGaleria';
import { EditarEnderecoLoteDialog } from '@/components/instalacao/EditarEnderecoLoteDialog';
import { OcorrenciaRapidaDialog } from '@/components/instalacao/OcorrenciaRapidaDialog';
import type {
  EnderecoLoteForm,
  LotePainelOs,
  MotivoSemAssinaturaLote,
  OcorrenciaGestao,
  PainelOsInstalacao,
  ResultadoBuscaCep,
} from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

interface InstalacaoLoteDetalhePanelProps {
  lote: LotePainelOs;
  ocorrencias?: OcorrenciaGestao[];
  onVoltar?: () => void;
  rotuloLote?: string | null;
  buscarCep?: (cep: string) => Promise<ResultadoBuscaCep>;
  onEditarEndereco?: (dados: EnderecoLoteForm) => Promise<void>;
  quantidadeMaximaEdicao?: number;
  onAprovarConclusao?: (dados: {
    fotos_evidencia?: string[];
    motivo_sem_assinatura?: MotivoSemAssinaturaLote;
    observacao_conclusao_gestao?: string;
    assinatura_url?: string;
  }) => Promise<void>;
  onUploadAnexo?: (arquivo: File) => Promise<{ url: string }>;
  edicaoAberta?: boolean;
  onEdicaoAbertaChange?: (aberto: boolean) => void;
  osId?: string;
  painelOs?: PainelOsInstalacao;
  onRegistrarOcorrencia?: (dados: {
    os_id: string;
    item_instalacao_id?: string;
    tipo: string;
    descricao: string;
    fotos_evidencia?: string[];
  }) => Promise<void>;
}

export function InstalacaoLoteDetalhePanel({
  lote,
  ocorrencias = [],
  onVoltar,
  rotuloLote,
  buscarCep,
  onEditarEndereco,
  quantidadeMaximaEdicao,
  onAprovarConclusao,
  onUploadAnexo,
  edicaoAberta,
  onEdicaoAbertaChange,
  osId,
  painelOs,
  onRegistrarOcorrencia,
}: InstalacaoLoteDetalhePanelProps) {
  const [dialogAprovarAberto, setDialogAprovarAberto] = useState(false);
  const [aprovando, setAprovando] = useState(false);

  const fotosConclusao = lote.fotos_evidencia ?? [];
  const tone = STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
  const aguardandoConclusaoCampo =
    lote.status_instalacao === 'EM_ANDAMENTO' ||
    lote.status_instalacao === 'AGUARDANDO';
  const faltaAssinatura = aguardandoConclusaoCampo && !lote.assinatura_url;
  const podeAprovarGestao =
    Boolean(onAprovarConclusao && onUploadAnexo) && aguardandoConclusaoCampo;
  const concluidoPorGestao = lote.origem_conclusao_lote === 'GESTAO';

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {onVoltar && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit text-muted-foreground"
          onClick={onVoltar}
        >
          <IconArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar ao quadro de lotes
        </Button>
      )}

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base font-semibold text-foreground">
                {lote.item_os.produto_servico ?? 'Instalação em campo'}
              </CardTitle>
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <IconMapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{montarEnderecoResumido(lote)}</span>
              </p>
              {lote.complemento && (
                <p className="text-xs text-muted-foreground">
                  Complemento: {lote.complemento}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge
                className={cn('shrink-0', TONE_CLASSES[tone])}
                variant="outline"
              >
                {STATUS_INSTALACAO_LABEL[lote.status_instalacao] ??
                  lote.status_instalacao}
              </Badge>
              {lote.aguardando_reagendamento && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100"
                >
                  Aguardando data
                </Badge>
              )}
              {buscarCep && onEditarEndereco && (
                <EditarEnderecoLoteDialog
                  lote={lote}
                  buscarCep={buscarCep}
                  onSalvar={onEditarEndereco}
                  quantidadeMaxima={quantidadeMaximaEdicao}
                  open={edicaoAberta}
                  onOpenChange={onEdicaoAbertaChange}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Quantidade alocada</p>
            <p className="text-sm font-medium text-foreground">
              {lote.quantidade_alocada} un.
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconCalendar className="h-3.5 w-3.5" />
              Previsão de visita
            </p>
            <p className="text-sm font-medium text-foreground">
              {formatarDataPrevisaoLote(lote.data_previsao, lote.turno_previsao)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconUsers className="h-3.5 w-3.5" />
              Equipe alocada
            </p>
            <p className="text-sm font-medium text-foreground">
              {lote.equipe_instalacao?.trim() || 'Não definida'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {lote.informar_equipe
                ? 'Equipe informada no app de campo'
                : 'Ainda não informada à equipe'}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Responsável no local</p>
            <p className="text-sm font-medium text-foreground">
              {lote.responsavel_local?.trim() || 'Não informado'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <IconClipboardList className="h-4 w-4" />
              Histórico de ocorrências
            </CardTitle>
            {osId && onRegistrarOcorrencia && onUploadAnexo && (
              <OcorrenciaRapidaDialog
                osId={osId}
                painel={painelOs}
                onRegistrar={onRegistrarOcorrencia}
                onUpload={onUploadAnexo}
                loteIdFixo={lote.id}
                loteRotuloFixo={montarEnderecoResumido(lote)}
                rotuloBotao="Nova ocorrência"
                varianteBotao="outline"
                classNameBotao="shrink-0"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <InstalacaoLoteOcorrenciasHistorico
            ocorrencias={ocorrencias}
            rotuloLote={rotuloLote}
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <IconPhoto className="h-4 w-4" />
            Evidências fotográficas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InstalacaoLoteEvidenciasGaleria
            fotosConclusao={fotosConclusao}
            ocorrencias={ocorrencias}
          />
        </CardContent>
      </Card>

      {podeAprovarGestao && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                Conclusão por alçada da gestão
              </p>
              <p className="text-muted-foreground">
                Confira ocorrências e evidências. Aprove mesmo sem assinatura
                do instalador, registrando o motivo.
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700"
              onClick={() => setDialogAprovarAberto(true)}
            >
              <IconCircleCheck className="mr-2 h-4 w-4" />
              Aprovar conclusão
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <IconSignature className="h-4 w-4" />
            Termo de assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!lote.assinatura_url ? (
            <>
              <p className="text-sm text-muted-foreground">
                Assinatura ainda não coletada neste endereço.
              </p>
              {concluidoPorGestao && lote.motivo_sem_assinatura && (
                <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {ORIGEM_CONCLUSAO_LOTE_LABEL.GESTAO}
                  </Badge>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Motivo: </span>
                    {MOTIVO_SEM_ASSINATURA_LABEL[lote.motivo_sem_assinatura] ??
                      lote.motivo_sem_assinatura}
                  </p>
                  {lote.observacao_conclusao_gestao && (
                    <p className="text-muted-foreground">
                      {lote.observacao_conclusao_gestao}
                    </p>
                  )}
                  {lote.conclusao_gestao_em && (
                    <p className="text-xs text-muted-foreground">
                      Aprovado em{' '}
                      {new Date(lote.conclusao_gestao_em).toLocaleString(
                        'pt-BR',
                      )}
                    </p>
                  )}
                </div>
              )}
              {faltaAssinatura && (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                  Registrar ocorrências não conclui a instalação. No aplicativo{' '}
                  <strong className="font-medium">/instalador</strong>, abra este
                  endereço e use{' '}
                  <strong className="font-medium">Concluir trabalho</strong>{' '}
                  (fotos + assinatura do recebedor), ou use{' '}
                  <strong className="font-medium">Aprovar conclusão</strong>{' '}
                  acima.
                </p>
              )}
            </>
          ) : (
            <div className="max-w-md overflow-hidden rounded-md border border-border bg-muted">
              <AnexoInstalacaoImagem
                src={lote.assinatura_url}
                alt="Assinatura do cliente"
                className="h-auto w-full object-contain"
              />
            </div>
          )}
          {lote.origem_conclusao_lote && (
            <p className="text-xs text-muted-foreground">
              Conclusão via{' '}
              {ORIGEM_CONCLUSAO_LOTE_LABEL[lote.origem_conclusao_lote] ??
                lote.origem_conclusao_lote}
            </p>
          )}
        </CardContent>
      </Card>

      {onAprovarConclusao && onUploadAnexo && (
        <AprovarConclusaoLoteDialog
          open={dialogAprovarAberto}
          lote={lote}
          loading={aprovando}
          onClose={() => setDialogAprovarAberto(false)}
          onUploadAnexo={onUploadAnexo}
          onConfirm={async (dados) => {
            setAprovando(true);
            try {
              await onAprovarConclusao(dados);
              setDialogAprovarAberto(false);
            } finally {
              setAprovando(false);
            }
          }}
        />
      )}
    </div>
  );
}
