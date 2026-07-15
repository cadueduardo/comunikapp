'use client';

import { Mail, MapPin, MessageCircle, MoreHorizontal, Package, Workflow } from 'lucide-react';
import Link from 'next/link';
import {
  especialidadesDoFornecedor,
  Fornecedor,
  tipoFornecedorClassName,
  tipoFornecedorLabel,
} from '@/app/(main)/fornecedores/columns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FornecedorCardProps {
  fornecedor: Fornecedor;
  onDelete: (fornecedor: Fornecedor) => void;
}

export function FornecedorCard({ fornecedor, onDelete }: FornecedorCardProps) {
  const especialidades = especialidadesDoFornecedor(fornecedor.especialidades);
  const whatsapp = fornecedor.whatsapp?.replace(/\D/g, '');

  return (
    <div
      className={`space-y-3 rounded-lg border border-gray-200 bg-white p-4 ${
        fornecedor.ativo ? '' : 'opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-gray-900">
            {fornecedor.nome}
          </h3>
          {fornecedor.razao_social && (
            <p className="truncate text-sm text-gray-500">
              {fornecedor.razao_social}
            </p>
          )}
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
              <Link
                href={`/fornecedores/editar/${fornecedor.id}`}
              >
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(fornecedor)}>
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={tipoFornecedorClassName[fornecedor.tipo]}>
          {tipoFornecedorLabel[fornecedor.tipo]}
        </Badge>
        <Badge variant={fornecedor.ativo ? 'outline' : 'secondary'}>
          {fornecedor.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {(fornecedor.cidade || fornecedor.estado) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              {[fornecedor.cidade, fornecedor.estado]
                .filter(Boolean)
                .join(' / ')}
            </span>
          </div>
        )}
        {fornecedor.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="truncate">{fornecedor.email}</span>
          </div>
        )}
        {whatsapp && (
          <a
            className="flex items-center gap-2 text-emerald-700 hover:underline"
            href={`https://wa.me/55${whatsapp.replace(/^55/, '')}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{fornecedor.whatsapp}</span>
          </a>
        )}
      </div>

      {especialidades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t pt-3">
          {especialidades.slice(0, 4).map((especialidade) => (
            <Badge key={especialidade} variant="secondary" className="font-normal">
              {especialidade}
            </Badge>
          ))}
          {especialidades.length > 4 && (
            <Badge variant="secondary">+{especialidades.length - 4}</Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{fornecedor._count?.insumos ?? 0} insumo(s)</span>
        </div>
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-muted-foreground" />
          <span>{fornecedor._count?.itens_terceirizados ?? 0} item(ns)</span>
        </div>
      </div>
    </div>
  );
}
