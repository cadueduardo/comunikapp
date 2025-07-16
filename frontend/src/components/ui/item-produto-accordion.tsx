'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface ItemProduto {
  id: string;
  nome_servico: string;
  descricao?: string;
  largura_produto?: number;
  altura_produto?: number;
  unidade_medida_produto?: string;
  area_produto?: number;
  custo_material: number;
  custo_mao_obra: number;
  custo_indireto: number;
  custo_total: number;
  preco_final: number;
  ordem: number;
  itens_insumo?: Array<{
    id: string;
    insumo: {
      nome: string;
      unidade_medida: string;
    };
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
  }>;
}

interface ItemProdutoAccordionProps {
  item: ItemProduto;
  onEdit?: (item: ItemProduto) => void;
  onDelete?: (itemId: string) => void;
  isEditable?: boolean;
}

export function ItemProdutoAccordion({ 
  item, 
  onEdit, 
  onDelete, 
  isEditable = false 
}: ItemProdutoAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span
              onClick={toggleExpanded}
              className="p-1 h-6 w-6 cursor-pointer hover:bg-gray-100 rounded flex items-center justify-center"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
            
            <div className="flex-1">
              <CardTitle className="text-lg">{item.nome_servico}</CardTitle>
              {item.descricao && (
                <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(item.preco_final)}
              </div>
              <Badge variant="secondary" className="mt-1">
                Item #{item.ordem + 1}
              </Badge>
            </div>
          </div>
          
          {isEditable && (
            <div className="flex gap-2 ml-4">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Medidas do Produto */}
            {(item.largura_produto || item.altura_produto) && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Medidas do Produto</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {item.largura_produto && (
                    <div>
                      <span className="text-gray-600">Largura:</span>
                      <span className="ml-2 font-medium">
                        {item.largura_produto} {item.unidade_medida_produto}
                      </span>
                    </div>
                  )}
                  {item.altura_produto && (
                    <div>
                      <span className="text-gray-600">Altura:</span>
                      <span className="ml-2 font-medium">
                        {item.altura_produto} {item.unidade_medida_produto}
                      </span>
                    </div>
                  )}
                  {item.area_produto && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Área:</span>
                      <span className="ml-2 font-medium">
                        {item.area_produto} m²
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Materiais Utilizados */}
            {item.itens_insumo && item.itens_insumo.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Materiais Utilizados</h4>
                <div className="space-y-2">
                  {item.itens_insumo.map((insumo) => (
                    <div key={insumo.id} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{insumo.insumo.nome}</span>
                        <span className="text-gray-600 ml-2">
                          ({insumo.quantidade} {insumo.insumo.unidade_medida})
                        </span>
                      </div>
                      <span className="font-medium">{formatCurrency(insumo.custo_total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custos Detalhados */}
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Custos Detalhados</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo Material:</span>
                  <span>{formatCurrency(item.custo_material)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo Mão de Obra:</span>
                  <span>{formatCurrency(item.custo_mao_obra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo Indireto:</span>
                  <span>{formatCurrency(item.custo_indireto)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">Custo Total:</span>
                  <span className="font-medium">{formatCurrency(item.custo_total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 