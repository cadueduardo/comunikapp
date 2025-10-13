'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Copy,
  Send,
  Download,
  FileText,
  Image,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MoreVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ArteVersao, ArteStatus } from '../types/arte-types';

interface ArteVersionCardProps {
  versao: ArteVersao;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onSendForApproval?: () => void;
  onSendToPCP?: () => void;
  readonly?: boolean;
}

export function ArteVersionCard({
  versao,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onView,
  onSendForApproval,
  onSendToPCP,
  readonly = false
}: ArteVersionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const getStatusIcon = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ArteStatus.ENVIADA_CLIENTE:
        return <Send className="h-4 w-4 text-blue-600" />;
      case ArteStatus.RASCUNHO:
        return <Edit className="h-4 w-4 text-gray-600" />;
      case ArteStatus.REVISAO_SOLICITADA:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case ArteStatus.BLOQUEADA:
        return <XCircle className="h-4 w-4 text-orange-600" />;
      case ArteStatus.ENVIADA_PCP:
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = versao.status === ArteStatus.RASCUNHO && !readonly;
  const canDelete = versao.status === ArteStatus.RASCUNHO && !readonly;
  const canSendForApproval = versao.status === ArteStatus.RASCUNHO && versao.arquivos.length > 0 && !readonly;
  const canSendToPCP = versao.status === ArteStatus.APROVADA && !readonly;

  return (
    <Card className={`transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Checkbox de seleção */}
            {onSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={onSelect}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            )}

            {/* Ícone de status */}
            {getStatusIcon(versao.status)}

            {/* Informações principais */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {versao.versao}
                </CardTitle>
                <Badge className={getStatusColor(versao.status)}>
                  {getStatusLabel(versao.status)}
                </Badge>
              </div>
              
              {versao.descricao && (
                <p className="text-sm text-gray-600 mt-1">
                  {versao.descricao}
                </p>
              )}
            </div>
          </div>

          {/* Botão de expansão */}
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

      {/* Informações básicas */}
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-500">Autor</p>
              <p className="font-medium">{versao.autor?.nome || 'Desconhecido'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-500">Criada em</p>
              <p className="font-medium">{formatDate(versao.data_criacao)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-500">Arquivos</p>
              <p className="font-medium">{versao.arquivos.length}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-500">Comentários</p>
              <p className="font-medium">{versao.comentarios.length}</p>
            </div>
          </div>
        </div>

        {/* Ações principais */}
        <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="flex items-center space-x-1"
            >
              <Eye className="h-4 w-4" />
              <span>Visualizar</span>
            </Button>

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </Button>
            )}

            {canSendForApproval && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendForApproval}
                className="flex items-center space-x-1"
              >
                <Send className="h-4 w-4" />
                <span>Enviar para Aprovação</span>
              </Button>
            )}

            {canSendToPCP && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendToPCP}
                className="flex items-center space-x-1"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Enviar para PCP</span>
              </Button>
            )}
          </div>

          {/* Menu de ações */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="p-1"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showActions && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(versao.id);
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copiar ID</span>
                  </button>

                  {versao.arquivos.length > 0 && (
                    <button
                      onClick={() => {
                        // Implementar download de todos os arquivos
                        setShowActions(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Todos</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => {
                        onDelete?.();
                        setShowActions(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo expandido */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Observações */}
            {versao.observacoes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Observações</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {versao.observacoes}
                </p>
              </div>
            )}

            {/* Arquivos */}
            {versao.arquivos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Arquivos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {versao.arquivos.map((arquivo) => (
                    <div
                      key={arquivo.id}
                      className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md"
                    >
                      {arquivo.tipo_arquivo.toLowerCase().includes('pdf') ? (
                        <FileText className="h-4 w-4 text-red-600" />
                      ) : (
                        <Image className="h-4 w-4 text-blue-600" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {arquivo.nome_original}
                        </p>
                        <p className="text-xs text-gray-500">
                          {arquivo.tipo_arquivo.toUpperCase()} • {formatDate(arquivo.data_upload)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Implementar download individual
                        }}
                        className="p-1"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comentários recentes */}
            {versao.comentarios.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Comentários Recentes</h4>
                <div className="space-y-2">
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
                  {versao.comentarios.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{versao.comentarios.length - 3} comentários adicionais
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Informações de aprovação */}
            {versao.aprovado_por_cliente && versao.data_aprovacao && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Aprovada pelo Cliente
                    </p>
                    <p className="text-xs text-green-600">
                      {formatDate(versao.data_aprovacao)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


