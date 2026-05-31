'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface SobraSugestao {
  id: string;
  codigo_sobra?: string;
  codigoSobra?: string;
  material?: string;
  cor?: string;
  area?: number;
  quantidade?: number;
  unidade_medida?: string;
  unidadeMedida?: string;
  dimensoes?: string;
  economia_gerada?: number;
  economiaGerada?: number;
}

interface SobrasRetalhosSugestaoPanelProps {
  insumoId?: string | null;
  areaMinimaM2?: number;
}

export function SobrasRetalhosSugestaoPanel({
  insumoId,
  areaMinimaM2,
}: SobrasRetalhosSugestaoPanelProps) {
  const [sugestoes, setSugestoes] = useState<SobraSugestao[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!insumoId) {
      setSugestoes([]);
      return;
    }

    const params = new URLSearchParams({ insumoId });
    if (areaMinimaM2 && areaMinimaM2 > 0) {
      params.set('areaMinima', String(areaMinimaM2));
    }

    let cancelado = false;

    const carregar = async () => {
      setLoading(true);
      setErro(null);
      try {
        const res = await apiRequest(
          `/api/estoque/sobras/sugestoes/buscar?${params.toString()}`,
        );
        if (!res.ok) {
          throw new Error('Não foi possível buscar retalhos');
        }
        const data = await res.json();
        if (!cancelado) {
          setSugestoes(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelado) {
          setErro('Retalhos indisponíveis no momento.');
          setSugestoes([]);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [insumoId, areaMinimaM2]);

  if (!insumoId) return null;

  return (
    <div className="rounded-md border border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-2 text-sm">
      <div className="font-medium text-sm">Retalhos compatíveis no estoque</div>

      {loading && (
        <p className="text-xs text-muted-foreground">Buscando retalhos...</p>
      )}

      {erro && !loading && (
        <p className="text-xs text-muted-foreground">{erro}</p>
      )}

      {!loading && !erro && sugestoes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum retalho disponível para este material
          {areaMinimaM2 && areaMinimaM2 > 0
            ? ` com área ≥ ${areaMinimaM2.toFixed(2)} m²`
            : ''}
          .
        </p>
      )}

      {!loading && sugestoes.length > 0 && (
        <ul className="space-y-2 text-xs">
          {sugestoes.slice(0, 5).map((s) => {
            const codigo = s.codigo_sobra ?? s.codigoSobra ?? s.id.slice(0, 8);
            const area = Number(s.area ?? 0);
            const qtd = Number(s.quantidade ?? 1);
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/40 pt-2 first:border-0 first:pt-0"
              >
                <div>
                  <Link
                    href={`/estoque/sobras/${s.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {codigo}
                  </Link>
                  {s.material && (
                    <span className="text-muted-foreground"> · {s.material}</span>
                  )}
                  {s.dimensoes && (
                    <span className="text-muted-foreground"> · {s.dimensoes}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {area > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {area.toFixed(2)} m² × {qtd}
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {sugestoes.length > 5 && (
        <Link href="/estoque/sobras" className="text-xs text-primary hover:underline">
          Ver todos os retalhos
        </Link>
      )}
    </div>
  );
}
