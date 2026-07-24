'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { expedicaoApi } from '@/lib/expedicao/expedicao-api';
import { STATUS_EXPEDICAO_LABEL } from '@/lib/expedicao/expedicao-columns';
import { formatarDataHistoricoExpedicao } from '@/lib/expedicao/expedicao-format';
import type { ExpedicaoCardKanban } from '@/lib/expedicao/expedicao.types';
import { expedicaoModuleNav } from '@/lib/module-nav';
import { IconArchive, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function ExpedicaoArquivoPage() {
  const [cards, setCards] = useState<ExpedicaoCardKanban[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expedicaoApi.listarArquivo({
        busca: busca.trim() || undefined,
      });
      setCards(data.cards ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao carregar arquivo',
      );
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregar();
    }, 400);
    return () => clearTimeout(timer);
  }, [carregar]);

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={expedicaoModuleNav}
        title="Arquivo de expedição"
        subtitle="Entregas arquivadas e histórico de devoluções"
        icon={<IconArchive className="h-6 w-6" />}
        backHref="/expedicao"
        actions={
          <div className="flex gap-2">
            <Input
              placeholder="Buscar OS ou cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button variant="outline" size="sm" onClick={() => void carregar()}>
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
          ) : cards.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nenhum registro no arquivo com os filtros atuais.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.os_numero}</TableCell>
                    <TableCell>{card.titulo}</TableCell>
                    <TableCell>{card.cliente}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {STATUS_EXPEDICAO_LABEL[card.status] ?? card.status}
                      </Badge>
                      {card.retrabalho && (
                        <Badge className="ml-1 bg-fuchsia-100 text-fuchsia-800">
                          Retrabalho
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatarDataHistoricoExpedicao(card.atualizado_em)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/os/${card.os_id}`}>Abrir OS</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
