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
              name="forma_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="50% entrada, restante na entrega"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 