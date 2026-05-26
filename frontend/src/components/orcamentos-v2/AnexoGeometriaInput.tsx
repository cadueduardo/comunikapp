'use client';

import {
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { DxfExtraido, SugestoesPorCamada } from './DxfRevisaoCard';

/**
 * Componente único de upload de anexo de geometria (imagem ou DXF) para o
 * produto do Orçamento V2. Substitui a separação rígida do V12 entre
 * "modo DXF" e "modo Imagem" — aqui o operador pode:
 *
 *  - colar um print do clipboard (Ctrl+V) enquanto a área estiver focada,
 *  - arrastar um arquivo (drag-and-drop) na área,
 *  - clicar para abrir o file picker.
 *
 * A categoria do arquivo (IMAGEM vs DXF) é detectada no backend. O resultado
 * do upload vira a string em `arquivo_geometria_url` do formulário (campo
 * que já existe no `ProdutoOrcamento` desde a Fase 2).
 *
 * Decisões registradas na Sub-fase 7.A do plano-mãe:
 *  - Posicionado no TOPO do card de produto (antes do "Nome do Produto").
 *  - A imagem do orçamento conta como ARTE da OS gerada (Leitura B).
 *  - O endpoint usa o JWT da sessão para multi-tenant; sem produto_id na URL.
 */
export interface AnexoGeometriaInputProps {
  /** URL relativa do anexo já persistido (ex.: `/orcamentos-v2/anexos-geometria/<token>`). */
  value: string | null | undefined;
  /**
   * Callback ao trocar o anexo (sucesso de upload ou remoção).
   *
   * O segundo argumento é a categoria detectada pelo backend ao fazer o
   * upload (`IMAGEM` ou `DXF`), ou `null` na remoção. O caller usa essa
   * informação para refletir em `geometria_origem` do `ProdutoOrcamento`.
   */
  onChange: (
    value: string | null,
    categoria: 'IMAGEM' | 'DXF' | null,
  ) => void;
  /**
   * Callback opcional ao detectar que o arquivo é DXF e o backend conseguiu
   * extrair o nome do projeto. Usado para sugerir preenchimento do campo
   * "Nome do Produto" (apenas se ele estiver vazio — decisão de produto).
   */
  onNomeSugerido?: (nomeSugerido: string) => void;
  /**
   * Callback opcional ao receber metadados extraídos de um DXF (Sub-fase 7.B).
   * Recebe `null` quando o anexo é removido, deixa de ser DXF ou nenhum
   * metadado pôde ser interpretado. O segundo argumento traz as sugestões
   * de insumo por camada (heurística do `DxfSugestaoInsumoService`). O
   * caller decide se exibe o card `DxfRevisaoCard` para que o operador
   * aplique os valores ao produto e/ou atrele insumos.
   */
  onDxfExtraido?: (
    dxf: DxfExtraido | null,
    sugestoesInsumo: SugestoesPorCamada[],
  ) => void;
  disabled?: boolean;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api'
).replace(/\/$/, '');

const TAMANHO_MAXIMO_IMAGEM_BYTES = 5 * 1024 * 1024;
const TAMANHO_MAXIMO_DXF_BYTES = 20 * 1024 * 1024;

const EXTENSOES_IMAGEM = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
const EXTENSOES_DXF = new Set(['dxf']);

type CategoriaDetectada = 'IMAGEM' | 'DXF' | null;

function detectarCategoria(file: File): CategoriaDetectada {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('image/')) {
    const sub = mime.split('/')[1] || '';
    if (EXTENSOES_IMAGEM.has(sub)) return 'IMAGEM';
  }
  if (mime === 'application/dxf' || mime === 'application/x-dxf') {
    return 'DXF';
  }
  const nome = (file.name || '').toLowerCase();
  const idx = nome.lastIndexOf('.');
  if (idx >= 0) {
    const ext = nome.slice(idx + 1);
    if (EXTENSOES_IMAGEM.has(ext)) return 'IMAGEM';
    if (EXTENSOES_DXF.has(ext)) return 'DXF';
  }
  return null;
}

function obterToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

interface UploadResponse {
  url: string;
  token: string;
  categoria: 'IMAGEM' | 'DXF';
  metadados: {
    nome_original?: string;
    [key: string]: unknown;
  };
  dxf_extraido: DxfExtraido | null;
  sugestoes_insumo: SugestoesPorCamada[];
}

export function AnexoGeometriaInput({
  value,
  onChange,
  onNomeSugerido,
  onDxfExtraido,
  disabled = false,
}: AnexoGeometriaInputProps) {
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [dragAtivo, setDragAtivo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [categoriaAtual, setCategoriaAtual] =
    useState<CategoriaDetectada>(null);
  const [nomeOriginal, setNomeOriginal] = useState<string | null>(null);

  // Quando o `value` muda (carga inicial ou parent), carrega o preview a
  // partir do endpoint autenticado e cria um blob URL local. Limpa o blob
  // anterior para evitar leak.
  useEffect(() => {
    let cancelado = false;
    let blobUrlCriado: string | null = null;

    const limparBlobAnterior = () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };

    if (!value) {
      limparBlobAnterior();
      setPreviewUrl(null);
      setCategoriaAtual(null);
      setNomeOriginal(null);
      return;
    }

    const carregar = async () => {
      try {
        const token = obterToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch(`${API_BASE_URL}${value}`, { headers });
        if (!resp.ok) {
          throw new Error(`Falha ao carregar anexo (${resp.status})`);
        }
        const blob = await resp.blob();
        if (cancelado) return;
        limparBlobAnterior();
        blobUrlCriado = URL.createObjectURL(blob);
        setPreviewUrl(blobUrlCriado);
        // Detecta categoria pelo content-type retornado.
        const ct = (resp.headers.get('content-type') || '').toLowerCase();
        let categoriaCarregada: CategoriaDetectada = null;
        if (ct.startsWith('image/')) {
          categoriaCarregada = 'IMAGEM';
        } else if (ct.includes('dxf') || ct === 'application/octet-stream') {
          categoriaCarregada = 'DXF';
        }
        setCategoriaAtual(categoriaCarregada);

        // Sub-fase 7.B: se o anexo recarregado for DXF, refaz a leitura dos
        // metadados extraídos para que o card de revisão volte a aparecer
        // (ex.: ao reabrir um orçamento salvo). Falha silenciosa: o card
        // simplesmente não aparece.
        if (categoriaCarregada === 'DXF' && onDxfExtraido) {
          const match = value.match(
            /\/orcamentos-v2\/anexos-geometria\/([0-9a-f-]{36})$/i,
          );
          const tokenAnexo = match ? match[1] : null;
          if (tokenAnexo) {
            try {
              const respDxf = await fetch(
                `${API_BASE_URL}/orcamentos-v2/anexos-geometria/${tokenAnexo}/dxf-extraido`,
                { headers },
              );
              if (respDxf.ok) {
                const dataDxf = (await respDxf.json()) as {
                  dxf_extraido: DxfExtraido | null;
                  sugestoes_insumo?: SugestoesPorCamada[];
                };
                if (!cancelado) {
                  onDxfExtraido(
                    dataDxf.dxf_extraido,
                    dataDxf.sugestoes_insumo ?? [],
                  );
                }
              }
            } catch (error) {
              console.warn('Falha ao reler metadados do DXF:', error);
            }
          }
        }
      } catch (error) {
        if (!cancelado) {
          console.warn('Falha ao carregar preview do anexo:', error);
          setPreviewUrl(null);
        }
      }
    };

    void carregar();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Cleanup geral ao desmontar (revogar blob).
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviarArquivo = useCallback(
    async (file: File) => {
      const categoria = detectarCategoria(file);
      if (!categoria) {
        toast.error(
          'Formato não permitido. Use PNG, JPG, WEBP, GIF ou DXF.',
        );
        return;
      }
      const limite =
        categoria === 'IMAGEM'
          ? TAMANHO_MAXIMO_IMAGEM_BYTES
          : TAMANHO_MAXIMO_DXF_BYTES;
      if (file.size > limite) {
        const limiteMb = (limite / (1024 * 1024)).toFixed(0);
        toast.error(
          `Arquivo excede o limite de ${limiteMb} MB para ${categoria === 'IMAGEM' ? 'imagem' : 'DXF'}.`,
        );
        return;
      }

      try {
        setEnviando(true);
        const formData = new FormData();
        formData.append('arquivo', file, file.name);

        const token = obterToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(
          `${API_BASE_URL}/orcamentos-v2/anexos-geometria`,
          {
            method: 'POST',
            headers,
            body: formData,
          },
        );
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          throw new Error(txt || `Falha no upload (${resp.status})`);
        }
        const data = (await resp.json()) as UploadResponse;
        setNomeOriginal(data.metadados?.nome_original || file.name);
        onChange(data.url, data.categoria);
        toast.success(
          `${categoria === 'IMAGEM' ? 'Imagem' : 'DXF'} anexado com sucesso.`,
        );

        if (categoria === 'DXF') {
          // Sub-fase 7.B: propaga metadados extraídos do DXF + sugestões de
          // insumo (heurística por camada) para que o ProdutoSection
          // renderize o card de revisão e ofereça "Atrelar" nos materiais.
          onDxfExtraido?.(
            data.dxf_extraido ?? null,
            data.sugestoes_insumo ?? [],
          );

          // Sugestão de nome: prefere `$PROJECTNAME` do DXF se vier (mais
          // descritivo); cai para o nome do arquivo caso contrário. Política
          // atual: só preenche quando o campo "Nome do Produto" estiver vazio.
          if (onNomeSugerido) {
            const projeto = data.dxf_extraido?.nome_projeto?.trim();
            if (projeto && projeto.length > 0) {
              onNomeSugerido(projeto);
            } else if (data.metadados?.nome_original) {
              const sugestao = (data.metadados.nome_original as string)
                .replace(/\.dxf$/i, '')
                .replace(/[_-]+/g, ' ')
                .trim();
              if (sugestao) onNomeSugerido(sugestao);
            }
          }
        } else {
          // Categoria mudou para IMAGEM: limpa eventual card de revisão.
          onDxfExtraido?.(null, []);
        }
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Falha ao enviar arquivo';
        toast.error(msg);
      } finally {
        setEnviando(false);
      }
    },
    [onChange, onNomeSugerido, onDxfExtraido],
  );

  const handleArquivoSelecionado = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void enviarArquivo(file);
      }
      // Limpa o input para permitir reenvio do mesmo arquivo.
      event.target.value = '';
    },
    [enviarArquivo],
  );

  const handlePaste = useCallback(
    (event: ReactClipboardEvent<HTMLDivElement>) => {
      if (disabled || enviando) return;
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void enviarArquivo(file);
            return;
          }
        }
      }
    },
    [enviarArquivo, disabled, enviando],
  );

  const handleDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (disabled || enviando) return;
      event.preventDefault();
      event.stopPropagation();
      setDragAtivo(true);
    },
    [disabled, enviando],
  );

  const handleDragLeave = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragAtivo(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (disabled || enviando) return;
      event.preventDefault();
      event.stopPropagation();
      setDragAtivo(false);
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        void enviarArquivo(files[0]);
      }
    },
    [enviarArquivo, disabled, enviando],
  );

  const handleClickArea = useCallback(() => {
    if (disabled || enviando) return;
    inputFileRef.current?.click();
  }, [disabled, enviando]);

  const handleRemover = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      if (disabled || enviando || !value) return;
      // Deleta no backend (best-effort; falha não impede limpar localmente).
      try {
        const token = obterToken();
        const match = value.match(
          /\/orcamentos-v2\/anexos-geometria\/([0-9a-f-]{36})$/i,
        );
        const tokenAnexo = match ? match[1] : null;
        if (tokenAnexo) {
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          await fetch(
            `${API_BASE_URL}/orcamentos-v2/anexos-geometria/${tokenAnexo}`,
            { method: 'DELETE', headers },
          ).catch(() => undefined);
        }
      } finally {
        onChange(null, null);
        onDxfExtraido?.(null, []);
        setNomeOriginal(null);
      }
    },
    [value, onChange, disabled, enviando, onDxfExtraido],
  );

  const temAnexo = !!value;
  const ehImagem = categoriaAtual === 'IMAGEM';
  const ehDXF = categoriaAtual === 'DXF';

  return (
    <div className="space-y-2">
      <input
        ref={inputFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,.dxf,application/dxf,application/x-dxf"
        onChange={handleArquivoSelecionado}
        className="hidden"
        disabled={disabled}
      />

      <div
        ref={areaRef}
        tabIndex={disabled ? -1 : 0}
        role="button"
        onClick={handleClickArea}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'relative rounded-md border-2 border-dashed transition-colors cursor-pointer outline-none',
          'focus:ring-2 focus:ring-primary/40 focus:border-primary/40',
          dragAtivo
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50',
          disabled ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
        aria-label="Anexar imagem ou DXF do produto"
      >
        {temAnexo && previewUrl && ehImagem ? (
          // Preview de imagem.
          <div className="relative p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={nomeOriginal || 'Anexo de geometria'}
              className="mx-auto max-h-48 rounded object-contain"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">
                {nomeOriginal || 'imagem anexada'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemover}
                disabled={disabled || enviando}
                className="h-7 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Remover
              </Button>
            </div>
          </div>
        ) : temAnexo && ehDXF ? (
          // Card para DXF (sem preview visual).
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Arquivo DXF anexado</p>
                <p className="text-xs text-muted-foreground truncate max-w-[24rem]">
                  {nomeOriginal || 'arquivo.dxf'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemover}
              disabled={disabled || enviando}
              className="h-7 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Remover
            </Button>
          </div>
        ) : (
          // Estado vazio: instruções e ícone.
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center">
            {enviando ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Enviando arquivo...
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-5 w-5" />
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">
                  Arraste, cole (Ctrl+V) ou clique para anexar
                </p>
                <p className="text-xs text-muted-foreground">
                  Imagem (PNG, JPG, WEBP, GIF até 5 MB) ou vetor DXF (até 20
                  MB). A imagem vira a arte da OS.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
