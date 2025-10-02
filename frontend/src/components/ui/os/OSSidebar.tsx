'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Calendar,
  FileText,
  Copy,
  MessageSquare
} from 'lucide-react';

interface OSSidebarProps {
  os: {
    id: string;
    cliente_nome?: string;
    cliente_telefone?: string;
    cliente_email?: string;
    cliente?: {
      id: string;
      nome: string;
      email: string;
      telefone: string;
    };
    responsavel_nome?: string;
    aprovacao_tecnica_status?: string;
    aprovacao_tecnica_por?: string;
    aprovacao_tecnica_em?: Date;
    materiais_disponivel?: boolean;
    alertas_estoque?: string[];
    observacoes?: string;
  };
  onDuplicarOS?: () => void;
  onAdicionarNota?: () => void;
}

const getMaterialStatus = (disponivel?: boolean, alertas?: string[]) => {
  if (disponivel && (!alertas || alertas.length === 0)) {
    return {
      status: 'OK',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle
    };
  } else if (alertas && alertas.length > 0) {
    return {
      status: `Faltando ${alertas.length} itens`,
      color: 'bg-orange-100 text-orange-800',
      icon: AlertTriangle
    };
  } else {
    return {
      status: 'Verificar',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock
    };
  }
};

const getAprovacaoStatus = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'APROVADO':
      return {
        status: 'Aprovado',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      };
    case 'REJEITADO':
      return {
        status: 'Rejeitado',
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle
      };
    case 'PENDENTE':
    default:
      return {
        status: 'Pendente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      };
  }
};

export function OSSidebar({ os, onDuplicarOS, onAdicionarNota }: OSSidebarProps) {
  const materialStatus = getMaterialStatus(os.materiais_disponivel, os.alertas_estoque);
  const aprovacaoStatus = getAprovacaoStatus(os.aprovacao_tecnica_status);
  const MaterialIcon = materialStatus.icon;
  const AprovacaoIcon = aprovacaoStatus.icon;

  return (
    <div className="space-y-4">
      {/* Status de Materiais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Status de Materiais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <MaterialIcon className="h-4 w-4" />
            <Badge className={materialStatus.color}>
              {materialStatus.status}
            </Badge>
          </div>
          
          {os.alertas_estoque && os.alertas_estoque.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-orange-600 font-medium">Alertas:</div>
              {os.alertas_estoque.slice(0, 3).map((alerta, index) => (
                <div key={index} className="text-xs text-orange-700">
                  • {alerta}
                </div>
              ))}
              {os.alertas_estoque.length > 3 && (
                <div className="text-xs text-orange-600">
                  +{os.alertas_estoque.length - 3} mais...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contato Cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Contato Cliente</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="font-medium text-sm">
              {os.cliente?.nome || os.cliente_nome || 'Não informado'}
            </div>
            
            {(os.cliente?.telefone || os.cliente_telefone) && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{os.cliente?.telefone || os.cliente_telefone}</span>
              </div>
            )}
            
            {(os.cliente?.email || os.cliente_email) && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{os.cliente?.email || os.cliente_email}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aprovação Técnica */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Aprovação Técnica</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <AprovacaoIcon className="h-4 w-4" />
            <Badge className={aprovacaoStatus.color}>
              {aprovacaoStatus.status}
            </Badge>
          </div>
          
          {os.aprovacao_tecnica_por && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500">Responsável:</div>
              <div className="text-sm font-medium">
                {os.aprovacao_tecnica_por}
              </div>
            </div>
          )}
          
          {os.aprovacao_tecnica_em && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500">Data:</div>
              <div className="text-sm">
                {new Date(os.aprovacao_tecnica_em).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responsável da OS */}
      {os.responsavel_nome && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Responsável OS</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {os.responsavel_nome}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Ações Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={onDuplicarOS}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicar OS
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={onAdicionarNota}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Adicionar Nota
          </Button>
        </CardContent>
      </Card>

      {/* Observações */}
      {os.observacoes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Observações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700">
              {os.observacoes}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
