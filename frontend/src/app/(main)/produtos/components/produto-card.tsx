'use client';

import { Produto } from '../columns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Package, Tag, Clock, DollarSign, Settings } from 'lucide-react';
import Link from 'next/link';

interface ProdutoCardProps {
  produto: Produto;
  onDelete: (id: string, nome: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatHours = (hours: number) => {
  return `${hours.toFixed(2)}h`;
};

export function ProdutoCard({ produto, onDelete }: ProdutoCardProps) {
  const custoTotalInsumos = produto.itens.reduce((sum, item) => sum + item.custo_total, 0);
  const custoTotalMaquinas = produto.maquinas.reduce((sum, maquina) => sum + maquina.custo_total, 0);
  const custoTotalFuncoes = produto.funcoes.reduce((sum, funcao) => sum + funcao.custo_total, 0);
  const custoTotal = custoTotalInsumos + custoTotalMaquinas + custoTotalFuncoes;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header com nome e ações */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate pr-8" title={produto.nome}>
            {produto.nome}
          </h3>
          <div className="flex gap-2 mt-1">
            <Badge 
              variant={produto.ativo ? 'default' : 'secondary'}
              className={`text-xs ${
                produto.ativo 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              }`}
            >
              {produto.ativo ? '✅ Ativo' : '❌ Inativo'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {produto.categoria}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/produtos/${produto.id}/editar`}>
                Editar Produto
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(produto.id, produto.nome)}
              className="text-red-600"
            >
              Excluir Produto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Informações principais */}
      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-medium text-gray-900">Serviço:</span>
          <span className="text-gray-600 ml-1">{produto.nome_servico}</span>
        </div>
        
        {produto.descricao && (
          <div className="text-sm">
            <span className="font-medium text-gray-900">Descrição:</span>
            <span className="text-gray-600 ml-1 line-clamp-2">{produto.descricao}</span>
          </div>
        )}

        {/* Dimensões */}
        {(produto.largura_produto || produto.altura_produto) && (
          <div className="text-sm">
            <span className="font-medium text-gray-900">Dimensões:</span>
            <span className="text-gray-600 ml-1">
              {produto.largura_produto && produto.altura_produto 
                ? `${produto.largura_produto} × ${produto.altura_produto} ${produto.unidade_medida_produto || 'cm'}`
                : produto.area_produto 
                  ? `${produto.area_produto} ${produto.unidade_medida_produto || 'cm²'}`
                  : 'N/A'
              }
            </span>
          </div>
        )}

        {/* Quantidade padrão */}
        {produto.quantidade_padrao && (
          <div className="text-sm">
            <span className="font-medium text-gray-900">Qtd. Padrão:</span>
            <span className="text-gray-600 ml-1">{produto.quantidade_padrao}</span>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Horas</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {formatHours(produto.horas_producao)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium">Insumos</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {produto.itens.length}
          </div>
        </div>
      </div>

      {/* Custos */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900">Custo Total:</span>
          <span className="font-semibold text-green-600">{formatCurrency(custoTotal)}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
          <div className="text-center">
            <div className="text-gray-500">Materiais</div>
            <div className="font-medium">{formatCurrency(custoTotalInsumos)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Máquinas</div>
            <div className="font-medium">{formatCurrency(custoTotalMaquinas)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Mão de Obra</div>
            <div className="font-medium">{formatCurrency(custoTotalFuncoes)}</div>
          </div>
        </div>
      </div>

      {/* Máquinas e Funções */}
      {(produto.maquinas.length > 0 || produto.funcoes.length > 0) && (
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Recursos utilizados:</div>
          
          {produto.maquinas.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Máquinas:</div>
              <div className="flex flex-wrap gap-1">
                {produto.maquinas.map((maquina) => (
                  <Badge key={maquina.id} variant="outline" className="text-xs">
                    {maquina.maquina.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {produto.funcoes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Funções:</div>
              <div className="flex flex-wrap gap-1">
                {produto.funcoes.map((funcao) => (
                  <Badge key={funcao.id} variant="outline" className="text-xs">
                    {funcao.funcao.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 