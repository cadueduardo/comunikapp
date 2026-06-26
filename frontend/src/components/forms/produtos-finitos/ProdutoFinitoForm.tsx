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
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
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
import { produtosFinitosApi } from '@/lib/api-client';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';

const formSchema = z.object({
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
});

export type ProdutoFinitoFormValues = z.infer<typeof formSchema>;

type ImagemGaleria = {
  id: string;
  url_imagem: string;
  ordem: number;
};

type ImagemPendente = {
  id: string;
  file: File;
  preview: string;
};

interface ProdutoFinitoFormProps {
  produtoId?: string;
  initialData?: Partial<ProdutoFinitoFormValues> & {
    imagens?: ImagemGaleria[];
    categoria?: { id: string; nome: string } | null;
    ativo?: boolean;
  };
  onSuccess: () => void;
}

const parseNumero = (valor?: string) => {
  if (!valor) return undefined;
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
  const [categorias, setCategorias] = useState<Array<{ id: string; nome: string }>>(
    [],
  );
  const [imagensSalvas, setImagensSalvas] = useState<ImagemGaleria[]>(
    initialData?.imagens || [],
  );
  const [imagensPendentes, setImagensPendentes] = useState<ImagemPendente[]>([]);

  const form = useForm<ProdutoFinitoFormValues>({
    resolver: zodResolver(formSchema),
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
    },
  });

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
      imagensPendentes.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [imagensPendentes]);

  const categoriaOptions = useMemo(
    () => categorias.map((c) => ({ label: c.nome, value: c.id })),
    [categorias],
  );

  const totalImagens = imagensSalvas.length + imagensPendentes.length;

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

  const enviarImagensPendentes = async (id: string, token: string) => {
    for (const imagem of imagensPendentes) {
      await produtosFinitosApi.uploadImagem(id, imagem.file, token);
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

      const payload = montarPayload(values);
      let idDestino = produtoId;

      if (produtoId) {
        await produtosFinitosApi.update(produtoId, payload, token);
      } else {
        const criado = (await produtosFinitosApi.create(payload, token)) as {
          id: string;
        };
        idDestino = criado.id;
      }

      if (idDestino && imagensPendentes.length > 0) {
        await enviarImagensPendentes(idDestino, token);
      }

      toast.success(
        produtoId ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.',
      );
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar o produto.');
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

    const novos: ImagemPendente[] = [];
    Array.from(files)
      .slice(0, restante)
      .forEach((file) => {
        novos.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
        });
      });

    setImagensPendentes((prev) => [...prev, ...novos]);
  };

  const removerImagemPendente = (id: string) => {
    setImagensPendentes((prev) => {
      const alvo = prev.find((img) => img.id === id);
      if (alvo) URL.revokeObjectURL(alvo.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const removerImagemSalva = async (imagemId: string) => {
    if (!produtoId) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    await produtosFinitosApi.removerImagem(produtoId, imagemId, token);
    setImagensSalvas((prev) => prev.filter((img) => img.id !== imagemId));
  };

  const thumbnailPendente = imagensPendentes[0]?.preview || null;
  const thumbnailSalvaUrl = imagensSalvas[0]?.url_imagem || null;

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
          className="grid grid-cols-1 gap-6 xl:grid-cols-12"
        >
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
                    <div className="flex flex-wrap gap-2">
                      {imagensSalvas.map((imagem) => (
                        <div
                          key={imagem.id}
                          className="relative h-16 w-16 overflow-hidden rounded-md border"
                        >
                          <ProdutoFinitoThumb
                            url={imagem.url_imagem}
                            alt=""
                            className="h-full w-full rounded-md"
                          />
                          <button
                              type="button"
                              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                              onClick={() => void removerImagemSalva(imagem.id)}
                            >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {imagensPendentes.map((imagem) => (
                        <div
                          key={imagem.id}
                          className="relative h-16 w-16 overflow-hidden rounded-md border border-primary/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagem.preview}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <Badge className="absolute bottom-0.5 left-0.5 px-1 py-0 text-[10px]">
                            Nova
                          </Badge>
                          <button
                            type="button"
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                            onClick={() => removerImagemPendente(imagem.id)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
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

                {!produtoId && imagensPendentes.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    As imagens serão enviadas automaticamente ao salvar o produto.
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
        </form>
      </Form>
    </div>
  );
}
