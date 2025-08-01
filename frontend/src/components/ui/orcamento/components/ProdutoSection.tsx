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
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Package, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { calcularArea } from '../../shared/utils/calculo.utils';

interface ProdutoSectionProps {
  mode: 'novo' | 'editar' | 'template';
  onCarregarProduto?: (itemIndex: number) => void;
}

export function ProdutoSection({ onCarregarProduto }: ProdutoSectionProps) {
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

  const handleCalcularArea = (itemIndex: number) => {
    const largura = Number(form.watch(`itens_produto.${itemIndex}.largura_produto`));
    const altura = Number(form.watch(`itens_produto.${itemIndex}.altura_produto`));
    const unidade = form.watch(`itens_produto.${itemIndex}.unidade_medida_produto`);

    if (largura && altura && unidade) {
      const area = calcularArea(largura, altura, unidade);
      form.setValue(`itens_produto.${itemIndex}.area_produto`, area.toFixed(2));
      toast.success(`Área calculada: ${area.toFixed(2)} m²`);
    } else {
      toast.error('Preencha largura, altura e unidade de medida para calcular a área');
    }
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                            <FormControl>
                              <Input placeholder="cm, m, mm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-end space-x-2">
                        <FormField
                          control={form.control}
                          name={`itens_produto.${index}.area_produto`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Área (m²)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="text" 
                                  placeholder="0.00"
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
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcularArea(index)}
                          className="mb-2"
                        >
                          Calcular
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Botão Carregar Produto */}
                  {onCarregarProduto && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onCarregarProduto(index)}
                        className="flex items-center space-x-2"
                      >
                        <Loader2 className="w-4 h-4" />
                        <span>Carregar Produto</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 