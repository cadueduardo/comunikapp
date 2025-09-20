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
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { OrdemServico } from '../columns';

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
      color: 'bg-purple-100 text-purple-800'
    },
  };

  return configs[status] || { 
    variant: 'outline' as const, 
    label: status,
    color: 'bg-gray-100 text-gray-800'
  };
};

export function OSCard({ os, onDelete }: OSCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const statusConfig = getStatusConfig(os.status);

  // Verificar se prazo está vencendo ou atrasado
  const hoje = new Date();
  const dataPrazo = os.data_prazo ? new Date(os.data_prazo) : null;
  const isAtrasada = dataPrazo && dataPrazo < hoje;
  const isVencendo = dataPrazo && dataPrazo <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const podeEditar = os.status !== 'FINALIZADA' && os.status !== 'CANCELADA';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-lg">OS #{os.numero}</CardTitle>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <h3 className="font-semibold text-gray-900">{os.nome_servico}</h3>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações básicas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Cliente: {os.cliente_nome || 'Não informado'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="h-4 w-4" />
            <span>Quantidade: {os.quantidade}</span>
          </div>

          {dataPrazo && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className={`${isAtrasada ? 'text-red-600 font-medium' : isVencendo ? 'text-yellow-600' : 'text-gray-600'}`}>
                Prazo: {dataPrazo.toLocaleDateString('pt-BR')}
              </span>
              {isAtrasada && <AlertTriangle className="h-4 w-4 text-red-500" />}
              {isVencendo && !isAtrasada && <Clock className="h-4 w-4 text-yellow-500" />}
            </div>
          )}

          {os.responsavel_nome && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Responsável: {os.responsavel_nome}</span>
            </div>
          )}
        </div>

        {/* Status dos materiais */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          {os.materiais_disponivel ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600 text-sm font-medium">Materiais Disponíveis</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600 text-sm font-medium">Verificar Materiais</span>
            </>
          )}
        </div>

        {/* Informações de data */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <div>Criada em: {new Date(os.criado_em).toLocaleString('pt-BR')}</div>
          {os.orcamento_id && (
            <div className="flex items-center gap-1 mt-1">
              <span>Orçamento:</span>
              <Link href={`/orcamentos/${os.orcamento_id}`} className="text-blue-600 hover:underline">
                Ver orçamento <ArrowRight className="h-3 w-3 inline" />
              </Link>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t">
          <Link href={`/os/${os.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
          </Link>
          
          {podeEditar && (
            <>
              <Link href={`/os/${os.id}/editar`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="px-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Excluir Ordem de Serviço"
          description={`Tem certeza que deseja excluir a OS #${os.numero}? Esta ação não pode ser desfeita.`}
          onConfirm={() => {
            onDelete();
            setShowDeleteDialog(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
