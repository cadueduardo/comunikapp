'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Package,
  CheckSquare,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState } from 'react';

interface MaterialDetalhe {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  display: string;
  categoria?: string;
  tipo_material?: string;
  disponivel_estoque?: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
  custo_unitario?: number;
  custo_total?: number;
  origem?: string;
  orcamento_id?: string;
  data_calculo?: string;
}

interface ProdutoDetalhe {
  id: string;
  nome: string;
  quantidade: number;
  materiais?: MaterialDetalhe[];
}

interface ChecklistEstoqueProps {
  produtos?: ProdutoDetalhe[];
  alertas_estoque?: string[];
  recomendacoes_estoque?: string[];
  materiais_disponivel?: boolean;
  aprovacao_tecnica_status?: string;
}

export function ChecklistEstoque({ 
  produtos = [], 
  alertas_estoque = [], 
  recomendacoes_estoque = [],
  materiais_disponivel = false,
  aprovacao_tecnica_status = 'AGUARDANDO'
}: ChecklistEstoqueProps) {
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

  const toggleMaterialExpansion = (materialId: string) => {
    const newExpanded = new Set(expandedMaterials);
    if (newExpanded.has(materialId)) {
      newExpanded.delete(materialId);
    } else {
      newExpanded.add(materialId);
    }
    setExpandedMaterials(newExpanded);
  };

  const getStatusIcon = (material: MaterialDetalhe) => {
    if (material.disponivel_estoque) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (material.quantidade_disponivel && material.quantidade_disponivel > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (material: MaterialDetalhe) => {
    if (material.disponivel_estoque) {
      return { text: 'Disponível', color: 'text-green-600' };
    } else if (material.quantidade_disponivel && material.quantidade_disponivel > 0) {
      return { text: 'Parcial', color: 'text-yellow-600' };
    } else {
      return { text: 'Indisponível', color: 'text-red-600' };
    }
  };

  const getAprovacaoStatus = () => {
    switch (aprovacao_tecnica_status) {
      case 'APROVADA':
        return { 
          icon: <CheckCircle className="h-3 w-3 text-green-500" />, 
          text: 'Liberada', 
          color: 'text-green-600 font-medium' 
        };
      case 'AGUARDANDO':
        return { 
          icon: <Clock className="h-3 w-3 text-yellow-500" />, 
          text: 'Aguardando', 
          color: 'text-yellow-600 font-medium' 
        };
      default:
        return { 
          icon: <XCircle className="h-3 w-3 text-red-500" />, 
          text: 'Bloqueada', 
          color: 'text-red-600 font-medium' 
        };
    }
  };

  const aprovacaoStatus = getAprovacaoStatus();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <CheckSquare className="h-4 w-4" />
            <span>Checklist de Estoque</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 px-2 text-xs"
          >
            {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showDetails ? 'Resumido' : 'Detalhado'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Status Geral */}
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4" />
          <Badge className={materiais_disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {materiais_disponivel ? 'Estoque OK' : 'Verificar Estoque'}
          </Badge>
        </div>

        {/* Lista de Materiais */}
        {produtos.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Materiais Necessários:</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {produtos.map((produto) => 
                produto.materiais?.map((material) => (
                  <div key={`${produto.id}-${material.id}`} className="border rounded-lg">
                    <div 
                      className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleMaterialExpansion(`${produto.id}-${material.id}`)}
                      title={`${material.nome} - ${material.display}`} // Tooltip com descrição completa
                    >
                      <div className="flex-1 min-w-0 pr-4"> {/* Adicionado pr-4 para espaçamento */}
                        <div className="font-medium truncate" title={material.nome}>
                          {material.nome}
                        </div>
                        <div className="text-gray-600">{material.display}</div>
                      </div>
                      <div className="flex items-center space-x-3"> {/* Aumentado space-x-2 para space-x-3 */}
                        <div className="text-right">
                          <div className={`text-xs ${getStatusText(material).color}`}>
                            {getStatusText(material).text}
                          </div>
                        </div>
                        <div title={`${getStatusText(material).text} em estoque`}> {/* Tooltip no ícone */}
                          {getStatusIcon(material)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Detalhes Expandidos */}
                    {expandedMaterials.has(`${produto.id}-${material.id}`) && showDetails && (
                      <div className="px-2 pb-2 space-y-1 text-xs border-t bg-white">
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div>
                            <span className="text-gray-500">Produto:</span>
                            <div className="font-medium">{produto.nome}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Categoria:</span>
                            <div className="font-medium">{material.categoria || 'N/A'}</div>
                          </div>
                          {material.quantidade_disponivel !== undefined && (
                            <div>
                              <span className="text-gray-500">Disponível:</span>
                              <div className="font-medium">{material.quantidade_disponivel} {material.unidade}</div>
                            </div>
                          )}
                          {material.localizacao_estoque && (
                            <div>
                              <span className="text-gray-500">Localização:</span>
                              <div className="font-medium">{material.localizacao_estoque}</div>
                            </div>
                          )}
                        </div>
                        
                        {material.custo_unitario && (
                          <div className="pt-1 border-t">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Custo unitário:</span>
                              <span className="font-medium">R$ {material.custo_unitario.toFixed(2)}</span>
                            </div>
                            {material.custo_total && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Custo total:</span>
                                <span className="font-medium">R$ {material.custo_total.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Alertas */}
        {alertas_estoque.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-orange-600">⚠️ Alertas:</div>
            <div className="space-y-1">
              {alertas_estoque.slice(0, 3).map((alerta, index) => (
                <div key={index} className="text-xs text-orange-700 p-2 bg-orange-50 rounded border-l-2 border-orange-300">
                  • {alerta}
                </div>
              ))}
              {alertas_estoque.length > 3 && (
                <div className="text-xs text-orange-600">
                  +{alertas_estoque.length - 3} mais alertas...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recomendações */}
        {recomendacoes_estoque.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-blue-600">💡 Recomendações:</div>
            <div className="space-y-1">
              {recomendacoes_estoque.slice(0, 2).map((recomendacao, index) => (
                <div key={index} className="text-xs text-blue-700 p-2 bg-blue-50 rounded border-l-2 border-blue-300">
                  • {recomendacao}
                </div>
              ))}
              {recomendacoes_estoque.length > 2 && (
                <div className="text-xs text-blue-600">
                  +{recomendacoes_estoque.length - 2} mais recomendações...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status de Aprovação */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Aprovação Técnica:</span>
            <div className="flex items-center space-x-1">
              {aprovacaoStatus.icon}
              <span className={aprovacaoStatus.color}>{aprovacaoStatus.text}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
