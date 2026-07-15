"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Loader2,
  MapPin,
  Save,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

const optionalEmail = z.union([
  z.literal(""),
  z.string().email("Informe um e-mail válido."),
]);

export const fornecedorFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres."),
  razao_social: z.string().trim().optional(),
  cnpj_cpf: z.string().trim().optional(),
  tipo: z.enum(["INSUMO", "TERCEIRIZADO", "AMBOS"]),
  ativo: z.boolean(),
  contato_nome: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  email: optionalEmail,
  cep: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  numero: z.string().trim().optional(),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  estado: z.string().trim().max(2, "Use a sigla com 2 letras.").optional(),
  especialidades: z.array(z.string()),
});

export type FornecedorFormValues = z.infer<typeof fornecedorFormSchema>;

export interface FornecedorFormData extends Partial<FornecedorFormValues> {
  nome: string;
}

interface FornecedorFormProps {
  onSave: (values: FornecedorFormValues) => Promise<void>;
  onCancel?: () => void;
  initialData?: FornecedorFormData;
  loading?: boolean;
}

const especialidadesDisponiveis = [
  "Comunicação Visual",
  "Fachadas",
  "Serralheria",
  "Impressão UV",
  "Corte Router",
  "Instalação",
];

const normalizePayload = (values: FornecedorFormValues) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? undefined : value,
    ]),
  ) as FornecedorFormValues;

export function FornecedorForm({
  onSave,
  onCancel,
  initialData,
  loading = false,
}: FornecedorFormProps) {
  const [buscandoCep, setBuscandoCep] = useState(false);
  const form = useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorFormSchema),
    defaultValues: {
      nome: initialData?.nome ?? "",
      razao_social: initialData?.razao_social ?? "",
      cnpj_cpf: initialData?.cnpj_cpf ?? "",
      tipo: initialData?.tipo ?? "INSUMO",
      ativo: initialData?.ativo ?? true,
      contato_nome: initialData?.contato_nome ?? "",
      telefone: initialData?.telefone ?? "",
      whatsapp: initialData?.whatsapp ?? "",
      email: initialData?.email ?? "",
      cep: initialData?.cep ?? "",
      endereco: initialData?.endereco ?? "",
      numero: initialData?.numero ?? "",
      complemento: initialData?.complemento ?? "",
      bairro: initialData?.bairro ?? "",
      cidade: initialData?.cidade ?? "",
      estado: initialData?.estado ?? "",
      especialidades: initialData?.especialidades ?? [],
    },
  });
  const tipoSelecionado = form.watch("tipo");

  const buscarCep = async () => {
    const cep = (form.getValues("cep") ?? "").replace(/\D/g, "");
    if (cep.length !== 8) {
      toast.error("Informe um CEP com 8 dígitos.");
      return;
    }

    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`);

      const endereco = (await response.json()) as {
        erro?: boolean;
        cep?: string;
        logradouro?: string;
        complemento?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      if (endereco.erro) {
        toast.error("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }

      form.setValue("cep", endereco.cep ?? cep, { shouldValidate: true });
      form.setValue("endereco", endereco.logradouro ?? "", {
        shouldValidate: true,
      });
      form.setValue("complemento", endereco.complemento ?? "");
      form.setValue("bairro", endereco.bairro ?? "");
      form.setValue("cidade", endereco.localidade ?? "");
      form.setValue("estado", endereco.uf ?? "", { shouldValidate: true });
      toast.success("Endereço preenchido pelo CEP.");
    } catch (error) {
      console.error("Erro ao consultar ViaCEP:", error);
      toast.error(
        "Não foi possível consultar o CEP. Preencha o endereço manualmente.",
      );
    } finally {
      setBuscandoCep(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSave(normalizePayload(values)),
        )}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Dados gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome fantasia *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Gráfica Parceira" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="razao_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão social</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Razão social ou nome completo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cnpj_cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ ou CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-base">
                    O que este fornecedor oferece? *
                  </FormLabel>
                  <FormDescription>
                    Essa classificação define onde ele poderá ser selecionado
                    no sistema.
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-3 pt-2 md:grid-cols-3"
                    >
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                        <RadioGroupItem value="INSUMO" className="mt-1" />
                        <span>
                          <span className="block font-medium">
                            Vende insumos
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            Fornece materiais como lonas, chapas, tintas ou
                            ferragens.
                          </span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                        <RadioGroupItem
                          value="TERCEIRIZADO"
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium">
                            Executa terceirização
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            Produz ou instala itens e etapas de projetos para a
                            empresa.
                          </span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                        <RadioGroupItem value="AMBOS" className="mt-1" />
                        <span>
                          <span className="block font-medium">
                            Oferece ambos
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            Vende insumos e também executa serviços
                            terceirizados.
                          </span>
                        </span>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4 md:col-span-2">
                  <div>
                    <FormLabel className="text-base">Cadastro ativo</FormLabel>
                    <FormDescription>
                      Fornecedores inativos permanecem no histórico, mas não
                      devem ser usados em novos vínculos.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contato_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pessoa de contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do contato comercial" {...field} />
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
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contato@empresa.com.br"
                      {...field}
                    />
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
                    <Input placeholder="(11) 3333-4444" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormDescription>
                    Será usado para abrir uma conversa rápida na listagem.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-6">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>CEP</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={buscarCep}
                      disabled={buscandoCep}
                      aria-label="Buscar CEP"
                    >
                      {buscandoCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, avenida..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Galpão, sala..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
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
              name="cidade"
              render={({ field }) => (
                <FormItem>
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
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF</FormLabel>
                  <FormControl>
                    <Input maxLength={2} className="uppercase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {tipoSelecionado !== "INSUMO" && (
          <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Especialidades de terceirização
            </CardTitle>
            <FormDescription>
              Selecione os serviços produtivos ou de instalação executados
              pelo parceiro.
            </FormDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="especialidades"
              render={({ field }) => (
                <FormItem>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {especialidadesDisponiveis.map((especialidade) => {
                      const selecionada = field.value.includes(especialidade);
                      return (
                        <label
                          key={especialidade}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selecionada}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, especialidade]
                                  : field.value.filter(
                                      (item) => item !== especialidade,
                                    ),
                              )
                            }
                          />
                          <span className="text-sm font-medium">
                            {especialidade}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          </Card>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          ) : (
            <Button type="button" variant="outline" asChild>
              <Link href="/fornecedores">Cancelar</Link>
            </Button>
          )}
          <Button type="submit" disabled={loading || buscandoCep}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar fornecedor
          </Button>
        </div>
      </form>
    </Form>
  );
}
