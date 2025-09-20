'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, ArrowLeft, Package, User, Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { z } from 'zod';
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

// Schema de validação
const osSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  nome_servico: z.string().min(1, 'Nome do produto/serviço é obrigatório'),
  descricao: z.string().optional(),
  quantidade: z.number().min(0.001, 'Quantidade deve ser maior que zero'),
  largura_produto: z.number().optional(),
  altura_produto: z.number().optional(),
  unidade_medida_produto: z.string().optional(),
  data_prazo: z.string().optional(),
  responsavel_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type OSFormValues = z.infer<typeof osSchema>;

interface OSFormProps {
  mode: 'novo' | 'editar';
  initialData?: Record<string, unknown>;
  osId?: string;
  onSuccess?: () => void;
}

export function OSForm({ mode, initialData, osId, onSuccess }: OSFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  const form = useForm<OSFormValues>({
    resolver: zodResolver(osSchema),
    defaultValues: {
      cliente_id: '',
      nome_servico: '',
      descricao: '',
      quantidade: 1,
      largura_produto: undefined,
      altura_produto: undefined,
      unidade_medida_produto: 'm2',
      data_prazo: '',
      responsavel_id: '',
      observacoes: '',
    },
  });

  // Carregar dados necessários
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar clientes
        const clientesResponse = await apiRequest('/api/clientes');
        if (clientesResponse.ok) {
          const clientesData = await clientesResponse.json();
          setClientes(clientesData || []);
        }

        // Carregar usuários (responsáveis)
        const usuariosResponse = await apiRequest('/api/usuarios');
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          setUsuarios(usuariosData || []);
        }

        // Carregar dados iniciais se for edição
        if (mode === 'editar' && osId) {
          const osResponse = await apiRequest(`/api/os/${osId}`);
          if (osResponse.ok) {
            const osData = await osResponse.json();
            if (osData.success && osData.data) {
              const os = osData.data;
              form.reset({
                cliente_id: os.cliente_id,
                nome_servico: os.nome_servico,
                descricao: os.descricao || '',
                quantidade: os.quantidade,
                largura_produto: os.parametros_tecnicos?.largura,
                altura_produto: os.parametros_tecnicos?.altura,
                unidade_medida_produto: os.parametros_tecnicos?.unidade_medida || 'm2',
                data_prazo: os.data_prazo ? new Date(os.data_prazo).toISOString().split('T')[0] : '',
                responsavel_id: os.responsavel_id || '',
                observacoes: os.observacoes || '',
              });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados necessários');
      }
    };

    loadData();
  }, [mode, osId, form]);

  const onSubmit = async (values: OSFormValues) => {
    try {
      setLoading(true);

      // Preparar dados para envio
      const osData = {
        cliente_id: values.cliente_id,
        nome_servico: values.nome_servico,
        descricao: values.descricao,
        quantidade: values.quantidade,
        parametros_tecnicos: {
          largura: values.largura_produto,
          altura: values.altura_produto,
          area: values.largura_produto && values.altura_produto 
            ? values.largura_produto * values.altura_produto 
            : undefined,
          unidade_medida: values.unidade_medida_produto,
        },
        data_prazo: values.data_prazo || undefined,
        responsavel_id: values.responsavel_id || undefined,
        observacoes: values.observacoes,
      };

      // Enviar requisição
      const url = mode === 'novo' ? '/api/os' : `/api/os/${osId}`;
      const method = mode === 'novo' ? 'POST' : 'PATCH';

      const response = await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(osData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar OS');
      }

      const result = await response.json();
      
      toast.success(
        mode === 'novo' 
          ? `OS #${result.data.numero} criada com sucesso!`
          : 'OS atualizada com sucesso!'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/os');
      }
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar OS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Seção Produto/Serviço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produto/Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nome_servico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto/Serviço *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banner 3x2m - Lona 440g" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição detalhada do produto/serviço"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="largura_produto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largura</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="3.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="altura_produto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="2.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="unidade_medida_produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade de Medida</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="m2">Metro Quadrado (m²)</SelectItem>
                      <SelectItem value="ml">Metro Linear (ml)</SelectItem>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                      <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Seção Gestão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gestão e Prazos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_prazo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Limite</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usuarios
                          .filter(u => ['ADMINISTRADOR', 'PRODUCAO'].includes(u.funcao))
                          .map((usuario) => (
                            <SelectItem key={usuario.id} value={usuario.id}>
                              {usuario.nome_completo} ({usuario.funcao})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                      placeholder="Observações gerais sobre a OS"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/os')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading 
              ? (mode === 'novo' ? 'Criando...' : 'Salvando...') 
              : (mode === 'novo' ? 'Criar OS' : 'Salvar Alterações')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
