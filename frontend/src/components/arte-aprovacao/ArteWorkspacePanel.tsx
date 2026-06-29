'use client';

import { useCallback, useState } from 'react';
import { ArteAprovacaoTab } from '@/components/os/arte-aprovacao/ArteAprovacaoTab';
import { ArteAprovacaoSidebar } from '@/components/os/arte-aprovacao/ArteAprovacaoSidebar';
import { useArteVersoes } from '@/components/os/arte-aprovacao/hooks/useArteVersoes';
import { enviarVersaoParaCliente } from '@/lib/arte-links-api';
import { toast } from 'sonner';

interface ArteWorkspacePanelProps {
  osId: string;
  itemId: string;
  osNumero?: string;
  onMutacao?: () => void;
}

export function ArteWorkspacePanel({
  osId,
  itemId,
  osNumero,
  onMutacao,
}: ArteWorkspacePanelProps) {
  const { versoes = [], refreshVersoes } = useArteVersoes(osId);
  const [enviando, setEnviando] = useState(false);

  const hasVersoesRascunho = versoes.some(
    (v) =>
      v.status === 'RASCUNHO' &&
      (v.servico_id === itemId || !itemId),
  );

  const notificarMutacao = useCallback(() => {
    void refreshVersoes(true);
    onMutacao?.();
  }, [onMutacao, refreshVersoes]);

  const handleEnviarTodasArtes = useCallback(async () => {
    const rascunhos = versoes.filter(
      (v) =>
        v.status === 'RASCUNHO' &&
        (!itemId || v.servico_id === itemId),
    );

    if (rascunhos.length === 0) {
      toast.warning('Nenhuma versão em rascunho para enviar');
      return;
    }

    setEnviando(true);
    try {
      for (const versao of rascunhos) {
        await enviarVersaoParaCliente(versao.id);
      }
      toast.success(
        `${rascunhos.length} versão(ões) enviada(s) ao cliente. Confira o e-mail no console (Ethereal) em dev.`,
      );
      notificarMutacao();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao enviar artes',
      );
    } finally {
      setEnviando(false);
    }
  }, [versoes, itemId, notificarMutacao]);

  return (
    <div className="flex flex-col xl:flex-row gap-4 min-h-[60vh]">
      <div className="flex-1 min-w-0">
        <ArteAprovacaoTab
          osId={osId}
          itemIdFoco={itemId}
          onMutacao={notificarMutacao}
        />
      </div>
      <div className="xl:w-72 shrink-0">
        <ArteAprovacaoSidebar
          osId={osId}
          osNumero={osNumero}
          itemIdFoco={itemId}
          versoes={versoes}
          onEnviarTodasArtes={
            hasVersoesRascunho ? () => void handleEnviarTodasArtes() : undefined
          }
          hasVersoesRascunho={hasVersoesRascunho && !enviando}
          onMutacao={notificarMutacao}
        />
      </div>
    </div>
  );
}
