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
import type { LotePainelOs } from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';
import {
  IconArrowLeft,
  IconCalendar,
  IconMapPin,
  IconPhoto,
  IconSignature,
  IconUsers,
} from '@tabler/icons-react';

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
  onVoltar?: () => void;
}

export function InstalacaoLoteDetalhePanel({
  lote,
  onVoltar,
}: InstalacaoLoteDetalhePanelProps) {
  const fotos = lote.fotos_evidencia ?? [];
  const tone = STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';

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
            <Badge
              className={cn('shrink-0', TONE_CLASSES[tone])}
              variant="outline"
            >
              {STATUS_INSTALACAO_LABEL[lote.status_instalacao] ??
                lote.status_instalacao}
            </Badge>
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
            <IconPhoto className="h-4 w-4" />
            Evidências fotográficas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fotos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma foto de campo registrada para este lote.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {fotos.map((foto, index) => (
                <div
                  key={`${foto}-${index}`}
                  className="aspect-square overflow-hidden rounded-md border border-border bg-muted"
                >
                  <AnexoInstalacaoImagem
                    src={foto}
                    alt={`Evidência ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <IconSignature className="h-4 w-4" />
            Termo de assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!lote.assinatura_url ? (
            <p className="text-sm text-muted-foreground">
              Assinatura ainda não coletada neste endereço.
            </p>
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
