'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useUser } from '@/contexts/UserContext';
import { configuracoesModuleNav } from '@/lib/module-nav';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { buildApiUrl } from '@/lib/config';
import { hasClientSession } from '@/lib/session-auth';

const formatPercentage = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: Number.isInteger(numberValue) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

const normalizePercentageInput = (value: string): string =>
  value.replace(/[^\d,.-]/g, '');

const parsePercentage = (value?: string): number | null => {
  if (value === undefined) return null;
  const cleaned = value.trim().replace(/\s/g, '').replace(/%/g, '');
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;

  if (normalized === '') return null;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const emptyToUndef = (v: string | undefined) => {
  const t = v?.trim();
  return t ? t : undefined;
};

const formSchema = z.object({
  nome: z.string().min(2, 'Informe o nome da loja'),
  razao_social: z.string().optional(),
  nome_fantasia: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(8, 'Informe o telefone'),
  documento_tipo: z.enum(['cnpj', 'cpf']),
  documento: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  slug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(48, 'Máximo 48 caracteres')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use apenas letras minúsculas, números e hífens',
    ),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  logo_url: z.string().optional(),
  cabecalho_orcamento: z.string().optional(),
  margem_lucro_padrao: z.string().optional(),
  impostos_padrao: z.string().optional(),
  comissao_padrao: z.string().optional(),
  horas_produtivas_mensais: z.string().optional(),
  tipo_margem_lucro: z.enum(['markup', 'margem_por_dentro']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ConfiguracoesLojaPage() {
  const { user, refetchUser, loading } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      razao_social: '',
      nome_fantasia: '',
      email: '',
      telefone: '',
      documento_tipo: 'cnpj',
      documento: '',
      inscricao_estadual: '',
      inscricao_municipal: '',
      slug: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      logo_url: '',
      cabecalho_orcamento: '',
      margem_lucro_padrao: '',
      impostos_padrao: '',
      comissao_padrao: '',
      horas_produtivas_mensais: '',
      tipo_margem_lucro: 'margem_por_dentro',
    },
  });

  useEffect(() => {
    if (!user?.loja) return;
    const { loja } = user;
    const hasCnpj = Boolean(loja.cnpj);
    form.reset({
      nome: loja.nome ?? '',
      razao_social: loja.razao_social ?? '',
      nome_fantasia: loja.nome_fantasia ?? loja.nome ?? '',
      email: loja.email ?? user.email ?? '',
      telefone: loja.telefone ?? user.telefone ?? '',
      documento_tipo: hasCnpj ? 'cnpj' : 'cpf',
      documento: (hasCnpj ? loja.cnpj : loja.cpf) ?? '',
      inscricao_estadual: loja.inscricao_estadual ?? '',
      inscricao_municipal: loja.inscricao_municipal ?? '',
      slug: loja.slug ?? '',
      cep: loja.cep ?? '',
      logradouro: loja.logradouro ?? '',
      numero: loja.numero ?? '',
      complemento: loja.complemento ?? '',
      bairro: loja.bairro ?? '',
      cidade: loja.cidade ?? '',
      uf: loja.uf ?? '',
      logo_url: loja.logo_url ?? '',
      cabecalho_orcamento: loja.cabecalho_orcamento ?? '',
      margem_lucro_padrao: formatPercentage(loja.margem_lucro_padrao),
      impostos_padrao: formatPercentage(loja.impostos_padrao),
      comissao_padrao: formatPercentage(loja.comissao_padrao),
      horas_produtivas_mensais: String(loja.horas_produtivas_mensais ?? 352),
      tipo_margem_lucro:
        loja.tipo_margem_lucro === 'markup' ? 'markup' : 'margem_por_dentro',
    });
  }, [user, form]);

  const slugWatch = form.watch('slug');
  const urlCanonico = useMemo(() => {
    if (!slugWatch) return '';
    return `https://${slugWatch}.comunikapp.com.br`;
  }, [slugWatch]);

  async function onSubmit(values: FormValues) {
    setIsSaving(true);
    let newLogoUrl: string | null = null;

    try {
      if (!hasClientSession()) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }

      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        const uploadResponse = await fetch(buildApiUrl('/lojas/logo'), {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!uploadResponse.ok) {
          const err = await uploadResponse.json().catch(() => ({}));
          throw new Error(err.message || 'Falha ao enviar o logo.');
        }
        const uploadResult = await uploadResponse.json();
        newLogoUrl = uploadResult.logo_url;
      }

      const cadastroPayload = {
        nome: values.nome.trim(),
        razao_social: emptyToUndef(values.razao_social) ?? null,
        nome_fantasia: emptyToUndef(values.nome_fantasia) ?? null,
        email: values.email.trim().toLowerCase(),
        telefone: values.telefone.trim(),
        slug: values.slug.trim().toLowerCase(),
        inscricao_estadual: emptyToUndef(values.inscricao_estadual) ?? null,
        inscricao_municipal: emptyToUndef(values.inscricao_municipal) ?? null,
        cep: emptyToUndef(values.cep) ?? null,
        logradouro: emptyToUndef(values.logradouro) ?? null,
        numero: emptyToUndef(values.numero) ?? null,
        complemento: emptyToUndef(values.complemento) ?? null,
        bairro: emptyToUndef(values.bairro) ?? null,
        cidade: emptyToUndef(values.cidade) ?? null,
        uf: emptyToUndef(values.uf)?.toUpperCase() ?? null,
        ...(values.documento_tipo === 'cnpj'
          ? { cnpj: emptyToUndef(values.documento) ?? null, cpf: null }
          : { cpf: emptyToUndef(values.documento) ?? null, cnpj: null }),
      };

      const cadastroRes = await fetch(buildApiUrl('/lojas/cadastro'), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cadastroPayload),
      });
      if (!cadastroRes.ok) {
        const err = await cadastroRes.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao salvar cadastro da loja.');
      }

      const configPayload = {
        logo_url: newLogoUrl ?? values.logo_url,
        cabecalho_orcamento: values.cabecalho_orcamento,
        margem_lucro_padrao: parsePercentage(values.margem_lucro_padrao),
        impostos_padrao: parsePercentage(values.impostos_padrao),
        comissao_padrao: parsePercentage(values.comissao_padrao),
        horas_produtivas_mensais: values.horas_produtivas_mensais
          ? Number(values.horas_produtivas_mensais)
          : null,
        tipo_margem_lucro: values.tipo_margem_lucro,
      };

      const configRes = await fetch(buildApiUrl('/lojas/configuracoes'), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configPayload),
      });
      if (!configRes.ok) {
        const err = await configRes.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao salvar parâmetros da loja.');
      }

      setSelectedFile(null);
      await refetchUser();
      toast.success('Configurações da loja salvas com sucesso!');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar configurações.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <ModuleHeader
        module={configuracoesModuleNav}
        title="Loja"
        description="Cadastro, endereço, URL canônica, branding e parâmetros de negócio."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Identidade e cadastro</h2>
              <p className="text-sm text-muted-foreground">
                Dados da empresa. Base para orçamentos e, no futuro, emissão de NF.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de exibição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nome_fantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Razão social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail da loja</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documento_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de documento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('documento_tipo') === 'cnpj' ? 'CNPJ' : 'CPF'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inscricao_estadual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição estadual</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Opcional" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inscricao_municipal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição municipal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Opcional" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Endereço</h2>
              <p className="text-sm text-muted-foreground">
                Preparado para futura integração fiscal / NF. Pode preencher agora.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-6">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logradouro"
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="complemento"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Acesso e URL</h2>
              <p className="text-sm text-muted-foreground">
                Defina o slug da loja. Em breve o login será neste endereço.
              </p>
            </div>
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (endereço)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, ''),
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    URL canônica (informativa):{' '}
                    <span className="font-mono text-foreground">
                      {urlCanonico || '—'}
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Domínio próprio (ex.: sistema.minhaloja.com.br) chegará em uma
              próxima etapa, com wizard de DNS no onboarding.
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Branding</h2>
              <p className="text-sm text-muted-foreground">
                Logo e cabeçalho usados em orçamentos e documentos.
              </p>
            </div>
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <ImageUpload
                  currentImageUrl={form.watch('logo_url') || undefined}
                  onFileSelect={setSelectedFile}
                />
              </FormControl>
            </FormItem>
            <FormField
              control={form.control}
              name="cabecalho_orcamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cabeçalho do orçamento</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Parâmetros de negócio</h2>
              <p className="text-sm text-muted-foreground">
                Padrões aplicados em novos orçamentos.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tipo_margem_lucro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="inline-flex items-center gap-1">
                      Tipo de margem
                      <InfoTooltip text="Markup (por fora) ou margem por dentro." />
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="margem_por_dentro">
                          Margem por dentro
                        </SelectItem>
                        <SelectItem value="markup">Markup</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="horas_produtivas_mensais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas produtivas mensais</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="margem_lucro_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margem de lucro (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(normalizePercentageInput(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="impostos_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impostos (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(normalizePercentageInput(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comissao_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão padrão (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(normalizePercentageInput(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando…' : 'Salvar configurações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
