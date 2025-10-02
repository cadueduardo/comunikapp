'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Edit, 
  Printer, 
  ArrowLeft, 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface OSHeaderProps {
  os: {
    id: string;
    numero: string;
    nome_servico: string;
    status: string;
    cliente_nome?: string;
    cliente?: {
      id: string;
      nome: string;
      email: string;
      telefone: string;
    };
    data_prazo?: string;
    prioridade?: string;
    pode_editar?: boolean;
  };
  onImprimirOS: () => void;
}

const getStatusConfig = (status: string) => {
  const configs = {
    FILA: { 
      variant: "secondary" as const, 
      label: "Na fila", 
      color: "bg-gray-100 text-gray-800",
      icon: Clock
    },
    AGUARDANDO_APROVACAO_TECNICA: { 
      variant: "outline" as const, 
      label: "Aguardando aprovação técnica", 
      color: "bg-blue-100 text-blue-800",
      icon: Clock
    },
    APROVADA_TECNICA: { 
      variant: "default" as const, 
      label: "Aprovada tecnicamente", 
      color: "bg-green-100 text-green-800",
      icon: CheckCircle
    },
    AGUARDANDO_APROVACAO_ORCAMENTARIA: { 
      variant: "outline" as const, 
      label: "Aguardando aprovação orçamentária", 
      color: "bg-purple-100 text-purple-800",
      icon: Clock
    },
    APROVADA_ORCAMENTARIA: { 
      variant: "default" as const, 
      label: "Aprovada orçamentariamente", 
      color: "bg-green-100 text-green-800",
      icon: CheckCircle
    },
    PRODUCAO: { 
      variant: "default" as const, 
      label: "Em produção", 
      color: "bg-blue-100 text-blue-800",
      icon: Clock
    },
    ACABAMENTO: { 
      variant: "outline" as const, 
      label: "Acabamento", 
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock
    },
    FINALIZADA: { 
      variant: "default" as const, 
      label: "Finalizada", 
      color: "bg-green-100 text-green-800",
      icon: CheckCircle
    },
    CANCELADA: { 
      variant: "destructive" as const, 
      label: "Cancelada", 
      color: "bg-red-100 text-red-800",
      icon: AlertTriangle
    },
    REJEITADA: { 
      variant: "destructive" as const, 
      label: "Rejeitada", 
      color: "bg-red-100 text-red-800",
      icon: AlertTriangle
    },
    AGUARDANDO_MATERIAL: {
      variant: "outline" as const,
      label: "Aguardando material",
      color: "bg-orange-100 text-orange-800",
      icon: Clock
    },
    PAUSADA: { 
      variant: "secondary" as const, 
      label: "Pausada", 
      color: "bg-purple-100 text-purple-800",
      icon: Clock
    },
  };

  return configs[status as keyof typeof configs] || {
    variant: "outline" as const,
    label: status,
    color: "bg-gray-100 text-gray-800",
    icon: Clock
  };
};

const getPrioridadeConfig = (prioridade?: string) => {
  switch (prioridade?.toUpperCase()) {
    case 'ALTA':
      return { color: 'text-red-600', label: 'Alta' };
    case 'MEDIA':
      return { color: 'text-yellow-600', label: 'Média' };
    case 'BAIXA':
      return { color: 'text-green-600', label: 'Baixa' };
    default:
      return { color: 'text-gray-600', label: 'Normal' };
  }
};

export function OSHeader({ os, onImprimirOS }: OSHeaderProps) {
  const statusConfig = getStatusConfig(os.status);
  const prioridadeConfig = getPrioridadeConfig(os.prioridade);
  const StatusIcon = statusConfig.icon;
  const dataPrazo = os.data_prazo ? new Date(os.data_prazo) : null;
  const hoje = new Date();
  const isAtrasada = dataPrazo && dataPrazo < hoje;
  const isVencendo = dataPrazo && dataPrazo <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-4">
      {/* Cabeçalho Principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/os">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              OS #{os.numero}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {os.nome_servico}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <StatusIcon className="h-4 w-4" />
            <Badge variant={statusConfig.variant} className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="flex space-x-2">
            <Button onClick={onImprimirOS} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            
            {os.pode_editar && (
              <Link href={`/os/${os.id}/editar`}>
                <Button size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Linha de Resumo Rápido */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Cliente</div>
                <div className="font-medium text-sm">
                  {os.cliente?.nome || os.cliente_nome || 'Não informado'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Prazo</div>
                <div className={`font-medium text-sm ${
                  isAtrasada ? 'text-red-600' : 
                  isVencendo ? 'text-yellow-600' : 
                  'text-gray-900'
                }`}>
                  {dataPrazo ? dataPrazo.toLocaleDateString('pt-BR') : 'Não definido'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Prioridade</div>
                <div className={`font-medium text-sm ${prioridadeConfig.color}`}>
                  {prioridadeConfig.label}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className="font-medium text-sm">
                  {statusConfig.label}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
