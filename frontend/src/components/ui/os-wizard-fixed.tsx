'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { TipoOS } from './os-type-selector';
import { 
  User, 
  Package, 
  Settings, 
  Wrench, 
  Users as UsersIcon, 
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-react';

// Schema base para OS
const baseOSSchema = z.object({
  nome_servico: z.string().min(1, 'Nome do serviço é obrigatório'),
  descricao: z.string().optional(),
  quantidade: z.number().min(0.001, 'Quantidade deve ser maior que zero'),
  data_prazo: z.string().optional(),
  responsavel_id: z.string().optional(),
  observacoes: z.string().optional(),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
});

// Schema para OS Comercial
const comercialSchema = baseOSSchema.extend({
  tipo_os: z.literal('COMERCIAL'),
  cliente_id: z.string().min(1, 'Cliente é obrigatório para OS Comercial'),
  orcamento_id: z.string().optional(),
  valor_orcado: z.number().optional(),
  valor_realizado: z.number().optional(),
  data_entrega_cliente: z.string().optional(),
  satisfacao_cliente: z.number().min(1).max(5).optional(),
  observacoes_cliente: z.string().optional(),
});

// Schema para OS Interna
const internaSchema = baseOSSchema.extend({
  tipo_os: z.literal('INTERNA'),
  departamento_solicitante: z.string().min(1, 'Departamento solicitante é obrigatório'),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  projeto_interno: z.string().optional(),
  justificativa_interna: z.string().min(1, 'Justificativa é obrigatória para OS Interna'),
  valor_estimado: z.number().optional(),
});

type OSComercialData = z.infer<typeof comercialSchema>;
type OSInternaData = z.infer<typeof internaSchema>;
type OSFormData = OSComercialData | OSInternaData;

interface OSWizardProps {
  tipoOS: TipoOS;
  onBack: () => void;
}

const steps = [
  { id: 'basico', title: 'Básico', icon: <User className="h-4 w-4" /> },
  { id: 'insumos', title: 'Insumos', icon: <Package className="h-4 w-4" /> },
  { id: 'maquinas', title: 'Máquinas', icon: <Settings className="h-4 w-4" /> },
  { id: 'maoobra', title: 'Mão de Obra', icon: <UsersIcon className="h-4 w-4" /> },
  { id: 'servicos', title: 'Serviços', icon: <Wrench className="h-4 w-4" /> },
  { id: 'custos', title: 'Custos', icon: <DollarSign className="h-4 w-4" /> },
];

export function OSWizard({ tipoOS, onBack }: OSWizardProps) {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const schema = tipoOS === 'COMERCIAL' ? comercialSchema : internaSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<OSFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_os: tipoOS,
      quantidade: 1,
      prioridade: 'NORMAL',
    } as any,
  });

  const watchedValues = watch();

  const onSubmit = async (data: OSFormData) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const endpoint = tipoOS === 'COMERCIAL' ? '/os/comercial' : '/os/interna';
      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success(`OS ${tipoOS === 'COMERCIAL' ? 'Comercial' : 'Interna'} criada com sucesso!`);
      router.push('/os');
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      toast.error('Erro ao salvar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    const isValid = await trigger();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'basico':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tipoOS === 'COMERCIAL' && (
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Input
                    id="cliente_id"
                    {...register('cliente_id')}
                    placeholder="ID do cliente"
                    className={(errors as any).cliente_id ? 'border-red-500' : ''}
                  />
                  {(errors as any).cliente_id && (
                    <p className="text-sm text-red-500">{(errors as any).cliente_id.message}</p>
                  )}
                </div>
              )}

              {tipoOS === 'INTERNA' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="departamento_solicitante">Departamento Solicitante *</Label>
                    <Select onValueChange={(value) => setValue('departamento_solicitante', value)}>
                      <SelectTrigger className={(errors as any).departamento_solicitante ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="PRODUCAO">Produção</SelectItem>
                        <SelectItem value="VENDAS">Vendas</SelectItem>
                        <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                    {(errors as any).departamento_solicitante && (
                      <p className="text-sm text-red-500">{(errors as any).departamento_solicitante.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="centro_custo">Centro de Custo *</Label>
                    <Input
                      id="centro_custo"
                      {...register('centro_custo')}
                      placeholder="Ex: CC001 - Marketing"
                      className={(errors as any).centro_custo ? 'border-red-500' : ''}
                    />
                    {(errors as any).centro_custo && (
                      <p className="text-sm text-red-500">{(errors as any).centro_custo.message}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome_servico">Nome do Serviço *</Label>
                <Input
                  id="nome_servico"
                  {...register('nome_servico')}
                  placeholder="Ex: Banner 3x2m"
                  className={errors.nome_servico ? 'border-red-500' : ''}
                />
                {errors.nome_servico && (
                  <p className="text-sm text-red-500">{errors.nome_servico.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select onValueChange={(value) => setValue('prioridade', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição detalhada do serviço"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.001"
                  {...register('quantidade', { valueAsNumber: true })}
                  placeholder="1"
                  className={errors.quantidade ? 'border-red-500' : ''}
                />
                {errors.quantidade && (
                  <p className="text-sm text-red-500">{errors.quantidade.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_prazo">Data Prazo</Label>
                <Input
                  id="data_prazo"
                  type="datetime-local"
                  {...register('data_prazo')}
                />
              </div>
            </div>

            {tipoOS === 'INTERNA' && (
              <div className="space-y-2">
                <Label htmlFor="justificativa_interna">Justificativa Interna *</Label>
                <Textarea
                  id="justificativa_interna"
                  {...register('justificativa_interna')}
                  placeholder="Justifique a necessidade desta OS interna"
                  rows={3}
                  className={(errors as any).justificativa_interna ? 'border-red-500' : ''}
                />
                {(errors as any).justificativa_interna && (
                  <p className="text-sm text-red-500">{(errors as any).justificativa_interna.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>
          </div>
        );

      case 'insumos':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Insumos Necessários</h3>
              <p className="text-gray-600">Configure os materiais e insumos para esta OS</p>
            </div>
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Funcionalidade de insumos será implementada em breve</p>
            </div>
          </div>
        );

      case 'maquinas':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Máquinas e Equipamentos</h3>
              <p className="text-gray-600">Selecione as máquinas necessárias para produção</p>
            </div>
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Funcionalidade de máquinas será implementada em breve</p>
            </div>
          </div>
        );

      case 'maoobra':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Mão de Obra</h3>
              <p className="text-gray-600">Configure as funções e responsabilidades necessárias</p>
            </div>
            <div className="text-center py-8 text-gray-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Funcionalidade de mão de obra será implementada em breve</p>
            </div>
          </div>
        );

      case 'servicos':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Serviços Manuais</h3>
              <p className="text-gray-600">Configure os serviços adicionais necessários</p>
            </div>
            <div className="text-center py-8 text-gray-500">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Funcionalidade de serviços será implementada em breve</p>
            </div>
          </div>
        );

      case 'custos':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Custos e Valores</h3>
              <p className="text-gray-600">Configure os valores e custos da OS</p>
            </div>
            
            {tipoOS === 'COMERCIAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_orcado">Valor Orçado</Label>
                  <Input
                    id="valor_orcado"
                    type="number"
                    step="0.01"
                    {...register('valor_orcado', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_realizado">Valor Realizado</Label>
                  <Input
                    id="valor_realizado"
                    type="number"
                    step="0.01"
                    {...register('valor_realizado', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_entrega_cliente">Data de Entrega ao Cliente</Label>
                  <Input
                    id="data_entrega_cliente"
                    type="datetime-local"
                    {...register('data_entrega_cliente')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="satisfacao_cliente">Satisfação do Cliente (1-5)</Label>
                  <Input
                    id="satisfacao_cliente"
                    type="number"
                    min="1"
                    max="5"
                    {...register('satisfacao_cliente', { valueAsNumber: true })}
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes_cliente">Observações do Cliente</Label>
                  <Textarea
                    id="observacoes_cliente"
                    {...register('observacoes_cliente')}
                    placeholder="Observações do cliente sobre a entrega"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {tipoOS === 'INTERNA' && (
              <div className="space-y-2">
                <Label htmlFor="valor_estimado">Valor Estimado</Label>
                <Input
                  id="valor_estimado"
                  type="number"
                  step="0.01"
                  {...register('valor_estimado', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Funcionalidades avançadas de custos serão implementadas em breve</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-xl font-semibold">
              Criar OS {tipoOS === 'COMERCIAL' ? 'Comercial' : 'Interna'}
            </h2>
            <p className="text-sm text-gray-600">
              Passo {currentStep + 1} de {steps.length}: {steps[currentStep].title}
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {tipoOS === 'COMERCIAL' ? 'Comercial' : 'Interna'}
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className={`ml-2 text-sm ${
              index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {steps[currentStep].icon}
            <span>{steps[currentStep].title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}
          </form>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex space-x-2">
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} onClick={handleSubmit(onSubmit)}>
              {loading ? 'Salvando...' : 'Criar OS'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
