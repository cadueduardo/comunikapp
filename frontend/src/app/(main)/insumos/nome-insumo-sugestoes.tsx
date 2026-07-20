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
  excludeId?: string;
}

export function NomeInsumoSugestoes({
  nome,
  excludeId,
}: NomeInsumoSugestoesProps) {
  const router = useRouter();
  const [sugestoes, setSugestoes] = useState<InsumoNomeSugestao[]>([]);
  const [loading, setLoading] = useState(false);
  const [reativandoId, setReativandoId] = useState<string | null>(null);

  useEffect(() => {
    const termo = nome.trim();
    if (termo.length < 2) {
      setSugestoes([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      setLoading(true);
      try {
        const data = (await insumosApi.buscarPorNome(token, termo, {
          limit: 8,
          excludeId,
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
  }, [nome, excludeId]);

  if (nome.trim().length < 2) {
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

  if (!loading && sugestoes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {loading ? 'Buscando insumos cadastrados…' : 'Insumos cadastrados'}
      </p>

      {matchExato && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Já existe um insumo com este nome exato
          {!matchExato.ativo ? ' (inativo)' : ''}. O cadastro novo será
          bloqueado; abra o existente ou reative-o.
        </p>
      )}

      <ul className="space-y-2">
        {sugestoes.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 rounded-md border bg-background p-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-medium">{item.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.categoria?.nome ?? 'Sem categoria'}
                {item.fornecedor?.nome ? ` · ${item.fornecedor.nome}` : ''}
                {' · '}
                {item.ativo ? 'Ativo' : 'Inativo'}
                {item.match_exato ? ' · nome idêntico' : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(`/insumos/editar/${item.id}`)}
              >
                Abrir
              </Button>
              {!item.ativo && (
                <Button
                  type="button"
                  size="sm"
                  disabled={reativandoId === item.id}
                  onClick={() => handleReativar(item)}
                >
                  {reativandoId === item.id ? 'Reativando…' : 'Reativar'}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
