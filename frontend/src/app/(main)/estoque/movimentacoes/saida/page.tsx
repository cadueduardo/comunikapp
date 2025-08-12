'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, ArrowDownRight, Package } from 'lucide-react';
import Link from 'next/link';

interface ItemEstoque {
  id: string;
  insumoId: string;
  insumoNome: string;
  localizacaoId: string;
  localizacaoCodigo: string;
  quantidadeAtual: number;
  quantidadeReservada: number;
  estoqueMinimo: number;
  estoqueMaximo?: number;
  unidadeCompra: string;
  valorUnitario: number;
}

export default function SaidaMovimentacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itensEstoque, setItensEstoque] = useState<ItemEstoque[]>([]);
  const [formData, setFormData] = useState({
    estoqueId: '',
    tipo: 'SAIDA',
    quantidade: '',
    documentoRef: '',
    observacoes: '',
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
        setItensEstoque(data.data || data);
      }
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error);
      toast.error('Erro ao carregar itens de estoque');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const requestData: any = {
      estoqueId: formData.estoqueId,
      tipo: formData.tipo,
      quantidade: parseFloat(formData.quantidade) || 0,
    };

    // Adicionar campos opcionais apenas se não estiverem vazios
    if (formData.documentoRef && formData.documentoRef.trim()) {
      requestData.documentoRef = formData.documentoRef;
    }
    
    if (formData.observacoes && formData.observacoes.trim()) {
      requestData.observacoes = formData.observacoes;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/estoque/movimentacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success('Saída de movimentação realizada com sucesso!');
        router.push('/estoque/movimentacoes');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Erro ao realizar saída de movimentação');
      }
    } catch (error) {
      console.error('Erro ao realizar saída de movimentação:', error);
      toast.error('Erro ao realizar saída de movimentação');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getItemEstoqueInfo = (estoqueId: string) => {
    const item = itensEstoque.find(item => item.id === estoqueId);
    return item;
  };

  const selectedItem = getItemEstoqueInfo(formData.estoqueId);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/estoque/movimentacoes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Saída de Movimentação</h1>
          <p className="text-muted-foreground">Registre saídas de produtos do estoque</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5" />
            Dados da Saída
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="estoqueId">Item de Estoque *</Label>
                <Select
                  value={formData.estoqueId}
                  onValueChange={(value) => handleInputChange('estoqueId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um item de estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    {itensEstoque.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.insumoNome} - {item.localizacaoCodigo} 
                        (Atual: {item.quantidadeAtual} {item.unidadeCompra})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                {selectedItem && (
                  <p className="text-sm text-muted-foreground">
                    Quantidade atual: {selectedItem.quantidadeAtual} {selectedItem.unidadeCompra}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentoRef">Documento de Referência</Label>
                <Input
                  id="documentoRef"
                  type="text"
                  value={formData.documentoRef}
                  onChange={(e) => handleInputChange('documentoRef', e.target.value)}
                  placeholder="NF, OS, etc."
                />
              </div>
            </div>

            {selectedItem && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    Informações do Item Selecionado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Insumo:</span>
                      <p>{selectedItem.insumoNome}</p>
                    </div>
                    <div>
                      <span className="font-medium">Localização:</span>
                      <p>{selectedItem.localizacaoCodigo}</p>
                    </div>
                    <div>
                      <span className="font-medium">Quantidade Atual:</span>
                      <p>{selectedItem.quantidadeAtual} {selectedItem.unidadeCompra}</p>
                    </div>
                    <div>
                      <span className="font-medium">Valor Unitário:</span>
                                             <p>R$ {selectedItem.valorUnitario ? parseFloat(selectedItem.valorUnitario.toString()).toFixed(2) : '0.00'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações sobre a saída..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/estoque/movimentacoes">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !formData.estoqueId || !formData.quantidade}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Processando...' : 'Realizar Saída'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
