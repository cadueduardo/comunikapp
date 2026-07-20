'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { insumosApi } from '@/lib/api-client';

export type InsumoNomeSugestao = {
  id: string;
  nome: string;
  ativo: boolean;
  match_exato: boolean;
  categoria?: { id: string; nome: string } | null;
  fornecedor?: { id: string; nome: string } | null;
};

interface NomeInsumoSugestoesProps {
  nome: string;
}

export function NomeInsumoSugestoes({ nome }: NomeInsumoSugestoesProps) {
  const router = useRouter();
  const [sugestoes, setSugestoes] = useState<InsumoNomeSugestao[]>([]);
  const [loading, setLoading] = useState(false);
  const [reativandoId, setReativandoId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const termo = nome.trim();
    if (termo.length < 2) {
      setSugestoes([]);
      setLoading(false);
      setAberto(false);
      return;
    }

    let cancelled = false;
    setAberto(true);
    const timer = window.setTimeout(async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      setLoading(true);
      try {
        const data = (await insumosApi.buscarPorNome(token, termo, {
          limit: 8,
        })) as InsumoNomeSugestao[];
        if (!cancelled) setSugestoes(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setSugestoes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [nome]);

  if (!aberto || nome.trim().length < 2) {
    return null;
  }

  if (!loading && sugestoes.length === 0) {
    return null;
  }

  const matchExato = sugestoes.find((item) => item.match_exato);

  const handleReativar = async (item: InsumoNomeSugestao) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    setReativandoId(item.id);
    try {
      await insumosApi.reativar(item.id, token);
      toast.success(`Insumo "${item.nome}" reativado.`);
      router.push(`/insumos/editar/${item.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível reativar.',
      );
    } finally {
      setReativandoId(null);
    }
  };

  return (
    <div
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
      role="listbox"
      aria-label="Insumos cadastrados"
    >
      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
        {loading ? 'Buscando…' : 'Insumos cadastrados'}
      </p>

      {matchExato && (
        <p className="px-2 pb-2 text-xs text-amber-700 dark:text-amber-400">
          Nome idêntico já existe
          {!matchExato.ativo ? ' (inativo)' : ''}. Abra o cadastro ou reative —
          um novo com o mesmo nome será bloqueado.
        </p>
      )}

      <ul className="space-y-1">
        {sugestoes.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => router.push(`/insumos/editar/${item.id}`)}
            >
              <p className="truncate text-sm font-medium">{item.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.categoria?.nome ?? 'Sem categoria'}
                {item.fornecedor?.nome ? ` · ${item.fornecedor.nome}` : ''}
                {' · '}
                {item.ativo ? 'Ativo' : 'Inativo'}
              </p>
            </button>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/insumos/editar/${item.id}`)}
              >
                Abrir
              </Button>
              {!item.ativo && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={reativandoId === item.id}
                  onClick={() => handleReativar(item)}
                >
                  {reativandoId === item.id ? '…' : 'Reativar'}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
