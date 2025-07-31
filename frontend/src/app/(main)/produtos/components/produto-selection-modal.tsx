'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, Package, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

// Função para formatar horas
const formatHours = (hours: number): string => {
  if (hours === 0) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours === Math.floor(hours)) return `${hours}h`;
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}min`;
};

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  nome_servico: string;
  descricao_produto?: string;
  horas_producao: number;
  largura_produto?: number;
  altura_produto?: number;
  area_produto?: number;
  unidade_medida_produto?: string;
  quantidade_padrao?: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  itens: Array<{
    id: string;
    insumo: {
      id: string;
      nome: string;
      categoria: string;
    };
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
  }>;
  maquinas: Array<{
    id: string;
    maquina: {
      id: string;
      nome: string;
    };
    horas_utilizadas: number;
    custo_total: number;
  }>;
  funcoes: Array<{
    id: string;
    funcao: {
      id: string;
      nome: string;
    };
    horas_trabalhadas: number;
    custo_total: number;
  }>;
}

interface ProdutoSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (produto: Produto) => void;
}

export function ProdutoSelectionModal({ open, onClose, onSelect }: ProdutoSelectionModalProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [categorias, setCategorias] = useState<string[]>([]);

  // Buscar produtos
  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Token encontrado:', token ? 'Sim' : 'Não');
      
      if (!token) {
        toast.error('Usuário não autenticado');
        return;
      }

      const response = await fetch(`http://localhost:3001/produtos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 Status da resposta:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🔍 Erro da API:', errorData);
        throw new Error(`Erro ao buscar produtos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 Produtos carregados:', data.length);
      setProdutos(data);
      
      // Extrair categorias únicas
      const categoriasUnicas = [...new Set(data.map((p: Produto) => p.categoria))] as string[];
      setCategorias(categoriasUnicas);
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar produtos
  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.nome_servico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = selectedCategoria === 'all' || produto.categoria === selectedCategoria;
    return matchesSearch && matchesCategoria && produto.ativo;
  });

  // Calcular custo total do produto
  const calcularCustoTotal = (produto: Produto) => {
    const custoInsumos = produto.itens.reduce((sum, item) => sum + item.custo_total, 0);
    const custoMaquinas = produto.maquinas.reduce((sum, maquina) => sum + maquina.custo_total, 0);
    const custoFuncoes = produto.funcoes.reduce((sum, funcao) => sum + funcao.custo_total, 0);
    return custoInsumos + custoMaquinas + custoFuncoes;
  };

  // Selecionar produto
  const handleSelectProduto = (produto: Produto) => {
    onSelect(produto);
    onClose();
    toast.success(`Produto "${produto.nome}" selecionado!`);
  };

  useEffect(() => {
    if (open) {
      fetchProdutos();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selecionar Produto/Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Produtos */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Carregando produtos...</span>
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum produto encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProdutos.map((produto) => (
                <Card key={produto.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{produto.nome}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{produto.nome_servico}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{produto.categoria}</Badge>
                          <Badge variant={produto.ativo ? "default" : "destructive"}>
                            {produto.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelectProduto(produto)}
                        className="ml-2"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Selecionar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {produto.descricao && (
                      <p className="text-sm text-gray-600 mb-3">{produto.descricao}</p>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Horas de Produção:</span>
                        <p>{formatHours(produto.horas_producao)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Custo Total:</span>
                        <p className="text-green-600 font-semibold">
                          {formatCurrency(calcularCustoTotal(produto))}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Dimensões:</span>
                        <p>
                          {produto.largura_produto && produto.altura_produto
                            ? `${produto.largura_produto} x ${produto.altura_produto} ${produto.unidade_medida_produto || 'cm'}`
                            : 'Não especificado'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Detalhes dos itens */}
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Materiais ({produto.itens.length}):</span>
                        <span>{formatCurrency(produto.itens.reduce((sum, item) => sum + item.custo_total, 0))}</span>
                      </div>
                      {produto.maquinas.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Máquinas ({produto.maquinas.length}):</span>
                          <span>{formatCurrency(produto.maquinas.reduce((sum, maquina) => sum + maquina.custo_total, 0))}</span>
                        </div>
                      )}
                      {produto.funcoes.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Funções ({produto.funcoes.length}):</span>
                          <span>{formatCurrency(produto.funcoes.reduce((sum, funcao) => sum + funcao.custo_total, 0))}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 