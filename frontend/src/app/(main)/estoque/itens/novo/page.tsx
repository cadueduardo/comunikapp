'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Package, Barcode, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { UnitSelect } from '@/components/ui/unit-select';
import { UNIDADES_COMPRA } from '@/lib/unidades-compra';
import { estoqueApi, insumosApi, fornecedoresApi } from '@/lib/api-client';

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

export default function NovoItemEstoquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchInsumos();
    fetchLocalizacoes();
    fetchFornecedores();
  }, []);

  const fetchInsumos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await insumosApi.getAll(token);
      setInsumos(data);
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
    }
  };

  const fetchLocalizacoes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await estoqueApi.getLocalizacoes(token);
      setLocalizacoes(data.data || data);
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await fornecedoresApi.getAll(token, 'INSUMO');
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
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
        codigo: insumo.codigo_interno || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação básica no cliente para evitar 400
      if (!formData.insumoId || !formData.localizacaoId || !formData.nome || !formData.unidadeMedida) {
        toast.error('Preencha os campos obrigatórios: insumo, localização, nome e unidade de medida.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const payload: Record<string, any> = {
        insumoId: formData.insumoId,
        localizacaoId: formData.localizacaoId,
        nome: formData.nome,
        unidadeMedida: formData.unidadeMedida,
        quantidadeAtual: Number.isFinite(parseInt(formData.quantidadeAtual)) ? parseInt(formData.quantidadeAtual) : 0,
        quantidadeReservada: Number.isFinite(parseInt(formData.quantidadeReservada)) ? parseInt(formData.quantidadeReservada) : 0,
        estoqueMinimo: Number.isFinite(parseInt(formData.estoqueMinimo)) ? parseInt(formData.estoqueMinimo) : 0,
        precoUnitario: parseFloat(formData.precoUnitario) || 0,
        ativo: formData.ativo,
      };
      if (formData.codigo) payload.codigo = formData.codigo;
      if (formData.descricao) payload.descricao = formData.descricao;
      if (formData.estoqueMaximo) payload.estoqueMaximo = parseInt(formData.estoqueMaximo);
      if (formData.codigoBarras) payload.codigoBarras = formData.codigoBarras;
      if (formData.lote) payload.lote = formData.lote;
      if (formData.dataValidade) payload.dataValidade = formData.dataValidade;
      if (formData.fornecedorId) payload.fornecedorId = formData.fornecedorId;
      if (formData.observacoes) payload.observacoes = formData.observacoes;

      await estoqueApi.createItem(payload, token);
      toast.success('Item de estoque criado com sucesso!');
      router.push('/estoque/itens');
    } catch (error) {
      console.error('Erro ao criar item de estoque:', error);
      toast.error('Erro ao criar item de estoque');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para formatar localização para exibição
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
          <h1 className="text-2xl font-bold">Novo Item de Estoque</h1>
          <p className="text-muted-foreground">Adicione um novo item ao controle de estoque</p>
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
                <Label htmlFor="unidadeMedida">Unidade de Compra *</Label>
                <UnitSelect
                  value={formData.unidadeMedida}
                  onValueChange={(value) => handleInputChange('unidadeMedida', value)}
                  placeholder="Selecione a unidade de compra"
                  units={UNIDADES_COMPRA}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidadeAtual">Quantidade Atual</Label>
                <Input
                  id="quantidadeAtual"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.quantidadeAtual}
                  onChange={(e) => handleInputChange('quantidadeAtual', e.target.value)}
                  placeholder="0"
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
                <Label htmlFor="estoqueMaximo">Estoque Máximo (opcional)</Label>
                <Input
                  id="estoqueMaximo"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.estoqueMaximo}
                  onChange={(e) => handleInputChange('estoqueMaximo', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção: Informações Comerciais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Informações Comerciais
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
                <Label htmlFor="codigoBarras">Código de Barras</Label>
                <Input
                  id="codigoBarras"
                  value={formData.codigoBarras}
                  onChange={(e) => handleInputChange('codigoBarras', e.target.value)}
                  placeholder="Código de barras do produto"
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
                <Label htmlFor="ativo">Status</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => handleInputChange('ativo', checked as boolean)}
                  />
                  <Label htmlFor="ativo">Item ativo</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção: Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações adicionais sobre o item"
                rows={4}
              />
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
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Item'}
              </Button>
            </div>
          </form>
    </div>
  );
}
