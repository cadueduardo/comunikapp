import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface TituloOrcamentoSectionProps {
  modo: 'novo' | 'editar' | 'template';
}

export function TituloOrcamentoSection({ modo }: TituloOrcamentoSectionProps) {
  const form = useFormContext();

  if (modo === 'template') {
    return null;
  }

  const isEdicao = modo === 'editar';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Título do Orçamento</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do orçamento</FormLabel>
              <FormDescription>
                Esse nome aparecerá na listagem e ajuda a localizar o rascunho rapidamente.
              </FormDescription>
              <FormControl>
                <Input
                  placeholder={isEdicao ? 'Manter título existente ou atualizar' : 'Ex: Projeto fachada loja XPTO'}
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
