'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  FileText,
  Calendar
} from 'lucide-react';

interface Movimentacao {
  id: string;
  etapa_anterior?: string;
  etapa_atual: string;
  usuario_id: string;
  data_movimentacao: string;
  observacoes?: string;
  tipo_movimentacao?: string;
}

interface OSTimelineProps {
  movimentacoes?: Movimentacao[];
  os: {
    id: string;
    numero: string;
    status: string;
    criado_em: string;
    modificado_em?: string;
  };
}

const getStatusConfig = (status: string) => {
  const configs = {
    FILA: { 
      color: 'bg-gray-100 text-gray-800',
      icon: Clock
    },
    AGUARDANDO_APROVACAO_TECNICA: { 
      color: 'bg-blue-100 text-blue-800',
      icon: Clock
    },
    APROVADA_TECNICA: { 
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle
    },
    AGUARDANDO_APROVACAO_ORCAMENTARIA: { 
      color: 'bg-purple-100 text-purple-800',
      icon: Clock
    },
    APROVADA_ORCAMENTARIA: { 
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle
    },
    PRODUCAO: { 
      color: 'bg-blue-100 text-blue-800',
      icon: Clock
    },
    ACABAMENTO: { 
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock
    },
    FINALIZADA: { 
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle
    },
    CANCELADA: { 
      color: 'bg-red-100 text-red-800',
      icon: AlertTriangle
    },
    REJEITADA: { 
      color: 'bg-red-100 text-red-800',
      icon: AlertTriangle
    },
    AGUARDANDO_MATERIAL: {
      color: 'bg-orange-100 text-orange-800',
      icon: Clock
    },
    PAUSADA: { 
      color: 'bg-purple-100 text-purple-800',
      icon: Clock
    },
  };

  return configs[status as keyof typeof configs] || {
    color: 'bg-gray-100 text-gray-800',
    icon: Clock
  };
};

const getTipoMovimentacaoConfig = (tipo?: string) => {
  switch (tipo) {
    case 'CRIACAO':
      return { label: 'Criação', icon: FileText, color: 'text-green-600' };
    case 'APROVACAO_TECNICA':
      return { label: 'Aprovação Técnica', icon: CheckCircle, color: 'text-blue-600' };
    case 'APROVACAO_ORCAMENTARIA':
      return { label: 'Aprovação Orçamentária', icon: CheckCircle, color: 'text-purple-600' };
    case 'AVANCAR_ETAPA':
      return { label: 'Avançar Etapa', icon: ArrowRight, color: 'text-blue-600' };
    case 'RETROCEDER_ETAPA':
      return { label: 'Retroceder Etapa', icon: ArrowRight, color: 'text-orange-600' };
    case 'PAUSAR':
      return { label: 'Pausar', icon: Clock, color: 'text-yellow-600' };
    case 'RETOMAR':
      return { label: 'Retomar', icon: Clock, color: 'text-green-600' };
    case 'CANCELAR':
      return { label: 'Cancelar', icon: AlertTriangle, color: 'text-red-600' };
    case 'FINALIZAR':
      return { label: 'Finalizar', icon: CheckCircle, color: 'text-green-600' };
    case 'ATRIBUIR_RESPONSAVEL':
      return { label: 'Atribuir Responsável', icon: User, color: 'text-blue-600' };
    case 'ADICIONAR_OBSERVACAO':
      return { label: 'Adicionar Observação', icon: FileText, color: 'text-gray-600' };
    default:
      return { label: 'Movimentação', icon: Clock, color: 'text-gray-600' };
  }
};

export function OSTimeline({ movimentacoes, os }: OSTimelineProps) {
  // Criar timeline completa incluindo criação e movimentações
  const timelineItems = [
    {
      id: 'criacao',
      tipo: 'CRIACAO',
      etapa_atual: 'FILA',
      usuario_id: 'Sistema',
      data_movimentacao: os.criado_em,
      observacoes: 'OS criada',
      isSystem: true
    },
    ...(movimentacoes || [])
  ].sort((a, b) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime());

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Timeline de Atividades</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timelineItems.length > 0 ? (
          <div className="space-y-4">
            {timelineItems.map((item, index) => {
              const tipoConfig = getTipoMovimentacaoConfig(item.tipo_movimentacao);
              const statusConfig = getStatusConfig(item.etapa_atual);
              const TipoIcon = tipoConfig.icon;
              const StatusIcon = statusConfig.icon;
              const { date, time } = formatDateTime(item.data_movimentacao);

              return (
                <div key={item.id} className="flex items-start space-x-3">
                  {/* Ícone da Timeline */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <TipoIcon className={`h-4 w-4 ${tipoConfig.color}`} />
                  </div>

                  {/* Conteúdo da Timeline */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {tipoConfig.label}
                        </span>
                        {item.etapa_atual && (
                          <>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <Badge className={statusConfig.color}>
                              {item.etapa_atual}
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {date} às {time}
                      </div>
                    </div>

                    {/* Usuário */}
                    <div className="flex items-center space-x-1 mt-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {item.usuario_id}
                      </span>
                    </div>

                    {/* Observações */}
                    {item.observacoes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                        {item.observacoes}
                      </div>
                    )}

                    {/* Transição de Status */}
                    {item.etapa_anterior && item.etapa_anterior !== item.etapa_atual && (
                      <div className="mt-2 flex items-center space-x-2 text-xs text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          {item.etapa_anterior}
                        </Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge className={statusConfig.color}>
                          {item.etapa_atual}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">
              Nenhuma movimentação registrada
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}















