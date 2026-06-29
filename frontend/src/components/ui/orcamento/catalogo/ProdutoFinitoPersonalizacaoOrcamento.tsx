'use client';

import { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Paintbrush, Sparkles } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import {
  calcularPrecoLinhaPersonalizada,
} from '@/lib/catalogo/personalizacao-preco';
import type {
  CatalogoRegrasOrcamento,
  CampoVariavelDefOrcamento,
  GradeDistribuicaoLinha,
  PersonalizacaoVdpModo,
} from '@/lib/catalogo/personalizacao-orcamento.types';
import { EstampaThumbGrid } from './EstampaThumbGrid';
import { CamposVariaveisInline } from './CamposVariaveisInline';
import {
  GradeDistribuicaoMini,
  construirLinhasGradeIniciais,
  somaGradeDistribuicao,
} from './GradeDistribuicaoMini';
import { VdpModoToggle } from './VdpModoToggle';
import { CsvColumnMapper } from './CsvColumnMapper';

const CAMPO_TEXTO_IMPRINT: CampoVariavelDefOrcamento = {
  id: 'imprint-texto',
  chave: 'texto_personalizacao',
  label: 'Texto da personalização',
  tipo: 'TEXTO',
  obrigatorio: true,
  max_caracteres: 500,
  ordem: 0,
  placeholder: 'Ex.: Eu te amo',
};

interface ProdutoFinitoPersonalizacaoOrcamentoProps {
  itemIndex: number;
  quantidadeTotal: number;
  precoBaseProduto: number;
  somenteLeitura?: boolean;
}

export function ProdutoFinitoPersonalizacaoOrcamento({
  itemIndex,
  quantidadeTotal,
  precoBaseProduto,
  somenteLeitura,
}: ProdutoFinitoPersonalizacaoOrcamentoProps) {
  const form = useFormContext();
  const basePath = `itens_produto.${itemIndex}` as const;

  const regras = form.watch(`${basePath}.catalogo_regras`) as
    | CatalogoRegrasOrcamento
    | undefined;
  const personalizavel = Boolean(regras?.personalizavel);
  const ativa = Boolean(form.watch(`${basePath}.personalizacao_ativa`));
  const modo = (form.watch(`${basePath}.personalizacao_modo`) as string) || '';
  const estampaId = (form.watch(`${basePath}.personalizacao_estampa_id`) as string) || '';
  const processoId = (form.watch(`${basePath}.personalizacao_processo_id`) as string) || '';
  const vdpModo = (form.watch(`${basePath}.personalizacao_vdp_modo`) as PersonalizacaoVdpModo) || 'INLINE';
  const valoresInline = (form.watch(`${basePath}.personalizacao_valores_campos`) as Record<string, string>) || {};
  const gradeLinhas = (form.watch(`${basePath}.personalizacao_grade_distribuicao`) as GradeDistribuicaoLinha[]) || [];

  const modosHabilitados = regras?.modos_habilitados ?? [];
  const permiteEstampa = modosHabilitados.includes('ESTAMPA');
  const permiteImprint = modosHabilitados.includes('IMPRINT_LIVRE');

  const estampaSelecionada = useMemo(
    () => regras?.estampas_permitidas?.find((e) => e.id === estampaId) ?? null,
    [regras?.estampas_permitidas, estampaId],
  );

  const processoSelecionado = useMemo(() => {
    if (modo === 'ESTAMPA') {
      return estampaSelecionada?.processo ?? null;
    }
    if (modo === 'IMPRINT_LIVRE') {
      return (
        regras?.processos_livres_permitidos?.find((p) => p.id === processoId) ?? null
      );
    }
    return null;
  }, [modo, estampaSelecionada, processoId, regras?.processos_livres_permitidos]);

  const camposVariaveis: CampoVariavelDefOrcamento[] = useMemo(() => {
    if (modo === 'ESTAMPA' && estampaSelecionada?.conjunto_campos?.campos?.length) {
      return estampaSelecionada.conjunto_campos.campos;
    }
    if (modo === 'IMPRINT_LIVRE') {
      return [CAMPO_TEXTO_IMPRINT];
    }
    return [];
  }, [modo, estampaSelecionada]);

  const gradeDef = regras?.grade_atributos_def ?? [];
  const exibirGrade = gradeDef.length > 0 && quantidadeTotal > 1;

  useEffect(() => {
    if (!exibirGrade) return;
    if (gradeLinhas.length > 0) return;
    const iniciais = construirLinhasGradeIniciais(gradeDef, quantidadeTotal);
    form.setValue(`${basePath}.personalizacao_grade_distribuicao`, iniciais, {
      shouldDirty: false,
    });
  }, [exibirGrade, gradeDef, quantidadeTotal, gradeLinhas.length, form, basePath]);

  const precoPreview = useMemo(() => {
    if (!ativa || !modo) {
      return {
        precoUnitarioProduto: precoBaseProduto,
        custoDecoracao: { setup: 0, unitarioFaixa: 0, total: 0 },
        precoTotalLinha: precoBaseProduto * quantidadeTotal,
      };
    }
    const precoAdicional = modo === 'ESTAMPA' ? Number(estampaSelecionada?.preco_adicional || 0) : 0;
    return calcularPrecoLinhaPersonalizada({
      precoBaseProduto,
      precoAdicionalEstampa: precoAdicional,
      quantidade: quantidadeTotal,
      processo: processoSelecionado,
    });
  }, [ativa, modo, precoBaseProduto, quantidadeTotal, estampaSelecionada, processoSelecionado]);

  useEffect(() => {
    form.setValue(
      `${basePath}.personalizacao_preco_total_linha`,
      String(precoPreview.precoTotalLinha.toFixed(2)),
      { shouldDirty: false },
    );
  }, [precoPreview.precoTotalLinha, form, basePath]);

  if (!personalizavel) {
    return null;
  }

  const atualizarValorCampo = (chave: string, valor: string) => {
    const atual = (form.getValues(`${basePath}.personalizacao_valores_campos`) as Record<string, string>) || {};
    form.setValue(
      `${basePath}.personalizacao_valores_campos`,
      { ...atual, [chave]: valor },
      { shouldDirty: true },
    );
  };

  const exibirVdp = quantidadeTotal > 1 && camposVariaveis.length > 0 && ativa && Boolean(modo);

  return (
    <div className="space-y-4 rounded-md border bg-background p-4">
      <FormField
        control={form.control}
        name={`${basePath}.personalizacao_ativa`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <FormLabel>Adicionar personalização a este item</FormLabel>
              <FormDescription>
                Estampa do catálogo ou personalização livre conforme o produto.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                disabled={somenteLeitura}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {ativa ? (
        <>
          <FormField
            control={form.control}
            name={`${basePath}.personalizacao_modo`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modo de personalização</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                    disabled={somenteLeitura}
                  >
                    {permiteEstampa ? (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="ESTAMPA" id={`modo-estampa-${itemIndex}`} />
                        <Label htmlFor={`modo-estampa-${itemIndex}`} className="flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4" />
                          Estampa do catálogo
                        </Label>
                      </div>
                    ) : null}
                    {permiteImprint ? (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="IMPRINT_LIVRE" id={`modo-imprint-${itemIndex}`} />
                        <Label htmlFor={`modo-imprint-${itemIndex}`} className="flex items-center gap-1.5">
                          <Paintbrush className="h-4 w-4" />
                          Personalização livre
                        </Label>
                      </div>
                    ) : null}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {modo === 'ESTAMPA' ? (
            <div className="space-y-2">
              <FormLabel>Selecione a estampa</FormLabel>
              <EstampaThumbGrid
                estampas={regras?.estampas_permitidas ?? []}
                selecionadaId={estampaId}
                disabled={somenteLeitura}
                onSelecionar={(id) => {
                  form.setValue(`${basePath}.personalizacao_estampa_id`, id, { shouldDirty: true });
                  form.setValue(`${basePath}.personalizacao_valores_campos`, {}, { shouldDirty: true });
                  form.setValue(`${basePath}.personalizacao_valores_campos_vdp`, [], { shouldDirty: true });
                }}
              />
            </div>
          ) : null}

          {modo === 'IMPRINT_LIVRE' ? (
            <FormField
              control={form.control}
              name={`${basePath}.personalizacao_processo_id`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo de decoração</FormLabel>
                  <Select
                    disabled={somenteLeitura}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o processo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(regras?.processos_livres_permitidos ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                          {p.codigo ? ` (${p.codigo})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {exibirGrade ? (
            <GradeDistribuicaoMini
              definicoes={gradeDef}
              linhas={gradeLinhas}
              quantidadeTotal={quantidadeTotal}
              disabled={somenteLeitura}
              onChange={(linhas) =>
                form.setValue(`${basePath}.personalizacao_grade_distribuicao`, linhas, {
                  shouldDirty: true,
                })
              }
            />
          ) : null}

          {camposVariaveis.length > 0 &&
          (modo !== 'ESTAMPA' || estampaId) &&
          (modo !== 'IMPRINT_LIVRE' || processoId) ? (
            <div className="space-y-3">
              <FormLabel>Conteúdo variável</FormLabel>
              {exibirVdp ? (
                <>
                  <VdpModoToggle
                    modo={vdpModo}
                    disabled={somenteLeitura}
                    onModoChange={(m) =>
                      form.setValue(`${basePath}.personalizacao_vdp_modo`, m, { shouldDirty: true })
                    }
                  />
                  {vdpModo === 'INLINE' ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Os mesmos valores serão aplicados a todas as {quantidadeTotal} unidades.
                      </p>
                      <CamposVariaveisInline
                        campos={camposVariaveis}
                        valores={valoresInline}
                        disabled={somenteLeitura}
                        prefixoId={`item-${itemIndex}`}
                        onChange={atualizarValorCampo}
                      />
                    </>
                  ) : (
                    <CsvColumnMapper
                      campos={camposVariaveis}
                      quantidadeEsperada={quantidadeTotal}
                      disabled={somenteLeitura}
                      onDadosMapeados={(linhas) =>
                        form.setValue(`${basePath}.personalizacao_valores_campos_vdp`, linhas, {
                          shouldDirty: true,
                        })
                      }
                    />
                  )}
                </>
              ) : (
                <CamposVariaveisInline
                  campos={camposVariaveis}
                  valores={valoresInline}
                  disabled={somenteLeitura}
                  prefixoId={`item-${itemIndex}`}
                  onChange={atualizarValorCampo}
                />
              )}
            </div>
          ) : null}

          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
            <p className="font-medium">Prévia de preço (personalização)</p>
            <p className="text-muted-foreground">
              Base unitária: {formatCurrency(precoPreview.precoUnitarioProduto)}
            </p>
            {precoPreview.custoDecoracao.total > 0 ? (
              <>
                <p className="text-muted-foreground">
                  Setup processo: {formatCurrency(precoPreview.custoDecoracao.setup)}
                </p>
                <p className="text-muted-foreground">
                  Decoração (faixa × qtd):{' '}
                  {formatCurrency(
                    precoPreview.custoDecoracao.unitarioFaixa * quantidadeTotal,
                  )}
                </p>
              </>
            ) : null}
            <p className="font-medium text-foreground">
              Total da linha: {formatCurrency(precoPreview.precoTotalLinha)}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function validarGradePersonalizacao(
  regras: CatalogoRegrasOrcamento | undefined,
  quantidadeTotal: number,
  gradeLinhas: GradeDistribuicaoLinha[] | undefined,
): string | null {
  const gradeDef = regras?.grade_atributos_def ?? [];
  if (!gradeDef.length || quantidadeTotal <= 1) return null;
  const soma = somaGradeDistribuicao(gradeLinhas ?? []);
  if (soma !== quantidadeTotal) {
    return `A soma da grade de atributos (${soma}) deve ser igual à quantidade total (${quantidadeTotal}).`;
  }
  return null;
}
