'use client';

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { CondicaoPagamentoFieldset } from './CondicaoPagamentoFieldset';
import { modalidadesEntregaApi } from '@/lib/api-client';

interface ConfiguracoesSectionProps {
  mode: 'novo' | 'editar' | 'template';
}

interface ModalidadeEntregaOption {
  id: string;
  nome: string;
  valor_padrao?: string | number | null;
  custo_padrao?: string | number | null;
  prazo_padrao_dias?: string | number | null;
}

export function ConfiguracoesSection({ mode }: ConfiguracoesSectionProps) {
  const form = useFormContext();
  const { user } = useUser();
  const [modalidadesEntrega, setModalidadesEntrega] = useState<ModalidadeEntregaOption[]>([]);
  const LABEL_SEM_ENTREGA = 'Sem entrega / retirada';

  const sincronizarNomeModalidadeEntrega = (modalidadeId: string) => {
    if (!modalidadeId?.trim()) {
      form.setValue('entrega_modalidade_nome', LABEL_SEM_ENTREGA, {
        shouldDirty: true,
      });
      return;
    }
    const modalidade = modalidadesEntrega.find((item) => item.id === modalidadeId);
    form.setValue('entrega_modalidade_nome', modalidade?.nome?.trim() || '', {
      shouldDirty: true,
    });
  };

  const usarEnderecoCliente = form.watch('entrega_usar_endereco_cliente') !== false;
  const produtos = (form.watch('itens_produto') || []) as Array<
    Record<string, unknown>
  >;
  const possuiLogisticaPorProduto = produtos.some((produto) =>
    Boolean(produto?.logistica_modo),
  );
  const padraoLojaLegend =
    user?.loja?.tipo_margem_lucro === 'markup'
      ? 'Padrão da loja: Markup (por fora)'
      : 'Padrão da loja: Margem por dentro';

  // Não mostrar se for template (produto)
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;
    if (!token) return;

    modalidadesEntregaApi
      .getAll(token, true)
      .then((data: unknown) => {
        const lista = Array.isArray(data)
          ? data
          : Array.isArray((data as { data?: unknown })?.data)
            ? (data as { data: ModalidadeEntregaOption[] }).data
            : [];
        setModalidadesEntrega(lista as ModalidadeEntregaOption[]);
      })
      .catch(() => setModalidadesEntrega([]));
  }, []);

  useEffect(() => {
    if (modalidadesEntrega.length === 0) return;
    const nomeAtual = String(form.getValues('entrega_modalidade_nome') || '').trim();
    if (nomeAtual) return;
    const modalidadeId = String(form.getValues('entrega_modalidade_id') || '').trim();
    sincronizarNomeModalidadeEntrega(modalidadeId);
  }, [modalidadesEntrega, form]);

  if (mode === 'template') {
    return null;
  }

  return (
    <Card flatOnMobile>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <CardTitle>Configurações Comerciais</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de margem e percentuais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="tipo_margem_lucro"
            render={({ field }) => (
              <FormItem>
                <InfoTooltip content="Por dentro: % sobre preço final. Markup: % sobre custo.">
                  <FormLabel>Tipo de margem de lucro</FormLabel>
                </InfoTooltip>
                <Select
                  onValueChange={(v) => field.onChange(v === 'padrao_loja' ? '' : v)}
                  value={field.value === '' || field.value == null ? 'padrao_loja' : field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Usar padrão da loja" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="padrao_loja">{padraoLojaLegend}</SelectItem>
                    <SelectItem value="margem_por_dentro">Margem por dentro</SelectItem>
                    <SelectItem value="markup">Markup (por fora)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="margem_lucro_customizada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Margem de Lucro (%)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="30"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,.-]/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="impostos_customizados"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impostos (%)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="18"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,.-]/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="valor_final_manual"
            render={({ field }) => (
              <FormItem>
                <InfoTooltip content="Opcional. Quando preenchido, este valor substitui o preco calculado para venda.">
                  <FormLabel>Valor Final (R$)</FormLabel>
                </InfoTooltip>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Ex: 1500,00"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,.-]/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Configurações Comerciais */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Condições Comerciais</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="prazo_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo de Entrega</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="10 a 15 dias úteis"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validade_proposta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade da Proposta</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="30 dias"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="atendente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atendente</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Equipe Comercial"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comissao_percentual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="5.0"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir apenas números, ponto e vírgula
                        if (value === '' || /^[0-9]+([,.][0-9]*)?$/.test(value)) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Bloco estruturado de Condicao de Pagamento (Fase 6) */}
          <CondicaoPagamentoFieldset mode={mode} />

          {possuiLogisticaPorProduto ? (
            <div className="space-y-3 border-t pt-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Resumo da logística
                </h3>
                <p className="text-xs text-muted-foreground">
                  A logística é definida em cada produto para evitar instruções
                  contraditórias.
                </p>
              </div>
              <div className="space-y-2">
                {produtos.map((produto, index) => {
                  const labels: Record<string, string> = {
                    RETIRADA_CLIENTE: 'Retirada pelo cliente',
                    ENTREGA_EMPRESA: 'Entrega pela empresa',
                    EQUIPE_INSTALACAO: 'Levado pela equipe de instalação',
                    ENTREGA_ANTES_INSTALACAO:
                      'Entrega antes e instalação posterior',
                    PARCEIRO_DIRETO: 'Envio direto pelo parceiro',
                  };
                  const modo = String(
                    produto.logistica_modo || 'RETIRADA_CLIENTE',
                  );
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">
                        {String(produto.nome_servico || `Produto ${index + 1}`)}
                      </span>
                      <span className="text-muted-foreground">
                        {labels[modo] || modo}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700">Entrega</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="entrega_modalidade_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade</FormLabel>
                    <Select
                      value={field.value || 'sem_entrega'}
                      onValueChange={(value) => {
                        const id = value === 'sem_entrega' ? '' : value;
                        field.onChange(id);
                        sincronizarNomeModalidadeEntrega(id);
                        const modalidade = modalidadesEntrega.find((item) => item.id === id);
                        if (!modalidade) return;
                        if (!form.getValues('entrega_valor_cobrado')) {
                          form.setValue(
                            'entrega_valor_cobrado',
                            modalidade.valor_padrao != null ? String(modalidade.valor_padrao) : '',
                          );
                        }
                        if (!form.getValues('entrega_custo_estimado')) {
                          form.setValue(
                            'entrega_custo_estimado',
                            modalidade.custo_padrao != null ? String(modalidade.custo_padrao) : '',
                          );
                        }
                        if (!form.getValues('entrega_prazo_dias')) {
                          form.setValue(
                            'entrega_prazo_dias',
                            modalidade.prazo_padrao_dias != null ? String(modalidade.prazo_padrao_dias) : '',
                          );
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sem entrega" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sem_entrega">Sem entrega / retirada</SelectItem>
                        {modalidadesEntrega.map((modalidade) => (
                          <SelectItem key={modalidade.id} value={modalidade.id}>
                            {modalidade.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entrega_valor_cobrado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor cobrado</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^0-9,.-]/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entrega_custo_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo estimado</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^0-9,.-]/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="entrega_usar_endereco_cliente"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded border p-3">
                    <FormControl>
                      <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="m-0">Usar endereço do cliente</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entrega_prazo_dias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo em dias</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Ex.: 2"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!usarEnderecoCliente && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="entrega_cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entrega_logradouro"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entrega_numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entrega_bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entrega_cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entrega_estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl><Input maxLength={2} {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="entrega_observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações da entrega</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
