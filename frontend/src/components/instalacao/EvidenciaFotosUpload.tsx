'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnexoInstalacaoImagem } from '@/components/instalacao/AnexoInstalacaoImagem';
import { IconCamera, IconLoader2, IconTrash } from '@tabler/icons-react';

interface EvidenciaFotosUploadProps {
  fotos: string[];
  onChange: (fotos: string[]) => void;
  onUpload: (arquivo: File) => Promise<{ url: string }>;
  disabled?: boolean;
  maxFotos?: number;
}

export function EvidenciaFotosUpload({
  fotos,
  onChange,
  onUpload,
  disabled = false,
  maxFotos = 8,
}: EvidenciaFotosUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleArquivos(arquivos: FileList | null) {
    if (!arquivos?.length || disabled) return;

    setEnviando(true);
    setErro(null);

    const novasUrls = [...fotos];

    try {
      for (const arquivo of Array.from(arquivos)) {
        if (novasUrls.length >= maxFotos) break;
        const resultado = await onUpload(arquivo);
        novasUrls.push(resultado.url);
      }
      onChange(novasUrls);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha no upload');
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remover(indice: number) {
    onChange(fotos.filter((_, i) => i !== indice));
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 overflow-hidden">
      <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
        {fotos.map((url, indice) => (
          <div
            key={`${url}-${indice}`}
            className="relative aspect-square min-w-0 overflow-hidden rounded-lg border border-border bg-muted"
          >
            <AnexoInstalacaoImagem
              src={url}
              alt={`Evidência ${indice + 1}`}
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => remover(indice)}
              >
                <IconTrash className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {!disabled && fotos.length < maxFotos && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => void handleArquivos(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={enviando}
            className="h-12 w-full min-w-0"
            onClick={() => inputRef.current?.click()}
          >
            {enviando ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando foto...
              </>
            ) : (
              <>
                <IconCamera className="mr-2 h-5 w-5" />
                Adicionar evidência ({fotos.length}/{maxFotos})
              </>
            )}
          </Button>
        </>
      )}

      {erro && (
        <p className="break-words text-xs text-destructive">{erro}</p>
      )}
    </div>
  );
}
