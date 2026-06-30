'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  STATUS_INSTALACAO_LABEL,
  STATUS_INSTALACAO_TONE,
} from '@/lib/instalacao/instalacao-labels';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import type { LoteGestao } from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';
import { IconLoader2, IconMapPin, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

export default function InstalacaoGestaoPage() {
  const [lotes, setLotes] = useState<LoteGestao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await instalacaoApi.listarLotes();
      setLotes(dados);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao carregar lotes',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Instalações</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de lotes, endereços e acompanhamento de campo
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={carregando}
          onClick={() => void carregar()}
        >
          <IconRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : lotes.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <IconMapPin className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum lote de instalação cadastrado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden w-full min-w-0 overflow-x-auto md:block">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.map((lote) => {
                  const os = lote.item_os.os;
                  const tone =
                    STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
                  return (
                    <TableRow key={lote.id}>
                      <TableCell className="font-medium">
                        {os.numero}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {os.cliente?.nome ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate">
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
                      <TableCell className="text-right">
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link href={`/os/${os.id}?tab=instalacao`}>
                            Abrir OS
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {lotes.map((lote) => {
              const os = lote.item_os.os;
              const tone =
                STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
              return (
                <Card key={lote.id} className="w-full min-w-0 border-border bg-card">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          OS {os.numero}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {os.cliente?.nome}
                        </p>
                      </div>
                      <Badge className={cn('shrink-0', TONE_CLASSES[tone])}>
                        {STATUS_INSTALACAO_LABEL[lote.status_instalacao]}
                      </Badge>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">
                      {lote.logradouro}, {lote.numero} — {lote.bairro}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link href={`/os/${os.id}?tab=instalacao`}>
                        Ver na OS
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
