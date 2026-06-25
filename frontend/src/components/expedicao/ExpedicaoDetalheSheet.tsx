'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { expedicaoApi } from '@/lib/expedicao/expedicao-api';
import {
  MODALIDADE_EXPEDICAO_LABEL,
  STATUS_EXPEDICAO_LABEL,
} from '@/lib/expedicao/expedicao-columns';
import { formatarDataHistoricoExpedicao } from '@/lib/expedicao/expedicao-format';
import type { ExpedicaoDetalhe } from '@/lib/expedicao/expedicao.types';
import {
  IconAlertTriangle,
  IconArchive,
  IconExternalLink,
  IconLock,
  IconCircleCheck,
  IconTruckDelivery,
  IconMapPin,
  IconUser,
  IconCalendar,
  IconPackage,
  IconTemplate,
} from '@tabler/icons-react';

export interface ExpedicaoDetalheSheetProps {
  expedicaoId: string | null;
  open: boolean;
  refreshToken?: number;
  onClose: () => void;
  onDevolver: (detalhe: ExpedicaoDetalhe) => void;
  onConcluir: (detalhe: ExpedicaoDetalhe) => void;
  onArquivar?: (detalhe: ExpedicaoDetalhe) => void;
  onTransformarTemplate?: (detalhe: ExpedicaoDetalhe) => void;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function ExpedicaoDetalheSheet({
  expedicaoId,
  open,
  refreshToken = 0,
  onClose,
  onDevolver,
  onConcluir,
  onArquivar,
  onTransformarTemplate,
}: ExpedicaoDetalheSheetProps) {
  const [detalhe, setDetalhe] = useState<ExpedicaoDetalhe | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !expedicaoId) {
      return;
    }

    let ativo = true;
    setLoading(true);
    setErro(null);

    expedicaoApi
      .obterDetalhe(expedicaoId)
      .then((data) => {
        if (ativo) setDetalhe(data);
      })
      .catch((err) => {
        if (ativo) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar detalhe');
          setDetalhe(null);
        }
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [open, expedicaoId, refreshToken]);

  const bloqueio = detalhe?.bloqueio_financeiro;
  const isBloqueado = Boolean(bloqueio?.bloqueado);
  const podeDevolver =
    detalhe &&
    !['DEVOLVIDA', 'ENTREGUE_FINALIZADO', 'ARQUIVADO'].includes(detalhe.status);
  const podeConcluir =
    detalhe &&
    !['DEVOLVIDA', 'ENTREGUE_FINALIZADO', 'ARQUIVADO'].includes(detalhe.status);
  const podeArquivar =
    detalhe?.status === 'ENTREGUE_FINALIZADO' && Boolean(onArquivar);
  const podeTransformar =
    Boolean(detalhe?.ordem_servico.orcamento_id) &&
    Boolean(onTransformarTemplate);

  const statusLabel =
    (detalhe && STATUS_EXPEDICAO_LABEL[detalhe.status]) ?? detalhe?.status;
  const modalidadeLabel =
    detalhe &&
    (MODALIDADE_EXPEDICAO_LABEL[detalhe.modalidade] ?? detalhe.modalidade);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="space-y-3 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <IconTruckDelivery className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-left text-lg font-bold">
                Expedição — {detalhe?.ordem_servico.numero ?? '...'}
              </DialogTitle>
              <p className="truncate text-sm text-muted-foreground">
                {detalhe?.ordem_servico.nome_servico ?? 'Carregando dados logísticos'}
              </p>
            </div>
          </div>

          {detalhe && !loading && (
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                {statusLabel}
              </Badge>
              <Badge variant="outline">{modalidadeLabel}</Badge>
              {detalhe.ordem_servico.retrabalho && (
                <Badge className="bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-100">
                  Retrabalho
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="max-h-[55vh] space-y-5 overflow-y-auto px-6 py-5">
          {loading && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}

          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {detalhe && !loading && (
            <>
              {bloqueio?.bloqueado && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <IconAlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Entrega bloqueada por pendência financeira.
                    {bloqueio.link_financeiro && (
                      <>
                        {' '}
                        <Link
                          href={bloqueio.link_financeiro}
                          className="font-medium underline"
                        >
                          Regularizar {bloqueio.os_numero ?? 'esta OS'} no financeiro
                        </Link>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 rounded-lg border bg-slate-50/80 p-4">
                <InfoRow
                  icon={<IconUser className="h-4 w-4" />}
                  label="Cliente"
                  value={detalhe.ordem_servico.cliente.nome}
                />

                {detalhe.ordem_servico.endereco_entrega && (
                  <InfoRow
                    icon={<IconMapPin className="h-4 w-4" />}
                    label="Endereço de entrega"
                    value={detalhe.ordem_servico.endereco_entrega}
                  />
                )}

                {detalhe.codigo_rastreio && (
                  <InfoRow
                    icon={<IconPackage className="h-4 w-4" />}
                    label="Código de rastreio"
                    value={detalhe.codigo_rastreio}
                  />
                )}

                {detalhe.data_expedida && (
                  <InfoRow
                    icon={<IconCalendar className="h-4 w-4" />}
                    label="Expedida em"
                    value={formatarDataHistoricoExpedicao(detalhe.data_expedida)}
                  />
                )}

                {detalhe.observacoes && (
                  <InfoRow
                    icon={<IconPackage className="h-4 w-4" />}
                    label="Observações"
                    value={detalhe.observacoes}
                  />
                )}
              </div>

              <div className="rounded-lg bg-violet-50 px-4 py-3">
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Histórico de Movimentações
                </p>
                <p className="text-sm text-slate-700">
                  OS enviada para expedição em{' '}
                  {formatarDataHistoricoExpedicao(detalhe.criado_em)}
                </p>
                {detalhe.ordem_servico.retrabalho && (
                  <p className="mt-2 text-sm text-red-700">
                    Esta OS já passou por retrabalho após devolução anterior.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {detalhe && !loading && (
          <>
            <Separator />
            <DialogFooter className="flex-col gap-2 px-6 py-4 sm:flex-row sm:justify-between">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link href={`/os/${detalhe.os_id}`}>
                    <IconExternalLink className="mr-1 h-4 w-4" />
                    Abrir OS
                  </Link>
                </Button>

                {podeTransformar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTransformarTemplate?.(detalhe)}
                    className="w-full border-indigo-200 text-indigo-900 hover:bg-indigo-50 sm:w-auto"
                  >
                    <IconTemplate className="mr-1 h-4 w-4" />
                    Salvar template
                  </Button>
                )}
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {podeArquivar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onArquivar?.(detalhe)}
                    className="w-full sm:w-auto"
                  >
                    <IconArchive className="mr-1 h-4 w-4" />
                    Arquivar
                  </Button>
                )}

                {podeConcluir && (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isBloqueado}
                    onClick={() => onConcluir(detalhe)}
                    className={`w-full sm:w-auto ${isBloqueado ? 'opacity-70' : ''}`}
                  >
                    {isBloqueado ? (
                      <IconLock className="mr-1 h-4 w-4" />
                    ) : (
                      <IconCircleCheck className="mr-1 h-4 w-4" />
                    )}
                    {isBloqueado ? 'Conclusão bloqueada' : 'Concluir entrega'}
                  </Button>
                )}

                {podeDevolver && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDevolver(detalhe)}
                    className="w-full border-fuchsia-300 text-fuchsia-900 hover:bg-fuchsia-100 sm:w-auto"
                  >
                    <IconAlertTriangle className="mr-1 h-4 w-4" />
                    Devolver para produção
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
