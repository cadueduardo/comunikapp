'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  fetchOnboarding,
  postAplicarEntregaInstalacao,
  type OnboardingEtapaEstado,
} from '@/lib/home-operacional-api';

const STEP_ENTREGA_INSTALACAO = 'configurar_entrega_instalacao';
const STORAGE_KEY = 'comunikapp.novidades.entrega-instalacao.2026-06';

export function NovidadesEntregaInstalacaoModal() {
  const [etapa, setEtapa] = useState<OnboardingEtapaEstado | null>(null);
  const [aberto, setAberto] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  const deveExibir = useMemo(
    () => etapa?.status === 'pendente',
    [etapa?.status],
  );

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (typeof window === 'undefined') return;
      if (window.localStorage.getItem(STORAGE_KEY) === 'dispensado') return;

      try {
        const resumo = await fetchOnboarding();
        const encontrada =
          resumo.etapas.find((item) => item.step_id === STEP_ENTREGA_INSTALACAO) ??
          null;
        if (!ativo) return;
        setEtapa(encontrada);
        setAberto(encontrada?.status === 'pendente');
      } catch {
        // Nao bloqueia a Home se a novidade falhar.
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  function dispensar() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'dispensado');
    }
    setAberto(false);
  }

  async function aplicar() {
    setAplicando(true);
    try {
      await postAplicarEntregaInstalacao();
      toast.success('Padrões de entrega e instalação aplicados.');
      setEtapa((atual) =>
        atual ? { ...atual, status: 'concluido', concluido_em: new Date().toISOString() } : atual,
      );
      setAberto(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível aplicar os padrões de entrega e instalação.',
      );
    } finally {
      setAplicando(false);
    }
  }

  if (!deveExibir) return null;

  return (
    <Dialog open={aberto} onOpenChange={(novoAberto) => !novoAberto && dispensar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novidade no orçamento</DialogTitle>
          <DialogDescription>
            Agora o Comunikapp possui cadastros próprios para modalidades de entrega e
            tipos de instalação. Isso ajuda o orçamento a registrar frete,
            deslocamento, mão de obra e necessidade de agendamento sem deixar a
            operação pesada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Podemos criar uma base inicial para sua loja:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Retirada, entrega própria, motoboy, transportadora, Correios e outro.</li>
            <li>Aplicação simples, instalação em fachada, adesivação, instalação em altura, elétrica e outro.</li>
          </ul>
          <p>
            Nenhum valor será preenchido automaticamente. Você poderá definir preços
            e custos no CRUD ou ajustar direto no orçamento.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={dispensar} disabled={aplicando}>
            Agora não
          </Button>
          <Button onClick={() => void aplicar()} disabled={aplicando}>
            {aplicando ? 'Aplicando...' : 'Criar padrões recomendados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
