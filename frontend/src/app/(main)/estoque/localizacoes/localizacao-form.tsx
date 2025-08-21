'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface LocalizacaoFormData {
  codigo: string;
  deposito: string;
  corredor?: string;
  prateleira?: string;
  nivel?: string;
  posicao?: string;
  descricao?: string;
  capacidade?: number;
  ativo: boolean;
}

interface LocalizacaoFormProps {
  localizacaoId?: string;
}

export default function LocalizacaoForm({ localizacaoId }: LocalizacaoFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<LocalizacaoFormData>({
    codigo: '',
    deposito: '',
    corredor: '',
    prateleira: '',
    nivel: '',
    posicao: '',
    descricao: '',
    capacidade: undefined,
    ativo: true,
  });

  useEffect(() => {
    // Se tem localizacaoId, é edição
    if (localizacaoId) {
      fetchLocalizacao(localizacaoId);
    }
  }, [localizacaoId]);

  const fetchLocalizacao = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/estoque/localizacoes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          codigo: data.codigo || '',
          deposito: data.deposito || '',
          corredor: data.corredor || '',
          prateleira: data.prateleira || '',
          nivel: data.nivel || '',
          posicao: data.posicao || '',
          descricao: data.descricao || '',
          capacidade: data.capacidade || undefined,
          ativo: data.ativo !== undefined ? data.ativo : true,
        });
      } else {
        toast.error('Erro ao carregar dados da localização');
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      toast.error('Erro ao carregar dados da localização');
    }
  };

  const handleInputChange = (field: keyof LocalizacaoFormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSend = {
        ...formData,
        corredor: formData.corredor || undefined,
        prateleira: formData.prateleira || undefined,
        nivel: formData.nivel || undefined,
        posicao: formData.posicao || undefined,
        descricao: formData.descricao || undefined,
        capacidade: formData.capacidade || undefined,
      };

      const url = localizacaoId 
        ? `/api/estoque/localizacoes/${localizacaoId}`
        : '/api/estoque/localizacoes';

      const method = localizacaoId ? 'PUT' : 'POST';

      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        toast.success(
          localizacaoId 
            ? 'Localização atualizada com sucesso!' 
            : 'Localização criada com sucesso!'
        );
        router.push('/estoque/localizacoes');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao salvar localização');
      }
    } catch (error) {
      console.error('Erro ao salvar localização:', error);
      toast.error('Erro ao salvar localização');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link 
          href="/estoque/localizacoes"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Localizações
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {localizacaoId ? 'Editar Localização' : 'Nova Localização'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Localização</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Código e Depósito - Lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => handleInputChange('codigo', e.target.value)}
                  placeholder="Ex: A1-01-B-02-03, DEP-001, SETOR-A-01"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Código único da localização (formato flexível)
                </p>
              </div>

              <div>
                <Label htmlFor="deposito">Depósito *</Label>
                <Input
                  id="deposito"
                  type="text"
                  value={formData.deposito}
                  onChange={(e) => handleInputChange('deposito', e.target.value)}
                  placeholder="Nome do depósito"
                  required
                />
              </div>
            </div>

            {/* Corredor e Prateleira - Lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="corredor">Corredor</Label>
                <Input
                  id="corredor"
                  type="text"
                  value={formData.corredor}
                  onChange={(e) => handleInputChange('corredor', e.target.value)}
                  placeholder="Ex: A, B, C"
                />
              </div>

              <div>
                <Label htmlFor="prateleira">Prateleira</Label>
                <Input
                  id="prateleira"
                  type="text"
                  value={formData.prateleira}
                  onChange={(e) => handleInputChange('prateleira', e.target.value)}
                  placeholder="Ex: 01, 02, 03"
                />
              </div>
            </div>

            {/* Nível e Posição - Lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nivel">Nível</Label>
                <Input
                  id="nivel"
                  type="text"
                  value={formData.nivel}
                  onChange={(e) => handleInputChange('nivel', e.target.value)}
                  placeholder="Ex: 1, 2, 3 ou A, B, C"
                />
              </div>

              <div>
                <Label htmlFor="posicao">Posição</Label>
                <Input
                  id="posicao"
                  type="text"
                  value={formData.posicao}
                  onChange={(e) => handleInputChange('posicao', e.target.value)}
                  placeholder="Ex: 01, 02, 03"
                />
              </div>
            </div>

            {/* Descrição - Largura total */}
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descrição da localização"
                rows={3}
              />
            </div>

            {/* Capacidade e Ativo - Lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacidade">Capacidade</Label>
                <Input
                  id="capacidade"
                  type="number"
                  step="0.01"
                  value={formData.capacidade || ''}
                  onChange={(e) => handleInputChange('capacidade', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Capacidade em unidades"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => handleInputChange('ativo', checked)}
                />
                <Label htmlFor="ativo">Localização ativa</Label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {localizacaoId ? 'Atualizar' : 'Criar'} Localização
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/estoque/localizacoes')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 