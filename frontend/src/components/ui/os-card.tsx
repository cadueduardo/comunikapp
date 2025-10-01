'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Package,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Importar interface do arquivo de colunas
import { OrdemServico } from '@/app/(main)/os/columns';

interface OSCardProps {
  os: OrdemServico;
  onDelete: () => void;
}

// Configurações de status (reutilizando lógica das colunas)
const getStatusConfig = (status: string) => {
  const configs = {
    'FILA': { 
      variant: 'secondary' as const, 
      label: 'Na Fila',
      color: 'bg-gray-100 text-gray-800'
    },
    'PRODUCAO': { 
      variant: 'default' as const, 
      label: 'Em Produção',
      color: 'bg-blue-100 text-blue-800'
    },
    'ACABAMENTO': { 
      variant: 'outline' as const, 
      label: 'Acabamento',
      color: 'bg-yellow-100 text-yellow-800'
    },
    'FINALIZADA': { 
      variant: 'default' as const, 
      label: 'Finalizada',
      color: 'bg-green-100 text-green-800'
    },
    'CANCELADA': { 
      variant: 'destructive' as const, 
      label: 'Cancelada',
      color: 'bg-red-100 text-red-800'
    },
    'AGUARDANDO_MATERIAL': { 
      variant: 'outline' as const, 
      label: 'Aguardando Material',
      color: 'bg-orange-100 text-orange-800'
    },
    'PAUSADA': { 
      variant: 'secondary' as const, 
      label: 'Pausada',
      color: 'bg-gray-100 text-gray-600'
    },
  };

  return configs[status as keyof typeof configs] || {
    variant: 'secondary' as const,
    label: status,
    color: 'bg-gray-100 text-gray-800'
  };
};

// Função para formatar data
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Função para formatar data e hora
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function OSCard({ os, onDelete }: OSCardProps) {
  const statusConfig = getStatusConfig(os.status);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              OS #{os.numero}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {os.nome_servico}
            </p>
          </div>
          <Badge variant={statusConfig.variant} className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do Cliente */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">Cliente:</span> {os.cliente_nome || 'N/A'}
          </span>
        </div>

        {/* Quantidade */}
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">Quantidade:</span> {os.quantidade}
          </span>
        </div>

        {/* Data de Abertura */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">Abertura:</span> {formatDateTime(os.data_abertura)}
          </span>
        </div>

        {/* Prazo */}
        {os.data_prazo && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">Prazo:</span> {formatDate(os.data_prazo)}
            </span>
          </div>
        )}

        {/* Status dos Materiais */}
        <div className="flex items-center gap-2">
          {os.materiais_disponivel ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          )}
          <span className="text-sm">
            <span className="font-medium">Materiais:</span>{' '}
            <Badge variant={os.materiais_disponivel ? 'default' : 'destructive'}>
              {os.materiais_disponivel ? 'Disponivel' : 'Faltando'}
            </Badge>
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-1"
          >
            <Link href={`/os/${os.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-1"
          >
            <Link href={`/os/${os.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          
          <ConfirmDialog
            title="Excluir Ordem de Serviço"
            description={`Tem certeza que deseja excluir a OS #${os.numero}? Esta ação não pode ser desfeita.`}
            onConfirm={handleDelete}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </ConfirmDialog>
        </div>
      </CardContent>
    </Card>
  );
}
