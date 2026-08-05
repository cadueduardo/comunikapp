'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  clientesApi,
  type ParticipanteCarteiraApi,
  type ResponsavelComercialResumoApi,
} from '@/lib/api-client';
import { getClientSessionToken } from '@/lib/session-auth';

type Props = {
  clienteId: string;
  responsavelComercialId: string | null;
  participantes: ParticipanteCarteiraApi[];
  podeAdministrar: boolean;
  onChanged: () => void;
};

export function ParticipantesCarteiraPanel({
  clienteId,
  responsavelComercialId,
  participantes,
  podeAdministrar,
  onChanged,
}: Props) {
  const [candidatos, setCandidatos] = useState<ResponsavelComercialResumoApi[]>(
    [],
  );
  const [usuarioId, setUsuarioId] = useState('');
  const [loadingCandidatos, setLoadingCandidatos] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [confirmRemover, setConfirmRemover] =
    useState<ParticipanteCarteiraApi | null>(null);
  const [erroCandidatos, setErroCandidatos] = useState(false);

  const idsParticipantes = useMemo(
    () => new Set(participantes.map((p) => p.usuario_id)),
    [participantes],
  );

  const elegiveis = useMemo(
    () =>
      candidatos.filter(
        (u) =>
          u.id !== responsavelComercialId && !idsParticipantes.has(u.id),
      ),
    [candidatos, responsavelComercialId, idsParticipantes],
  );

  useEffect(() => {
    if (!podeAdministrar) return;
    const token = getClientSessionToken();
    if (!token) return;
    setLoadingCandidatos(true);
    setErroCandidatos(false);
    void clientesApi
      .listarResponsaveisDisponiveis(token)
      .then(setCandidatos)
      .catch(() => {
        setErroCandidatos(true);
        setCandidatos([]);
      })
      .finally(() => setLoadingCandidatos(false));
  }, [podeAdministrar, clienteId]);

  const adicionar = async () => {
    if (!usuarioId) {
      toast.error('Selecione um participante.');
      return;
    }
    const token = getClientSessionToken();
    if (!token) return;
    setAdicionando(true);
    try {
      await clientesApi.adicionarParticipante(
        clienteId,
        { usuario_id: usuarioId },
        token,
      );
      toast.success('Participante incluído.');
      setUsuarioId('');
      onChanged();
    } catch {
      toast.error('Não foi possível incluir o participante.');
    } finally {
      setAdicionando(false);
    }
  };

  const confirmarRemocao = async () => {
    if (!confirmRemover) return;
    const token = getClientSessionToken();
    if (!token) return;
    setRemovendoId(confirmRemover.usuario_id);
    try {
      await clientesApi.removerParticipante(
        clienteId,
        confirmRemover.usuario_id,
        token,
      );
      toast.success('Participante removido.');
      setConfirmRemover(null);
      onChanged();
    } catch {
      toast.error('Não foi possível remover o participante.');
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Participantes da carteira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground">
          Colaboradores veem o cliente na carteira própria. Não recebem
          transferência, inativação, desconto, alçada ou poderes de gestor.
        </p>

        {participantes.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-muted-foreground">
            Nenhum participante nesta carteira.
          </p>
        ) : (
          <ul className="space-y-2">
            {participantes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <div>
                  <p className="font-medium text-foreground">{p.usuario.nome}</p>
                  <Badge variant="secondary" className="mt-1">
                    Participante
                  </Badge>
                </div>
                {podeAdministrar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remover participante ${p.usuario.nome}`}
                    disabled={removendoId === p.usuario_id}
                    onClick={() => setConfirmRemover(p)}
                  >
                    {removendoId === p.usuario_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {podeAdministrar ? (
          <div className="space-y-2 border-t border-border pt-3">
            <Label htmlFor="participante-novo">Adicionar participante</Label>
            {loadingCandidatos ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando usuários elegíveis...
              </p>
            ) : erroCandidatos ? (
              <p className="text-destructive">
                Não foi possível carregar candidatos. Verifique a permissão de
                transferência de carteira.
              </p>
            ) : elegiveis.length === 0 ? (
              <p className="text-muted-foreground">
                Não há usuários comerciais elegíveis para incluir.
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={usuarioId} onValueChange={setUsuarioId}>
                  <SelectTrigger id="participante-novo" className="sm:flex-1">
                    <SelectValue placeholder="Selecione o usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {elegiveis.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => void adicionar()}
                  disabled={adicionando || !usuarioId}
                >
                  {adicionando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Incluir
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Somente gestor/administrador com permissão de transferir carteira
            pode incluir ou remover participantes.
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(confirmRemover)}
        title="Remover participante?"
        description={
          confirmRemover
            ? `${confirmRemover.usuario.nome} deixará de ver este cliente na carteira própria. O histórico comercial permanece intacto.`
            : undefined
        }
        confirmText="Remover"
        cancelText="Cancelar"
        loading={Boolean(removendoId)}
        onConfirm={() => void confirmarRemocao()}
        onCancel={() => setConfirmRemover(null)}
      />
    </Card>
  );
}
