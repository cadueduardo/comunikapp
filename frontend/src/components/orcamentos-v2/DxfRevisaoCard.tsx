'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Info, Layers, Package2, Plus, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Estrutura devolvida pelo backend (`DxfParserService.parse`) — replicada
 * aqui em TypeScript para o frontend consumir sem dependência circular.
 *
 * Mantenha em sincronia com `backend/src/orcamentos-v2/services/dxf-parser.service.ts`
 * (interface `DxfExtraido`).
 */
export interface DxfExtraido {
  versao_parser: string;
  nome_projeto: string | null;
  descricao_projeto: string | null;
  unidade_origem: 'mm' | 'cm' | 'm' | 'pol' | 'pe' | 'desconhecida';
  largura_mm: number | null;
  altura_mm: number | null;
  area_mm2: number | null;
  area_origem: 'POLIGONO_FECHADO' | 'BOUNDING_BOX' | null;
  perimetro_total_mm: number;
  camadas: Array<{
    nome: string;
    perimetro_mm: number;
    quantidade_entidades: number;
  }>;
  camada_sugerida: string | null;
  alertas: string[];
}

/**
 * Resultado retornado pelo card quando o operador clica em "Aplicar ao
 * produto". Sempre devolve valores em mm (a conversão para a unidade do
 * formulário é responsabilidade do caller).
 */
export interface AplicarMedidasDxf {
  largura_mm: number;
  altura_mm: number;
  area_mm2: number;
  perimetro_mm: number;
  camada_perimetro: string | null;
  origem_area: 'POLIGONO_FECHADO' | 'BOUNDING_BOX';
}

/**
 * Sugestão de insumo para uma camada do DXF. Replicada do backend
 * (`DxfSugestaoInsumoService`); mantenha em sincronia.
 */
export interface SugestaoInsumoCamada {
  insumo_id: string;
  insumo_nome: string;
  tipo_material_nome: string | null;
  categoria_nome: string | null;
  score: number;
  tokens_match: string[];
  motivo: 'NOME_INSUMO' | 'TIPO_MATERIAL' | 'CATEGORIA';
}

export interface SugestoesPorCamada {
  nome_camada: string;
  sugestoes: SugestaoInsumoCamada[];
  /**
   * Sub-fase 7.B+++: marca camadas cujo nome é puramente operação
   * (CORTE/GRAVACAO/DOBRA/etc.) — sem tokens de material após filtrar
   * stop-words. Para essas, esconder "Cadastrar novo" e orientar o
   * operador a renomear a camada no DXF.
   */
  apenas_operacao?: boolean;
}

interface DxfRevisaoCardProps {
  dados: DxfExtraido;
  /**
   * Sugestões de insumo para cada camada do DXF. Calculadas pelo backend a
   * partir do catálogo da loja. Quando vazio, a seção "Materiais sugeridos"
   * não é renderizada.
   */
  sugestoesInsumo?: SugestoesPorCamada[];
  /**
   * Disparado quando o operador confirma a aplicação. O caller decide o
   * que fazer com os valores (em `ProdutoSection.tsx` invocamos
   * `atualizarGeometria`).
   */
  onAplicar: (medidas: AplicarMedidasDxf) => void;
  /**
   * Disparado quando o operador clica em "Cadastrar novo insumo" em uma
   * camada (sub-fase 7.B++). O caller é responsável por abrir o modal
   * compacto de cadastro, pré-preenchido com o nome da camada limpo.
   *
   * Quando omitido, a seção "Materiais por camada" não é renderizada
   * (decisão de produto da 7.B++++: a UI de sugestões heurísticas foi
   * removida por gerar muitos falsos positivos; resta apenas o caminho
   * de cadastrar um insumo novo a partir da camada de material).
   */
  onCadastrarNovoInsumo?: (args: {
    nome_camada: string;
    nome_sugerido: string;
  }) => void;
  /**
   * Disparado quando o operador clica em "Ignorar". O caller pode esconder
   * o card ou marcá-lo como dispensado para esta sessão.
   */
  onIgnorar: () => void;
}

/**
 * Card "Valores detectados no DXF" exibido logo abaixo do `AnexoGeometriaInput`
 * quando o backend devolve `dxf_extraido` não nulo.
 *
 * Política de produto (Sub-fase 7.B):
 *  - O card NUNCA aplica valores automaticamente. Mostra o que foi extraído
 *    e exige clique em "Aplicar ao produto".
 *  - A camada padrão para perímetro é a "CORTE" (ou a primeira encontrada)
 *    mas o operador pode trocar.
 *  - Quando há alertas (ex.: área via bounding box), eles são exibidos em
 *    destaque para que o operador saiba que pode precisar ajustar.
 */
export function DxfRevisaoCard({
  dados,
  sugestoesInsumo,
  onAplicar,
  onCadastrarNovoInsumo,
  onIgnorar,
}: DxfRevisaoCardProps) {
  const [camadaSelecionada, setCamadaSelecionada] = useState<string | null>(
    dados.camada_sugerida || dados.camadas[0]?.nome || null,
  );

  const camadaAtual = useMemo(
    () => dados.camadas.find((c) => c.nome === camadaSelecionada) || null,
    [dados.camadas, camadaSelecionada],
  );

  // Lista de blocos a renderizar na seção "Materiais por camada".
  // - Se `onCadastrarNovoInsumo` está habilitado: mostra TODAS as camadas
  //   (apenas_operacao recebe mensagem orientativa; demais recebem botão
  //   "Cadastrar novo").
  // - Caso contrário: omite a seção inteira (sem callback, nada útil para
  //   exibir já que a UI de sugestões da heurística foi removida na 7.B++++).
  const blocosDeCamada = useMemo(() => {
    if (!onCadastrarNovoInsumo) return [];
    return sugestoesInsumo || [];
  }, [sugestoesInsumo, onCadastrarNovoInsumo]);

  /**
   * Limpa o nome da camada para sugerir como nome do insumo: remove os
   * prefixos comuns de operação (`CORTE_`, `GRAVACAO_`, `CUT_`, etc.) e
   * troca `_`/`-` por espaços. Mantém capitalização original.
   */
  const sugerirNomeInsumoApartirDaCamada = (nomeCamada: string): string => {
    return nomeCamada
      .replace(
        /^(corte|cortes|gravacao|gravação|cut|cutting|engrave|engraving|dobra|vinco|furo|contorno)[_\-\s]+/i,
        '',
      )
      .replace(/[_\-]+/g, ' ')
      .trim();
  };

  const podeAplicar =
    !!camadaAtual &&
    dados.largura_mm !== null &&
    dados.altura_mm !== null &&
    dados.area_mm2 !== null &&
    dados.area_origem !== null;

  const formatarMm = (valor: number | null): string => {
    if (valor === null || !Number.isFinite(valor)) return '—';
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mm`;
  };

  const formatarAreaM2 = (valorMm2: number | null): string => {
    if (valorMm2 === null || !Number.isFinite(valorMm2)) return '—';
    const m2 = valorMm2 / 1_000_000;
    return `${m2.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} m²`;
  };

  const handleAplicar = () => {
    if (!podeAplicar || !camadaAtual) return;
    onAplicar({
      largura_mm: dados.largura_mm!,
      altura_mm: dados.altura_mm!,
      area_mm2: dados.area_mm2!,
      perimetro_mm: camadaAtual.perimetro_mm,
      camada_perimetro: camadaAtual.nome,
      origem_area: dados.area_origem!,
    });
  };

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Ruler className="h-4 w-4" />
          <span>Valores detectados no DXF</span>
        </div>
        {dados.nome_projeto ? (
          <span className="text-xs text-muted-foreground truncate max-w-[14rem]">
            Projeto: {dados.nome_projeto}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Largura</p>
          <p className="font-medium">{formatarMm(dados.largura_mm)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Altura</p>
          <p className="font-medium">{formatarMm(dados.altura_mm)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Área</p>
          <p className="font-medium">{formatarAreaM2(dados.area_mm2)}</p>
          {dados.area_origem === 'BOUNDING_BOX' ? (
            <p className="text-[10px] text-amber-700">aprox. (envolvente)</p>
          ) : dados.area_origem === 'POLIGONO_FECHADO' ? (
            <p className="text-[10px] text-emerald-700">polígono fechado</p>
          ) : null}
        </div>
        <div>
          <p className="text-muted-foreground">Perímetro (camada)</p>
          <p className="font-medium">
            {camadaAtual ? formatarMm(camadaAtual.perimetro_mm) : '—'}
          </p>
        </div>
      </div>

      {dados.camadas.length > 0 ? (
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Camadas do DXF (selecione qual usar para o perímetro)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dados.camadas.map((camada) => {
              const ativa = camadaSelecionada === camada.nome;
              return (
                <button
                  key={camada.nome}
                  type="button"
                  onClick={() => setCamadaSelecionada(camada.nome)}
                  className={[
                    'rounded border px-2 py-1 text-xs transition-colors',
                    ativa
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 hover:border-muted-foreground/60',
                  ].join(' ')}
                >
                  <span className="font-medium">{camada.nome}</span>
                  <span className="ml-1 text-muted-foreground">
                    ({formatarMm(camada.perimetro_mm)})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {dados.alertas.length > 0 ? (
        <div className="rounded bg-amber-50 border border-amber-200 p-2">
          <div className="flex items-start gap-2 text-amber-900">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <ul className="text-xs space-y-0.5 list-disc list-inside">
              {dados.alertas.map((alerta, idx) => (
                <li key={idx}>{alerta}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/*
        Sub-fase 7.B++++: a UI de "Materiais sugeridos" foi removida.
        Decisão de produto (registrada na seção 4.21 do HANDOFF):
        - A heurística atual gera muitos falsos positivos quando o catálogo
          tem poucos materiais ou quando os tokens da camada/descrição são
          genéricos (`3mm`, `de`, `designer`, etc.).
        - Em vez de listar matches duvidosos, o card agora só oferece o
          caminho de cadastrar um insumo novo a partir da camada.
        - Backend continua calculando `sugestoes_insumo` (não custa caro
          e mantém os hooks intactos para um futuro "modo avançado"), mas
          o frontend ignora a lista e usa só o flag `apenas_operacao` para
          decidir entre "Cadastrar novo" (material) e mensagem orientativa
          (operação).
      */}
      {blocosDeCamada.length > 0 && onCadastrarNovoInsumo ? (
        <div className="rounded bg-emerald-50/50 border border-emerald-200 p-2 space-y-2">
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-900">
            <Package2 className="h-3.5 w-3.5" />
            <span>Materiais por camada</span>
          </div>
          <p className="text-[11px] text-emerald-900/80">
            Cada camada do DXF que representa um material pode virar insumo no
            seu catálogo. Camadas de operação (corte/gravação) são apenas
            instruções para a máquina.
          </p>
          {blocosDeCamada.map((porCamada) => {
            const nomeSugerido = sugerirNomeInsumoApartirDaCamada(
              porCamada.nome_camada,
            );
            const camadaJaCadastrada = (porCamada.sugestoes?.length || 0) > 0;
            return (
              <div
                key={porCamada.nome_camada}
                className="rounded bg-white border border-emerald-100 p-2"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold">
                    Camada{' '}
                    <span className="text-primary">
                      {porCamada.nome_camada}
                    </span>
                    {porCamada.apenas_operacao ? (
                      <span className="ml-2 inline-block rounded bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[10px] font-medium">
                        operação
                      </span>
                    ) : camadaJaCadastrada ? (
                      <span className="ml-2 inline-block rounded bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-medium">
                        cadastrado
                      </span>
                    ) : null}
                  </p>
                  {/*
                    Sub-fase 7.B+++: esconde "Cadastrar novo" em camadas
                    que são puramente operação (CORTE/GRAVACAO/etc.) —
                    não faz sentido criar um insumo chamado "CORTE".
                  */}
                  {!porCamada.apenas_operacao && !camadaJaCadastrada ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onCadastrarNovoInsumo({
                          nome_camada: porCamada.nome_camada,
                          nome_sugerido: nomeSugerido,
                        })
                      }
                      className="h-6 px-2 gap-1 text-[11px]"
                    >
                      <Plus className="h-3 w-3" />
                      Cadastrar novo
                    </Button>
                  ) : camadaJaCadastrada ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled
                      className="h-6 px-2 gap-1 text-[11px]"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Cadastrado
                    </Button>
                  ) : null}
                </div>
                {porCamada.apenas_operacao ? (
                  <p className="text-[10px] text-muted-foreground italic">
                    Esta camada parece ser <strong>apenas uma operação</strong>{' '}
                    que a máquina executa (corte / gravação / dobra). Para
                    sugerir um material automaticamente, renomeie a camada no
                    DXF incluindo o material — ex.:{' '}
                    <code className="bg-slate-100 px-1 rounded">
                      ACRILICO_3MM_CRISTAL
                    </code>{' '}
                    ou{' '}
                    <code className="bg-slate-100 px-1 rounded">
                      ACM_3MM_BRANCO_CORTE
                    </code>
                    . Você ainda pode adicionar materiais manualmente em
                    &quot;Materiais Utilizados&quot;.
                  </p>
                ) : camadaJaCadastrada ? (
                  <p className="text-[10px] text-emerald-800 italic">
                    Material encontrado no catálogo. Já foi sugerido/atrelado
                    automaticamente no produto.
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">
                    Se o material desta camada ainda não está no catálogo,
                    clique em &quot;Cadastrar novo&quot;. Caso já exista,
                    atrele manualmente em &quot;Materiais Utilizados&quot; logo
                    abaixo.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onIgnorar}
        >
          Ignorar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleAplicar}
          disabled={!podeAplicar}
          className="gap-1"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aplicar ao produto
        </Button>
      </div>
    </div>
  );
}
