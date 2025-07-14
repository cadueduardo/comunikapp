'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Check, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  tipo: z.string().min(1, 'Selecione um tipo de máquina.'),
  custo_hora: z.any().refine(val => Number(String(val).replace(/[^0-9,-]/g, '').replace(',', '.')) > 0, {
    message: 'O custo por hora deve ser maior que zero.',
  }),
  status: z.string().min(1, 'Selecione um status.'),
  capacidade: z.string().optional(),
  observacoes: z.string().optional(),
});

export type MaquinaFormValues = z.infer<typeof formSchema>;

interface MaquinaFormProps {
  onSave: (data: MaquinaFormValues) => Promise<void>;
  initialData?: {
    nome: string;
    tipo: string;
    custo_hora: number;
    status: string;
    capacidade?: string;
    observacoes?: string;
  };
  loading?: boolean;
}

// Lista extensa de tipos de máquinas para gráficas
const tiposMaquinas = [
  // Impressão Digital
  { value: 'PLOTTER_GRANDE_FORMATO', label: 'Plotter Grande Formato' },
  { value: 'IMPRESSORA_UV', label: 'Impressora UV' },
  { value: 'IMPRESSORA_LATEX', label: 'Impressora Latex' },
  { value: 'IMPRESSORA_SOLVENTE', label: 'Impressora Solvente' },
  { value: 'IMPRESSORA_ECO_SOLVENTE', label: 'Impressora Eco-Solvente' },
  { value: 'IMPRESSORA_DTG', label: 'Impressora DTG (Direct to Garment)' },
  { value: 'IMPRESSORA_SUBLIMACAO', label: 'Impressora Sublimação' },
  { value: 'IMPRESSORA_TERMICA', label: 'Impressora Térmica' },
  
  // Corte e Acabamento
  { value: 'PLOTTER_CORTE', label: 'Plotter de Corte' },
  { value: 'ROUTER_CNC', label: 'Router CNC' },
  { value: 'LASER_CO2', label: 'Laser CO2' },
  { value: 'LASER_FIBRA', label: 'Laser Fibra' },
  { value: 'CORTE_VINIL', label: 'Cortadora de Vinil' },
  { value: 'CORTE_PAPEL', label: 'Cortadora de Papel' },
  { value: 'CORTE_TECIDO', label: 'Cortadora de Tecido' },
  { value: 'DOBRADEIRA', label: 'Dobradeira' },
  { value: 'VINCO', label: 'Máquina de Vinco' },
  { value: 'REFRIGO', label: 'Refrigo' },
  
  // Acabamento e Laminagem
  { value: 'LAMINADORA', label: 'Laminadora' },
  { value: 'LAMINADORA_FRIA', label: 'Laminadora a Frio' },
  { value: 'LAMINADORA_QUENTE', label: 'Laminadora a Quente' },
  { value: 'ACABAMENTO', label: 'Máquina de Acabamento' },
  { value: 'VINCO_DOBRA', label: 'Vinco e Dobra' },
  { value: 'CORTE_ANGULO', label: 'Corte em Ângulo' },
  
  // Impressão Offset e Flexografia
  { value: 'OFFSET_PLANA', label: 'Offset Plana' },
  { value: 'OFFSET_ROTATIVA', label: 'Offset Rotativa' },
  { value: 'FLEXOGRAFIA', label: 'Flexografia' },
  { value: 'SERIGRAFIA', label: 'Serigrafia' },
  { value: 'TAMPOGRAFIA', label: 'Tampografia' },
  
  // Acabamento Especializado
  { value: 'FOIL_STAMPING', label: 'Foil Stamping' },
  { value: 'RELEVO', label: 'Máquina de Relevo' },
  { value: 'PERFURACAO', label: 'Perfuração' },
  { value: 'COSIDURA', label: 'Cosidura' },
  { value: 'ESPIRAL', label: 'Espiral' },
  { value: 'WIRE_O', label: 'Wire-O' },
  { value: 'ANEL', label: 'Anel' },
  
  // Encadernação
  { value: 'ENCADERNADORA', label: 'Encadernadora' },
  { value: 'GRAMPEADORA', label: 'Grampeadora' },
  { value: 'COLADEIRA', label: 'Coladeira' },
  { value: 'COSTURA', label: 'Máquina de Costura' },
  
  // Acabamento de Superfície
  { value: 'VERNIZ', label: 'Verniz' },
  { value: 'VERNIZ_UV', label: 'Verniz UV' },
  { value: 'VERNIZ_LOCALIZADO', label: 'Verniz Localizado' },
  { value: 'EMBOSSING', label: 'Embossing' },
  { value: 'DEBOSSING', label: 'Debossing' },
  
  // Equipamentos Auxiliares
  { value: 'SECADORA', label: 'Secadora' },
  { value: 'CURADORA_UV', label: 'Curadora UV' },
  { value: 'LAMINADOR', label: 'Laminador' },
  { value: 'CORTE_PRECISAO', label: 'Corte de Precisão' },
  { value: 'FURADEIRA', label: 'Furadeira' },
  { value: 'POLIDORA', label: 'Polidora' },
  
  // Equipamentos de Produção
  { value: 'MONTADORA', label: 'Montadora' },
  { value: 'EMBALADORA', label: 'Embaladora' },
  { value: 'ETIQUETADORA', label: 'Etiquetadora' },
  { value: 'SELADORA', label: 'Seladora' },
  { value: 'ENFARDADEIRA', label: 'Enfardadeira' },
  
  // Equipamentos de Qualidade
  { value: 'ESPECTROFOTOMETRO', label: 'Espectrofotômetro' },
  { value: 'DENSITOMETRO', label: 'Densitômetro' },
  { value: 'LUPAS', label: 'Lupas de Controle' },
  { value: 'MICROMETRO', label: 'Micrômetro' },
  
  // Equipamentos de Suporte
  { value: 'COMPRESSOR', label: 'Compressor' },
  { value: 'GERADOR', label: 'Gerador' },
  { value: 'AR_CONDICIONADO', label: 'Ar Condicionado Industrial' },
  { value: 'VENTILACAO', label: 'Sistema de Ventilação' },
  { value: 'EXAUSTAO', label: 'Sistema de Exaustão' },
  
  // Outros
  { value: 'OUTROS', label: 'Outros' },
];

// Componente Combobox com busca para tipo de máquina
function TipoMaquinaCombobox({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);

  const selectedTipo = tiposMaquinas.find(tipo => tipo.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedTipo ? selectedTipo.label : "Selecione o tipo..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar tipo de máquina..." />
          <CommandList>
            <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
            <CommandGroup>
              {tiposMaquinas.map((tipo) => (
                <CommandItem
                  key={tipo.value}
                  value={tipo.label}
                  onSelect={() => {
                    onValueChange(tipo.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === tipo.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tipo.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function MaquinaForm({ onSave, initialData, loading = false }: MaquinaFormProps) {
  const form = useForm<MaquinaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome: '',
      tipo: '',
      custo_hora: '',
      status: 'ATIVA',
      capacidade: '',
      observacoes: '',
    },
  });

  const onSubmit = async (values: MaquinaFormValues) => {
    await onSave(values);
  };

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <Link href="/configuracoes/maquinas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Máquinas
        </Link>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {initialData ? 'Editar Máquina' : 'Nova Máquina'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Máquina</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Plotter HP 1200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Máquina</FormLabel>
                      <FormControl>
                        <TipoMaquinaCombobox
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ATIVA">Ativa</SelectItem>
                          <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                          <SelectItem value="INATIVA">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custo_hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo por Hora (R$)</FormLabel>
                      <FormControl>
                        <CustomCurrencyInput
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Custo operacional por hora de uso da máquina.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="capacidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1200x2400mm, 300g/m²" {...field} />
                      </FormControl>
                      <FormDescription>
                        Especificações técnicas da máquina (tamanho, peso, etc.).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre a máquina..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Observações, configurações especiais ou notas importantes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Link href="/configuracoes/maquinas">
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Máquina'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 