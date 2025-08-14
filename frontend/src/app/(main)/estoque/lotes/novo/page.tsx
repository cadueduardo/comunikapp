'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  ArrowLeft, 
  Save,
  Calendar,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ItemEstoque {
  id: string;
  codigo: string;
  nome: string;
  insumoNome: string;
  localizacaoCodigo: string;
  quantidadeAtual: number;
  unidadeCompra: string;
}

export default function NovoLotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itensEstoque, setItensEstoque] = useState<ItemEstoque[]>([]);
  const [formData, setFormData] = useState({
    estoqueId: '',
    numeroLote: '',
    dataFabricacao: '',
    dataValidade: '',
    quantidadeLote: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchItensEstoque();
  }, []);

  const fetchItensEstoque = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/estoque/itens', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setItensEstoque(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar itens de estoque:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/estoque/lotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantidadeLote: parseFloat(formData.quantidadeLote),
          dataFabricacao: formData.dataFabricacao || null,
          dataValidade: formData.dataValidade || null,
        }),
      });

      if (response.ok) {
        toast.success('Lote criado com sucesso!');
        router.push('/estoque/lotes');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao criar lote');
      }
    } catch (error) {
      toast.error('Erro ao criar lote');
      console.error('Erro ao criar lote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const itemSelecionado = itensEstoque.find(item => item.id === formData.estoqueId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque/lotes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-8 w-8" />
              Novo Lote
            </h1>
            <p className="text-gray-600 mt-1">
              Criar novo lote de estoque
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Lote */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Informações do Lote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="estoqueId">Item de Estoque *</Label>
                <select
                  id="estoqueId"
                  value={formData.estoqueId}
                  onChange={(e) => handleInputChange('estoqueId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um item</option>
                  {itensEstoque.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} - {item.nome} ({item.insumoNome}) - {item.localizacaoCodigo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="numeroLote">Número do Lote *</Label>
                <Input
                  id="numeroLote"
                  value={formData.numeroLote}
                  onChange={(e) => handleInputChange('numeroLote', e.target.value)}
                  placeholder="Ex: LOT-2024-001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="quantidadeLote">Quantidade do Lote *</Label>
                <div className="flex gap-2">
                  <Input
                    id="quantidadeLote"
                    type="number"
                    step="0.01"
                    value={formData.quantidadeLote}
                    onChange={(e) => handleInputChange('quantidadeLote', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  {itemSelecionado && (
                    <span className="flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-md">
                      {itemSelecionado.unidadeCompra}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dataFabricacao">Data de Fabricação</Label>
                <Input
                  id="dataFabricacao"
                  type="date"
                  value={formData.dataFabricacao}
                  onChange={(e) => handleInputChange('dataFabricacao', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dataValidade">Data de Validade</Label>
                <Input
                  id="dataValidade"
                  type="date"
                  value={formData.dataValidade}
                  onChange={(e) => handleInputChange('dataValidade', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações sobre o lote..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Item Selecionado */}
        {itemSelecionado && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Item Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Código</Label>
                  <p className="text-sm text-gray-900">{itemSelecionado.codigo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome</Label>
                  <p className="text-sm text-gray-900">{itemSelecionado.nome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Insumo</Label>
                  <p className="text-sm text-gray-900">{itemSelecionado.insumoNome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Localização</Label>
                  <p className="text-sm text-gray-900">{itemSelecionado.localizacaoCodigo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Quantidade Atual</Label>
                  <p className="text-sm text-gray-900">
                    {itemSelecionado.quantidadeAtual} {itemSelecionado.unidadeCompra}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Unidade</Label>
                  <p className="text-sm text-gray-900">{itemSelecionado.unidadeCompra}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Link href="/estoque/lotes">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Criando...' : 'Criar Lote'}
          </Button>
        </div>
      </form>
    </div>
  );
}
