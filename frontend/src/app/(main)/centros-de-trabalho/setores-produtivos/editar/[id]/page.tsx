'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  IconBuildingFactory, 
  IconArrowLeft,
  IconSave,
  IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SetorProdutivo {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  ordem: number;
}

interface UpdateSetorDto {
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  ordem: number;
}

export default function EditarSetorPage() {
  const router = useRouter();
  const params = useParams();
  const setorId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [setor, setSetor] = useState<SetorProdutivo | null>(null);
  const [formData, setFormData] = useState<UpdateSetorDto>({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
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

  useEffect(() => {
    if (setorId) {
      fetchSetor();
    }
  }, [setorId]);

  const fetchSetor = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/centros-de-trabalho/setores-produtivos/${setorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSetor(data);
        setFormData({
          nome: data.nome,
          descricao: data.descricao || '',
          cor: data.cor,
          ativo: data.ativo,
          ordem: data.ordem
        });
      } else {
        throw new Error('Erro ao carregar setor');
      }
    } catch (error) {
      console.error('Erro ao carregar setor:', error);
      toast.error('Erro ao carregar dados do setor');
      router.push('/centros-de-trabalho/setores-produtivos');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome do setor é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/centros-de-trabalho/setores-produtivos/${setorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Setor atualizado com sucesso');
        router.push('/centros-de-trabalho/setores-produtivos');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar setor');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar setor:', error);
      toast.error(error.message || 'Erro ao atualizar setor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateSetorDto, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!setor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/centros-de-trabalho/setores-produtivos">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Setor não encontrado</h1>
            <p className="text-gray-600">O setor solicitado não foi encontrado</p>
          </div>
        </div>
      </div>
    );
  }

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
            Editar Setor Produtivo
          </h1>
          <p className="text-gray-600">
            Edite as informações do setor: {setor.nome}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Setor</CardTitle>
          <CardDescription>
            Atualize as informações do setor produtivo
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
                <IconSave className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
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
