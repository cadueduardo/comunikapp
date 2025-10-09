'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Scissors,
  Recycle
} from 'lucide-react';

interface MaterialCalculado {
  insumo_id: string;
  nome: string;
  tipo_material: string;
  unidade_compra: string;
  dimensoes_compra: {
    largura: number;
    comprimento: number;
    area_unidade: number;
  };
  quantidade_necessaria: number;
  desperdicio_percentual: number;
  desperdicio_area: number;
  area_total_com_desperdicio: number;
  unidades_necessarias: number;
  area_total_comprada: number;
  sobra_aproveitavel: number;
  custo_unitario: number;
  custo_total: number;
  estoque_disponivel: number;
  estoque_suficiente: boolean;
  sugestoes_otimizacao: string[];
}

interface ResultadoCalculoMaterial {
  materiais: MaterialCalculado[];
  resumo: {
    total_materiais: number;
    materiais_suficientes: number;
    materiais_insuficientes: number;
    custo_total: number;
    desperdicio_total: number;
    sobras_aproveitaveis: number;
  };
  alertas: string[];
  recomendacoes: string[];
}

interface CalculoMaterialCardProps {
  osId: string;
  onCalculoChange?: (resultado: ResultadoCalculoMaterial) => void;
}

export function CalculoMaterialCard({ osId, onCalculoChange }: CalculoMaterialCardProps) {
  const [resultado, setResultado] = useState<ResultadoCalculoMaterial | null>(null);
  const [loading, setLoading] = useState(false);

  const calcularMateriais = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/os/calculo-material/${osId}`);
      if (response.ok) {
        const data = await response.json();
        setResultado(data);
        onCalculoChange?.(data);
      } else {
        console.error('Erro ao calcular materiais');
      }
    } catch (error) {
      console.error('Erro ao calcular materiais:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (osId) {
      calcularMateriais();
    }
  }, [osId]);

  const getTipoMaterialIcon = (tipo: string) => {
    switch (tipo) {
      case 'LONA_FRONT':
      case 'LONA_BACK':
        return '🎨';
      case 'VINIL_ADESIVO':
        return '📄';
      case 'ACRILICO':
        return '🔲';
      case 'PAPEL':
        return '📰';
      case 'TINTA':
        return '🎨';
      case 'CORDAO':
        return '🧵';
      default:
        return '📦';
    }
  };

  const getUnidadeCompraIcon = (unidade: string) => {
    switch (unidade) {
      case 'bobina':
        return '🔄';
      case 'rolo':
        return '📜';
      case 'chapa':
        return '⬜';
      case 'litro':
        return '🫗';
      case 'metro':
        return '📏';
      default:
        return '📦';
    }
  };

  if (loading && !resultado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Cálculo Inteligente de Materiais</span>
          </CardTitle>
          <CardDescription>
            Calculando materiais necessários...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <CardTitle>Cálculo Inteligente de Materiais</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={calcularMateriais}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Calculando...' : 'Recalcular'}
          </Button>
        </div>
        <CardDescription>
          Conversão de área total para unidades de compra com otimização de desperdício
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {resultado && (
          <>
            {/* Resumo Geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <Package className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{resultado.resumo.total_materiais}</div>
                <div className="text-sm text-gray-500">Materiais</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-green-600">{resultado.resumo.materiais_suficientes}</div>
                <div className="text-sm text-gray-500">Suficientes</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">R$ {resultado.resumo.custo_total.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Custo Total</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Recycle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold text-orange-600">{resultado.resumo.sobras_aproveitaveis.toFixed(1)}m²</div>
                <div className="text-sm text-gray-500">Sobras</div>
              </div>
            </div>

            {/* Lista de Materiais */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Materiais Calculados</h4>
              {resultado.materiais.map((material, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getTipoMaterialIcon(material.tipo_material)}</span>
                      <div>
                        <div className="font-medium">{material.nome}</div>
                        <div className="text-sm text-gray-500">
                          {material.dimensoes_compra.largura}m × {material.dimensoes_compra.comprimento}m = {material.dimensoes_compra.area_unidade}m²
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={material.estoque_suficiente ? "default" : "destructive"}>
                        {material.estoque_suficiente ? "Suficiente" : "Insuficiente"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {getUnidadeCompraIcon(material.unidade_compra)} {material.unidade_compra}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Área Necessária</div>
                      <div className="font-medium">{material.quantidade_necessaria.toFixed(2)}m²</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Desperdício</div>
                      <div className="font-medium text-orange-600">
                        {material.desperdicio_area.toFixed(2)}m² ({material.desperdicio_percentual}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Unidades Necessárias</div>
                      <div className="font-medium">{material.unidades_necessarias} {material.unidade_compra}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Custo Total</div>
                      <div className="font-medium">R$ {material.custo_total.toFixed(2)}</div>
                    </div>
                  </div>

                  {material.sobra_aproveitavel > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center space-x-2 text-green-700">
                        <Recycle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Sobra aproveitável: {material.sobra_aproveitavel.toFixed(2)}m²
                        </span>
                      </div>
                    </div>
                  )}

                  {material.sugestoes_otimizacao.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-blue-700">Sugestões de Otimização:</div>
                          <ul className="text-xs text-blue-600 space-y-1">
                            {material.sugestoes_otimizacao.map((sugestao, idx) => (
                              <li key={idx}>• {sugestao}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Alertas */}
            {resultado.alertas.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-red-600">Alertas</h4>
                <div className="space-y-1">
                  {resultado.alertas.map((alerta, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <span>{alerta}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendações */}
            {resultado.recomendacoes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-blue-600">Recomendações</h4>
                <div className="space-y-1">
                  {resultado.recomendacoes.map((recomendacao, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-blue-600">
                      <TrendingUp className="h-4 w-4 mt-0.5" />
                      <span>{recomendacao}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}




