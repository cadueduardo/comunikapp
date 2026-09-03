'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  clientesApi,
  orcamentosApi,
  type ResponsavelComercialResumoApi,
} from '@/lib/api-client';
import { rotuloResponsavelOrcamento } from '@/lib/orcamento-responsavel';
import { getClientSessionToken } from '@/lib/session-auth';

type OrcamentoAlvo = {
  id: string;
  numero?: string;
  nome_servico?: string;
  responsavel_id?: string | null;
  responsavel?: { id: string; nome: string } | null;
  atendente?: string | null;
};

type Props = {
  open: boolean;
  orcamento?: OrcamentoAlvo;
  onClose: () => void;
  onSuccess: (resultado?: {
    atendente?: string;
    responsavel?: { id: string; nome: string };
  }) => void;
};

function novaChaveOperacao(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function TransferirOrcamentoDialog({
  open,
  orcamento,
  onClose,
  onSuccess,
}: Props) {
  const [usuarios, setUsuarios] = useState<ResponsavelComercialResumoApi[]>([]);
  const [paraUsuarioId, setParaUsuarioId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  useEffect(() => {
    if (!open) return;
    setParaUsuarioId('');
    setMotivo('');
    const token = getClientSessionToken();
    if (!token) return;
    setLoadingUsuarios(true);
    void clientesApi
      .listarResponsaveisDisponiveis(token)
      .then((data) => {
        setUsuarios(
          data.filter((u) => u.id !== orcamento?.responsavel_id && u.id !== orcamento?.responsavel?.id),
        );
      })
      .catch(() => {
        toast.error('Não foi possível carregar usuários da loja.');
        setUsuarios([]);
      })
      .finally(() => setLoadingUsuarios(false));
  }, [open, orcamento?.responsavel_id, orcamento?.responsavel?.id]);

  const confirmar = async () => {
    if (!orcamento) return;
    if (!paraUsuarioId) {
      toast.error('Selecione o novo responsável.');
      return;
    }
    if (motivo.trim().length < 3) {
      toast.error('Informe o motivo da transferência (mínimo 3 caracteres).');
      return;
    }
    const token = getClientSessionToken();
    if (!token) {
      toast.error('Sessão inválida');
      return;
    }
    setLoading(true);
    try {
      const atualizado = await orcamentosApi.v2.transferir(
        orcamento.id,
        {
          para_usuario_id: paraUsuarioId,
          motivo: motivo.trim(),
          chave_operacao: novaChaveOperacao(),
        },
        token,
      );
      toast.success('Responsável do orçamento atualizado.');
      onSuccess({
        atendente:
          typeof atualizado?.atendente === 'string'
            ? atualizado.atendente
            : undefined,
        responsavel:
          atualizado?.responsavel && typeof atualizado.responsavel === 'object'
            ? {
                id: String(
                  (atualizado.responsavel as { id?: string }).id || paraUsuarioId,
                ),
                nome: String(
                  (atualizado.responsavel as { nome?: string }).nome || '',
                ),
              }
            : undefined,
      });
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível transferir o responsável.',
      );
    } finally {
      setLoading(false);
    }
  };

  const rotuloAtual = orcamento
    ? rotuloResponsavelOrcamento(orcamento)
    : 'Sem responsável';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir responsável</DialogTitle>
          <DialogDescription>
            {orcamento
              ? `Reatribuir o orçamento ${orcamento.numero ? `#${orcamento.numero}` : ''} ${orcamento.nome_servico ? `“${orcamento.nome_servico}”` : ''}. Atual: ${rotuloAtual}.`
              : 'Reatribuir o responsável do orçamento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="para-usuario-orcamento">Novo responsável</Label>
            <Select
              value={paraUsuarioId}
              onValueChange={setParaUsuarioId}
              disabled={loadingUsuarios || loading}
            >
              <SelectTrigger
                id="para-usuario-orcamento"
                aria-label="Novo responsável"
              >
                <SelectValue
                  placeholder={
                    loadingUsuarios ? 'Carregando…' : 'Selecione o usuário'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo-transferencia-orcamento">Motivo</Label>
            <Textarea
              id="motivo-transferencia-orcamento"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da transferência"
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void confirmar()} disabled={loading}>
            {loading ? 'Transferindo…' : 'Confirmar transferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
