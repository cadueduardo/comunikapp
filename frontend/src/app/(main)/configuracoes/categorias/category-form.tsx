'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCategoriaValidation } from "@/hooks/use-categoria-validation";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const formSchema = z.object({
  nome: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
});

interface CategoryFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: z.infer<typeof formSchema>;
  isSubmitting: boolean;
  categoriaId?: string; // Para validação de edição
}

export function CategoryForm({ onSubmit, defaultValues, isSubmitting, categoriaId }: CategoryFormProps) {
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || { nome: "" },
  });

  const nome = form.watch('nome');
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // Hook de validação
  const { isValidating, validationMessage: hookMessage, isValid } = useCategoriaValidation({
    nome,
    categoriaId,
    token: token || '',
    onValidationChange: (isValid, message) => {
      setIsFormValid(isValid);
      setValidationMessage(message || '');
    },
  });

  // Atualizar mensagem de validação quando o hook mudar
  useEffect(() => {
    setValidationMessage(hookMessage);
  }, [hookMessage]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!isFormValid) {
      return;
    }
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Ex: Lonas e Adesivos" 
                    {...field} 
                    className={validationMessage ? 'border-red-500' : isValid ? 'border-green-500' : ''}
                  />
                  {isValidating && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {!isValidating && isValid && nome.trim() && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {!isValidating && validationMessage && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
              
              {/* Mensagem de validação personalizada */}
              {validationMessage && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationMessage}</AlertDescription>
                </Alert>
              )}
              
              {/* Mensagem de sucesso */}
              {!validationMessage && isValid && nome.trim() && (
                <Alert className="mt-2 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Nome disponível! Esta categoria pode ser cadastrada.
                  </AlertDescription>
                </Alert>
              )}
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={isSubmitting || !isFormValid || isValidating}
          className="w-full"
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
} 