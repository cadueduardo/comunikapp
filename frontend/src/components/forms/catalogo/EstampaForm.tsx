'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Upload } from 'lucide-react';
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

interface EstampaFormProps {
  estampaId?: string;
  initialData?: Partial<EstampaFormValues> & { arte_mestra_url?: string | null };
  onSave: (data: EstampaFormValues) => Promise<void>;
  loading?: boolean;
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

export function EstampaForm({
  estampaId,
  initialData,
  onSave,
  loading = false,
}: EstampaFormProps) {
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const [processos, setProcessos] = useState<Array<{ id: string; nome: string }>>([]);
  const [conjuntos, setConjuntos] = useState<Array<{ id: string; nome: string }>>([]);
  const [arteMestraUrl, setArteMestraUrl] = useState<string | null>(
    initialData?.arte_mestra_url ?? null,
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
  }, []);

  const handleUploadArteMestra = async (arquivo: File) => {
    if (!estampaId) {
      toast.error('Salve a estampa antes de enviar a arte-mestra.');
      return;
    }

    if (arquivo.size > LIMITE_ARTE_MESTRA_BYTES) {
      toast.error('Arquivo excede o limite de 15 MB.');
      return;
    }

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
    <div className="w-full max-w-none">
      <div className="mb-6">
        <Link
          href="/catalogo/estampas"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Estampas
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {estampaId ? 'Editar estampa' : 'Nova estampa'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

          {estampaId ? (
            <Card>
              <CardHeader>
                <CardTitle>Arte-mestra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <ProdutoFinitoThumb
                    url={arteMestraUrl}
                    alt="Arte-mestra"
                    fit="contain"
                    className="h-40 w-40 shrink-0"
                  />
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: PDF, PNG, JPEG e SVG. Tamanho máximo: 15 MB.
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Salve a estampa para habilitar o upload da arte-mestra.
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/catalogo/estampas">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
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
