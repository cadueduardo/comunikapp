'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
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
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Package, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { MaterialSection, MaquinaSection, FuncaoSection } from '../../shared/sections';

interface ProdutoSectionProps {
  mode: 'novo' | 'editar' | 'template';
  onCarregarProduto?: (itemIndex: number) => void;
  insumos?: Array<{
    id: string;
    nome: string;
    unidade_compra: string;
    custo_unitario: number;
    quantidade_compra: number;
    unidade_uso: string;
    fator_conversao: number;
    categoria: { nome: string };
  }>;
  maquinas?: Array<{
    id: string;
    nome: string;
    tipo: string;
    custo_hora: number;
  }>;
  funcoes?: Array<{
    id: string;
    nome: string;
    custo_hora: number;
    maquina?: { nome: string };
  }>;
}

export function ProdutoSection({ onCarregarProduto, insumos = [], maquinas = [], funcoes = [] }: ProdutoSectionProps) {
  const form = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens_produto',
  });

  const handleAddProduto = () => {
    append({
      nome_servico: '',
      descricao: '',
      quantidade_produto: '1',
      largura_produto: '',
      altura_produto: '',
      unidade_medida_produto: '',
      area_produto: '',
      materiais: [{ insumo_id: '', quantidade: '1' }],
      maquinas: [{ maquina_id: '', horas_utilizadas: '1' }],
      funcoes: [{ funcao_id: '', horas_trabalhadas: '1' }],
    });
  };

  const handleRemoveProduto = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      toast.success('Produto removido');
    } else {
      toast.error('Deve haver pelo menos um produto');
    }
  };

  // Função para converter medidas para metros
  const converterParaMetros = (valor: number, unidade: string): number => {
    switch (unidade.toLowerCase()) {
      case 'mm':
        return valor / 1000;
      case 'cm':
        return valor / 100;
      case 'm':
        return valor;
      case 'm2':
        return valor;
      default:
        return valor;
    }
  };

  // Função para calcular área em m²
  const calcularArea = (largura: number, altura: number, unidade: string): number => {
    if (!largura || !altura) return 0;
    
    const larguraEmMetros = converterParaMetros(largura, unidade);
    const alturaEmMetros = converterParaMetros(altura, unidade);
    
    return larguraEmMetros * alturaEmMetros;
  };

  // Função para calcular área automaticamente
  const calcularAreaAutomatica = (itemIndex: number) => {
    const largura = Number(form.watch(`itens_produto.${itemIndex}.largura_produto`));
    const altura = Number(form.watch(`itens_produto.${itemIndex}.altura_produto`));
    const unidade = form.watch(`itens_produto.${itemIndex}.unidade_medida_produto`);

    if (largura && altura && unidade) {
      const area = calcularArea(largura, altura, unidade);
      form.setValue(`itens_produto.${itemIndex}.area_produto`, area.toFixed(2));
    } else {
      form.setValue(`itens_produto.${itemIndex}.area_produto`, '');
    }
  };

  // Função para calcular área total considerando quantidade
  const calcularAreaTotal = (itemIndex: number) => {
    const areaUnitaria = Number(form.watch(`itens_produto.${itemIndex}.area_produto`));
    const quantidade = Number(form.watch(`itens_produto.${itemIndex}.quantidade_produto`));
    
    if (areaUnitaria && quantidade) {
      return (areaUnitaria * quantidade).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Produtos</h2>
        </div>
        <Button
          type="button"
          onClick={handleAddProduto}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {fields.map((field, index) => (
          <AccordionItem key={field.id} value={`item-${index}`}>
            <Card>
              <AccordionTrigger className="px-6 py-4">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">
                      Produto {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {form.watch(`itens_produto.${index}.nome_servico`) || 'Sem nome'}
                    </span>
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProduto(index);
                    }}
                    className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6">
                                     {/* Informações do Produto */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                       control={form.control}
                       name={`itens_produto.${index}.nome_servico`}
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Nome do Produto</FormLabel>
                           <FormControl>
                             <Input placeholder="Digite o nome do produto" {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     
                     <FormField
                       control={form.control}
                       name={`itens_produto.${index}.quantidade_produto`}
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Quantidade</FormLabel>
                           <FormControl>
                             <Input 
                               type="text" 
                               placeholder="1"
                               {...field}
                               onChange={(e) => {
                                 const value = e.target.value.replace(/[^0-9,.-]/g, '');
                                 field.onChange(value);
                                 // Força re-render do disclaimer para atualizar área total
                                 setTimeout(() => form.trigger(`itens_produto.${index}.quantidade_produto`), 0);
                               }}
                             />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     {/* Botão Carregar Produto */}
                     {onCarregarProduto && (
                       <FormItem>
                         <FormLabel>&nbsp;</FormLabel>
                         <FormControl>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => onCarregarProduto(index)}
                             className="w-full flex items-center space-x-2"
                           >
                             <Loader2 className="w-4 h-4" />
                             <span>Carregar Produto</span>
                           </Button>
                         </FormControl>
                       </FormItem>
                     )}
                   </div>

                  <FormField
                    control={form.control}
                    name={`itens_produto.${index}.descricao`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Digite a descrição do produto" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Medidas do Produto */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Medidas do Produto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                             <FormField
                         control={form.control}
                         name={`itens_produto.${index}.largura_produto`}
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Largura</FormLabel>
                             <FormControl>
                               <Input 
                                 type="text" 
                                 placeholder="0.00"
                                 {...field}
                                 onChange={(e) => {
                                   const value = e.target.value.replace(/[^0-9,.-]/g, '');
                                   field.onChange(value);
                                   // Calcular área automaticamente
                                   setTimeout(() => calcularAreaAutomatica(index), 0);
                                 }}
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                      
                                             <FormField
                         control={form.control}
                         name={`itens_produto.${index}.altura_produto`}
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Altura</FormLabel>
                             <FormControl>
                               <Input 
                                 type="text" 
                                 placeholder="0.00"
                                 {...field}
                                 onChange={(e) => {
                                   const value = e.target.value.replace(/[^0-9,.-]/g, '');
                                   field.onChange(value);
                                   // Calcular área automaticamente
                                   setTimeout(() => calcularAreaAutomatica(index), 0);
                                 }}
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                      
                                                                     <FormField
                          control={form.control}
                          name={`itens_produto.${index}.unidade_medida_produto`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidade de Medida</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                setTimeout(() => calcularAreaAutomatica(index), 0);
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a unidade" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mm">Milímetros (mm)</SelectItem>
                                  <SelectItem value="cm">Centímetros (cm)</SelectItem>
                                  <SelectItem value="m">Metros (m)</SelectItem>
                                  <SelectItem value="un">Unidade (un)</SelectItem>
                                  <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      
                                             <FormField
                         control={form.control}
                         name={`itens_produto.${index}.area_produto`}
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Área (m²)</FormLabel>
                             <FormControl>
                               <Input 
                                 type="text" 
                                 placeholder="0.00"
                                 {...field}
                                 readOnly
                                 className="bg-muted"
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                    </div>
                    
                    {/* Disclaimer da Área Total */}
                    {form.watch(`itens_produto.${index}.area_produto`) && 
                     form.watch(`itens_produto.${index}.quantidade_produto`) && 
                     Number(form.watch(`itens_produto.${index}.quantidade_produto`)) > 1 && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <p className="text-blue-800 font-medium">
                              📐 Área Total (quantidade × área unitária):
                            </p>
                            <p className="text-blue-700">
                              {form.watch(`itens_produto.${index}.quantidade_produto`)} × {form.watch(`itens_produto.${index}.area_produto`)}m² = 
                              <span className="font-semibold text-blue-900 ml-1">
                                {calcularAreaTotal(index)}m²
                              </span>
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              ⚠️ Esta área total será considerada nos cálculos de tempo e materiais
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  

                  {/* Seções de Materiais, Máquinas e Funções */}
                  <div className="space-y-6">
                    {/* Materiais Utilizados */}
                    <MaterialSection
                      variant="orcamento"
                      itemIndex={index}
                      insumos={insumos}
                    />

                    {/* Máquinas Utilizadas */}
                    <MaquinaSection
                      variant="orcamento"
                      itemIndex={index}
                      maquinas={maquinas}
                    />

                    {/* Funções Utilizadas */}
                    <FuncaoSection
                      variant="orcamento"
                      itemIndex={index}
                      funcoes={funcoes}
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 