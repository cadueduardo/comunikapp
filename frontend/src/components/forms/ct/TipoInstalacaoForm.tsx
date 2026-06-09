'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Textarea } from '@/components/ui/textarea';

const regrasCobranca = [
  { value: 'FIXO', label: 'Valor fixo' },
  { value: 'POR_M2', label: 'Por m² instalado' },
  { value: 'POR_ML', label: 'Por metro linear' },
  { value: 'POR_UNIDADE', label: 'Por unidade' },
  { value: 'POR_HORA', label: 'Por hora/equipe' },
  { value: 'MANUAL', label: 'Manual' },
] as const;

const precoPadraoLabels: Record<(typeof regrasCobranca)[number]['value'], string> = {
  FIXO: 'Preço padrão cobrado (R$)',
  POR_M2: 'Preço por m² instalado (R$)',
  POR_ML: 'Preço por metro linear instalado (R$)',
  POR_UNIDADE: 'Preço por unidade instalada (R$)',
  POR_HORA: 'Preço por hora/equipe (R$)',
  MANUAL: 'Preço padrão sugerido (R$)',
};

const formSchema = z.object({
  nome: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  exige_endereco: z.boolean(),
  exige_agendamento: z.boolean(),
  regra_cobranca: z.enum(['FIXO', 'POR_M2', 'POR_ML', 'POR_UNIDADE', 'POR_HORA', 'MANUAL']),
  preco_padrao: z.string().optional(),
  custo_mao_obra_padrao: z.string().optional(),
  custo_deslocamento_padrao: z.string().optional(),
  tempo_estimado_min: z.string().optional(),
  quantidade_pessoas_padrao: z.string().optional(),
  observacoes_padrao: z.string().optional(),
});

export type TipoInstalacaoFormValues = z.infer<typeof formSchema>;

interface TipoInstalacaoFormProps {
  onSave: (data: TipoInstalacaoFormValues) => Promise<void>;
  initialData?: Partial<TipoInstalacaoFormValues>;
  loading?: boolean;
}

export function TipoInstalacaoForm({
  onSave,
  initialData,
  loading = false,
}: TipoInstalacaoFormProps) {
  const form = useForm<TipoInstalacaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome ?? '',
      descricao: initialData?.descricao ?? '',
      ativo: initialData?.ativo ?? true,
      exige_endereco: initialData?.exige_endereco ?? true,
      exige_agendamento: initialData?.exige_agendamento ?? false,
      regra_cobranca: initialData?.regra_cobranca ?? 'FIXO',
      preco_padrao: initialData?.preco_padrao ?? '',
      custo_mao_obra_padrao: initialData?.custo_mao_obra_padrao ?? '',
      custo_deslocamento_padrao: initialData?.custo_deslocamento_padrao ?? '',
      tempo_estimado_min: initialData?.tempo_estimado_min ?? '',
      quantidade_pessoas_padrao: initialData?.quantidade_pessoas_padrao ?? '',
      observacoes_padrao: initialData?.observacoes_padrao ?? '',
    },
  });
  const regraSelecionada = form.watch('regra_cobranca');

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <Link
          href="/centros-de-trabalho/tipos-instalacao"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Tipos de Instalação
        </Link>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {initialData ? 'Editar Tipo de Instalação' : 'Novo Tipo de Instalação'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Nome que aparecerá na seleção de instalação dentro do produto do orçamento. Use algo simples e reconhecível pela equipe.">
                        <FormLabel>Nome</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input placeholder="Ex.: Aplicação simples, instalação em fachada" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="regra_cobranca"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Define como a instalação será cobrada no orçamento. Os modos por m², metro linear, unidade e hora usam as medidas e quantidades descritas no produto do orçamento.">
                        <FormLabel>Regra de cobrança</FormLabel>
                      </InfoTooltip>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a regra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regrasCobranca.map((regra) => (
                            <SelectItem key={regra.value} value={regra.value}>
                              {regra.label}
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
                  name="preco_padrao"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Valor comercial sugerido para o orçamento. Ele entra como padrão ao selecionar este tipo de instalação, mas pode ser alterado no produto do orçamento quando houver uma condição específica.">
                        <FormLabel>
                          {precoPadraoLabels[regraSelecionada] ?? 'Preço padrão cobrado (R$)'}
                        </FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^0-9,.-]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custo_mao_obra_padrao"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Custo interno sugerido da equipe para esta instalação. No orçamento ele é preenchido como padrão, mas pode ser ajustado produto a produto.">
                        <FormLabel>Custo padrão de mão de obra (R$)</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^0-9,.-]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custo_deslocamento_padrao"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Custo interno padrão de deslocamento da equipe. Ele é aplicado como valor fixo na instalação e pode ser alterado no orçamento.">
                        <FormLabel>Custo padrão de deslocamento (R$)</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^0-9,.-]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tempo_estimado_min"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Tempo padrão previsto para executar este tipo de instalação, em minutos. O orçamento recebe esse valor como sugestão e permite ajuste.">
                        <FormLabel>Tempo estimado (min)</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input
                          placeholder="Ex.: 90"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^0-9]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantidade_pessoas_padrao"
                  render={({ field }) => (
                    <FormItem>
                      <InfoTooltip content="Quantidade sugerida de pessoas para a equipe de instalação. No orçamento esse número pode ser alterado conforme o serviço.">
                        <FormLabel>Quantidade padrão de pessoas</FormLabel>
                      </InfoTooltip>
                      <FormControl>
                        <Input
                          placeholder="Ex.: 2"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^0-9]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  [
                    'ativo',
                    'Ativo',
                    'Quando desativado, este tipo deixa de aparecer para novos orçamentos, sem apagar o histórico.',
                  ],
                  [
                    'exige_endereco',
                    'Exige endereço',
                    'Use quando a instalação precisa de um local definido. No orçamento o produto pode usar o endereço de entrega ou informar outro endereço.',
                  ],
                  [
                    'exige_agendamento',
                    'Exige agendamento',
                    'Use quando este tipo de instalação precisa ser combinado com o cliente ou reservado na operação. O orçamento sinaliza essa necessidade ao selecionar o tipo.',
                  ],
                ].map(([name, label, info]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof TipoInstalacaoFormValues}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded border p-3">
                        <FormControl>
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <InfoTooltip content={info}>
                          <FormLabel className="m-0">{label}</FormLabel>
                        </InfoTooltip>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <FormField
                control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                    <InfoTooltip content="Descrição interna para orientar a equipe sobre quando usar este tipo de instalação. Não é o texto comercial do orçamento.">
                      <FormLabel>Descrição</FormLabel>
                    </InfoTooltip>
                    <FormControl>
                      <Textarea placeholder="Detalhes internos sobre este tipo de instalação..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes_padrao"
                render={({ field }) => (
                  <FormItem>
                    <InfoTooltip content="Texto sugerido para levar ao orçamento quando este tipo for usado. Pode ser editado no orçamento conforme o produto.">
                      <FormLabel>Observações padrão</FormLabel>
                    </InfoTooltip>
                    <FormControl>
                      <Textarea placeholder="Texto padrão para orçamentos..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Link href="/centros-de-trabalho/tipos-instalacao">
                  <Button variant="outline" type="button">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Tipo de Instalação'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
