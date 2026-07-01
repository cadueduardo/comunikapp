'use client';

import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EnderecoInstalacaoForm } from '@/components/instalacao/EnderecoInstalacaoForm';
import {
  STATUS_INSTALACAO_LABEL,
  STATUS_INSTALACAO_TONE,
} from '@/lib/instalacao/instalacao-labels';
import type {
  EnderecoLoteForm,
  PainelOsInstalacao,
} from '@/lib/instalacao/instalacao.types';
import { loteParaEnderecoForm } from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';
import { IconEdit, IconSignature } from '@tabler/icons-react';
import { toast } from 'sonner';

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

interface InstalacaoLotesTableProps {
  painel: PainelOsInstalacao;
  buscarCep: (cep: string) => Promise<unknown>;
  onAtualizarLote: (
    loteId: string,
    dados: EnderecoLoteForm,
  ) => Promise<void>;
  onPainelAtualizado?: () => void;
  somenteLeitura?: boolean;
}

export function InstalacaoLotesTable({
  painel,
  buscarCep,
  onAtualizarLote,
  somenteLeitura = false,
}: InstalacaoLotesTableProps) {
  const [loteEditando, setLoteEditando] = useState<string | null>(null);

  const loteEmEdicao = painel.lotes.find((l) => l.id === loteEditando);

  const salvarEndereco = useCallback(
    async (dados: EnderecoLoteForm) => {
      if (!loteEditando) return;
      await onAtualizarLote(loteEditando, dados);
      toast.success('Endereço do lote atualizado.');
      setLoteEditando(null);
    },
    [loteEditando, onAtualizarLote],
  );

  if (painel.lotes.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Nenhum lote de instalação vinculado a esta OS.
          {!somenteLeitura &&
            painel.itens_saldo?.some((item) => item.saldo_disponivel > 0) && (
            <span className="mt-1 block">
              Use &quot;Novo lote&quot; para alocar endereços e quantidades.
            </span>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 overflow-hidden">
      <div className="hidden w-full min-w-0 overflow-x-auto md:block">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Endereço</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assinatura</TableHead>
              {!somenteLeitura && (
                <TableHead className="text-right">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {painel.lotes.map((lote) => {
              const tone =
                STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
              return (
                <TableRow key={lote.id}>
                  <TableCell className="max-w-[240px]">
                    <p className="truncate font-medium text-foreground">
                      {lote.logradouro}, {lote.numero}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lote.bairro} — {lote.cidade}/{lote.uf}
                    </p>
                  </TableCell>
                  <TableCell>{lote.quantidade_alocada}</TableCell>
                  <TableCell>
                    <Badge className={cn('whitespace-nowrap', TONE_CLASSES[tone])}>
                      {STATUS_INSTALACAO_LABEL[lote.status_instalacao]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lote.assinatura_url ? (
                      <a
                        href={lote.assinatura_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <IconSignature className="h-3.5 w-3.5" />
                        Ver
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {!somenteLeitura && (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={lote.status_instalacao === 'CONCLUIDO'}
                        onClick={() => setLoteEditando(lote.id)}
                      >
                        <IconEdit className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {painel.lotes.map((lote) => {
          const tone =
            STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
          return (
            <Card key={lote.id} className="w-full min-w-0 border-border bg-card">
              <CardContent className="space-y-2 p-4">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="break-words text-sm font-medium text-foreground">
                    {lote.logradouro}, {lote.numero}
                  </p>
                  <Badge className={cn('shrink-0', TONE_CLASSES[tone])}>
                    {STATUS_INSTALACAO_LABEL[lote.status_instalacao]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lote.bairro} — {lote.cidade}/{lote.uf} · {lote.quantidade_alocada} un.
                </p>
                {!somenteLeitura && lote.status_instalacao !== 'CONCLUIDO' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setLoteEditando(lote.id)}
                  >
                    Editar endereço
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!somenteLeitura && loteEmEdicao && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Editar endereço do lote</CardTitle>
          </CardHeader>
          <CardContent>
            <EnderecoInstalacaoForm
              key={loteEmEdicao.id}
              valorInicial={loteParaEnderecoForm(loteEmEdicao)}
              buscarCep={buscarCep as (cep: string) => Promise<{
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
              }>}
              exibirQuantidade
              onSalvar={salvarEndereco}
            />
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={() => setLoteEditando(null)}
            >
              Cancelar edição
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
