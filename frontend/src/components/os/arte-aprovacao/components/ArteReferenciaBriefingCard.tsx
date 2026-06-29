'use client';

import { useState } from 'react';
import { Eye, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnexoGeometriaThumb } from '@/components/shared/AnexoGeometriaThumb';
import { AnexoGeometriaPreviewModal } from '@/components/shared/AnexoGeometriaPreviewModal';
import { useArteItensContexto } from '../hooks/useArteItensContexto';

interface ArteReferenciaBriefingCardProps {
  osId: string;
  itemId: string;
}

export function ArteReferenciaBriefingCard({
  osId,
  itemId,
}: ArteReferenciaBriefingCardProps) {
  const { getItem, loading } = useArteItensContexto(osId);
  const [modalAberto, setModalAberto] = useState(false);
  const item = getItem(itemId);

  if (loading || !item?.referencia_url) {
    return null;
  }

  return (
    <>
      <Card className="border-slate-200 bg-slate-50/50 shadow-none">
        <CardContent className="flex items-center gap-4 p-3 sm:p-4">
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="shrink-0 rounded-md transition-opacity hover:opacity-80"
            title="Ver referência visual"
          >
            <AnexoGeometriaThumb
              referenciaUrl={item.referencia_url}
              geometriaOrigem={item.geometria_origem}
            />
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p className="text-sm leading-snug text-slate-700">
                Este produto tem referência visual. Use como briefing para criação
                da arte.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-auto"
              onClick={() => setModalAberto(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Abrir referência
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnexoGeometriaPreviewModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        referenciaUrl={item.referencia_url}
        titulo={`Referência — ${item.produto_nome}`}
        nomeArquivo={item.produto_nome}
        geometriaOrigem={item.geometria_origem}
      />
    </>
  );
}
