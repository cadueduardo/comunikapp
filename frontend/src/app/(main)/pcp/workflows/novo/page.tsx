'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import Link from 'next/link';

interface EtapaTemplate {
  id: string;
  nome: string;
  descricao: string;
  ordem: number;
  obrigatoria: boolean;
  tempo_estimado: number;
  responsaveis_permitidos: string[];
  checklist: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  descricao: string;
  obrigatorio: boolean;
  ordem: number;
}

export default function NovoWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
    sequencial: true,
    etapas: [] as EtapaTemplate[]
  });

  const adicionarEtapa = () => {
    const novaEtapa: EtapaTemplate = {
      id: `etapa-${Date.now()}`,
      nome: '',
      descricao: '',
      ordem: formData.etapas.length + 1,
      obrigatoria: true,
      tempo_estimado: 60,
      responsaveis_permitidos: [],
      checklist: []
    };

    setFormData(prev => ({
      ...prev,
      etapas: [...prev.etapas, novaEtapa]
    }));
  };

  const atualizarEtapa = (index: number, campo: keyof EtapaTemplate, valor: any) => {
    setFormData(prev => ({
      ...prev,
      etapas: prev.etapas.map((etapa, i) => 
        i === index ? { ...etapa, [campo]: valor } : etapa
      )
    }));
  };

  const removerEtapa = (index: number) => {
    setFormData(prev => ({
      ...prev,
      etapas: prev.etapas.filter((_, i) => i !== index).map((etapa, i) => ({
        ...etapa,
        ordem: i + 1
      }))
    }));
  };

  const adicionarChecklistItem = (etapaIndex: number) => {
    const etapa = formData.etapas[etapaIndex];
    const novoItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      descricao: '',
      obrigatorio: true,
      ordem: etapa.checklist.length + 1
    };

    atualizarEtapa(etapaIndex, 'checklist', [...etapa.checklist, novoItem]);
  };

  const atualizarChecklistItem = (etapaIndex: number, itemIndex: number, campo: keyof ChecklistItem, valor: any) => {
    const etapa = formData.etapas[etapaIndex];
    const checklistAtualizado = etapa.checklist.map((item, i) => 
      i === itemIndex ? { ...item, [campo]: valor } : item
    );

    atualizarEtapa(etapaIndex, 'checklist', checklistAtualizado);
  };

  const removerChecklistItem = (etapaIndex: number, itemIndex: number) => {
    const etapa = formData.etapas[etapaIndex];
    const checklistAtualizado = etapa.checklist.filter((_, i) => i !== itemIndex).map((item, i) => ({
      ...item,
      ordem: i + 1
    }));

    atualizarEtapa(etapaIndex, 'checklist', checklistAtualizado);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome do workflow é obrigatório');
      return;
    }

    if (formData.etapas.length === 0) {
      toast.error('Adicione pelo menos uma etapa ao workflow');
      return;
    }

    // Validar etapas
    for (const etapa of formData.etapas) {
      if (!etapa.nome.trim()) {
        toast.error('Todas as etapas devem ter um nome');
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('/api/pcp/workflow-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: formData.nome,
          descricao: formData.descricao,
          ativo: formData.ativo,
          sequencial: formData.sequencial,
          etapas: formData.etapas
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar workflow');
      }

      toast.success('Workflow criado com sucesso!');
      router.push('/pcp/workflows');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar workflow');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pcp/workflows">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Novo Workflow</h1>
        <p className="text-gray-600 mt-1">
          Crie um novo template de workflow para produção
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Workflow *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Banner ACM 3mm"
                  required
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sequencial"
                    checked={formData.sequencial}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sequencial: checked }))}
                  />
                  <Label htmlFor="sequencial">Execução Sequencial</Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o workflow e suas características..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Etapas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Etapas do Workflow</CardTitle>
              <Button type="button" onClick={adicionarEtapa} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Etapa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.etapas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma etapa adicionada ainda.</p>
                <p className="text-sm">Clique em "Adicionar Etapa" para começar.</p>
              </div>
            ) : (
              formData.etapas.map((etapa, index) => (
                <Card key={etapa.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">
                          Etapa {etapa.ordem}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerEtapa(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`etapa-${index}-nome`}>Nome da Etapa *</Label>
                        <Input
                          id={`etapa-${index}-nome`}
                          value={etapa.nome}
                          onChange={(e) => atualizarEtapa(index, 'nome', e.target.value)}
                          placeholder="Ex: Corte do material"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`etapa-${index}-tempo`}>Tempo Estimado (min)</Label>
                        <Input
                          id={`etapa-${index}-tempo`}
                          type="number"
                          value={etapa.tempo_estimado}
                          onChange={(e) => atualizarEtapa(index, 'tempo_estimado', Number(e.target.value))}
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`etapa-${index}-descricao`}>Descrição</Label>
                      <Textarea
                        id={`etapa-${index}-descricao`}
                        value={etapa.descricao}
                        onChange={(e) => atualizarEtapa(index, 'descricao', e.target.value)}
                        placeholder="Descreva o que deve ser feito nesta etapa..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`etapa-${index}-obrigatoria`}
                        checked={etapa.obrigatoria}
                        onCheckedChange={(checked) => atualizarEtapa(index, 'obrigatoria', checked)}
                      />
                      <Label htmlFor={`etapa-${index}-obrigatoria`}>Etapa Obrigatória</Label>
                    </div>

                    {/* Checklist da Etapa */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Checklist</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => adicionarChecklistItem(index)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Item
                        </Button>
                      </div>

                      {etapa.checklist.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          Nenhum item de checklist adicionado.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {etapa.checklist.map((item, itemIndex) => (
                            <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                              <Input
                                value={item.descricao}
                                onChange={(e) => atualizarChecklistItem(index, itemIndex, 'descricao', e.target.value)}
                                placeholder="Descrição do item de checklist"
                                className="flex-1"
                              />
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={item.obrigatorio}
                                  onCheckedChange={(checked) => atualizarChecklistItem(index, itemIndex, 'obrigatorio', checked)}
                                />
                                <Label className="text-sm">Obrigatório</Label>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerChecklistItem(index, itemIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/pcp/workflows">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Workflow'}
          </Button>
        </div>
      </form>
    </div>
  );
}
