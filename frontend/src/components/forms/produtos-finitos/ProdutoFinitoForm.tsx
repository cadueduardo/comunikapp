'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ImageIcon,
  Package,
  Plus,
  Save,
  Truck,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { produtosFinitosApi } from '@/lib/api-client';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import { ProdutoFinitoPersonalizacaoTab } from './ProdutoFinitoPersonalizacaoTab';
import {
  ProdutoFinitoGaleriaImagens,
  type GaleriaItem,
  type GaleriaItemPendente,
} from './ProdutoFinitoGaleriaImagens';

const fulfillmentPadraoEnum = z.enum(['ESTOQUE', 'PRODUCAO', 'HIBRIDO']);

const formSchema = z
  .object({
    nome: z.string().min(2, 'Informe o nome do produto.'),
    descricao_resumida: z.string().max(500, 'Máximo de 500 caracteres.').optional(),
    descricao: z.string().optional(),
    sku: z.string().min(1, 'Informe o SKU.'),
    ean: z.string().max(13).optional(),
    categoriaId: z.string().optional(),
    preco_venda: z.string().min(1, 'Informe o preço de venda.'),
    preco_promocional: z.string().optional(),
    preco_custo: z.string().optional(),
    peso_kg: z.string().optional(),
    largura_cm: z.string().optional(),
    altura_cm: z.string().optional(),
    profundidade_cm: z.string().optional(),
    estoque_atual: z.string().optional(),
    estoque_minimo: z.string().optional(),
    ativo: z.boolean(),
    personalizavel: z.boolean(),
    modo_estampa: z.boolean(),
    modo_imprint_livre: z.boolean(),
    fulfillment_padrao: fulfillmentPadraoEnum,
    estampa_ids: z.array(z.string()),
    processo_ids: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (!data.personalizavel) return;

    if (!data.modo_estampa && !data.modo_imprint_livre) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione ao menos um modo de personalização.',
        path: ['modo_estampa'],
      });
    }

    if (data.modo_estampa && data.estampa_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione ao menos uma estampa ou desative o modo Estampa.',
        path: ['estampa_ids'],
      });
    }

    if (data.modo_imprint_livre && data.processo_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione ao menos um processo ou desative o modo Personalização livre.',
        path: ['processo_ids'],
      });
    }
  });

export type ProdutoFinitoFormValues = z.infer<typeof formSchema>;

type ImagemGaleria = {
  id: string;
  url_imagem: string;
  ordem: number;
};

interface ProdutoFinitoFormProps {
  produtoId?: string;
  initialData?: Partial<ProdutoFinitoFormValues> & {
    imagens?: ImagemGaleria[];
    categoria?: { id: string; nome: string } | null;
    ativo?: boolean;
    personalizavel?: boolean;
    fulfillment_padrao?: 'ESTOQUE' | 'PRODUCAO' | 'HIBRIDO';
    estampa_ids?: string[];
    processo_ids?: string[];
  };
  onSuccess: () => void;
}

const parseNumero = (valor?: string | number) => {
  if (valor === null || valor === undefined || valor === '') return undefined;
  const n = Number(String(valor).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

/** Exibe vazio quando o valor é zero ou não informado — evita "0" fixo no input. */
export const formatCampoNumerico = (valor: unknown): string => {
  if (valor === null || valor === undefined || valor === '') return '';
  const n = Number(valor);
  if (!Number.isFinite(n) || n === 0) return '';
  return String(valor);
};

const MAX_IMAGENS = 10;
const TIPOS_IMAGEM = 'image/png,image/jpeg,image/jpg,image/webp,image/gif';

export function ProdutoFinitoForm({
  produtoId,
  initialData,
  onSuccess,
}: ProdutoFinitoFormProps) {
  const [salvando, setSalvando] = useState(false);
  const [reordenandoImagens, setReordenandoImagens] = useState(false);
  const [categorias, setCategorias] = useState<Array<{ id: string; nome: string }>>(
    [],
  );
  const [galeria, setGaleria] = useState<GaleriaItem[]>(() =>
    [...(initialData?.imagens ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map((img) => ({
        kind: 'salva' as const,
        id: img.id,
        url: img.url_imagem,
      })),
  );

  const form = useForm<ProdutoFinitoFormValues>({
    resolver: zodResolver(formSchema),
    // Campos em abas inativas não podem sumir do submit (ex.: estoque mínimo na aba Preço).
    shouldUnregister: false,
    defaultValues: {
      nome: initialData?.nome ?? '',
      descricao_resumida: initialData?.descricao_resumida ?? '',
      descricao: initialData?.descricao ?? '',
      sku: initialData?.sku ?? '',
      ean: initialData?.ean ?? '',
      categoriaId: initialData?.categoriaId ?? initialData?.categoria?.id ?? '',
      preco_venda: initialData?.preco_venda ?? '',
      preco_promocional: initialData?.preco_promocional ?? '',
      preco_custo: formatCampoNumerico(initialData?.preco_custo),
      peso_kg: formatCampoNumerico(initialData?.peso_kg),
      largura_cm: formatCampoNumerico(initialData?.largura_cm),
      altura_cm: formatCampoNumerico(initialData?.altura_cm),
      profundidade_cm: formatCampoNumerico(initialData?.profundidade_cm),
      estoque_atual: formatCampoNumerico(initialData?.estoque_atual),
      estoque_minimo: formatCampoNumerico(initialData?.estoque_minimo),
      ativo: initialData?.ativo ?? true,
      personalizavel: initialData?.personalizavel ?? false,
      modo_estampa: initialData?.modo_estampa ?? false,
      modo_imprint_livre: initialData?.modo_imprint_livre ?? false,
      fulfillment_padrao: initialData?.fulfillment_padrao ?? 'HIBRIDO',
      estampa_ids: initialData?.estampa_ids ?? [],
      processo_ids: initialData?.processo_ids ?? [],
    },
  });

  const personalizavel = form.watch('personalizavel');
  const modoEstampa = form.watch('modo_estampa');
  const modoImprintLivre = form.watch('modo_imprint_livre');
  const estampaIds = form.watch('estampa_ids');
  const processoIds = form.watch('processo_ids');

  const limparPersonalizacao = () => {
    form.setValue('modo_estampa', false);
    form.setValue('modo_imprint_livre', false);
    form.setValue('estampa_ids', []);
    form.setValue('processo_ids', []);
    form.setValue('fulfillment_padrao', 'HIBRIDO');
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const lista = (await produtosFinitosApi.listarCategorias(token, true)) as Array<{
        id: string;
        nome: string;
      }>;
      setCategorias(lista);
    })();
  }, []);

  useEffect(() => {
    return () => {
      galeria.forEach((item) => {
        if (item.kind === 'pendente') {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [galeria]);

  const categoriaOptions = useMemo(
    () => categorias.map((c) => ({ label: c.nome, value: c.id })),
    [categorias],
  );

  const totalImagens = galeria.length;

  const persistirOrdemImagensSalvas = async (itens: GaleriaItem[]) => {
    if (!produtoId) return;

    const idsSalvas = itens
      .filter((item): item is GaleriaItem & { kind: 'salva' } => item.kind === 'salva')
      .map((item) => item.id);

    const totalSalvas = itens.filter((item) => item.kind === 'salva').length;
    if (totalSalvas <= 1) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    setReordenandoImagens(true);
    try {
      const atualizadas = (await produtosFinitosApi.reordenarImagens(
        produtoId,
        idsSalvas,
        token,
      )) as ImagemGaleria[];

      const mapaUrl = new Map(atualizadas.map((img) => [img.id, img.url_imagem]));
      setGaleria((prev) =>
        prev.map((item) =>
          item.kind === 'salva'
            ? { ...item, url: mapaUrl.get(item.id) ?? item.url }
            : item,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível reordenar as imagens.',
      );
    } finally {
      setReordenandoImagens(false);
    }
  };

  const handleReordenarGaleria = (itens: GaleriaItem[]) => {
    setGaleria(itens);
    if (produtoId) {
      void persistirOrdemImagensSalvas(itens);
    }
  };

  const montarPayloadPersonalizacao = (values: ProdutoFinitoFormValues) => {
    if (!values.personalizavel) {
      return { personalizavel: false };
    }

    const modos = [
      ...(values.modo_estampa ? (['ESTAMPA'] as const) : []),
      ...(values.modo_imprint_livre ? (['IMPRINT_LIVRE'] as const) : []),
    ];

    return {
      personalizavel: true,
      fulfillment_padrao: values.fulfillment_padrao,
      modos_personalizacao: modos,
      estampa_ids: values.modo_estampa ? values.estampa_ids : [],
      processo_ids: values.modo_imprint_livre ? values.processo_ids : [],
    };
  };

  const montarPayload = (values: ProdutoFinitoFormValues) => ({
    nome: values.nome.trim(),
    descricao_resumida: values.descricao_resumida?.trim() || undefined,
    descricao: values.descricao?.trim() || undefined,
    sku: values.sku.trim(),
    ean: values.ean?.trim() || undefined,
    categoria_id: values.categoriaId || undefined,
    preco_venda: parseNumero(values.preco_venda) ?? 0,
    preco_promocional: parseNumero(values.preco_promocional),
    preco_custo: parseNumero(values.preco_custo),
    peso_kg: parseNumero(values.peso_kg) ?? 0,
    largura_cm: Math.floor(parseNumero(values.largura_cm) ?? 0),
    altura_cm: Math.floor(parseNumero(values.altura_cm) ?? 0),
    profundidade_cm: Math.floor(parseNumero(values.profundidade_cm) ?? 0),
    estoque_atual: Math.floor(parseNumero(values.estoque_atual) ?? 0),
    estoque_minimo: Math.floor(parseNumero(values.estoque_minimo) ?? 0),
    ativo: values.ativo,
  });

  const enviarImagensPendentes = async (
    id: string,
    token: string,
    itens: GaleriaItem[],
  ) => {
    const idsFinais: string[] = [];

    for (const item of itens) {
      if (item.kind === 'salva') {
        idsFinais.push(item.id);
        continue;
      }

      const resposta = (await produtosFinitosApi.uploadImagem(
        id,
        item.file,
        token,
      )) as { id: string; url_imagem?: string; url?: string };

      idsFinais.push(resposta.id);
    }

    if (idsFinais.length > 1) {
      await produtosFinitosApi.reordenarImagens(id, idsFinais, token);
    }
  };

  const onSubmit = async (values: ProdutoFinitoFormValues) => {
    setSalvando(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      const payload = {
        ...montarPayload(values),
        ...montarPayloadPersonalizacao(values),
      };
      let idDestino = produtoId;

      if (produtoId) {
        await produtosFinitosApi.update(produtoId, payload, token);
      } else {
        const criado = (await produtosFinitosApi.create(
          montarPayload(values),
          token,
        )) as { id: string };
        idDestino = criado.id;
        if (values.personalizavel) {
          await produtosFinitosApi.update(
            criado.id,
            montarPayloadPersonalizacao(values),
            token,
          );
        }
      }

      if (idDestino) {
        const pendentes = galeria.filter(
          (item): item is GaleriaItemPendente => item.kind === 'pendente',
        );
        if (pendentes.length > 0) {
          await enviarImagensPendentes(idDestino, token, galeria);
        } else if (produtoId) {
          await persistirOrdemImagensSalvas(galeria);
        }
      }

      toast.success(
        produtoId ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.',
      );
      onSuccess();
    } catch (error) {
      console.error(error);
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o produto.';
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  const criarCategoriaInline = async (nome: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const criada = (await produtosFinitosApi.criarCategoria(nome.trim(), token)) as {
      id: string;
      nome: string;
    };
    setCategorias((prev) => [...prev, criada]);
    form.setValue('categoriaId', criada.id);
    toast.success('Categoria de produto criada.');
  };

  const adicionarArquivos = (files: FileList | null) => {
    if (!files?.length) return;

    const restante = MAX_IMAGENS - totalImagens;
    if (restante <= 0) {
      toast.error(`Limite de ${MAX_IMAGENS} imagens por produto.`);
      return;
    }

    const novos: GaleriaItemPendente[] = [];
    Array.from(files)
      .slice(0, restante)
      .forEach((file) => {
        novos.push({
          kind: 'pendente',
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
        });
      });

    setGaleria((prev) => [...prev, ...novos]);
  };

  const removerItemGaleria = async (id: string) => {
    const alvo = galeria.find((item) => item.id === id);
    if (!alvo) return;

    if (alvo.kind === 'pendente') {
      URL.revokeObjectURL(alvo.preview);
      setGaleria((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    if (!produtoId) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    await produtosFinitosApi.removerImagem(produtoId, id, token);
    setGaleria((prev) => prev.filter((item) => item.id !== id));
  };

  const capaItem = galeria[0];
  const thumbnailPendente =
    capaItem?.kind === 'pendente' ? capaItem.preview : null;
  const thumbnailSalvaUrl = capaItem?.kind === 'salva' ? capaItem.url : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/produtos-finitos"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Produtos
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {produtoId ? 'Editar produto' : 'Adicionar produto'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre informações comerciais, estoque, logística e imagens do catálogo.
          </p>
        </div>
        <Button type="submit" form="produto-finito-form" disabled={salvando}>
          <Save className="mr-2 h-4 w-4" />
          {salvando ? 'Salvando...' : 'Salvar produto'}
        </Button>
      </div>

      <Form {...form}>
        <form
          id="produto-finito-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <Tabs defaultValue="identificacao" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="identificacao">Identificação</TabsTrigger>
              <TabsTrigger value="preco">Preço e logística</TabsTrigger>
              <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
            </TabsList>

            <TabsContent value="identificacao" className="mt-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-primary" />
                      Informações do produto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do produto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex.: Display Acrílico A4" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nome exibido no catálogo e nos orçamentos.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descricao_resumida"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição resumida</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={2}
                              maxLength={500}
                              placeholder="Breve descrição exibida no preview e no PDF do orçamento..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Texto curto (até 500 caracteres). Evita quebra de layout no orçamento.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição detalhada</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={5}
                              placeholder="Especificações técnicas, materiais, acabamentos e demais detalhes..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Informações completas do produto para consulta interna e catálogo.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                </div>

                <div className="space-y-6 xl:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Imagem principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-6 text-center transition hover:border-primary/40 hover:bg-muted/30">
                  {thumbnailPendente ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnailPendente}
                      alt="Prévia do produto"
                      className="max-h-48 w-full rounded-lg object-contain"
                    />
                  ) : thumbnailSalvaUrl ? (
                    <ProdutoFinitoThumb
                      url={thumbnailSalvaUrl}
                      alt="Prévia do produto"
                      fit="contain"
                      className="max-h-48 w-full"
                    />
                  ) : (
                    <>
                      <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-medium">Clique para enviar imagens</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG, WEBP ou GIF — até 5 MB cada (máx. {MAX_IMAGENS})
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept={TIPOS_IMAGEM}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      adicionarArquivos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>

                {totalImagens > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Galeria ({totalImagens}/{MAX_IMAGENS})
                    </p>
                    <ProdutoFinitoGaleriaImagens
                      itens={galeria}
                      onReorder={handleReordenarGaleria}
                      onRemover={(id) => void removerItemGaleria(id)}
                      reordenando={reordenandoImagens}
                    />
                  </div>
                ) : null}

                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
                  <Upload className="h-4 w-4" />
                  Adicionar mais imagens
                  <input
                    type="file"
                    accept={TIPOS_IMAGEM}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      adicionarArquivos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>

                {!produtoId && galeria.some((item) => item.kind === 'pendente') ? (
                  <p className="text-xs text-muted-foreground">
                    As imagens serão enviadas na ordem exibida ao salvar o produto.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Produto ativo</FormLabel>
                        <FormDescription>
                          {field.value
                            ? 'Disponível no catálogo e nos orçamentos.'
                            : 'Oculto do catálogo (inativo).'}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Categoria de Produtos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name="categoriaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Combobox
                          options={categoriaOptions}
                          value={field.value}
                          onChange={field.onChange}
                          onCreate={criarCategoriaInline}
                          placeholder="Selecione uma categoria"
                          searchPlaceholder="Buscar categoria..."
                          createPlaceholder="Criar categoria"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const nome = window.prompt('Nome da nova categoria:');
                    if (nome?.trim()) void criarCategoriaInline(nome.trim());
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar nova categoria
                </Button>
              </CardContent>
            </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preco" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Precificação</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="preco_venda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de venda</FormLabel>
                          <FormControl>
                            <CustomCurrencyInput
                              placeholder="R$ 0,00"
                              value={field.value}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormDescription>Preço padrão de prateleira.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preco_promocional"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço promocional</FormLabel>
                          <FormControl>
                            <CustomCurrencyInput
                              placeholder="R$ 0,00"
                              value={field.value}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormDescription>
                            Opcional. Deve ser menor que o preço de venda.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preco_custo"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Preço de custo</FormLabel>
                          <FormControl>
                            <CustomCurrencyInput
                              placeholder="R$ 0,00"
                              value={field.value}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormDescription>
                            Quanto o produto custa para a loja (compra ou fabricação). Usado no orçamento para calcular margem.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estoque e identificação</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="Código interno" {...field} />
                          </FormControl>
                          <FormDescription>Identificador único por loja.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ean"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EAN / GTIN</FormLabel>
                          <FormControl>
                            <Input placeholder="Código de barras" {...field} />
                          </FormControl>
                          <FormDescription>Até 13 dígitos para marketplaces.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estoque_atual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade em estoque</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="Ex.: 10"
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormDescription>Saldo disponível para venda.</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estoque_minimo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque mínimo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="Ex.: 2"
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormDescription>Referência para alertas operacionais.</FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="h-5 w-5 text-primary" />
                      Envio e dimensões da embalagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="peso_kg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.001"
                              placeholder="Ex.: 0,450"
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="largura_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Largura (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="Ex.: 30"
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="altura_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Altura (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="Ex.: 25"
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="profundidade_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profundidade (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="Ex.: 2"
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="personalizacao" className="mt-6">
              <ProdutoFinitoPersonalizacaoTab
                control={form.control}
                setValue={form.setValue}
                personalizavel={personalizavel}
                modoEstampa={modoEstampa}
                modoImprintLivre={modoImprintLivre}
                estampaIds={estampaIds}
                processoIds={processoIds}
                onPersonalizavelChange={(ativo) => {
                  if (!ativo) limparPersonalizacao();
                }}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end border-t pt-6">
            <Button type="submit" disabled={salvando}>
              <Save className="mr-2 h-4 w-4" />
              {salvando ? 'Salvando...' : 'Salvar produto'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
