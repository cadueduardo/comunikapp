'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  DollarSign,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';

interface OSWorkflowActionsProps {
  os: {
    id: string;
    numero: string;
    status: string;
    tipo_os?: string;
    valor_orcado?: number;
  };
  onStatusChange: () => void;
}

export function OSWorkflowActions({ os, onStatusChange }: OSWorkflowActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAprovarTecnica = async (aprovado: boolean) => {
    try {
      setLoading('tecnica');
      const response = await apiRequest(`/os/workflow-comercial/${os.id}/aprovar-tecnica`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovado,
          observacoes: aprovado ? 'Aprovado tecnicamente' : 'Rejeitado tecnicamente'
        }),
      });

      if (response.ok) {
        toast.success(`OS ${aprovado ? 'aprovada' : 'rejeitada'} tecnicamente`);
        onStatusChange();
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error((errorData && errorData.message) || 'Erro na aprovação técnica');
      }
    } catch (error) {
      console.error('Erro ao aprovar tecnicamente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro na aprovação técnica');
    } finally {
      setLoading(null);
    }
  };

  const handleAprovarOrcamentaria = async (aprovado: boolean) => {
    try {
      setLoading('orcamentaria');
      const response = await apiRequest(`/os/workflow-interna/${os.id}/aprovar-orcamentaria`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovado,
          observacoes: aprovado ? 'Aprovado orçamentariamente' : 'Rejeitado orçamentariamente'
        }),
      });

      if (response.ok) {
        toast.success(`OS ${aprovado ? 'aprovada' : 'rejeitada'} orçamentariamente`);
        onStatusChange();
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error((errorData && errorData.message) || 'Erro na aprovação orçamentária');
      }
    } catch (error) {
      console.error('Erro ao aprovar orçamentariamente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro na aprovação orçamentária');
    } finally {
      setLoading(null);
    }
  };

  const handleTransicionarEstado = async (novoStatus: string) => {
    try {
      setLoading('transicao');
      const response = await apiRequest(`/os/${os.id}/avancar-etapa`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nova_etapa: novoStatus,
          observacoes: `Transição para ${novoStatus}`
        }),
      });

      if (response.ok) {
        toast.success(`OS transicionada para ${novoStatus}`);
        onStatusChange();
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error((errorData && errorData.message) || 'Erro na transição de estado');
      }
    } catch (error) {
      console.error('Erro ao transicionar estado:', error);
      toast.error(error instanceof Error ? error.message : 'Erro na transição de estado');
    } finally {
      setLoading(null);
    }
  };

  // Renderizar ações baseadas no status atual
  const renderActions = () => {
    switch (os.status) {
      case 'AGUARDANDO_APROVACAO_TECNICA':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              Esta OS comercial está aguardando aprovação técnica.
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAprovarTecnica(true)}
                disabled={loading === 'tecnica'}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar Tecnicamente
              </Button>
              <Button 
                onClick={() => handleAprovarTecnica(false)}
                disabled={loading === 'tecnica'}
                variant="destructive"
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          </div>
        );

      case 'AGUARDANDO_APROVACAO_ORCAMENTARIA':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              Esta OS interna está aguardando aprovação orçamentária.
              {os.valor_orcado && (
                <div className="mt-1 text-sm font-medium">
                  Valor: R$ {Number(os.valor_orcado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAprovarOrcamentaria(true)}
                disabled={loading === 'orcamentaria'}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Aprovar Orçamentariamente
              </Button>
              <Button 
                onClick={() => handleAprovarOrcamentaria(false)}
                disabled={loading === 'orcamentaria'}
                variant="destructive"
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          </div>
        );

      case 'APROVADA_TECNICA':
      case 'APROVADA_ORCAMENTARIA':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              OS aprovada. Pronta para iniciar produção.
            </div>
            <Button 
              onClick={() => handleTransicionarEstado('PRODUCAO')}
              disabled={loading === 'transicao'}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Iniciar Produção
            </Button>
          </div>
        );

      case 'PRODUCAO':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              OS em produção. Pronta para acabamento.
            </div>
            <Button 
              onClick={() => handleTransicionarEstado('ACABAMENTO')}
              disabled={loading === 'transicao'}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Avançar para Acabamento
            </Button>
          </div>
        );

      case 'ACABAMENTO':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              OS em acabamento. Pronta para finalização.
            </div>
            <Button 
              onClick={() => handleTransicionarEstado('FINALIZADA')}
              disabled={loading === 'transicao'}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar OS
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            Nenhuma ação disponível para este status.
          </div>
        );
    }
  };

  // Não mostrar o card se não há ações disponíveis
  if (!['AGUARDANDO_APROVACAO_TECNICA', 'AGUARDANDO_APROVACAO_ORCAMENTARIA', 'APROVADA_TECNICA', 'APROVADA_ORCAMENTARIA', 'PRODUCAO', 'ACABAMENTO'].includes(os.status)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Ações de Workflow</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderActions()}
      </CardContent>
    </Card>
  );
}

