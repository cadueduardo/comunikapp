'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnexoInstalacaoImagem } from '@/components/instalacao/AnexoInstalacaoImagem';
import {
  STATUS_INSTALACAO_LABEL,
  STATUS_INSTALACAO_TONE,
} from '@/lib/instalacao/instalacao-labels';
import {
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
} from '@tabler/icons-react';
import { InstalacaoLoteOcorrenciasHistorico } from '@/components/instalacao/InstalacaoLoteOcorrenciasHistorico';
import { InstalacaoLoteEvidenciasGaleria } from '@/components/instalacao/InstalacaoLoteEvidenciasGaleria';
import { EditarEnderecoLoteDialog } from '@/components/instalacao/EditarEnderecoLoteDialog';
import type {
  EnderecoLoteForm,
  LotePainelOs,
  OcorrenciaGestao,
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
}

export function InstalacaoLoteDetalhePanel({
  lote,
  ocorrencias = [],
  onVoltar,
  rotuloLote,
  buscarCep,
  onEditarEndereco,
  quantidadeMaximaEdicao,
}: InstalacaoLoteDetalhePanelProps) {
  const fotosConclusao = lote.fotos_evidencia ?? [];
  const tone = STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
  const aguardandoAssinatura =
    lote.status_instalacao === 'EM_ANDAMENTO' ||
    lote.status_instalacao === 'AGUARDANDO';

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
              {buscarCep && onEditarEndereco && (
                <EditarEnderecoLoteDialog
                  lote={lote}
                  buscarCep={buscarCep}
                  onSalvar={onEditarEndereco}
                  quantidadeMaxima={quantidadeMaximaEdicao}
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
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <IconClipboardList className="h-4 w-4" />
            Histórico de ocorrências
          </CardTitle>
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
              {aguardandoAssinatura && (
                <p className="text-xs text-muted-foreground">
                  A assinatura do recebedor é coletada no aplicativo de campo
                  em{' '}
                  <strong className="font-medium text-foreground">
                    /instalador
                  </strong>
                  , ao concluir a instalação do lote (canvas de assinatura +
                  confirmação). O gestor no desktop não assina por aqui.
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
        </CardContent>
      </Card>
    </div>
  );
}
