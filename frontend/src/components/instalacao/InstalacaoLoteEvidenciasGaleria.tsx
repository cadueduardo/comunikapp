'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AnexoInstalacaoImagem } from '@/components/instalacao/AnexoInstalacaoImagem';
import { TIPO_OCORRENCIA_LABEL } from '@/lib/instalacao/instalacao-labels';
import type { OcorrenciaGestao } from '@/lib/instalacao/instalacao.types';
import { IconPhoto } from '@tabler/icons-react';

interface EvidenciaItem {
  url: string;
  origem: 'ocorrencia' | 'conclusao';
  ocorrencia?: OcorrenciaGestao;
}

interface InstalacaoLoteEvidenciasGaleriaProps {
  fotosConclusao: string[];
  ocorrencias: OcorrenciaGestao[];
}

function formatarData(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function montarItens(
  fotosConclusao: string[],
  ocorrencias: OcorrenciaGestao[],
): EvidenciaItem[] {
  const itens: EvidenciaItem[] = [];
  const urlsVistas = new Set<string>();

  for (const occ of ocorrencias) {
    for (const url of occ.fotos_evidencia ?? []) {
      if (!url || urlsVistas.has(url)) continue;
      urlsVistas.add(url);
      itens.push({ url, origem: 'ocorrencia', ocorrencia: occ });
    }
  }

  for (const url of fotosConclusao) {
    if (!url || urlsVistas.has(url)) continue;
    urlsVistas.add(url);
    itens.push({ url, origem: 'conclusao' });
  }

  return itens;
}

export function InstalacaoLoteEvidenciasGaleria({
  fotosConclusao,
  ocorrencias,
}: InstalacaoLoteEvidenciasGaleriaProps) {
  const itens = useMemo(
    () => montarItens(fotosConclusao, ocorrencias),
    [fotosConclusao, ocorrencias],
  );
  const [selecionado, setSelecionado] = useState<EvidenciaItem | null>(null);

  if (itens.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma evidência fotográfica neste endereço. Fotos anexadas em
        ocorrências ou na conclusão da instalação em campo aparecerão aqui.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {itens.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type="button"
            className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted text-left ring-offset-background transition hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setSelecionado(item)}
          >
            <AnexoInstalacaoImagem
              src={item.url}
              alt={`Evidência ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {item.origem === 'ocorrencia' && item.ocorrencia
                ? (TIPO_OCORRENCIA_LABEL[item.ocorrencia.tipo] ??
                  item.ocorrencia.tipo)
                : 'Conclusão'}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <IconPhoto className="h-3.5 w-3.5" />
        Clique em uma foto para ver o relato e a ocorrência vinculada.
      </p>

      <Dialog
        open={selecionado != null}
        onOpenChange={(aberto) => {
          if (!aberto) setSelecionado(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card">
          {selecionado && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left text-base">
                  {selecionado.origem === 'ocorrencia' && selecionado.ocorrencia
                    ? (TIPO_OCORRENCIA_LABEL[selecionado.ocorrencia.tipo] ??
                      selecionado.ocorrencia.tipo)
                    : 'Evidência de conclusão'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-md border border-border bg-muted">
                  <AnexoInstalacaoImagem
                    src={selecionado.url}
                    alt="Evidência ampliada"
                    className="max-h-[50vh] w-full object-contain"
                  />
                </div>

                {selecionado.origem === 'ocorrencia' &&
                  selecionado.ocorrencia && (
                    <div className="space-y-2 text-sm">
                      <p className="text-xs text-muted-foreground">
                        {formatarData(selecionado.ocorrencia.criado_em)}
                      </p>
                      <p className="text-foreground">
                        {selecionado.ocorrencia.descricao}
                      </p>
                      {selecionado.ocorrencia.quantidade > 1 && (
                        <Badge variant="secondary">
                          Quantidade: {selecionado.ocorrencia.quantidade}
                        </Badge>
                      )}
                    </div>
                  )}

                {selecionado.origem === 'conclusao' && (
                  <p className="text-sm text-muted-foreground">
                    Foto registrada na conclusão da instalação em campo
                    (aplicativo do instalador), junto com a assinatura do
                    recebedor.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
