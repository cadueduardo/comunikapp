'use client';

import { Cliente } from '@/app/(main)/clientes/columns';
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
import { MoreHorizontal, Edit, Trash2, FileText, Mail, Phone, MapPin, Calendar, Building2 } from 'lucide-react';
import Link from 'next/link';

interface ClienteCardProps {
  cliente: Cliente;
  onDelete: (id: string) => void;
}

export function ClienteCard({ cliente, onDelete }: ClienteCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'PROSPECT': return 'bg-blue-100 text-blue-800';
      case 'INATIVO': return 'bg-gray-100 text-gray-800';
      case 'BLOQUEADO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header com nome e ações */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate pr-8" title={cliente.nome}>
            {cliente.nome}
          </h3>
          <div className="flex gap-2 mt-1">
            <Badge className={`${getStatusColor(cliente.status_cliente)} hover:${getStatusColor(cliente.status_cliente)}`}>
              {cliente.status_cliente}
            </Badge>
            <Badge variant="outline">
              {cliente.tipo_pessoa === 'PESSOA_FISICA' ? 'P. Física' : 'P. Jurídica'}
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
            <DropdownMenuItem asChild>
              <Link href={`/orcamentos/novo?clienteId=${cliente.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Novo Orçamento
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/clientes/editar/${cliente.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(cliente.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Informações principais */}
      <div className="space-y-2">
        {/* Documento */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="h-4 w-4" />
          <span>{cliente.documento}</span>
        </div>

        {/* Email */}
        {cliente.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span className="truncate">{cliente.email}</span>
          </div>
        )}

        {/* Telefone */}
        {cliente.telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{cliente.telefone}</span>
          </div>
        )}

        {/* Cidade */}
        {cliente.cidade && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{cliente.cidade}</span>
          </div>
        )}

        {/* Data de criação */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            Desde: {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-1 pt-2 border-t border-gray-100">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/orcamentos/novo?clienteId=${cliente.id}`}>
            <FileText className="h-4 w-4 mr-1" />
            Orçamento
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clientes/editar/${cliente.id}`}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Link>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(cliente.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </div>
    </div>
  );
} 