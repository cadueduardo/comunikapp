'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowRight, 
  ArrowLeft, 
  Save,
  Package,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ItemEstoque {
  id: string;
  codigo: string;
  nome: string;
  insumoNome: string;
  localizacaoId: string;
  localizacaoCodigo: string;
  quantidadeAtual: number;
  unidadeCompra: string;
}

interface Localizacao {
  id: string;
  codigo: string;
  deposito: string;
  descricao?: string;
}

export default function NovaTransferenciaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itensEstoque, setItensEstoque] = useState<ItemEstoque[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [formData, setFormData] = useState({
    itemId: '',
    localizacaoOrigemId: '',
    localizacaoDestinoId: '',
    quantidade: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchItensEstoque();
    fetchLocalizacoes();
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

  const fetchLocalizacoes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/estoque/localizacoes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLocalizacoes(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar localizações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/estoque/transferencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantidade: parseFloat(formData.quantidade),
        }),
      });

      if (response.ok) {
        toast.success('Transferência realizada com sucesso!');
        router.push('/estoque/transferencias');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao realizar transferência');
      }
    } catch (error) {
      toast.error('Erro ao realizar transferência');
      console.error('Erro ao realizar transferência:', error);
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

  const itemSelecionado = itensEstoque.find(item => item.id === formData.itemId);
  const localizacaoOrigem = localizacoes.find(loc => loc.id === formData.localizacaoOrigemId);
  const localizacaoDestino = localizacoes.find(loc => loc.id === formData.localizacaoDestinoId);

  const itensDisponiveis = itensEstoque.filter(item => 
    item.quantidadeAtual > 0 && 
    (!formData.localizacaoOrigemId || item.localizacaoId === formData.localizacaoOrigemId)
  );

  const localizacoesComEstoque = localizacoes.filter(loc =>
    itensEstoque.some(i => i.localizacaoId === loc.id && i.quantidadeAtual > 0)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque/transferencias">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowRight className="h-8 w-8" />
              Nova Transferência
            </h1>
            <p className="text-gray-600 mt-1">
              Transferir itens entre localizações
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização de Origem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="localizacaoOrigemId">Localização de Origem *</Label>
                <select
                  id="localizacaoOrigemId"
                  value={formData.localizacaoOrigemId}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Ao mudar a origem, resetar item e quantidade
                    setFormData(prev => ({ ...prev, localizacaoOrigemId: value, itemId: '', quantidade: '' }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione a localização de origem</option>
                  {localizacoesComEstoque.map((localizacao) => (
                    <option key={localizacao.id} value={localizacao.id}>
                      {localizacao.codigo} - {localizacao.deposito}
                      {localizacao.descricao && ` (${localizacao.descricao})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="itemId">Item de Estoque *</Label>
                <select
                  id="itemId"
                  value={formData.itemId}
                  onChange={(e) => {
                    const value = e.target.value;
                    const item = itensDisponiveis.find(i => i.id === value);
                    setFormData(prev => ({
                      ...prev,
                      itemId: value,
                      // No modelo atual, transferência deve ser do total disponível
                      quantidade: item ? String(item.quantidadeAtual) : ''
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.localizacaoOrigemId}
                >
                  <option value="">
                    {formData.localizacaoOrigemId 
                      ? 'Selecione um item' 
                      : 'Primeiro selecione a localização de origem'
                    }
                  </option>
                  {itensDisponiveis.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} - {item.nome} ({item.insumoNome}) - {item.quantidadeAtual} {item.unidadeCompra}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Destino */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização de Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="localizacaoDestinoId">Localização de Destino *</Label>
                <select
                  id="localizacaoDestinoId"
                  value={formData.localizacaoDestinoId}
                  onChange={(e) => handleInputChange('localizacaoDestinoId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione a localização de destino</option>
                  {localizacoes
                    .filter(loc => loc.id !== formData.localizacaoOrigemId)
                    .map((localizacao) => (
                      <option key={localizacao.id} value={localizacao.id}>
                        {localizacao.codigo} - {localizacao.deposito}
                        {localizacao.descricao && ` (${localizacao.descricao})`}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label htmlFor="quantidade">Quantidade a Transferir *</Label>
                 <div className="flex gap-2">
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.01"
                    value={formData.quantidade}
                    onChange={(e) => handleInputChange('quantidade', e.target.value)}
                    placeholder="0.00"
                    required
                    min={0.01}
                    max={itemSelecionado?.quantidadeAtual || undefined}
                  />
                  {itemSelecionado && (
                    <span className="flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-md">
                      {itemSelecionado.unidadeCompra}
                    </span>
                  )}
                </div>
                {itemSelecionado && (
                  <p className="text-sm text-gray-500 mt-1">
                    Disponível: {itemSelecionado.quantidadeAtual} {itemSelecionado.unidadeCompra}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações sobre a transferência..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Resumo da Transferência */}
        {itemSelecionado && localizacaoOrigem && localizacaoDestino && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Transferência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{itemSelecionado.nome}</p>
                    <p className="text-sm text-gray-500">{itemSelecionado.insumoNome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">De: {localizacaoOrigem.codigo}</p>
                    <p className="text-sm text-gray-500">{localizacaoOrigem.deposito}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Para: {localizacaoDestino.codigo}</p>
                    <p className="text-sm text-gray-500">{localizacaoDestino.deposito}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Quantidade:</strong> {formData.quantidade} {itemSelecionado.unidadeCompra}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Link href="/estoque/transferencias">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={loading || !formData.itemId || !formData.localizacaoOrigemId || !formData.localizacaoDestinoId || !formData.quantidade}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Realizando...' : 'Realizar Transferência'}
          </Button>
        </div>
      </form>
    </div>
  );
}
