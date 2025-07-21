'use client';

import { Insumo } from '@/app/(main)/insumos/columns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Package, DollarSign, Tag } from 'lucide-react';
import Link from 'next/link';

interface InsumoCardProps {
  insumo: Insumo;
  onDelete: (id: string, nome: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function InsumoCard({ insumo, onDelete }: InsumoCardProps) {
  const formatUnidadeCompra = () => {
    return `1 ${insumo.unidade_compra}`;
  };

  const formatQuantidadePorUnidade = () => {
    const largura = insumo.largura;
    const altura = insumo.altura;
    const quantidadeCompra = Number(insumo.quantidade_compra);
    const unidadeDimensao = insumo.unidade_dimensao;
    const unidadeCompra = insumo.unidade_compra;
    
    // Regra 1: Se unidade de compra é PACOTE, mostrar quantidade de unidades
    if (unidadeCompra === 'PACOTE' || unidadeCompra === 'UNID') {
      return `${quantidadeCompra} unidades`;
    }
    // Regra 2: Se unidade de compra é ROLO, mostrar comprimento em metros
    else if (unidadeCompra === 'ROLO') {
      if (altura && unidadeDimensao) {
        const alturaNum = Number(altura);
        let alturaEmMetros = alturaNum;
        
        switch (unidadeDimensao) {
          case 'CENTÍMETROS':
          case 'CM':
            alturaEmMetros = alturaNum / 100;
            break;
          case 'MILÍMETROS':
          case 'MM':
            alturaEmMetros = alturaNum / 1000;
            break;
          case 'METROS':
          case 'M':
            // Já está em metros
            break;
        }
        
        return `${alturaEmMetros.toFixed(1)} M`;
      } else {
        return `${quantidadeCompra} M`;
      }
    }
    // Regra 3: Se unidade de compra é BOBINA, mostrar área em metros quadrados
    else if (unidadeCompra === 'BOBINA') {
      if (largura && altura && unidadeDimensao) {
        const larguraNum = Number(largura);
        const alturaNum = Number(altura);
        
        let larguraEmMetros = larguraNum;
        let alturaEmMetros = alturaNum;
        
        switch (unidadeDimensao) {
          case 'CENTÍMETROS':
          case 'CM':
            larguraEmMetros = larguraNum / 100;
            alturaEmMetros = alturaNum / 100;
            break;
          case 'MILÍMETROS':
          case 'MM':
            larguraEmMetros = larguraNum / 1000;
            alturaEmMetros = alturaNum / 1000;
            break;
          case 'METROS':
          case 'M':
            // Já está em metros
            break;
        }
        
        const area = larguraEmMetros * alturaEmMetros;
        return `${area.toFixed(1)} M2`;
      } else {
        return `${quantidadeCompra} M2`;
      }
    }
    // Caso padrão: usar quantidade com unidade de uso
    else if (quantidadeCompra > 0) {
      return `${quantidadeCompra} ${insumo.unidade_uso}`;
    }
    
    return '-';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header com nome e ações */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {insumo.nome}
          </h3>
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
            <DropdownMenuItem asChild>
              <Link href={`/insumos/editar/${insumo.id}`}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(insumo.id, insumo.nome)}>
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Informações principais */}
      <div className="space-y-2">
        {/* Categoria e Fornecedor */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Tag className="h-4 w-4" />
          <span>{insumo.categoria.nome}</span>
          <span>•</span>
          <span>{insumo.fornecedor.nome}</span>
        </div>

        {/* Custo */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium">
            {formatCurrency(Number(insumo.custo_unitario))}
          </span>
        </div>

        {/* Unidade de Compra e Quantidade por Unidade */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="h-4 w-4" />
          <span>{formatUnidadeCompra()}</span>
          <span>•</span>
          <span>{formatQuantidadePorUnidade()}</span>
        </div>

        {/* Unidade de uso e fator */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Uso: {insumo.unidade_uso}</span>
          <span>Fator: {Number(insumo.fator_conversao).toFixed(4)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className={`px-2 py-1 rounded-full text-xs ${
          Boolean(insumo.ativo)
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {Boolean(insumo.ativo) ? 'Ativo' : 'Inativo'}
        </span>
      </div>
    </div>
  );
} 