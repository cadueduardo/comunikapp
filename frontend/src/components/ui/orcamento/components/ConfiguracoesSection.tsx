'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface ConfiguracoesSectionProps {
  mode: 'novo' | 'editar' | 'template';
}

export function ConfiguracoesSection({ mode }: ConfiguracoesSectionProps) {
  const form = useFormContext();

  // Não mostrar se for template (produto)
  if (mode === 'template') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <CardTitle>Configurações Comerciais</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Margem de Lucro e Impostos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Condições Comerciais */}
        <FormField
          control={form.control}
          name="condicoes_comerciais"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condições Comerciais</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Digite as condições comerciais (prazo de pagamento, forma de pagamento, etc.)" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
} 