'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  IconBuildingFactory, 
  IconArrowLeft,
  IconDeviceFloppy,
  IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CreateSetorDto {
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  ordem: number;
}

export default function NovoSetorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSetorDto>({
    nome: '',
    descricao: '',
    cor: '#3B82F6', // Azul padrão
    ativo: true,
    ordem: 1
  });

  const coresPredefinidas = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#F97316', // Laranja
    '#06B6D4', // Ciano
    '#84CC16', // Lima
    '#EC4899', // Rosa
    '#6B7280'  // Cinza
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome do setor é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('/api/centros-de-trabalho/setores-produtivos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Setor criado com sucesso');
        router.push('/centros-de-trabalho/setores-produtivos');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar setor');
      }
    } catch (error: any) {
      console.error('Erro ao criar setor:', error);
      toast.error(error.message || 'Erro ao criar setor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateSetorDto, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/centros-de-trabalho/setores-produtivos">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconBuildingFactory className="h-6 w-6" />
            Novo Setor Produtivo
          </h1>
          <p className="text-gray-600">
            Crie um novo setor produtivo para organizar sua produção
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Setor</CardTitle>
          <CardDescription>
            Preencha as informações básicas do setor produtivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Setor *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Ex: Impressão Digital, CNC Laser, Acabamento..."
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descreva as atividades realizadas neste setor..."
                rows={3}
              />
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label>Cor de Identificação</Label>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {coresPredefinidas.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.cor === cor ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: cor }}
                      onClick={() => handleInputChange('cor', cor)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Personalizada:</span>
                  <Input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => handleInputChange('cor', e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                </div>
              </div>
            </div>

            {/* Ordem */}
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem no Kanban</Label>
              <Input
                id="ordem"
                type="number"
                min="1"
                value={formData.ordem}
                onChange={(e) => handleInputChange('ordem', parseInt(e.target.value) || 1)}
                placeholder="1"
              />
              <p className="text-sm text-gray-500">
                Define a ordem de exibição no Kanban (1 = primeiro)
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.ativo}
                    onChange={() => handleInputChange('ativo', true)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Ativo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.ativo}
                    onChange={() => handleInputChange('ativo', false)}
                    className="text-gray-600"
                  />
                  <span className="text-sm">Inativo</span>
                </label>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-4 pt-6 border-t">
              <Button type="submit" disabled={loading}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Setor'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/centros-de-trabalho/setores-produtivos">
                  <IconX className="h-4 w-4 mr-2" />
                  Cancelar
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
