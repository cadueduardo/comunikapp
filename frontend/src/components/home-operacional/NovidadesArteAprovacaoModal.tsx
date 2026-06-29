'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Palette } from 'lucide-react';
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
} from '@/lib/home-operacional-api';
import { fetchArteConfiguracaoStatus } from '@/lib/arte-orcamento-api';

const STEP_ARTE_APROVACAO = 'configurar_arte_aprovacao';
const STORAGE_KEY = 'comunikapp.novidades.arte-aprovacao.2026-06';

/**
 * Modal de novidade para lojas que já usam o sistema e ainda não
 * configuraram o custo/hora do departamento de arte.
 * Lojas novas veem a etapa no checklist de onboarding.
 */
export function NovidadesArteAprovacaoModal() {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (typeof window === 'undefined') return;
      if (window.localStorage.getItem(STORAGE_KEY) === 'dispensado') {
        setCarregando(false);
        return;
      }

      try {
        const [resumo, statusArte] = await Promise.all([
          fetchOnboarding(),
          fetchArteConfiguracaoStatus(),
        ]);

        if (!ativo) return;

        if (statusArte.configurado) {
          setCarregando(false);
          return;
        }

        const etapaArte = resumo.etapas.find(
          (item) => item.step_id === STEP_ARTE_APROVACAO,
        );
        const clienteAntigo = resumo.etapas.some(
          (item) =>
            item.step_id === 'primeiro_orcamento' &&
            item.status === 'concluido',
        );

        const deveExibir =
          etapaArte?.status === 'pendente' && clienteAntigo === true;

        setAberto(deveExibir);
      } catch {
        // Não bloqueia a Home se a novidade falhar.
      } finally {
        if (ativo) setCarregando(false);
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

  if (carregando || !aberto) return null;

  return (
    <Dialog open={aberto} onOpenChange={(novoAberto) => !novoAberto && dispensar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <Palette className="h-5 w-5" />
            </div>
            <DialogTitle>Novo: Departamento de Arte</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-left">
            O Comunikapp agora tem um módulo dedicado de{' '}
            <strong>Arte & Aprovação</strong> — fila de trabalho para designers,
            versões de arte e integração com os orçamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Para precificar criação e adaptação de arte automaticamente nos
            orçamentos, é necessário configurar o{' '}
            <strong>custo por hora</strong> do serviço sistêmico de arte.
          </p>
          <p>
            Enquanto isso não for feito, o sistema calcula o custo de arte como{' '}
            <strong>R$ 0,00</strong> nos orçamentos.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={dispensar}>
            Agora não
          </Button>
          <Button asChild onClick={dispensar}>
            <Link href="/configuracoes/arte-aprovacao">
              Configurar custo/hora
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
