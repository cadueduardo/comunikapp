'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Package, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { UnitSelect } from '@/components/ui/unit-select';
import { UNIDADES_COMPRA } from '@/lib/unidades-compra';
import { useUser } from '@/contexts/UserContext';

interface Insumo {
  id: string;
  nome: string;
  unidade_compra: string;
  custo_unitario: number;
  codigo_interno?: string;
}

interface Localizacao {
  id: string;
  codigo: string;
  deposito: string;
  corredor?: string;
  prateleira?: string;
  nivel?: string;
  posicao?: string;
  descricao?: string;
}

interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
}

export default function EditarItemEstoquePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolvedItemId, setResolvedItemId] = useState<string>('');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formData, setFormData] = useState({
    insumoId: '',
    localizacaoId: '',
    codigo: '',
    nome: '',
    descricao: '',
    quantidadeAtual: '',
    quantidadeReservada: '',
    unidadeMedida: '',
    precoUnitario: '',
    estoqueMinimo: '',
    estoqueMaximo: '',
    codigoBarras: '',
    lote: '',
    dataValidade: '',
    fornecedorId: '',
    observacoes: '',
    ativo: true,
  });

  const normalizeId = (value: unknown): string => String(value ?? '').trim().replace(/^:+/, '');

  useEffect(() => {
    console.log('🔍 EditarItemEstoquePage - useEffect executado');
    console.log('👤 Usuário:', user);
    console.log('🔄 User loading:', userLoading);
    
    if (!userLoading && user) {
      console.log('✅ Usuário autenticado, buscando dados...');
      fetchInsumos();
      fetchLocalizacoes();
      fetchFornecedores();
      fetchItem();
    } else if (!userLoading && !user) {
      console.log('❌ Usuário não autenticado');
      router.push('/login');
    }
  }, [id, user, userLoading, router]);

  const fetchItem = async () => {
    try {
      const token = localStorage.getItem('access_token');
      let data: any = null;
      const normalizedId = normalizeId(id);

      // Resolve sempre o ID canônico na listagem para suportar URL com itemId ou insumoId.
      const listResponse = await fetch('/api/estoque/itens', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (listResponse.ok) {
        const listData = await listResponse.json();
        const items = Array.isArray(listData) ? listData : (listData?.data ?? []);
        const matchedItem = items.find((item: any) => normalizeId(item?.id) === normalizedId);
        const matchedByInsumo = items.find((item: any) => normalizeId(item?.insumoId) === normalizedId);
        const fallbackItem = matchedItem ?? matchedByInsumo;

        if (fallbackItem?.id) {
          const canonicalId = normalizeId(fallbackItem.id);
          data = fallbackItem;
          if (canonicalId !== normalizedId) {
            router.replace(`/estoque/itens/editar/${canonicalId}`);
          }
        }
      }

      if (data) {
        const toDateInput = (value?: string) => {
          if (!value) return '';
          const d = new Date(value);
          if (Number.isNaN(d.getTime())) return '';
          return d.toISOString().split('T')[0];
        };
        setResolvedItemId(normalizeId(data.id || id));
        setFormData({
          insumoId: data.insumoId || '',
          localizacaoId: data.localizacaoId || '',
          codigo: data.codigo || '',
          nome: data.insumoNome || '',
          descricao: data.descricao || '',
          quantidadeAtual: data.quantidadeAtual?.toString() || '',
          quantidadeReservada: data.quantidadeReservada?.toString() || '',
          unidadeMedida: data.unidadeCompra || '',
          precoUnitario: data.valorUnitario?.toString() || '',
          estoqueMinimo: data.estoqueMinimo?.toString() || '',
          estoqueMaximo: data.estoqueMaximo?.toString() || '',
          codigoBarras: data.codigoBarras || '',
          lote: data.lote || '',
          dataValidade: toDateInput(data.dataValidade),
          fornecedorId: data.fornecedorId || '',
          observacoes: data.observacoes || '',
          ativo: data.ativo !== false
        });
      } else {
        toast.error('Item de estoque não encontrado para este insumo.');
      }
    } catch (error) {
      toast.error('Erro ao carregar item de estoque');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsumos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token para insumos:', token ? token.substring(0, 50) + '...' : 'Nenhum token');
      console.log('👤 Usuário atual:', user);
      
      const response = await fetch('/api/insumos', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      
      console.log('📊 Resposta da API de insumos:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Insumos carregados:', data);
        setInsumos(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro ao carregar insumos:', errorData);
        toast.error(`Erro ao carregar insumos: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar insumos:', error);
      toast.error('Erro ao buscar insumos');
    }
  };

  const fetchLocalizacoes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token para localizações:', token ? token.substring(0, 50) + '...' : 'Nenhum token');
      
      const response = await fetch('/api/estoque/localizacoes', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      
      console.log('📊 Resposta da API de localizações:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Localizações carregadas:', data);
        setLocalizacoes(data.data || data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro ao carregar localizações:', errorData);
        toast.error(`Erro ao carregar localizações: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar localizações:', error);
      toast.error('Erro ao buscar localizações');
    }
  };

  const fetchFornecedores = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token para fornecedores:', token ? token.substring(0, 50) + '...' : 'Nenhum token');
      
      const response = await fetch('/api/fornecedores', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      
      console.log('📊 Resposta da API de fornecedores:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fornecedores carregados:', data);
        setFornecedores(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro ao carregar fornecedores:', errorData);
        toast.error(`Erro ao carregar fornecedores: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar fornecedores:', error);
      toast.error('Erro ao buscar fornecedores');
    }
  };

  const handleInsumoChange = (insumoId: string) => {
    const insumo = insumos.find(i => i.id === insumoId);
    if (insumo) {
      setFormData(prev => ({
        ...prev,
        insumoId,
        nome: insumo.nome,
        unidadeMedida: insumo.unidade_compra,
        precoUnitario: insumo.custo_unitario.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('access_token');
      const itemIdToUpdate = normalizeId(resolvedItemId || id);
      const response = await fetch(`/api/estoque/itens/${itemIdToUpdate}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Item de estoque atualizado com sucesso!');
        router.push('/estoque/itens');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Erro ao atualizar item de estoque');
      }
    } catch (error) {
      console.error('Erro ao atualizar item de estoque:', error);
      toast.error('Erro ao atualizar item de estoque');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatLocalizacao = (localizacao: Localizacao) => {
    const parts = [
      localizacao.codigo,
      localizacao.deposito,
      localizacao.corredor,
      localizacao.prateleira,
      localizacao.nivel,
      localizacao.posicao
    ].filter(Boolean);
    
    return parts.join(' - ');
  };

  if (userLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-700 mb-2">
              Usuário não autenticado
            </div>
            <p className="text-sm text-gray-500">
              Redirecionando para login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando item de estoque...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/estoque/itens">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Editar Item de Estoque</h1>
          <p className="text-muted-foreground">Edite as informações do item de estoque</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção: Dados do Item */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dados do Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="insumoId">Insumo *</Label>
                <Select
                  value={formData.insumoId}
                  onValueChange={handleInsumoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um insumo" />
                  </SelectTrigger>
                  <SelectContent>
                    {insumos.map((insumo) => (
                      <SelectItem key={insumo.id} value={insumo.id}>
                        {insumo.nome} - {insumo.unidade_compra}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código do Item</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => handleInputChange('codigo', e.target.value)}
                  placeholder="Código interno do item"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Item *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Nome do item em estoque"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição detalhada do item"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção: Localização e Quantidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Localização e Quantidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="localizacaoId">Localização *</Label>
                <Select
                  value={formData.localizacaoId}
                  onValueChange={(value) => handleInputChange('localizacaoId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma localização" />
                  </SelectTrigger>
                  <SelectContent>
                    {localizacoes.map((localizacao) => (
                      <SelectItem key={localizacao.id} value={localizacao.id}>
                        {formatLocalizacao(localizacao)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidadeAtual">Quantidade Atual *</Label>
                <Input
                  id="quantidadeAtual"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.quantidadeAtual}
                  onChange={(e) => handleInputChange('quantidadeAtual', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidadeReservada">Quantidade Reservada</Label>
                <Input
                  id="quantidadeReservada"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.quantidadeReservada}
                  onChange={(e) => handleInputChange('quantidadeReservada', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidadeMedida">Unidade de Compra</Label>
                <UnitSelect
                  value={formData.unidadeMedida}
                  onValueChange={(value) => handleInputChange('unidadeMedida', value)}
                  placeholder="Selecione a unidade de compra"
                  units={UNIDADES_COMPRA}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                <Input
                  id="estoqueMinimo"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.estoqueMinimo}
                  onChange={(e) => handleInputChange('estoqueMinimo', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoqueMaximo">Estoque Máximo</Label>
                <Input
                  id="estoqueMaximo"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.estoqueMaximo}
                  onChange={(e) => handleInputChange('estoqueMaximo', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção: Valores e Custos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Valores e Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="precoUnitario">Preço Unitário</Label>
                <Input
                  id="precoUnitario"
                  type="number"
                  step="0.01"
                  value={formData.precoUnitario}
                  onChange={(e) => handleInputChange('precoUnitario', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedorId">Fornecedor</Label>
                <Select
                  value={formData.fornecedorId}
                  onValueChange={(value) => handleInputChange('fornecedorId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção: Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigoBarras">Código de Barras</Label>
                <Input
                  id="codigoBarras"
                  value={formData.codigoBarras}
                  onChange={(e) => handleInputChange('codigoBarras', e.target.value)}
                  placeholder="Código de barras do produto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lote">Lote</Label>
                <Input
                  id="lote"
                  value={formData.lote}
                  onChange={(e) => handleInputChange('lote', e.target.value)}
                  placeholder="Número do lote"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataValidade">Data de Validade</Label>
                <Input
                  id="dataValidade"
                  type="date"
                  value={formData.dataValidade}
                  onChange={(e) => handleInputChange('dataValidade', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais sobre o item"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => handleInputChange('ativo', checked as boolean)}
                />
                <Label htmlFor="ativo">Item ativo no estoque</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Link href="/estoque/itens">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
