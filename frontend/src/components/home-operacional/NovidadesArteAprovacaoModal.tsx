'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { HardDrive, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchOnboarding } from '@/lib/home-operacional-api';
import { iniciarGoogleOAuth } from '@/lib/conexoes-api';

const STEP_ARTE_APROVACAO = 'configurar_arte_aprovacao';
const STEP_GOOGLE_DRIVE = 'conectar_google_drive';
const STORAGE_KEY = 'comunikapp.novidades.arte-aprovacao.2026-07';

/**
 * Modal de novidade sobre o modulo de Arte & Aprovacao. Mostra apenas
 * as configuracoes que ainda faltam: custo/hora da arte e conexao com
 * o Google Drive da loja. Quando uma delas ja estiver concluida, some
 * dessa lista (tanto aqui quanto no checklist de onboarding).
 */
export function NovidadesArteAprovacaoModal() {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mostrarArte, setMostrarArte] = useState(false);
  const [mostrarGoogleDrive, setMostrarGoogleDrive] = useState(false);
  const [conectandoGoogle, setConectandoGoogle] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (typeof window === 'undefined') return;
      if (window.localStorage.getItem(STORAGE_KEY) === 'dispensado') {
        setCarregando(false);
        return;
      }

      try {
        const resumo = await fetchOnboarding();
        if (!ativo) return;

        const etapaArte = resumo.etapas.find(
          (item) => item.step_id === STEP_ARTE_APROVACAO,
        );
        const etapaGoogleDrive = resumo.etapas.find(
          (item) => item.step_id === STEP_GOOGLE_DRIVE,
        );

        const faltaArte = etapaArte?.status === 'pendente';
        const faltaGoogleDrive = etapaGoogleDrive?.status === 'pendente';

        setMostrarArte(faltaArte === true);
        setMostrarGoogleDrive(faltaGoogleDrive === true);
        setAberto(faltaArte === true || faltaGoogleDrive === true);
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

  async function conectarGoogleDrive() {
    setConectandoGoogle(true);
    try {
      const url = await iniciarGoogleOAuth();
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao iniciar conexão com o Google Drive',
      );
      setConectandoGoogle(false);
    }
  }

  if (carregando || !aberto) return null;

  const ambas = mostrarArte && mostrarGoogleDrive;
  const titulo = ambas
    ? 'Finalize a configuração do Arte & Aprovação'
    : mostrarArte
      ? 'Novo: Departamento de Arte'
      : 'Conecte o Google Drive da loja';
  const descricao = ambas
    ? 'O Comunikapp agora tem um módulo dedicado de Arte & Aprovação. Para ele funcionar completamente, finalize estas configurações:'
    : mostrarArte
      ? 'O Comunikapp agora tem um módulo dedicado de Arte & Aprovação — fila de trabalho para designers, versões de arte e integração com os orçamentos.'
      : 'Conecte o Google Drive da loja para organizar automaticamente os arquivos aprovados no fluxo de Arte & Aprovação.';

  return (
    <Dialog open={aberto} onOpenChange={(novoAberto) => !novoAberto && dispensar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              {mostrarArte ? <Palette className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
            </div>
            <DialogTitle>{titulo}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-left">{descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {mostrarArte && (
            <div className="space-y-2 rounded-lg border p-3 text-sm text-muted-foreground">
              <p>
                Para precificar criação e adaptação de arte automaticamente nos
                orçamentos, configure o <strong>custo por hora</strong> do
                serviço sistêmico de arte. Enquanto isso não for feito, o
                sistema calcula o custo de arte como <strong>R$ 0,00</strong>.
              </p>
              <Button asChild size="sm" onClick={dispensar}>
                <Link href="/configuracoes/arte-aprovacao">Configurar custo/hora</Link>
              </Button>
            </div>
          )}

          {mostrarGoogleDrive && (
            <div className="space-y-2 rounded-lg border p-3 text-sm text-muted-foreground">
              <p>
                Conecte o <strong>Google Drive</strong> da loja para organizar
                automaticamente os arquivos de arte aprovados em uma pasta
                própria da sua conta.
              </p>
              <Button
                size="sm"
                onClick={() => void conectarGoogleDrive()}
                disabled={conectandoGoogle}
              >
                {conectandoGoogle ? 'Conectando...' : 'Conectar Google Drive'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={dispensar}>
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
