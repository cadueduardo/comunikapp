'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface EtapaTemplate {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  obrigatoria: boolean;
  tempo_estimado?: number;
  responsaveis_permitidos?: string[];
  checklist?: ChecklistTemplate[];
}

interface ChecklistTemplate {
  id: string;
  descricao: string;
  obrigatorio: boolean;
  ordem: number;
}

interface WorkflowTemplate {
  id: string;
  nome: string;
  descricao?: string;
  etapas: EtapaTemplate[];
  ativo: boolean;
  sequencial: boolean;
  criado_em: string;
  atualizado_em: string;
}

export default function EditWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsedEtapas, setCollapsedEtapas] = useState<{ [key: string]: boolean }>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // ✅ Removido justMovedIndex para eliminar animação de bounce

  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
    sequencial: true,
    etapas: [] as EtapaTemplate[]
  });

  useEffect(() => {
    if (params.id) {
      fetchWorkflow(params.id as string);
    }
  }, [params.id]);

  const fetchWorkflow = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/pcp/workflow-templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflow(data);
        setFormData({
          nome: data.nome,
          descricao: data.descricao || '',
          ativo: data.ativo,
          sequencial: data.sequencial,
          etapas: data.etapas || []
        });
      } else {
        toast.error('Erro ao carregar workflow');
        router.push('/pcp/workflows');
      }
    } catch (error) {
      console.error('Erro ao buscar workflow:', error);
      toast.error('Erro ao conectar com o servidor');
      router.push('/pcp/workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/pcp/workflow-templates/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Workflow atualizado com sucesso!');
        router.push('/pcp/workflows');
      } else {
        toast.error('Erro ao atualizar workflow');
      }
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
      toast.error('Ocorreu um erro ao conectar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCollapse = (etapaId: string) => {
    setCollapsedEtapas(prev => ({
      ...prev,
      [etapaId]: !prev[etapaId]
    }));
  };

  // Função para verificar se uma etapa está colapsada (padrão: true = colapsada)
  const isEtapaCollapsed = (etapaId: string) => {
    return collapsedEtapas[etapaId] !== false; // Default é colapsada (true)
  };

  const addEtapa = () => {
    const novaEtapa: EtapaTemplate = {
      id: `etapa_${Date.now()}`,
      nome: '',
      descricao: '',
      ordem: formData.etapas.length + 1,
      obrigatoria: true,
      tempo_estimado: 60,
      checklist: []
    };

    setFormData({
      ...formData,
      etapas: [...formData.etapas, novaEtapa]
    });
  };

  const updateEtapa = (index: number, field: keyof EtapaTemplate, value: any) => {
    const etapasAtualizadas = [...formData.etapas];
    etapasAtualizadas[index] = {
      ...etapasAtualizadas[index],
      [field]: value
    };
    setFormData({ ...formData, etapas: etapasAtualizadas });
  };

  const removeEtapa = (index: number) => {
    const etapasAtualizadas = formData.etapas.filter((_, i) => i !== index);
    // Reordenar etapas
    etapasAtualizadas.forEach((etapa, i) => {
      etapa.ordem = i + 1;
    });
    setFormData({ ...formData, etapas: etapasAtualizadas });
  };

  const moveEtapa = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const etapasAtualizadas = [...formData.etapas];
    const [movedEtapa] = etapasAtualizadas.splice(fromIndex, 1);
    etapasAtualizadas.splice(toIndex, 0, movedEtapa);
    
    // Reordenar etapas
    etapasAtualizadas.forEach((etapa, i) => {
      etapa.ordem = i + 1;
    });
    
        setFormData({ ...formData, etapas: etapasAtualizadas });
        
        // Feedback visual de sucesso
        toast.success(`Etapa "${movedEtapa.nome || `Etapa ${movedEtapa.ordem}`}" movida para posição ${toIndex + 1}`);
  };

  const addChecklistItem = (etapaIndex: number) => {
    const etapasAtualizadas = [...formData.etapas];
    const etapa = etapasAtualizadas[etapaIndex];
    const novoItem: ChecklistTemplate = {
      id: `checklist_${Date.now()}`,
      descricao: '',
      obrigatorio: true,
      ordem: (etapa.checklist?.length || 0) + 1
    };

    etapa.checklist = [...(etapa.checklist || []), novoItem];
    setFormData({ ...formData, etapas: etapasAtualizadas });
  };

  const updateChecklistItem = (etapaIndex: number, itemIndex: number, field: keyof ChecklistTemplate, value: any) => {
    const etapasAtualizadas = [...formData.etapas];
    const etapa = etapasAtualizadas[etapaIndex];
    if (etapa.checklist) {
      etapa.checklist[itemIndex] = {
        ...etapa.checklist[itemIndex],
        [field]: value
      };
      setFormData({ ...formData, etapas: etapasAtualizadas });
    }
  };

  const removeChecklistItem = (etapaIndex: number, itemIndex: number) => {
    const etapasAtualizadas = [...formData.etapas];
    const etapa = etapasAtualizadas[etapaIndex];
    if (etapa.checklist) {
      etapa.checklist = etapa.checklist.filter((_, i) => i !== itemIndex);
      // Reordenar itens
      etapa.checklist.forEach((item, i) => {
        item.ordem = i + 1;
      });
      setFormData({ ...formData, etapas: etapasAtualizadas });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/pcp/workflows')}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando workflow...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/pcp/workflows')}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Editar Workflow
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Modifique as configurações do workflow
          </p>
        </div>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Workflow</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Produção de Banners"
            />
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o propósito deste workflow..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Workflow Ativo</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="sequencial"
                checked={formData.sequencial}
                onCheckedChange={(checked) => setFormData({ ...formData, sequencial: checked })}
              />
              <Label htmlFor="sequencial">Execução Sequencial</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etapas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Etapas do Workflow</CardTitle>
              <CardDescription>
                Defina as etapas que compõem este workflow
              </CardDescription>
            </div>
            <Button onClick={addEtapa}>
              <IconPlus className="h-4 w-4 mr-2" />
              Adicionar Etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.etapas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhuma etapa definida</p>
              <Button onClick={addEtapa}>
                <IconPlus className="h-4 w-4 mr-2" />
                Adicionar Primeira Etapa
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.etapas.map((etapa, index) => (
                <div
                  key={etapa.id}
                  className={`relative transition-all duration-200 ease-in-out ${
                    draggedIndex === index ? 'opacity-50 scale-95 rotate-1' : ''
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(index);
                  }}
                  onDragLeave={() => {
                    setDragOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverIndex(null);
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    if (fromIndex !== index) {
                      moveEtapa(fromIndex, index);
                    }
                  }}
                >
                  {/* Linha de drop antes da etapa */}
                  {dragOverIndex === index && (
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse shadow-lg mb-4" />
                  )}
                  
                  <Card 
                    className={`border-l-4 cursor-move transition-all duration-200 ease-in-out ${
                      draggedIndex === index 
                        ? 'border-l-blue-600 shadow-2xl bg-blue-50' 
                        : 'border-l-blue-500 hover:shadow-lg hover:border-l-blue-600'
                    } ${
                      dragOverIndex === index 
                        ? 'bg-blue-50 border-l-green-500 shadow-lg ring-2 ring-blue-200' 
                        : ''
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', index.toString());
                      setDraggedIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                  >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <IconGripVertical 
                          className="h-4 w-4 text-gray-400" 
                        />
                        <span className="font-medium">
                          Etapa {etapa.ordem} - {etapa.nome || 'Sem nome'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCollapse(etapa.id)}
                        >
                          {isEtapaCollapsed(etapa.id) ? (
                            <IconChevronDown className="h-4 w-4" />
                          ) : (
                            <IconChevronUp className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEtapa(index)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {!isEtapaCollapsed(etapa.id) && (
                    <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`etapa_nome_${index}`}>Nome da Etapa</Label>
                        <Input
                          id={`etapa_nome_${index}`}
                          value={etapa.nome}
                          onChange={(e) => updateEtapa(index, 'nome', e.target.value)}
                          placeholder="Ex: Preparação do Material"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`etapa_tempo_${index}`}>Tempo Estimado (min)</Label>
                        <Input
                          id={`etapa_tempo_${index}`}
                          type="number"
                          value={etapa.tempo_estimado || ''}
                          onChange={(e) => updateEtapa(index, 'tempo_estimado', parseInt(e.target.value) || 0)}
                          placeholder="60"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`etapa_descricao_${index}`}>Descrição</Label>
                      <Textarea
                        id={`etapa_descricao_${index}`}
                        value={etapa.descricao || ''}
                        onChange={(e) => updateEtapa(index, 'descricao', e.target.value)}
                        placeholder="Descreva o que deve ser feito nesta etapa..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`etapa_obrigatoria_${index}`}
                        checked={etapa.obrigatoria}
                        onCheckedChange={(checked) => updateEtapa(index, 'obrigatoria', checked)}
                      />
                      <Label htmlFor={`etapa_obrigatoria_${index}`}>Etapa Obrigatória</Label>
                    </div>

                    {/* Checklist da Etapa */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Checklist da Etapa</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addChecklistItem(index)}
                        >
                          <IconPlus className="h-3 w-3 mr-1" />
                          Adicionar Item
                        </Button>
                      </div>
                      
                      {etapa.checklist && etapa.checklist.length > 0 && (
                        <div className="space-y-2">
                          {etapa.checklist.map((item, itemIndex) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Input
                                value={item.descricao}
                                onChange={(e) => updateChecklistItem(index, itemIndex, 'descricao', e.target.value)}
                                placeholder="Item do checklist..."
                                className="flex-1"
                              />
                              <Switch
                                checked={item.obrigatorio}
                                onCheckedChange={(checked) => updateChecklistItem(index, itemIndex, 'obrigatorio', checked)}
                                size="sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeChecklistItem(index, itemIndex)}
                              >
                                <IconTrash className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    </CardContent>
                  )}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Salvar no Final */}
      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <IconDeviceFloppy className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}
