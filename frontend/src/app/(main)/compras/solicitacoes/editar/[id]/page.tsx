'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { comprasApi, type SolicitacaoCompraApi } from '@/lib/api-client';
import { statusSolicitacaoLabel } from '../columns';
import {
  SolicitacaoForm,
  SolicitacaoFormData,
  SolicitacaoFormValues,
} from '../solicitacao-form';

export default function EditarSolicitacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [solicitacao, setSolicitacao] = useState<SolicitacaoCompraApi | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busy, setBusy] = useState(false);

  const carregar = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const data = await comprasApi.getSolicitacao(id, token);
      setSolicitacao(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, [id]);

  const editavel =
    solicitacao?.status === 'RASCUNHO' || solicitacao?.status === 'DEVOLVIDA';

  const salvar = async (values: SolicitacaoFormValues) => {
    setSalvando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }
      const atualizada = await comprasApi.updateSolicitacao(id, values, token);
      setSolicitacao(atualizada);
      toast.success('Solicitação atualizada com sucesso.');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar solicitação.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const acao = async (
    fn: (id: string, token: string) => Promise<SolicitacaoCompraApi>,
    okMsg: string,
  ) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setBusy(true);
    try {
      const atualizada = await fn(id, token);
      setSolicitacao(atualizada);
      toast.success(okMsg);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Falha na ação.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando solicitação...</p>;
  }
  if (!solicitacao) {
    return <p>Solicitação não encontrada.</p>;
  }

  const initialData: SolicitacaoFormData = {
    prioridade: solicitacao.prioridade as SolicitacaoFormData['prioridade'],
    origem_tipo: solicitacao.origem_tipo as SolicitacaoFormData['origem_tipo'],
    justificativa: solicitacao.justificativa ?? '',
    itens: (solicitacao.itens ?? []).map((item) => ({
      tipo: item.tipo as 'DESPESA' | 'SERVICO' | 'MATERIAL',
      descricao: item.descricao,
      quantidade: Number(item.quantidade),
      unidade: item.unidade,
      insumo_id: item.insumo_id ?? undefined,
    })),
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {editavel ? 'Editar solicitação' : 'Solicitação'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">{solicitacao.numero}</span>
            <Badge variant="secondary">
              {statusSolicitacaoLabel[solicitacao.status] ?? solicitacao.status}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(solicitacao.status === 'RASCUNHO' ||
            solicitacao.status === 'DEVOLVIDA') && (
            <Button
              disabled={busy}
              onClick={() =>
                void acao(comprasApi.enviarSolicitacao, 'Solicitação enviada.')
              }
            >
              Enviar
            </Button>
          )}
          {solicitacao.status === 'SOLICITADA' && (
            <>
              <Button
                disabled={busy}
                onClick={() =>
                  void acao(
                    comprasApi.aprovarSolicitacao,
                    'Solicitação aprovada.',
                  )
                }
              >
                Aprovar
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  void acao(
                    (sid, token) =>
                      comprasApi.devolverSolicitacao(
                        sid,
                        { motivo: 'Devolvida para ajuste' },
                        token,
                      ),
                    'Solicitação devolvida.',
                  )
                }
              >
                Devolver
              </Button>
              <Button
                disabled={busy}
                variant="destructive"
                onClick={() =>
                  void acao(
                    (sid, token) =>
                      comprasApi.rejeitarSolicitacao(sid, {}, token),
                    'Solicitação rejeitada.',
                  )
                }
              >
                Rejeitar
              </Button>
            </>
          )}
          {(solicitacao.status === 'RASCUNHO' ||
            solicitacao.status === 'SOLICITADA' ||
            solicitacao.status === 'APROVADA' ||
            solicitacao.status === 'DEVOLVIDA') && (
            <Button
              disabled={busy}
              variant="destructive"
              onClick={() =>
                void acao(
                  (sid, token) =>
                    comprasApi.cancelarSolicitacao(
                      sid,
                      { motivo: 'Cancelada pelo usuário' },
                      token,
                    ),
                  'Solicitação cancelada.',
                )
              }
            >
              Cancelar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/compras/solicitacoes')}
          >
            Voltar
          </Button>
        </div>
      </div>

      <SolicitacaoForm
        initialData={initialData}
        onSave={salvar}
        loading={salvando}
        readOnly={!editavel}
      />
    </div>
  );
}
