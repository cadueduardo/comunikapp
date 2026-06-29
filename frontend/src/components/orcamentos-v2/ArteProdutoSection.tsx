'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormControl,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  FINALIDADE_ANEXO_OPCOES,
  OrigemItemServicoManual,
  POLITICA_COBRANCA_ARTE_OPCOES,
  PoliticaCobrancaArte,
  RESPONSABILIDADE_ARTE_OPCOES,
  ResponsabilidadeArte,
  arteRequerTrabalhoInterno,
} from '@/lib/arte-orcamento.constants';
import {
  fetchArteConfiguracaoLoja,
  fetchArteConfiguracaoStatus,
  syncArteProdutoOrcamento,
} from '@/lib/arte-orcamento-api';
import {
  resolverFinalidadeAnexoDefault,
  textoAjudaFinalidadeAnexo,
} from './arte-produto.helpers';

interface ArteProdutoSectionProps {
  itemIndex: number;
}

type ServicoFormulario = {
  servico_id?: string;
  horas_trabalhadas?: string;
  origem?: string;
  custo_hora?: number | string;
  custo_total?: number | string;
  descricao?: string;
};

function servicosManuaisParaSync(servicos: ServicoFormulario[] | undefined) {
  return (servicos || [])
    .filter((s) => s?.origem !== OrigemItemServicoManual.ARTE_AUTOMATICA)
    .filter((s) => s?.servico_id)
    .map((s) => ({
      servico_id: s.servico_id,
      horas_trabalhadas: s.horas_trabalhadas,
      tempo_horas: s.horas_trabalhadas,
      origem: OrigemItemServicoManual.MANUAL,
    }));
}

function separarServicosFormulario(servicos: ServicoFormulario[] | undefined) {
  const lista = servicos || [];
  return {
    automaticos: lista.filter(
      (s) => s?.origem === OrigemItemServicoManual.ARTE_AUTOMATICA,
    ),
    manuais: lista.filter(
      (s) => s?.origem !== OrigemItemServicoManual.ARTE_AUTOMATICA,
    ),
    rascunhos: lista.filter(
      (s) =>
        s?.origem !== OrigemItemServicoManual.ARTE_AUTOMATICA && !s?.servico_id,
    ),
  };
}

function servicoManualPadrao(): ServicoFormulario {
  return { servico_id: '', horas_trabalhadas: '1', origem: OrigemItemServicoManual.MANUAL };
}

function mapearServicosResposta(
  servicos: Array<Record<string, unknown>>,
): ServicoFormulario[] {
  return servicos.map((s) => ({
    servico_id: String(s.servico_id || ''),
    horas_trabalhadas: String(
      s.horas_trabalhadas ?? s.tempo_horas ?? '0',
    ),
    origem: s.origem ? String(s.origem) : OrigemItemServicoManual.MANUAL,
    custo_hora: s.custo_hora as number | string | undefined,
    custo_total: s.custo_total as number | string | undefined,
    descricao: s.descricao ? String(s.descricao) : undefined,
  }));
}

export function ArteProdutoSection({ itemIndex }: ArteProdutoSectionProps) {
  const form = useFormContext();
  const [alertaConfig, setAlertaConfig] = useState<string | undefined>();
  const [cobrancaPadrao, setCobrancaPadrao] = useState(
    PoliticaCobrancaArte.INCLUIDA_NO_PRODUTO,
  );
  const [sincronizando, setSincronizando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configCarregadaRef = useRef(false);
  const arteSyncInicialRef = useRef(true);

  const responsabilidade = useWatch({
    control: form.control,
    name: `itens_produto.${itemIndex}.responsabilidade_arte`,
  });
  const politica = useWatch({
    control: form.control,
    name: `itens_produto.${itemIndex}.politica_cobranca_arte`,
  });
  const finalidadeAnexo = useWatch({
    control: form.control,
    name: `itens_produto.${itemIndex}.finalidade_anexo`,
  });
  const arquivoGeometria = useWatch({
    control: form.control,
    name: `itens_produto.${itemIndex}.arquivo_geometria_url`,
  });
  const geometriaOrigem = useWatch({
    control: form.control,
    name: `itens_produto.${itemIndex}.geometria_origem`,
  });
  const servicos = useWatch({
    control: form.control,
    name: `itens_produto.${itemIndex}.servicos`,
  }) as ServicoFormulario[] | undefined;
  const arteHoras = useWatch({
    control: form.control,
    name: `itens_produto.${itemIndex}.arte_horas_calculadas`,
  });
  const arteCusto = useWatch({
    control: form.control,
    name: `itens_produto.${itemIndex}.arte_custo_calculado`,
  });

  const linhaAutomatica = (servicos || []).find(
    (s) => s?.origem === OrigemItemServicoManual.ARTE_AUTOMATICA,
  );

  useEffect(() => {
    if (configCarregadaRef.current) return;
    configCarregadaRef.current = true;

    void (async () => {
      try {
        const [status, config] = await Promise.all([
          fetchArteConfiguracaoStatus(),
          fetchArteConfiguracaoLoja(),
        ]);
        setAlertaConfig(status.configurado ? undefined : status.alerta);
        setCobrancaPadrao(config.cobranca_padrao);
      } catch {
        // Silencioso: banner é auxiliar
      }
    })();
  }, []);

  useEffect(() => {
    const url = String(arquivoGeometria || '').trim();
    if (!url) {
      const atual = form.getValues(`itens_produto.${itemIndex}.finalidade_anexo`);
      if (atual) {
        form.setValue(`itens_produto.${itemIndex}.finalidade_anexo`, '', {
          shouldDirty: true,
        });
      }
      return;
    }

    const resp =
      form.getValues(`itens_produto.${itemIndex}.responsabilidade_arte`) ||
      ResponsabilidadeArte.NAO_APLICAVEL;
    const atual = form.getValues(`itens_produto.${itemIndex}.finalidade_anexo`);
    if (atual) return;

    const sugerida = resolverFinalidadeAnexoDefault(
      resp,
      geometriaOrigem,
      null,
    );
    if (sugerida) {
      form.setValue(`itens_produto.${itemIndex}.finalidade_anexo`, sugerida, {
        shouldDirty: true,
      });
    }
  }, [arquivoGeometria, geometriaOrigem, responsabilidade, form, itemIndex]);

  const sincronizarArte = useCallback(async () => {
    const valores = form.getValues(`itens_produto.${itemIndex}`);
    const resp =
      valores?.responsabilidade_arte || ResponsabilidadeArte.NAO_APLICAVEL;
    const { manuais, rascunhos } = separarServicosFormulario(valores?.servicos);

    if (!arteRequerTrabalhoInterno(resp)) {
      const semAutomatico =
        manuais.length > 0 ? manuais : [servicoManualPadrao()];

      form.setValue(`itens_produto.${itemIndex}.servicos`, semAutomatico, {
        shouldDirty: true,
      });
      form.setValue(`itens_produto.${itemIndex}.arte_custo_automatico`, false);
      form.setValue(`itens_produto.${itemIndex}.arte_horas_calculadas`, null);
      form.setValue(`itens_produto.${itemIndex}.arte_custo_calculado`, null);
      form.setValue(
        `itens_produto.${itemIndex}.arte_referencia_servico_id`,
        null,
      );
      return;
    }

    setSincronizando(true);
    try {
      const resultado = await syncArteProdutoOrcamento({
        responsabilidade_arte: resp,
        politica_cobranca_arte:
          valores?.politica_cobranca_arte || cobrancaPadrao,
        finalidade_anexo: valores?.finalidade_anexo || null,
        complexidade_arte: valores?.complexidade_arte || null,
        servicos: servicosManuaisParaSync(valores?.servicos),
      });

      if (resultado.alertas?.length) {
        setAlertaConfig(resultado.alertas[0]);
      }

      form.setValue(
        `itens_produto.${itemIndex}.servicos`,
        [...mapearServicosResposta(resultado.servicos), ...rascunhos],
        { shouldDirty: true },
      );
      form.setValue(
        `itens_produto.${itemIndex}.arte_custo_automatico`,
        resultado.arte_custo_automatico,
      );
      form.setValue(
        `itens_produto.${itemIndex}.arte_horas_calculadas`,
        resultado.arte_horas_calculadas,
      );
      form.setValue(
        `itens_produto.${itemIndex}.arte_custo_calculado`,
        resultado.arte_custo_calculado,
      );
      form.setValue(
        `itens_produto.${itemIndex}.arte_referencia_servico_id`,
        resultado.arte_referencia_servico_id,
      );
    } catch (error) {
      console.error('Erro ao sincronizar arte:', error);
    } finally {
      setSincronizando(false);
    }
  }, [cobrancaPadrao, form, itemIndex]);

  useEffect(() => {
    if (arteSyncInicialRef.current) {
      arteSyncInicialRef.current = false;
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void sincronizarArte();
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [responsabilidade, politica, finalidadeAnexo, sincronizarArte]);

  const mostrarPolitica = arteRequerTrabalhoInterno(responsabilidade);
  const mostrarFinalidade = Boolean(arquivoGeometria?.trim());

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">Arte & Aprovação</h4>
        {sincronizando && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {alertaConfig && mostrarPolitica && (
        <Alert className="border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            {alertaConfig}
          </AlertDescription>
        </Alert>
      )}

      <FormField
        control={form.control}
        name={`itens_produto.${itemIndex}.responsabilidade_arte`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Responsabilidade da Arte</FormLabel>
            <Select
              value={field.value || ResponsabilidadeArte.NAO_APLICAVEL}
              onValueChange={(value) => {
                field.onChange(value);
                if (
                  arteRequerTrabalhoInterno(value) &&
                  !form.getValues(
                    `itens_produto.${itemIndex}.politica_cobranca_arte`,
                  )
                ) {
                  form.setValue(
                    `itens_produto.${itemIndex}.politica_cobranca_arte`,
                    cobrancaPadrao,
                  );
                }
                const url = String(
                  form.getValues(
                    `itens_produto.${itemIndex}.arquivo_geometria_url`,
                  ) || '',
                ).trim();
                if (url) {
                  const origem = form.getValues(
                    `itens_produto.${itemIndex}.geometria_origem`,
                  );
                  const sugerida = resolverFinalidadeAnexoDefault(
                    value,
                    origem,
                    null,
                  );
                  if (sugerida) {
                    form.setValue(
                      `itens_produto.${itemIndex}.finalidade_anexo`,
                      sugerida,
                      { shouldDirty: true },
                    );
                  }
                }
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {RESPONSABILIDADE_ARTE_OPCOES.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {mostrarPolitica && (
        <FormField
          control={form.control}
          name={`itens_produto.${itemIndex}.politica_cobranca_arte`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Política de cobrança</FormLabel>
              <Select
                value={field.value || cobrancaPadrao}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLITICA_COBRANCA_ARTE_OPCOES.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {mostrarFinalidade && (
        <FormField
          control={form.control}
          name={`itens_produto.${itemIndex}.finalidade_anexo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Finalidade do anexo</FormLabel>
              <Select
                value={field.value || ''}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a finalidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FINALIDADE_ANEXO_OPCOES.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {textoAjudaFinalidadeAnexo(field.value, responsabilidade) && (
                <p className="text-xs text-muted-foreground">
                  {textoAjudaFinalidadeAnexo(field.value, responsabilidade)}
                </p>
              )}
            </FormItem>
          )}
        />
      )}

      {linhaAutomatica && mostrarPolitica && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Criação de arte (automática)</span>
            <Badge variant="secondary">Sistema</Badge>
          </div>
          <p className="text-muted-foreground">
            {Number(arteHoras) || linhaAutomatica.horas_trabalhadas || 0} h ×{' '}
            {formatCurrency(
              Number(linhaAutomatica.custo_hora) ||
                Number(arteCusto) / Math.max(Number(arteHoras) || 1, 1),
            )}{' '}
            ={' '}
            {formatCurrency(
              Number(arteCusto) || Number(linhaAutomatica.custo_total) || 0,
            )}
          </p>
        </div>
      )}
    </div>
  );
}
