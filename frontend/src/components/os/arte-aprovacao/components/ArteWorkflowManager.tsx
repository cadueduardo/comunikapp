'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  FileText,
  Image,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { ArteVersao, ArteStatus } from '../types/arte-types';

interface ArteWorkflowManagerProps {
  versao: ArteVersao;
  onStatusChange: (versaoId: string, newStatus: ArteStatus) => void;
  onSendForApproval: (versao: ArteVersao) => void;
  onApprove: (versao: ArteVersao) => void;
  onReject: (versao: ArteVersao, motivo: string) => void;
  onSendToPCP: (versao: ArteVersao) => void;
  onBlock: (versao: ArteVersao, motivo: string) => void;
  onUnblock: (versao: ArteVersao) => void;
  readonly?: boolean;
}

export function ArteWorkflowManager({
  versao,
  onStatusChange,
  onSendForApproval,
  onApprove,
  onReject,
  onSendToPCP,
  onBlock,
  onUnblock,
  readonly = false
}: ArteWorkflowManagerProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case ArteStatus.ENVIADA_CLIENTE:
        return <Send className="h-5 w-5 text-blue-600" />;
      case ArteStatus.RASCUNHO:
        return <Edit className="h-5 w-5 text-gray-600" />;
      case ArteStatus.REVISAO_SOLICITADA:
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case ArteStatus.BLOQUEADA:
        return <XCircle className="h-5 w-5 text-orange-600" />;
      case ArteStatus.ENVIADA_PCP:
        return <CheckCircle className="h-5 w-5 text-purple-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return 'bg-green-100 text-green-800 border-green-200';
      case ArteStatus.ENVIADA_CLIENTE:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ArteStatus.RASCUNHO:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case ArteStatus.REVISAO_SOLICITADA:
        return 'bg-red-100 text-red-800 border-red-200';
      case ArteStatus.BLOQUEADA:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ArteStatus.ENVIADA_PCP:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return 'Aprovada';
      case ArteStatus.ENVIADA_CLIENTE:
        return 'Enviada para Cliente';
      case ArteStatus.RASCUNHO:
        return 'Rascunho';
      case ArteStatus.REVISAO_SOLICITADA:
        return 'Revisão Solicitada';
      case ArteStatus.BLOQUEADA:
        return 'Bloqueada';
      case ArteStatus.ENVIADA_PCP:
        return 'Enviada para PCP';
      default:
        return 'Desconhecido';
    }
  };

  const getNextPossibleStatuses = (currentStatus: ArteStatus): ArteStatus[] => {
    switch (currentStatus) {
      case ArteStatus.RASCUNHO:
        return [ArteStatus.ENVIADA_CLIENTE, ArteStatus.BLOQUEADA];
      case ArteStatus.ENVIADA_CLIENTE:
        return [ArteStatus.APROVADA, ArteStatus.REVISAO_SOLICITADA, ArteStatus.BLOQUEADA];
      case ArteStatus.APROVADA:
        return [ArteStatus.ENVIADA_PCP, ArteStatus.BLOQUEADA];
      case ArteStatus.REVISAO_SOLICITADA:
        return [ArteStatus.ENVIADA_CLIENTE, ArteStatus.BLOQUEADA];
      case ArteStatus.BLOQUEADA:
        return [ArteStatus.RASCUNHO];
      case ArteStatus.ENVIADA_PCP:
        return [ArteStatus.BLOQUEADA];
      default:
        return [];
    }
  };

  const getWorkflowSteps = () => {
    const steps = [
      { status: ArteStatus.RASCUNHO, label: 'Rascunho', icon: Edit },
      { status: ArteStatus.ENVIADA_CLIENTE, label: 'Enviada', icon: Send },
      { status: ArteStatus.APROVADA, label: 'Aprovada', icon: CheckCircle },
      { status: ArteStatus.ENVIADA_PCP, label: 'PCP', icon: ArrowRight }
    ];

    return steps.map((step, index) => {
      const isActive = versao.status === step.status;
      const isCompleted = getStepOrder(versao.status) > getStepOrder(step.status);
      const isAccessible = getStepOrder(versao.status) >= getStepOrder(step.status);

      return {
        ...step,
        isActive,
        isCompleted,
        isAccessible,
        index
      };
    });
  };

  const getStepOrder = (status: ArteStatus): number => {
    switch (status) {
      case ArteStatus.RASCUNHO:
        return 0;
      case ArteStatus.ENVIADA_CLIENTE:
        return 1;
      case ArteStatus.APROVADA:
        return 2;
      case ArteStatus.ENVIADA_PCP:
        return 3;
      default:
        return -1;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (newStatus: ArteStatus) => {
    if (readonly) return;
    
    switch (newStatus) {
      case ArteStatus.ENVIADA_CLIENTE:
        onSendForApproval(versao);
        break;
      case ArteStatus.APROVADA:
        onApprove(versao);
        break;
      case ArteStatus.REVISAO_SOLICITADA:
        setShowRejectModal(true);
        break;
      case ArteStatus.ENVIADA_PCP:
        onSendToPCP(versao);
        break;
      case ArteStatus.BLOQUEADA:
        setShowBlockModal(true);
        break;
      default:
        onStatusChange(versao.id, newStatus);
    }
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(versao, rejectReason);
      setRejectReason('');
      setShowRejectModal(false);
    }
  };

  const handleBlock = () => {
    if (blockReason.trim()) {
      onBlock(versao, blockReason);
      setBlockReason('');
      setShowBlockModal(false);
    }
  };

  const workflowSteps = getWorkflowSteps();
  const nextStatuses = getNextPossibleStatuses(versao.status);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(versao.status)}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Workflow de Aprovação
              </CardTitle>
              <p className="text-sm text-gray-600">
                {versao.versao} • {getStatusLabel(versao.status)}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="p-1"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Status atual */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Status Atual</span>
            <Badge className={getStatusColor(versao.status)}>
              {getStatusLabel(versao.status)}
            </Badge>
          </div>
          
          {versao.data_aprovacao && (
            <div className="text-sm text-gray-600">
              <Calendar className="h-4 w-4 inline mr-1" />
              Aprovada em: {formatDate(versao.data_aprovacao)}
            </div>
          )}
        </div>

        {/* Workflow Steps */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Progresso do Workflow</h4>
          <div className="flex items-center space-x-2">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === workflowSteps.length - 1;
              
              return (
                <React.Fragment key={step.status}>
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    step.isActive 
                      ? 'bg-blue-100 border border-blue-200' 
                      : step.isCompleted 
                        ? 'bg-green-100 border border-green-200'
                        : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      step.isActive 
                        ? 'text-blue-600' 
                        : step.isCompleted 
                          ? 'text-green-600'
                          : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      step.isActive 
                        ? 'text-blue-800' 
                        : step.isCompleted 
                          ? 'text-green-800'
                          : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  
                  {!isLast && (
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Ações disponíveis */}
        {!readonly && nextStatuses.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Ações Disponíveis</h4>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => {
                const getActionLabel = (status: ArteStatus) => {
                  switch (status) {
                    case ArteStatus.ENVIADA_CLIENTE:
                      return 'Enviar para Aprovação';
                    case ArteStatus.APROVADA:
                      return 'Aprovar';
                    case ArteStatus.REVISAO_SOLICITADA:
                      return 'Solicitar Revisão';
                    case ArteStatus.ENVIADA_PCP:
                      return 'Enviar para PCP';
                    case ArteStatus.BLOQUEADA:
                      return 'Bloquear';
                    default:
                      return 'Alterar Status';
                  }
                };

                const getActionColor = (status: ArteStatus) => {
                  switch (status) {
                    case ArteStatus.APROVADA:
                      return 'bg-green-600 hover:bg-green-700 text-white';
                    case ArteStatus.REVISAO_SOLICITADA:
                      return 'bg-red-600 hover:bg-red-700 text-white';
                    case ArteStatus.ENVIADA_PCP:
                      return 'bg-purple-600 hover:bg-purple-700 text-white';
                    case ArteStatus.BLOQUEADA:
                      return 'bg-orange-600 hover:bg-orange-700 text-white';
                    default:
                      return 'bg-blue-600 hover:bg-blue-700 text-white';
                  }
                };

                return (
                  <Button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={getActionColor(status)}
                    size="sm"
                  >
                    {getActionLabel(status)}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Conteúdo expandido */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Informações detalhadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Informações da Versão</h5>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Autor: {versao.autor?.nome || 'Desconhecido'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Criada: {formatDate(versao.data_criacao)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Arquivos: {versao.arquivos.length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Comentários: {versao.comentarios.length}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-2">Histórico de Status</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status atual</span>
                    <Badge className={getStatusColor(versao.status)}>
                      {getStatusLabel(versao.status)}
                    </Badge>
                  </div>
                  
                  {versao.aprovado_por && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Aprovado por</span>
                      <span className="text-gray-900">{versao.aprovador?.nome || 'Desconhecido'}</span>
                    </div>
                  )}
                  
                  {versao.data_aprovacao && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Data de aprovação</span>
                      <span className="text-gray-900">{formatDate(versao.data_aprovacao)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Observações */}
            {versao.observacoes && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Observações</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {versao.observacoes}
                </p>
              </div>
            )}

            {/* Comentários recentes */}
            {versao.comentarios.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Comentários Recentes</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {versao.comentarios.slice(0, 3).map((comentario) => (
                    <div
                      key={comentario.id}
                      className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md"
                    >
                      <User className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {comentario.usuario?.nome || 'Usuário'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(comentario.data_comentario)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {comentario.comentario}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Solicitar Revisão
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Descreva o motivo da solicitação de revisão:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Digite o motivo da revisão..."
                className="w-full h-24 border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Solicitar Revisão
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bloqueio */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bloquear Versão
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Descreva o motivo do bloqueio:
              </p>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Digite o motivo do bloqueio..."
                className="w-full h-24 border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBlock}
                  disabled={!blockReason.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Bloquear
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
