'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

interface Option {
  value: string;
  label: string;
}

export default function EditarInsumoPage() {
  const router = useRouter();
  const params = useParams();
  const insumoId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [fornecedores, setFornecedores] = useState<Option[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    categoriaId: '',
    fornecedorId: '',
    custo_unitario: '',
    unidade_medida: '',
    estoque_minimo: '',
    codigo_interno: '',
    descricao_tecnica: '',
    observacoes: '',
  });

  useEffect(() => {
    if (!insumoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        const [insumoRes, categoriasRes, fornecedoresRes] = await Promise.all([
          fetch(`http://localhost:3001/insumos/${insumoId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:3001/categorias', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:3001/fornecedores', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (categoriasRes.ok) {
            const data = await categoriasRes.json();
            setCategorias(data.map((item: { id: string; nome: string }) => ({ value: item.id, label: item.nome })));
        }
        if (fornecedoresRes.ok) {
            const data = await fornecedoresRes.json();
            setFornecedores(data.map((item: { id: string; nome: string }) => ({ value: item.id, label: item.nome })));
        }

        if (insumoRes.ok) {
          const data = await insumoRes.json();
          setFormData({
            nome: data.nome || '',
            categoriaId: data.categoriaId || '',
            fornecedorId: data.fornecedorId || '',
            custo_unitario: String(data.custo_unitario) || '',
            unidade_medida: data.unidade_medida || '',
            estoque_minimo: String(data.estoque_minimo || ''),
            codigo_interno: data.codigo_interno || '',
            descricao_tecnica: data.descricao_tecnica || '',
            observacoes: data.observacoes || '',
          });
        } else {
          toast.error('Insumo não encontrado.');
          router.push('/insumos');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados da página.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [insumoId, router]);

  const handleCreate = async (
    name: string,
    url: string,
    setter: React.Dispatch<React.SetStateAction<Option[]>>,
    field: 'categoriaId' | 'fornecedorId'
  ) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: name }),
      });
      if (response.ok) {
        const newData = await response.json();
        const newOption = { value: newData.id, label: newData.nome };
        setter(prev => [...prev, newOption]);
        handleChange(field, newData.id);
        toast.success(`${field === 'categoriaId' ? 'Categoria' : 'Fornecedor'} "${name}" criada com sucesso!`);
      } else {
        toast.error(`Falha ao criar ${name}`);
      }
    } catch (err) {
      toast.error('Ocorreu um erro.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const dataToSubmit = {
        nome: formData.nome,
        categoriaId: formData.categoriaId,
        fornecedorId: formData.fornecedorId,
        custo_unitario: parseFloat(formData.custo_unitario.replace(',', '.')) || 0,
        unidade_medida: formData.unidade_medida,
        estoque_minimo: formData.estoque_minimo ? parseInt(formData.estoque_minimo, 10) : undefined,
        codigo_interno: formData.codigo_interno,
        descricao_tecnica: formData.descricao_tecnica,
        observacoes: formData.observacoes,
      };

      // Remover campos opcionais vazios para não enviar ao backend
      if (!dataToSubmit.estoque_minimo) delete dataToSubmit.estoque_minimo;

      const response = await fetch(`http://localhost:3001/insumos/${insumoId}`, {
        method: 'PATCH', // Changed to PATCH
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        toast.success('Insumo atualizado com sucesso!');
        router.push('/insumos');
      } else {
        const errorData = await response.json();
        toast.error(`Erro ao atualizar insumo: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao atualizar insumo:', err);
      toast.error('Erro ao atualizar insumo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-6">Carregando dados do insumo...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/insumos">
          <Button variant="outline" size="sm" className="cursor-pointer hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Insumo</h1>
          <p className="text-gray-600">Altere os dados do insumo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Insumo */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Insumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Insumo *</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Combobox
                    options={categorias}
                    value={formData.categoriaId}
                    onChange={(value) => handleChange('categoriaId', value)}
                    onCreate={(name) => handleCreate(name, 'http://localhost:3001/categorias', setCategorias, 'categoriaId')}
                    placeholder="Selecione uma categoria"
                    searchPlaceholder="Buscar categoria..."
                    emptyPlaceholder="Nenhuma categoria encontrada."
                    createPlaceholder="Criar categoria"
                  />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="custo_unitario">Custo Unitário (R$) *</Label>
                <Input id="custo_unitario" value={formData.custo_unitario} onChange={(e) => handleChange('custo_unitario', e.target.value)} type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="unidade_medida">Unidade de Medida *</Label>
                <Input id="unidade_medida" value={formData.unidade_medida} onChange={(e) => handleChange('unidade_medida', e.target.value)} placeholder="Ex: m², kg, L, un" required />
              </div>
               <div>
                <Label htmlFor="fornecedor">Fornecedor *</Label>
                <Combobox
                    options={fornecedores}
                    value={formData.fornecedorId}
                    onChange={(value) => handleChange('fornecedorId', value)}
                    onCreate={(name) => handleCreate(name, 'http://localhost:3001/fornecedores', setFornecedores, 'fornecedorId')}
                    placeholder="Selecione um fornecedor"
                    searchPlaceholder="Buscar fornecedor..."
                    emptyPlaceholder="Nenhum fornecedor encontrado."
                    createPlaceholder="Criar fornecedor"
                  />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <Label htmlFor="codigo_interno">Código Interno</Label>
                <Input id="codigo_interno" value={formData.codigo_interno} onChange={(e) => handleChange('codigo_interno', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                <Input id="estoque_minimo" value={formData.estoque_minimo} onChange={(e) => handleChange('estoque_minimo', e.target.value)} type="number" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="descricao_tecnica">Descrição Técnica</Label>
              <Textarea
                id="descricao_tecnica"
                value={formData.descricao_tecnica}
                onChange={(e) => handleChange('descricao_tecnica', e.target.value)}
                placeholder="Adicione especificações do insumo, como cor, gramatura, etc."
              />
            </div>
             <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Adicione informações adicionais relevantes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="cursor-pointer hover:bg-primary/90 transition-colors">
            {loading ? 'Salvando...' : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>}
          </Button>
        </div>
      </form>
    </div>
  );
} 