'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/contexts/UserContext';
import { useBannerEstado } from '@/hooks/use-home-operacional';
import {
  BannerAcao,
  BannerMensagem,
  BannerNivel,
  postAplicarConfiguracaoRecomendada,
} from '@/lib/home-operacional-api';

const MAX_VISIVEIS = 2;

const ESTILOS_NIVEL: Record<
  BannerNivel,
  { card: string; titulo: string; descricao: string; icone: React.ReactNode }
> = {
  critico: {
    card: 'bg-red-50 border-red-200',
    titulo: 'text-red-800',
    descricao: 'text-red-700',
    icone: <AlertCircle className="h-5 w-5 text-red-600" />,
  },
  atencao: {
    card: 'bg-yellow-50 border-yellow-200',
    titulo: 'text-yellow-900',
    descricao: 'text-yellow-800',
    icone: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  },
  informativo: {
    card: 'bg-blue-50 border-blue-200',
    titulo: 'text-blue-800',
    descricao: 'text-blue-700',
    icone: <Info className="h-5 w-5 text-blue-600" />,
  },
};

function chaveDispensa(userId: string | undefined, bannerId: string): string {
  return `comunikapp:banner-dismiss:${userId ?? 'anon'}:${bannerId}`;
}

/**
 * Banner unificado de estado do sistema. Substitui o uso direto do
 * TrialBanner na Home. Cobre trial, configuracao incompleta e demais
 * mensagens definidas em docs/fase-0-home-operacional/09.
 */
export function SystemStateBanner() {
  const { user } = useUser();
  const { mensagens, loading, recarregar } = useBannerEstado();
  const [dispensadasNoCliente, setDispensadasNoCliente] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const visiveis = new Set<string>();
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('comunikapp:banner-dismiss:')) {
          const partes = k.split(':');
          const bannerId = partes[partes.length - 1];
          visiveis.add(bannerId);
        }
      }
    } catch {
      // ignora
    }
    return visiveis;
  });
  const [aplicandoId, setAplicandoId] = useState<string | null>(null);

  const visiveis = useMemo(() => {
    const filtradas = mensagens.filter(
      (m) => !(m.dismissable && dispensadasNoCliente.has(m.id)),
    );
    return filtradas.slice(0, MAX_VISIVEIS);
  }, [mensagens, dispensadasNoCliente]);

  const restantes = mensagens.length - visiveis.length;

  if (loading) {
    return <Skeleton className="h-16 w-full mb-4" />;
  }

  if (visiveis.length === 0) {
    return null;
  }

  function dispensar(bannerId: string) {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          chaveDispensa(user?.id, bannerId),
          new Date().toISOString(),
        );
      } catch {
        // ignora
      }
    }
    setDispensadasNoCliente((atual) => {
      const proximo = new Set(atual);
      proximo.add(bannerId);
      return proximo;
    });
  }

  async function executarAcao(mensagem: BannerMensagem) {
    if (!mensagem.acao) return;
    if (mensagem.acao.tipo === 'link') return; // o Link cuida
    if (mensagem.acao.tipo !== 'endpoint') return;

    if (mensagem.id === 'configuracao_incompleta') {
      setAplicandoId(mensagem.id);
      try {
        await postAplicarConfiguracaoRecomendada();
        await recarregar();
      } catch {
        // erro silencioso aqui; o usuario verifica o resultado ao recarregar
      } finally {
        setAplicandoId(null);
      }
    }
  }

  return (
    <div className="space-y-3 mb-4">
      {visiveis.map((m) => {
        const estilo = ESTILOS_NIVEL[m.nivel];
        return (
          <div
            key={m.id}
            className={`flex items-start gap-3 border rounded-lg p-4 ${estilo.card}`}
          >
            <div className="mt-0.5">{estilo.icone}</div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium ${estilo.titulo}`}>{m.titulo}</h3>
              {m.descricao && (
                <p className={`text-sm mt-1 ${estilo.descricao}`}>{m.descricao}</p>
              )}
            </div>
            {m.acao && <BannerAcaoBotao acao={m.acao} mensagem={m} aplicando={aplicandoId === m.id} onExecutar={executarAcao} />}
            {m.dismissable && (
              <button
                aria-label="Dispensar mensagem"
                onClick={() => dispensar(m.id)}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}

      {restantes > 0 && (
        <p className="text-xs text-muted-foreground">
          + {restantes} outra{restantes === 1 ? '' : 's'} mensage{restantes === 1 ? 'm' : 'ns'} oculta{restantes === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
}

function BannerAcaoBotao({
  acao,
  mensagem,
  aplicando,
  onExecutar,
}: {
  acao: BannerAcao;
  mensagem: BannerMensagem;
  aplicando: boolean;
  onExecutar: (m: BannerMensagem) => void | Promise<void>;
}) {
  if (acao.tipo === 'link') {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href={acao.href}>{acao.label}</Link>
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" disabled={aplicando} onClick={() => onExecutar(mensagem)}>
      {aplicando ? 'Aplicando…' : acao.label}
    </Button>
  );
}
