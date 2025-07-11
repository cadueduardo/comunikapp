'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NovoInsumoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const fetchData = async (url: string, setter: React.Dispatch<React.SetStateAction<Option[]>>) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setter(data.map((item: { id: string, nome: string }) => ({ value: item.id, label: item.nome })));
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de ${url}:`, error);
      toast.error(`Não foi possível carregar os dados.`);
    }
  };

  useEffect(() => {
    fetchData('http://localhost:3001/categorias', setCategorias);
    fetchData('http://localhost:3001/fornecedores', setFornecedores);
  }, []);

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
        ...formData,
        custo_unitario: parseFloat(formData.custo_unitario.replace(',', '.')) || 0,
        estoque_minimo: formData.estoque_minimo ? parseInt(formData.estoque_minimo, 10) : undefined,
      };

      if (!dataToSubmit.estoque_minimo) delete dataToSubmit.estoque_minimo;
      
      const response = await fetch('http://localhost:3001/insumos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        toast.success('Insumo cadastrado com sucesso!');
        router.push('/insumos');
      } else {
        const errorData = await response.json();
        toast.error(`Erro ao cadastrar insumo: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao cadastrar insumo:', err);
      toast.error('Erro ao cadastrar insumo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
          <h1 className="text-3xl font-bold">Novo Insumo</h1>
          <p className="text-gray-600">Cadastre um novo material ou serviço</p>
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
            {loading ? 'Salvando...' : <><Save className="h-4 w-4 mr-2" /> Salvar Insumo</>}
          </Button>
        </div>
      </form>
    </div>
  );
} 