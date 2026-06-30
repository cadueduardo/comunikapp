'use client';

import { Layers, Paintbrush, Plus, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import {
  catalogoEstampasApi,
  catalogoPersonalizacaoApi,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  CatalogoInlineCadastroModals,
  type CatalogoModalTipo,
} from './CatalogoInlineCadastroModals';
import type { ProdutoFinitoFormValues } from './ProdutoFinitoForm';

type EstampaOpcao = {
  id: string;
  nome: string;
  codigo?: string | null;
  arte_mestra_url?: string | null;
  thumb_url?: string | null;
};

type ProcessoOpcao = {
  id: string;
  nome: string;
  codigo?: string | null;
};

const FULFILLMENT_OPCOES = [
  { value: 'ESTOQUE', label: 'Só separação (estoque)' },
  { value: 'PRODUCAO', label: 'Produção (personalizar antes de expedir)' },
  { value: 'HIBRIDO', label: 'Híbrido (reservar produto + personalizar)' },
] as const;

interface ProdutoFinitoPersonalizacaoTabProps {
  control: Control<ProdutoFinitoFormValues>;
  setValue: UseFormSetValue<ProdutoFinitoFormValues>;
  personalizavel: boolean;
  modoEstampa: boolean;
  modoImprintLivre: boolean;
  estampaIds: string[];
  processoIds: string[];
  onPersonalizavelChange: (ativo: boolean) => void;
}

export function ProdutoFinitoPersonalizacaoTab({
  control,
  setValue,
  personalizavel,
  modoEstampa,
  modoImprintLivre,
  estampaIds,
  processoIds,
  onPersonalizavelChange,
}: ProdutoFinitoPersonalizacaoTabProps) {
  const [estampas, setEstampas] = useState<EstampaOpcao[]>([]);
  const [processos, setProcessos] = useState<ProcessoOpcao[]>([]);
  const [carregandoEstampas, setCarregandoEstampas] = useState(false);
  const [carregandoProcessos, setCarregandoProcessos] = useState(false);
  const [modalAberto, setModalAberto] = useState<CatalogoModalTipo>(null);

  const carregarEstampas = useCallback(async () => {
    setCarregandoEstampas(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const lista = await catalogoEstampasApi.getAll(token, { ativo: true });
      setEstampas(Array.isArray(lista) ? (lista as EstampaOpcao[]) : []);
    } catch {
      toast.error('Erro ao carregar estampas do catálogo.');
    } finally {
      setCarregandoEstampas(false);
    }
  }, []);

  const carregarProcessos = useCallback(async () => {
    setCarregandoProcessos(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const lista = await catalogoPersonalizacaoApi.getAll(token, { ativo: true });
      setProcessos(Array.isArray(lista) ? (lista as ProcessoOpcao[]) : []);
    } catch {
      toast.error('Erro ao carregar processos de decoração.');
    } finally {
      setCarregandoProcessos(false);
    }
  }, []);

  useEffect(() => {
    if (!personalizavel || !modoEstampa) return;
    void carregarEstampas();
  }, [personalizavel, modoEstampa, carregarEstampas]);

  useEffect(() => {
    if (!personalizavel || !modoImprintLivre) return;
    void carregarProcessos();
  }, [personalizavel, modoImprintLivre, carregarProcessos]);

  const incluirEstampa = (id: string) => {
    if (!estampaIds.includes(id)) {
      setValue('estampa_ids', [...estampaIds, id], { shouldValidate: true });
    }
    if (!modoEstampa) {
      setValue('modo_estampa', true, { shouldValidate: true });
    }
  };

  const incluirProcesso = (id: string) => {
    if (!processoIds.includes(id)) {
      setValue('processo_ids', [...processoIds, id], { shouldValidate: true });
    }
    if (!modoImprintLivre) {
      setValue('modo_imprint_livre', true, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      <CatalogoInlineCadastroModals
        modalAberto={modalAberto}
        onModalAbertoChange={setModalAberto}
        onProcessoCriado={(processo) => {
          setProcessos((prev) => {
            if (prev.some((p) => p.id === processo.id)) return prev;
            return [...prev, processo];
          });
          incluirProcesso(processo.id);
        }}
        onEstampaCriada={(estampa) => {
          setEstampas((prev) => {
            if (prev.some((e) => e.id === estampa.id)) return prev;
            return [...prev, estampa];
          });
          incluirEstampa(estampa.id);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Personalização na venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="personalizavel"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <FormLabel className="text-base">
                    Este produto pode ser personalizado
                  </FormLabel>
                  <FormDescription>
                    Define se o vendedor poderá oferecer estampas ou personalização
                    livre ao incluir este SKU no orçamento.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      onPersonalizavelChange(checked);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {personalizavel ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modos disponíveis na venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={control}
                name="modo_estampa"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="m-0 font-medium">
                        Estampa do catálogo
                      </FormLabel>
                      <FormDescription>
                        O cliente escolhe entre layouts pré-cadastrados com campos
                        variáveis.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="modo_imprint_livre"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="m-0 font-medium">
                        Personalização livre
                      </FormLabel>
                      <FormDescription>
                        Processo de decoração com texto, arquivo ou vetor enviado
                        pelo cliente.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormItem className="flex items-start gap-3 rounded-md border border-dashed bg-muted/30 p-3 opacity-70">
                <Checkbox checked={false} disabled aria-hidden />
                <div className="flex flex-wrap items-center gap-2">
                  <FormLabel className="m-0 font-medium text-muted-foreground">
                    Arte sob medida
                  </FormLabel>
                  <Badge variant="secondary">Breve</Badge>
                  <FormDescription className="w-full">
                    Modo avançado com briefing e aprovação dedicada — fora do escopo
                    V1.
                  </FormDescription>
                </div>
              </FormItem>
            </CardContent>
          </Card>

          {modoEstampa ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4 text-primary" />
                  Estampas compatíveis
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalAberto('estampa')}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Cadastrar estampa
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={control}
                  name="estampa_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormDescription>
                        Selecione as estampas que podem ser vendidas com este produto.
                      </FormDescription>
                      {carregandoEstampas ? (
                        <p className="text-sm text-muted-foreground">
                          Carregando estampas...
                        </p>
                      ) : estampas.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          <p>Nenhuma estampa ativa cadastrada.</p>
                          <Button
                            type="button"
                            variant="link"
                            className="mt-2"
                            onClick={() => setModalAberto('estampa')}
                          >
                            Cadastrar primeira estampa sem sair desta página
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {estampas.map((estampa) => {
                            const selecionada = field.value.includes(estampa.id);
                            const thumb =
                              estampa.thumb_url || estampa.arte_mestra_url;

                            return (
                              <button
                                key={estampa.id}
                                type="button"
                                onClick={() => {
                                  const atual = field.value;
                                  field.onChange(
                                    selecionada
                                      ? atual.filter((id) => id !== estampa.id)
                                      : [...atual, estampa.id],
                                  );
                                }}
                                className={cn(
                                  'flex flex-col overflow-hidden rounded-lg border text-left transition-shadow hover:shadow-md',
                                  selecionada
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-border',
                                )}
                              >
                                <div className="aspect-square bg-muted/30">
                                  <ProdutoFinitoThumb
                                    url={thumb}
                                    alt={estampa.nome}
                                    fit="contain"
                                    className="h-full w-full rounded-none border-0"
                                  />
                                </div>
                                <div className="space-y-0.5 p-2">
                                  <p className="line-clamp-2 text-xs font-medium">
                                    {estampa.nome}
                                  </p>
                                  {estampa.codigo ? (
                                    <p className="text-[10px] text-muted-foreground">
                                      {estampa.codigo}
                                    </p>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {estampaIds.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {estampaIds.length} estampa(s) selecionada(s)
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {modoImprintLivre ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Paintbrush className="h-4 w-4 text-primary" />
                  Processos para personalização livre
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalAberto('processo')}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Cadastrar processo
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={control}
                  name="processo_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormDescription>
                        Processos de decoração permitidos quando o vendedor escolher
                        personalização livre.
                      </FormDescription>
                      {carregandoProcessos ? (
                        <p className="text-sm text-muted-foreground">
                          Carregando processos...
                        </p>
                      ) : processos.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          <p>Nenhum processo ativo cadastrado.</p>
                          <Button
                            type="button"
                            variant="link"
                            className="mt-2"
                            onClick={() => setModalAberto('processo')}
                          >
                            Cadastrar processo sem sair desta página
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {processos.map((processo) => {
                            const selecionado = field.value.includes(processo.id);
                            return (
                              <label
                                key={processo.id}
                                className={cn(
                                  'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors',
                                  selecionado
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted/40',
                                )}
                              >
                                <Checkbox
                                  checked={selecionado}
                                  onCheckedChange={(checked) => {
                                    const atual = field.value;
                                    field.onChange(
                                      checked
                                        ? [...atual, processo.id]
                                        : atual.filter((id) => id !== processo.id),
                                    );
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-medium">{processo.nome}</p>
                                  {processo.codigo ? (
                                    <p className="text-xs text-muted-foreground">
                                      {processo.codigo}
                                    </p>
                                  ) : null}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {processoIds.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {processoIds.length} processo(s) selecionado(s)
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fulfillment padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={control}
                name="fulfillment_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fluxo operacional quando personalizado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fulfillment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FULFILLMENT_OPCOES.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define como a OS tratará estoque vs produção ao personalizar
                      este SKU.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Ative a personalização para configurar modos, estampas e processos
            permitidos na venda.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
