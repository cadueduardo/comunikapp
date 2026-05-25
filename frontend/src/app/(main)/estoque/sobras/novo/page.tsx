'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ItemEstoque {
  id: string;
  codigo: string;
  nome?: string;
  insumoNome?: string;
  quantidade?: number;
  quantidadeAtual?: number;
  unidadeMedida?: string;
  unidadeCompra?: string;
  localizacao?: {
    codigo?: string;
    nome?: string;
  };
  localizacaoCodigo?: string;
}

export default function NovaSobraPage() {
  const [loading, setLoading] = useState(false);
  const [itensEstoque, setItensEstoque] = useState<ItemEstoque[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState<ItemEstoque | null>(null);
  const [formData, setFormData] = useState({
    estoqueId: '',
    descricao: '',
    dimensoes: '',
    area: '',
    quantidade: '',
    unidadeMedida: '',
    material: '',
    cor: '',
    acabamento: '',
    origem: '',
    orcamentoOrigem: '',
  });
  const router = useRouter();

  useEffect(() => {
    carregarItensEstoque();
  }, []);

  const carregarItensEstoque = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/estoque/itens', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItensEstoque((data as any).data || data);
      } else {
        console.error('Erro ao carregar itens de estoque');
      }
    } catch (error) {
      console.error('Erro ao carregar itens de estoque:', error);
    }
  };

  const handleItemChange = (itemId: string) => {
    const item = itensEstoque.find(i => i.id === itemId);
    setItemSelecionado(item || null);
    setFormData(prev => ({
      ...prev,
      estoqueId: itemId,
      unidadeMedida: item?.unidadeMedida || item?.unidadeCompra || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/estoque/sobras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantidade: parseFloat(formData.quantidade),
          area: formData.area ? parseFloat(formData.area) : null,
        }),
      });

      if (response.ok) {
        await response.json();
        toast.success('Sobra criada com sucesso!');
        router.push('/estoque/sobras');
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(`Erro ao criar sobra: ${error.message || 'Falha ao salvar'}`);
      }
    } catch (error) {
      console.error('Erro ao criar sobra:', error);
      toast.error('Erro ao criar sobra');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/estoque/sobras">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Sobra</h1>
          <p className="text-muted-foreground">Registrar nova sobra ou retalho</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Sobra</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seleção do Item de Estoque */}
                <div className="space-y-2">
                  <Label htmlFor="estoqueId">Item de Estoque *</Label>
                  <Select value={formData.estoqueId} onValueChange={handleItemChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item de estoque" />
                    </SelectTrigger>
                    <SelectContent>
                      {itensEstoque.map((item) => {
                        const nome = item.nome ?? item.insumoNome ?? '';
                        const qtd = (item.quantidade ?? item.quantidadeAtual) ?? undefined;
                        const un = item.unidadeMedida ?? item.unidadeCompra ?? '';
                        return (
                          <SelectItem key={item.id} value={item.id}>
                            {item.codigo} - {nome} {qtd !== undefined ? `(${qtd} ${un})` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Informações do Item Selecionado */}
                {itemSelecionado && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-2">Item Selecionado:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Código:</span> {itemSelecionado.codigo}
                        </div>
                        <div>
                          <span className="font-medium">Nome:</span> {itemSelecionado.nome ?? itemSelecionado.insumoNome}
                        </div>
                        <div>
                          <span className="font-medium">Quantidade:</span> {(itemSelecionado.quantidade ?? itemSelecionado.quantidadeAtual) ?? '-'} {itemSelecionado.unidadeMedida ?? itemSelecionado.unidadeCompra ?? ''}
                        </div>
                      <div>
                          <span className="font-medium">Localização:</span> {itemSelecionado.localizacao?.codigo ?? itemSelecionado.localizacaoCodigo ?? '-'}
                      </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição da Sobra *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    placeholder="Descreva detalhadamente a sobra (ex: Retalho de PVC branco, restante de banner)"
                    required
                  />
                </div>

                {/* Dimensões e Área */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dimensoes">Dimensões</Label>
                    <Input
                      id="dimensoes"
                      value={formData.dimensoes}
                      onChange={(e) => handleInputChange('dimensoes', e.target.value)}
                      placeholder="Ex: 100x50cm, 2mx1m"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Área (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      step="0.01"
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Quantidade e Unidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade *</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      step="0.01"
                      value={formData.quantidade}
                      onChange={(e) => handleInputChange('quantidade', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidadeMedida">Unidade de Medida *</Label>
                    <Select value={formData.unidadeMedida} onValueChange={(value) => handleInputChange('unidadeMedida', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m²">m²</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="un">unidade</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="l">litro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Material e Cor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material *</Label>
                    <Select value={formData.material} onValueChange={(value) => handleInputChange('material', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PVC">PVC</SelectItem>
                        <SelectItem value="ADESIVO">Adesivo</SelectItem>
                        <SelectItem value="TECIDO">Tecido</SelectItem>
                        <SelectItem value="LONA">Lona</SelectItem>
                        <SelectItem value="PAPEL">Papel</SelectItem>
                        <SelectItem value="ACRILICO">Acrílico</SelectItem>
                        <SelectItem value="MDF">MDF</SelectItem>
                        <SelectItem value="OUTRO">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor</Label>
                    <Input
                      id="cor"
                      value={formData.cor}
                      onChange={(e) => handleInputChange('cor', e.target.value)}
                      placeholder="Ex: Branco, Preto, Azul"
                    />
                  </div>
                </div>

                {/* Acabamento e Origem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acabamento">Acabamento</Label>
                    <Select value={formData.acabamento} onValueChange={(value) => handleInputChange('acabamento', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o acabamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LAMINADO">Laminado</SelectItem>
                        <SelectItem value="FOSCO">Fosco</SelectItem>
                        <SelectItem value="BRILHANTE">Brilhante</SelectItem>
                        <SelectItem value="TEXTURIZADO">Texturizado</SelectItem>
                        <SelectItem value="SEM_ACABAMENTO">Sem acabamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="origem">Origem</Label>
                    <Input
                      id="origem"
                      value={formData.origem}
                      onChange={(e) => handleInputChange('origem', e.target.value)}
                      placeholder="Ex: Projeto ABC, Cliente XYZ"
                    />
                  </div>
                </div>

                {/* Orçamento de Origem */}
                <div className="space-y-2">
                  <Label htmlFor="orcamentoOrigem">Orçamento de Origem</Label>
                  <Input
                    id="orcamentoOrigem"
                    value={formData.orcamentoOrigem}
                    onChange={(e) => handleInputChange('orcamentoOrigem', e.target.value)}
                    placeholder="Código do orçamento que gerou a sobra"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Sobra'}
                  </Button>
                  <Link href="/estoque/sobras">
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Informações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Como registrar sobras:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Selecione o item de estoque de origem</li>
                  <li>• Descreva detalhadamente a sobra</li>
                  <li>• Informe as dimensões e área quando possível</li>
                  <li>• Especifique o material e características</li>
                  <li>• Registre a origem para rastreabilidade</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Benefícios:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Redução de custos com materiais</li>
                  <li>• Melhor aproveitamento de recursos</li>
                  <li>• Rastreabilidade completa</li>
                  <li>• Sugestões automáticas para novos projetos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p>• Sempre meça as dimensões quando possível</p>
                <p>• Registre a cor e acabamento para facilitar buscas</p>
                <p>• Use descrições detalhadas para facilitar o aproveitamento</p>
                <p>• Mantenha as sobras organizadas por localização</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
