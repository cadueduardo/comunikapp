'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, ExternalLink, RefreshCw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pcpApi } from '@/lib/api-client';

type StatusTerceirizacao =
  | 'A_COTAR'
  | 'COTADO'
  | 'PEDIDO_ENVIADO'
  | 'EM_PRODUCAO'
  | 'PRONTO'
  | 'EM_TRANSITO'
  | 'RECEBIDO'
  | 'ENTREGUE'
  | 'CANCELADO';

interface OrdemTerceirizacao {
  id: string;
  status: StatusTerceirizacao;
  custo_total?: string | number | null;
  prazo_dias?: number | null;
  data_prevista?: string | null;
  fornecedor: {
    id: string;
    nome: string;
    contato_nome?: string | null;
    whatsapp?: string | null;
  };
  item_os: {
    id: string;
    produto_servico: string;
    quantidade: string | number;
    os: { id: string; numero: string; data_prazo?: string | null };
  };
}

const STATUS_FLUXO: StatusTerceirizacao[] = [
  'A_COTAR',
  'COTADO',
  'PEDIDO_ENVIADO',
  'EM_PRODUCAO',
  'PRONTO',
  'EM_TRANSITO',
  'RECEBIDO',
  'ENTREGUE',
];

const statusLabel: Record<StatusTerceirizacao, string> = {
  A_COTAR: 'A cotar',
  COTADO: 'Cotado',
  PEDIDO_ENVIADO: 'Pedido enviado',
  EM_PRODUCAO: 'Em produção',
  PRONTO: 'Pronto',
  EM_TRANSITO: 'Em trânsito',
  RECEBIDO: 'Recebido',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const proximosStatus: Record<StatusTerceirizacao, StatusTerceirizacao[]> = {
  A_COTAR: ['COTADO', 'CANCELADO'],
  COTADO: ['PEDIDO_ENVIADO', 'CANCELADO'],
  PEDIDO_ENVIADO: ['EM_PRODUCAO', 'CANCELADO'],
  EM_PRODUCAO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['EM_TRANSITO', 'RECEBIDO', 'ENTREGUE', 'CANCELADO'],
  EM_TRANSITO: ['RECEBIDO', 'ENTREGUE', 'CANCELADO'],
  RECEBIDO: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: [],
};

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function OrdemCard({
  ordem,
  onStatus,
  atualizando,
}: {
  ordem: OrdemTerceirizacao;
  onStatus: (ordem: OrdemTerceirizacao, status: StatusTerceirizacao) => void;
  atualizando: boolean;
}) {
  const [proximo, setProximo] = useState<StatusTerceirizacao | ''>('');
  const opcoes = proximosStatus[ordem.status];
  const whatsapp = ordem.fornecedor.whatsapp?.replace(/\D/g, '');

  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-2 p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">OS {ordem.item_os.os.numero}</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link href={`/os/${ordem.item_os.os.id}`} aria-label="Abrir OS">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <p className="line-clamp-2 text-sm">{ordem.item_os.produto_servico}</p>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 text-xs">
        <div>
          <p className="font-medium">{ordem.fornecedor.nome}</p>
          {ordem.fornecedor.contato_nome && (
            <p className="text-muted-foreground">{ordem.fornecedor.contato_nome}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>{Number(ordem.item_os.quantidade)} un.</span>
          <span className="font-medium">
            {moeda.format(Number(ordem.custo_total ?? 0))}
          </span>
        </div>
        {ordem.data_prevista && (
          <p className="flex items-center gap-1 text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Previsto: {new Date(ordem.data_prevista).toLocaleDateString('pt-BR')}
          </p>
        )}
        {whatsapp && (
          <a
            href={`https://wa.me/55${whatsapp.replace(/^55/, '')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-emerald-700 hover:underline"
          >
            Conversar pelo WhatsApp
          </a>
        )}
        {opcoes.length > 0 && (
          <div className="flex gap-2 border-t pt-3">
            <Select
              value={proximo}
              onValueChange={(value) => setProximo(value as StatusTerceirizacao)}
            >
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue placeholder="Próximo status" />
              </SelectTrigger>
              <SelectContent>
                {opcoes.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8"
              disabled={!proximo || atualizando}
              onClick={() => proximo && onStatus(ordem, proximo)}
            >
              Aplicar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TerceirizacaoPCPPage() {
  const [ordens, setOrdens] = useState<OrdemTerceirizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await pcpApi.getTerceirizacoes(token);
      setOrdens(Array.isArray(data) ? (data as OrdemTerceirizacao[]) : []);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar as ordens de terceirização.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const porStatus = useMemo(
    () =>
      Object.fromEntries(
        [...STATUS_FLUXO, 'CANCELADO'].map((status) => [
          status,
          ordens.filter((ordem) => ordem.status === status),
        ]),
      ) as Record<StatusTerceirizacao, OrdemTerceirizacao[]>,
    [ordens],
  );

  const atualizarStatus = async (
    ordem: OrdemTerceirizacao,
    status: StatusTerceirizacao,
  ) => {
    setAtualizandoId(ordem.id);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await pcpApi.updateTerceirizacaoStatus(ordem.id, status, token);
      toast.success(`Ordem atualizada para ${statusLabel[status]}.`);
      await carregar();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar ordem.');
    } finally {
      setAtualizandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/pcp" aria-label="Voltar ao PCP">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Terceirização</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe pedidos enviados aos parceiros externos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </header>

      {loading && ordens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando ordens...</p>
      ) : ordens.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border bg-white py-14 text-center">
          <Truck className="mb-3 h-9 w-9 text-muted-foreground" />
          <h2 className="font-medium">Nenhuma terceirização em andamento</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            As ordens serão criadas quando um orçamento com produção terceirizada
            for aprovado e convertido em OS.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-[1800px] grid-cols-8 gap-3">
            {STATUS_FLUXO.map((status) => (
              <section key={status} className="rounded-lg bg-muted/40 p-2">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wide">
                    {statusLabel[status]}
                  </h2>
                  <Badge variant="secondary">{porStatus[status].length}</Badge>
                </div>
                <div className="space-y-2">
                  {porStatus[status].map((ordem) => (
                    <OrdemCard
                      key={ordem.id}
                      ordem={ordem}
                      onStatus={atualizarStatus}
                      atualizando={atualizandoId === ordem.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
