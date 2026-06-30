'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import {
  catalogoConjuntosCamposApi,
  catalogoEstampasApi,
  catalogoPersonalizacaoApi,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

const LIMITE_ARTE_MESTRA_BYTES = 15 * 1024 * 1024;
const TIPOS_ARTE_MESTRA = '.pdf,.png,.jpg,.jpeg,.svg';

const formSchema = z.object({
  nome: z.string().min(2, 'Informe o nome da estampa.'),
  codigo: z.string().max(50).optional(),
  processo_id: z.string().min(1, 'Selecione o processo de decoração.'),
  conjunto_campos_id: z.string().optional(),
  preco_adicional: z.string().optional(),
  ativo: z.boolean(),
});

export type EstampaFormValues = z.infer<typeof formSchema>;

export type EstampaFormSaveHandler = (
  data: EstampaFormValues,
  arteMestraPendente?: File | null,
) => Promise<void>;

interface EstampaFormProps {
  estampaId?: string;
  initialData?: Partial<EstampaFormValues> & { arte_mestra_url?: string | null };
  onSave: EstampaFormSaveHandler;
  loading?: boolean;
  embedded?: boolean;
  onCancel?: () => void;
  optionsRefreshKey?: number;
  onCadastrarProcesso?: () => void;
  onCadastrarConjunto?: () => void;
}

const parseNumero = (valor?: string) => {
  if (!valor) return 0;
  const n = Number(String(valor).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function serializarEstampa(data: EstampaFormValues) {
  return {
    nome: data.nome.trim(),
    codigo: data.codigo?.trim() || undefined,
    processo_id: data.processo_id,
    conjunto_campos_id: data.conjunto_campos_id || undefined,
    preco_adicional: parseNumero(data.preco_adicional),
    ativo: data.ativo,
  };
}

/** Cria estampa e envia arte-mestra pendente na mesma operação. */
export async function criarEstampaComArteMestra(
  data: EstampaFormValues,
  token: string,
  arteMestra?: File | null,
) {
  const criada = (await catalogoEstampasApi.create(
    serializarEstampa(data),
    token,
  )) as {
    id: string;
    nome: string;
    arte_mestra_url?: string | null;
    thumb_url?: string | null;
  };

  if (!arteMestra || !criada.id) {
    return criada;
  }

  const upload = (await catalogoEstampasApi.uploadArteMestra(
    criada.id,
    arteMestra,
    token,
  )) as { arte_mestra_url?: string; thumb_url?: string | null };

  return {
    ...criada,
    arte_mestra_url: upload.arte_mestra_url ?? criada.arte_mestra_url,
    thumb_url: upload.thumb_url ?? criada.thumb_url,
  };
}

export function EstampaForm({
  estampaId,
  initialData,
  onSave,
  loading = false,
  embedded = false,
  onCancel,
  optionsRefreshKey = 0,
  onCadastrarProcesso,
  onCadastrarConjunto,
}: EstampaFormProps) {
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const [processos, setProcessos] = useState<Array<{ id: string; nome: string }>>([]);
  const [conjuntos, setConjuntos] = useState<Array<{ id: string; nome: string }>>([]);
  const [arteMestraUrl, setArteMestraUrl] = useState<string | null>(
    initialData?.arte_mestra_url ?? null,
  );
  const [arteMestraPendente, setArteMestraPendente] = useState<File | null>(null);
  const [previewArtePendente, setPreviewArtePendente] = useState<string | null>(
    null,
  );
  const [enviandoArte, setEnviandoArte] = useState(false);

  const form = useForm<EstampaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome ?? '',
      codigo: initialData?.codigo ?? '',
      processo_id: initialData?.processo_id ?? '',
      conjunto_campos_id: initialData?.conjunto_campos_id ?? '',
      preco_adicional: initialData?.preco_adicional ?? '',
      ativo: initialData?.ativo ?? true,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const [listaProcessos, listaConjuntos] = await Promise.all([
          catalogoPersonalizacaoApi.getAll(token, { ativo: true }),
          catalogoConjuntosCamposApi.getAll(token, { ativo: true }),
        ]);

        setProcessos(
          (listaProcessos as Array<{ id: string; nome: string }>).map((p) => ({
            id: p.id,
            nome: p.nome,
          })),
        );
        setConjuntos(
          (listaConjuntos as Array<{ id: string; nome: string }>).map((c) => ({
            id: c.id,
            nome: c.nome,
          })),
        );
      } catch {
        toast.error('Erro ao carregar opções de vínculo.');
      }
    })();
  }, [optionsRefreshKey]);

  useEffect(() => {
    return () => {
      if (previewArtePendente) {
        URL.revokeObjectURL(previewArtePendente);
      }
    };
  }, [previewArtePendente]);

  const validarArquivoArteMestra = (arquivo: File): boolean => {
    if (arquivo.size > LIMITE_ARTE_MESTRA_BYTES) {
      toast.error('Arquivo excede o limite de 15 MB.');
      return false;
    }
    return true;
  };

  const selecionarArteMestraPendente = (arquivo: File) => {
    if (!validarArquivoArteMestra(arquivo)) return;

    if (previewArtePendente) {
      URL.revokeObjectURL(previewArtePendente);
    }

    setArteMestraPendente(arquivo);
    if (arquivo.type.startsWith('image/')) {
      setPreviewArtePendente(URL.createObjectURL(arquivo));
    } else {
      setPreviewArtePendente(null);
    }
  };

  const limparArteMestraPendente = () => {
    if (previewArtePendente) {
      URL.revokeObjectURL(previewArtePendente);
    }
    setArteMestraPendente(null);
    setPreviewArtePendente(null);
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = '';
    }
  };

  const handleUploadArteMestra = async (arquivo: File) => {
    if (!estampaId) {
      toast.error('Salve a estampa antes de enviar a arte-mestra.');
      return;
    }

    if (!validarArquivoArteMestra(arquivo)) return;

    try {
      setEnviandoArte(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const resposta = (await catalogoEstampasApi.uploadArteMestra(
        estampaId,
        arquivo,
        token,
      )) as { arte_mestra_url?: string };

      if (resposta.arte_mestra_url) {
        setArteMestraUrl(resposta.arte_mestra_url);
      }
      toast.success('Arte-mestra enviada com sucesso.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao enviar arte-mestra.',
      );
    } finally {
      setEnviandoArte(false);
      if (inputArquivoRef.current) {
        inputArquivoRef.current.value = '';
      }
    }
  };

  return (
    <div className={cn('w-full min-w-0', embedded && 'max-w-full')}>
      {!embedded ? (
        <div className="mb-6">
          <Link
            href="/catalogo/estampas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Estampas
          </Link>
        </div>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            onSave(values, arteMestraPendente),
          )}
          className={cn(embedded ? 'space-y-4' : 'space-y-6')}
        >
          <Card className={cn(embedded && 'border-0 shadow-none')}>
            {!embedded ? (
              <CardHeader>
                <CardTitle>
                  {estampaId ? 'Editar estampa' : 'Nova estampa'}
                </CardTitle>
              </CardHeader>
            ) : null}
            <CardContent className={cn('space-y-6', embedded && 'p-0')}>
              <div
                className={cn(
                  'grid grid-cols-1 gap-6',
                  !embedded && 'lg:grid-cols-2',
                )}
              >
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Estampa Aniversário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código interno</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: EST-ANIV-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div
                className={cn(
                  'grid grid-cols-1 gap-6',
                  !embedded && 'lg:grid-cols-2',
                )}
              >
                <FormField
                  control={form.control}
                  name="processo_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Processo de decoração</FormLabel>
                      <FormControl>
                        <Combobox
                          options={processos.map((p) => ({
                            value: p.id,
                            label: p.nome,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione o processo"
                          searchPlaceholder="Buscar processo..."
                          emptyPlaceholder="Nenhum processo ativo encontrado."
                        />
                      </FormControl>
                      <FormMessage />
                      {embedded && processos.length === 0 && onCadastrarProcesso ? (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto justify-start p-0 text-left text-sm whitespace-normal"
                          onClick={onCadastrarProcesso}
                        >
                          Cadastrar processo agora
                        </Button>
                      ) : null}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conjunto_campos_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conjunto de campos (opcional)</FormLabel>
                      <FormControl>
                        <Combobox
                          options={conjuntos.map((c) => ({
                            value: c.id,
                            label: c.nome,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Nenhum conjunto"
                          searchPlaceholder="Buscar conjunto..."
                          emptyPlaceholder="Nenhum conjunto ativo encontrado."
                        />
                      </FormControl>
                      <FormDescription>
                        Necessário para posicionar variáveis na arte-mestra.
                      </FormDescription>
                      {embedded && conjuntos.length === 0 && onCadastrarConjunto ? (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto justify-start p-0 text-left text-sm whitespace-normal"
                          onClick={onCadastrarConjunto}
                        >
                          Cadastrar conjunto de campos agora
                        </Button>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div
                className={cn(
                  'grid grid-cols-1 gap-6',
                  !embedded && 'lg:grid-cols-2',
                )}
              >
                <FormField
                  control={form.control}
                  name="preco_adicional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço adicional (R$)</FormLabel>
                      <FormControl>
                        <CustomCurrencyInput
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-md border p-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="m-0">Estampa ativa</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(embedded && 'border-0 shadow-none')}>
            {!embedded ? (
              <CardHeader>
                <CardTitle>Arte-mestra</CardTitle>
              </CardHeader>
            ) : (
              <CardHeader className={cn('px-0 pb-2', embedded && 'pt-0')}>
                <CardTitle className="text-base">Arte-mestra</CardTitle>
              </CardHeader>
            )}
            <CardContent
              className={cn('space-y-4', embedded && 'px-0 pb-0')}
            >
              {estampaId ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <ProdutoFinitoThumb
                    url={arteMestraUrl}
                    alt="Arte-mestra"
                    fit="contain"
                    className="h-40 w-40 shrink-0"
                  />
                  <div className="min-w-0 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: PDF, PNG, JPEG e SVG. Tamanho máximo: 15
                      MB.
                    </p>
                    <input
                      ref={inputArquivoRef}
                      type="file"
                      accept={TIPOS_ARTE_MESTRA}
                      className="hidden"
                      onChange={(event) => {
                        const arquivo = event.target.files?.[0];
                        if (arquivo) void handleUploadArteMestra(arquivo);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={enviandoArte}
                      onClick={() => inputArquivoRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {enviandoArte ? 'Enviando...' : 'Enviar arte-mestra'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Envie o layout base da estampa (PDF ou imagem). O arquivo será
                    anexado automaticamente ao salvar. Formatos: PDF, PNG, JPEG e
                    SVG — máx. 15 MB.
                  </p>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {previewArtePendente ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewArtePendente}
                        alt="Prévia da arte-mestra"
                        className="h-40 w-40 shrink-0 rounded-md border object-contain"
                      />
                    ) : arteMestraPendente ? (
                      <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-md border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                        {arteMestraPendente.name}
                      </div>
                    ) : (
                      <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20 text-xs text-muted-foreground">
                        Nenhum arquivo
                      </div>
                    )}
                    <div className="min-w-0 space-y-2">
                      <input
                        ref={inputArquivoRef}
                        type="file"
                        accept={TIPOS_ARTE_MESTRA}
                        className="hidden"
                        onChange={(event) => {
                          const arquivo = event.target.files?.[0];
                          if (arquivo) selecionarArteMestraPendente(arquivo);
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => inputArquivoRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {arteMestraPendente
                            ? 'Trocar arquivo'
                            : 'Selecionar arte-mestra'}
                        </Button>
                        {arteMestraPendente ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={limparArteMestraPendente}
                            aria-label="Remover arquivo selecionado"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                      {arteMestraPendente ? (
                        <p className="text-xs text-muted-foreground">
                          Selecionado: {arteMestraPendente.name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            {embedded ? (
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar
              </Button>
            ) : (
              <Link href="/catalogo/estampas">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
            )}
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar estampa'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
