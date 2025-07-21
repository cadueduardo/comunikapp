"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface TipoMaterial {
  id: string;
  nome: string;
  descricao?: string;
  logica_consumo: string;
  parametros_padrao?: Record<string, string | number>;
  criado_em: string;
  atualizado_em: string;
}

interface ColumnsProps {
  onEdit: (tipoMaterial: TipoMaterial) => void;
  onDelete: (id: string, nome: string) => void;
}

export const createColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<TipoMaterial>[] => [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
    cell: ({ row }) => {
      const descricao = row.getValue("descricao") as string;
      return descricao || "-";
    },
  },
  {
    accessorKey: "logica_consumo",
    header: "Lógica de Consumo",
    cell: ({ row }) => {
      const logica = row.getValue("logica_consumo") as string;
      const getBadgeVariant = (logica: string) => {
        switch (logica) {
          case 'area':
            return 'default';
          case 'perimetro':
            return 'secondary';
          case 'quantidade_fixa':
            return 'outline';
          case 'custom':
            return 'default';
          default:
            return 'default';
        }
      };
      
      const getLogicaLabel = (logica: string) => {
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

      return (
        <Badge variant={getBadgeVariant(logica)}>
          {getLogicaLabel(logica)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "parametros_padrao",
    header: "Parâmetros",
    cell: ({ row }) => {
      const parametros = row.getValue("parametros_padrao") as Record<string, string | number> | undefined;
      if (!parametros) return "-";
      
      const parametrosArray = Object.entries(parametros).map(([key, value]) => {
        const keyLabel = key === 'espacamento' ? 'Espaçamento' : 
                        key === 'quantidade_por_m2' ? 'Qtd/m²' :
                        key === 'multiplicador' ? 'Multiplicador' :
                        key === 'quantidade_fixa' ? 'Qtd Fixa' : key;
        return `${keyLabel}: ${value}`;
      });
      
      return parametrosArray.join(', ');
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const tipoMaterial = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(tipoMaterial)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(tipoMaterial.id, tipoMaterial.nome)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 