'use client';

import { TipoMaterial } from '@/app/(main)/configuracoes/tipos-material/columns';
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
import { MoreHorizontal, Package, Settings, Info } from 'lucide-react';
import Link from 'next/link';

interface TipoMaterialCardProps {
  tipoMaterial: TipoMaterial;
  onDelete: (id: string, nome: string) => void;
}

const getLogicaConsumoColor = (logica: string) => {
  switch (logica) {
    case 'area':
      return 'bg-green-100 text-green-800';
    case 'perimetro':
      return 'bg-blue-100 text-blue-800';
    case 'quantidade_fixa':
      return 'bg-purple-100 text-purple-800';
    case 'custom':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getLogicaConsumoLabel = (logica: string) => {
  switch (logica) {
    case 'area':
      return 'Área (m²)';
    case 'perimetro':
      return 'Perímetro (m)';
    case 'quantidade_fixa':
      return 'Quantidade Fixa';
    case 'custom':
      return 'Personalizado';
    default:
      return logica;
  }
};

const formatParametros = (parametros: Record<string, string | number> | null | undefined) => {
  if (!parametros) return 'Nenhum parâmetro';
  
  const params = [];
  
  if (parametros.tipo_calculo) {
    params.push(`Tipo: ${parametros.tipo_calculo}`);
  }
  
  if (parametros.espacamento) {
    params.push(`Espaçamento: ${parametros.espacamento}cm`);
  }
  
  if (parametros.quantidade_por_m2) {
    params.push(`${parametros.quantidade_por_m2} por m²`);
  }
  
  if (parametros.multiplicador) {
    params.push(`×${parametros.multiplicador}`);
  }
  
  if (parametros.quantidade_fixa) {
    params.push(`${parametros.quantidade_fixa} unidades`);
  }
  
  return params.join(', ') || 'Nenhum parâmetro';
};

export function TipoMaterialCard({ tipoMaterial, onDelete }: TipoMaterialCardProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {tipoMaterial.nome}
              </h3>
              {tipoMaterial.descricao && (
                <p className="text-sm text-gray-600 mt-1">
                  {tipoMaterial.descricao}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/configuracoes/tipos-material/editar/${tipoMaterial.id}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(tipoMaterial.id, tipoMaterial.nome)}
                className="text-red-600"
              >
                <Info className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Lógica:</span>
            <Badge className={getLogicaConsumoColor(tipoMaterial.logica_consumo)}>
              {getLogicaConsumoLabel(tipoMaterial.logica_consumo)}
            </Badge>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-gray-700">Parâmetros:</span>
            <span className="text-sm text-gray-600">
              {formatParametros(tipoMaterial.parametros_padrao)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 