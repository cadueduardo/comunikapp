'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExpedicaoKanbanBoard } from '@/components/expedicao/ExpedicaoKanbanBoard';
import { useExpedicaoKanban } from '@/hooks/useExpedicaoKanban';
import { useExpedicaoSocket } from '@/hooks/useExpedicaoSocket';
import { useUser } from '@/contexts/UserContext';
import { EXPEDICAO_KANBAN_COLUMNS } from '@/lib/expedicao/expedicao-columns';
import { expedicaoApi } from '@/lib/expedicao/expedicao-api';
import { ExpedicaoApiError } from '@/lib/expedicao/expedicao-api-error';
import { formatarDataHistoricoExpedicao } from '@/lib/expedicao/expedicao-format';
import type {
  BloqueioFinanceiroConflictBody,
  ExpedicaoCardKanban,
  ExpedicaoDetalhe,
} from '@/lib/expedicao/expedicao.types';
import {
  DevolverProducaoDialog,
  type HistoricoDevolucaoItem,
} from '@/components/expedicao/DevolverProducaoDialog';
import { ConcluirEntregaDialog } from '@/components/expedicao/ConcluirEntregaDialog';
import { BloqueioFinanceiroModal } from '@/components/expedicao/BloqueioFinanceiroModal';
import { ExpedicaoDetalheSheet } from '@/components/expedicao/ExpedicaoDetalheSheet';
import { ArquivarExpedicaoDialog } from '@/components/expedicao/ArquivarExpedicaoDialog';
import { TransformarTemplateDialog } from '@/components/expedicao/TransformarTemplateDialog';
import { IconArchive, IconRefresh, IconTruckDelivery } from '@tabler/icons-react';
import { toast } from 'sonner';

const FUNCOES_EXPEDICAO = new Set(['ADMINISTRADOR', 'PRODUCAO', 'ESTOQUE']);

interface DevolverContext {
  expedicaoId: string;
  osNumero: string;
  osTitulo: string;
  historico: HistoricoDevolucaoItem[];
}

function montarHistoricoDevolucao(
  dados: Pick<ExpedicaoCardKanban, 'criado_em'> & {
    retrabalho?: boolean;
  },
): HistoricoDevolucaoItem[] {
  const historico: HistoricoDevolucaoItem[] = [
    {
      tipo: 'envio',
      texto: `OS enviada para expedição em ${formatarDataHistoricoExpedicao(dados.criado_em)}`,
    },
  ];

  if (dados.retrabalho) {
    historico.push({
      tipo: 'devolucao',
      texto: 'OS já retornou ao PCP anteriormente (retrabalho em andamento)',
    });
  }

  return historico;
}

export default function ExpedicaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const {
    cardsRaw,
    stats,
    loading,
    setFilters,
    refreshData,
    handleStatusChange,
    removerCard,
  } = useExpedicaoKanban();

  const [busca, setBusca] = useState('');
  const [socketTick, setSocketTick] = useState(0);
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [expedicaoSelecionada, setExpedicaoSelecionada] = useState<string | null>(
    null,
  );
  const [devolverAberto, setDevolverAberto] = useState(false);
  const [concluirAberto, setConcluirAberto] = useState(false);
  const [devolvendo, setDevolvendo] = useState(false);
  const [concluindo, setConcluindo] = useState(false);
  const [detalheAcao, setDetalheAcao] = useState<ExpedicaoDetalhe | null>(null);
  const [devolverContext, setDevolverContext] = useState<DevolverContext | null>(
    null,
  );
  const [bloqueioModal, setBloqueioModal] =
    useState<BloqueioFinanceiroConflictBody | null>(null);
  const [arquivarAberto, setArquivarAberto] = useState(false);
  const [templateAberto, setTemplateAberto] = useState(false);
  const [arquivando, setArquivando] = useState(false);
  const [transformando, setTransformando] = useState(false);
  const [detalheAuxiliar, setDetalheAuxiliar] = useState<ExpedicaoDetalhe | null>(
    null,
  );

  const podeAcessar = FUNCOES_EXPEDICAO.has(
    String(user?.funcao ?? '').toUpperCase(),
  );

  const handleSocketRefresh = useCallback(() => {
    void refreshData(true);
    setSocketTick((t) => t + 1);
  }, [refreshData]);

  useExpedicaoSocket(handleSocketRefresh, podeAcessar && !userLoading);

  useEffect(() => {
    const osId = searchParams.get('os');
    if (!osId) return;

    expedicaoApi
      .obterDetalhePorOs(osId)
      .then((detalhe) => {
        setExpedicaoSelecionada(detalhe.id);
        setDetalheAberto(true);
      })
      .catch(() => {
        toast.error('Nenhuma expedição ativa encontrada para esta OS');
      });
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        busca: busca.trim() || undefined,
      }));
    }, 400);
    return () => clearTimeout(timer);
  }, [busca, setFilters]);

  const abrirDetalhe = useCallback((card: ExpedicaoCardKanban) => {
    setExpedicaoSelecionada(card.id);
    setDetalheAberto(true);
  }, []);

  const abrirDevolverDoCard = useCallback((card: ExpedicaoCardKanban) => {
    setDevolverContext({
      expedicaoId: card.id,
      osNumero: card.os_numero,
      osTitulo: card.titulo,
      historico: montarHistoricoDevolucao({ criado_em: card.criado_em }),
    });
    setDevolverAberto(true);
  }, []);

  const abrirDevolverDoDetalhe = useCallback((detalhe: ExpedicaoDetalhe) => {
    setDevolverContext({
      expedicaoId: detalhe.id,
      osNumero: detalhe.ordem_servico.numero,
      osTitulo: detalhe.ordem_servico.nome_servico,
      historico: montarHistoricoDevolucao({
        criado_em: detalhe.criado_em,
        retrabalho: detalhe.ordem_servico.retrabalho,
      }),
    });
    setDevolverAberto(true);
  }, []);

  async function confirmarDevolucao(motivo: string) {
    const expedicaoId = devolverContext?.expedicaoId ?? detalheAcao?.id;
    if (!expedicaoId) return;

    setDevolvendo(true);
    try {
      await expedicaoApi.devolverProducao(expedicaoId, motivo);
      toast.success('OS devolvida para produção');
      removerCard(expedicaoId);
      setDevolverAberto(false);
      setDetalheAberto(false);
      setDetalheAcao(null);
      setDevolverContext(null);
      await refreshData(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao devolver para produção',
      );
    } finally {
      setDevolvendo(false);
    }
  }

  async function confirmarConclusao(dados: {
    recebedor_nome: string;
    recebedor_doc?: string;
    url_assinatura?: string;
    observacoes?: string;
  }) {
    if (!detalheAcao) return;
    setConcluindo(true);
    try {
      await expedicaoApi.concluirEntrega(detalheAcao.id, dados);
      toast.success('Entrega concluída com sucesso');
      setConcluirAberto(false);
      setDetalheAberto(false);
      setDetalheAcao(null);
      await refreshData(true);
    } catch (err) {
      if (err instanceof ExpedicaoApiError) {
        if (err.status === 409 && err.isBloqueioFinanceiro) {
          setBloqueioModal(err.bloqueioFinanceiro);
          setConcluirAberto(false);
          await refreshData(true);
          setSocketTick((t) => t + 1);
          return;
        }
        if (err.status === 409) {
          toast.error(
            'Esta expedição foi alterada em outra sessão. Recarregando dados...',
          );
          await refreshData(true);
          setSocketTick((t) => t + 1);
          return;
        }
      }
      toast.error(
        err instanceof Error ? err.message : 'Erro ao concluir entrega',
      );
    } finally {
      setConcluindo(false);
    }
  }

  async function confirmarArquivamento(observacoes?: string) {
    const expedicaoId = detalheAuxiliar?.id;
    if (!expedicaoId) return;

    setArquivando(true);
    try {
      await expedicaoApi.arquivar(expedicaoId, observacoes);
      toast.success('Expedição arquivada');
      removerCard(expedicaoId);
      setArquivarAberto(false);
      setDetalheAberto(false);
      setDetalheAuxiliar(null);
      await refreshData(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao arquivar expedição',
      );
    } finally {
      setArquivando(false);
    }
  }

  async function confirmarTransformacaoTemplate(nome: string) {
    const osId = detalheAuxiliar?.os_id;
    if (!osId) return;

    setTransformando(true);
    try {
      const resultado = await expedicaoApi.transformarTemplate(osId, nome);
      const nomes = resultado.templates.map((t) => t.nome).join(', ');
      toast.success(`Template(s) criado(s): ${nomes}`);
      setTemplateAberto(false);
      setDetalheAuxiliar(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao criar template',
      );
    } finally {
      setTransformando(false);
    }
  }

  if (userLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!podeAcessar) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Seu perfil não tem acesso ao módulo de Expedição.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <IconTruckDelivery className="h-7 w-7" />
            Expedição
          </h1>
          <p className="text-sm text-muted-foreground">
            Kanban logístico pós-produção — {stats.total} expedição(ões) ativa(s)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar OS, cliente ou rastreio..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button variant="outline" size="sm" onClick={() => void refreshData()}>
            <IconRefresh className="mr-1 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/expedicao/arquivo">
              <IconArchive className="mr-1 h-4 w-4" />
              Arquivo
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXPEDICAO_KANBAN_COLUMNS.map((coluna) => (
          <Badge key={coluna.id} variant="outline">
            {coluna.title}: {stats.por_status[coluna.status] ?? 0}
          </Badge>
        ))}
      </div>

      <ExpedicaoKanbanBoard
        cards={cardsRaw}
        loading={loading}
        columns={EXPEDICAO_KANBAN_COLUMNS}
        onStatusChange={(id, status) => void handleStatusChange(id, status)}
        onCardClick={abrirDetalhe}
        onDevolver={abrirDevolverDoCard}
      />

      <ExpedicaoDetalheSheet
        expedicaoId={expedicaoSelecionada}
        open={detalheAberto}
        refreshToken={socketTick}
        onClose={() => {
          setDetalheAberto(false);
          if (searchParams.get('os')) {
            router.replace('/expedicao');
          }
        }}
        onDevolver={(detalhe) => {
          setDetalheAberto(false);
          abrirDevolverDoDetalhe(detalhe);
        }}
        onConcluir={(detalhe) => {
          setDetalheAberto(false);
          setDetalheAcao(detalhe);
          setConcluirAberto(true);
        }}
        onArquivar={(detalhe) => {
          setDetalheAberto(false);
          setDetalheAuxiliar(detalhe);
          setArquivarAberto(true);
        }}
        onTransformarTemplate={(detalhe) => {
          setDetalheAberto(false);
          setDetalheAuxiliar(detalhe);
          setTemplateAberto(true);
        }}
      />

      <DevolverProducaoDialog
        open={devolverAberto}
        osNumero={devolverContext?.osNumero}
        osTitulo={devolverContext?.osTitulo}
        historico={devolverContext?.historico}
        loading={devolvendo}
        onClose={() => {
          setDevolverAberto(false);
          setDevolverContext(null);
        }}
        onConfirm={confirmarDevolucao}
      />

      <ConcluirEntregaDialog
        open={concluirAberto}
        detalhe={detalheAcao}
        loading={concluindo}
        onClose={() => {
          setConcluirAberto(false);
          setDetalheAcao(null);
        }}
        onConfirm={confirmarConclusao}
      />

      <BloqueioFinanceiroModal
        open={Boolean(bloqueioModal)}
        dados={bloqueioModal}
        onClose={() => setBloqueioModal(null)}
      />

      <ArquivarExpedicaoDialog
        open={arquivarAberto}
        osNumero={detalheAuxiliar?.ordem_servico.numero}
        loading={arquivando}
        onClose={() => {
          setArquivarAberto(false);
          setDetalheAuxiliar(null);
        }}
        onConfirm={confirmarArquivamento}
      />

      <TransformarTemplateDialog
        open={templateAberto}
        osNumero={detalheAuxiliar?.ordem_servico.numero}
        nomeSugerido={detalheAuxiliar?.ordem_servico.nome_servico}
        loading={transformando}
        onClose={() => {
          setTemplateAberto(false);
          setDetalheAuxiliar(null);
        }}
        onConfirm={confirmarTransformacaoTemplate}
      />
    </div>
  );
}
