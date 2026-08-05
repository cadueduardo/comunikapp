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
  usuariosApi,
  type ClienteApi,
} from '@/lib/api-client';
import { getClientSessionToken } from '@/lib/session-auth';

type UsuarioOpcao = {
  id: string;
  nome_completo?: string;
  nome?: string;
  ativo?: boolean;
  status?: string;
  funcao?: string;
};

type Props = {
  open: boolean;
  cliente?: ClienteApi;
  onClose: () => void;
  onSuccess: () => void;
};

function novaChaveOperacao(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function TransferirCarteiraDialog({
  open,
  cliente,
  onClose,
  onSuccess,
}: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioOpcao[]>([]);
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
    void usuariosApi
      .getAll(token)
      .then((data: unknown) => {
        const lista = Array.isArray(data) ? (data as UsuarioOpcao[]) : [];
        setUsuarios(
          lista.filter(
            (u) =>
              u.ativo !== false &&
              String(u.status ?? 'ATIVO').toUpperCase() === 'ATIVO' &&
              u.id !== cliente?.responsavel_comercial_id,
          ),
        );
      })
      .catch(() => {
        toast.error('Não foi possível carregar usuários da loja.');
        setUsuarios([]);
      })
      .finally(() => setLoadingUsuarios(false));
  }, [open, cliente?.responsavel_comercial_id]);

  const confirmar = async () => {
    if (!cliente) return;
    if (!paraUsuarioId) {
      toast.error('Selecione o novo responsável comercial.');
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
      await clientesApi.transferir(
        cliente.id,
        {
          para_usuario_id: paraUsuarioId,
          motivo: motivo.trim(),
          chave_operacao: novaChaveOperacao(),
        },
        token,
      );
      toast.success('Carteira transferida.');
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível transferir a carteira.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir carteira</DialogTitle>
          <DialogDescription>
            {cliente
              ? `Reatribuir a responsabilidade comercial de “${cliente.nome}”. O histórico é preservado.`
              : 'Reatribuir responsabilidade comercial.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="para-usuario">Novo responsável comercial</Label>
            <Select
              value={paraUsuarioId}
              onValueChange={setParaUsuarioId}
              disabled={loadingUsuarios || loading}
            >
              <SelectTrigger id="para-usuario" aria-label="Novo responsável">
                <SelectValue
                  placeholder={
                    loadingUsuarios ? 'Carregando…' : 'Selecione o usuário'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome_completo || u.nome || u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo-transferencia">Motivo</Label>
            <Textarea
              id="motivo-transferencia"
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
