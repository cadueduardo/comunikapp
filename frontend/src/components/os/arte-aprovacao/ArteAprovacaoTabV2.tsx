'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  Image,
  Calendar,
  User,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useArteVersoes } from './hooks/useArteVersoes';
import { ArteVersao, ArteStatus } from './types/arte-types';
import { ArteAprovacaoTabProps } from './types/arte-types';
import { ArteFileUpload } from './components/ArteFileUpload';
import { ArtePreviewModal } from './components/ArtePreviewModal';
import { ArteVersionHistory } from './components/ArteVersionHistory';
import { ArteVersionCard } from './components/ArteVersionCard';
import { ArteComparisonModal } from './components/ArteComparisonModal';
import { ArteWorkflowManager } from './components/ArteWorkflowManager';
import { ArteFileUploadMultiple } from './components/ArteFileUploadMultiple';

export function ArteAprovacaoTab({ osId, readonly = false }: ArteAprovacaoTabProps) {
  const { versoes, loading, error, createVersao, deleteVersao, refreshVersoes } = useArteVersoes(osId);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedVersao, setSelectedVersao] = useState<ArteVersao | undefined>();
  const [selectedVersoesForComparison, setSelectedVersoesForComparison] = useState<ArteVersao[]>([]);
  const [creatingVersao, setCreatingVersao] = useState(false);
  const [activeView, setActiveView] = useState<'history' | 'workflow' | 'upload'>('history');

  const getStatusColor = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return 'bg-green-100 text-green-800';
      case ArteStatus.ENVIADA_CLIENTE:
        return 'bg-blue-100 text-blue-800';
      case ArteStatus.REVISAO_SOLICITADA:
        return 'bg-red-100 text-red-800';
      case ArteStatus.RASCUNHO:
        return 'bg-gray-100 text-gray-800';
      case ArteStatus.BLOQUEADA:
        return 'bg-orange-100 text-orange-800';
      case ArteStatus.ENVIADA_PCP:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return 'Aprovada';
      case ArteStatus.ENVIADA_CLIENTE:
        return 'Enviada ao Cliente';
      case ArteStatus.REVISAO_SOLICITADA:
        return 'Revisão Solicitada';
      case ArteStatus.RASCUNHO:
        return 'Rascunho';
      case ArteStatus.BLOQUEADA:
        return 'Bloqueada';
      case ArteStatus.ENVIADA_PCP:
        return 'Enviada ao PCP';
      default:
        return status;
    }
  };

  const handleCreateVersao = async () => {
    if (creatingVersao) return;
    
    try {
      setCreatingVersao(true);
      
      // Gerar próxima versão automaticamente
      const proximaVersao = `v${versoes.length + 1}`;
      
      await createVersao({
        os_id: osId,
        versao: proximaVersao,
        status: ArteStatus.RASCUNHO,
        descricao: `Nova versão ${proximaVersao}`
      });
      
      toast.success('Versão criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar versão:', error);
      toast.error('Erro ao criar versão');
    } finally {
      setCreatingVersao(false);
    }
  };

  const handleDeleteVersao = async (versaoId: string) => {
    if (confirm('Tem certeza que deseja remover esta versão?')) {
      try {
        await deleteVersao(versaoId);
        toast.success('Versão removida com sucesso!');
      } catch (error) {
        console.error('Erro ao remover versão:', error);
        toast.error('Erro ao remover versão');
      }
    }
  };

  const handleViewVersao = (versao: ArteVersao) => {
    setSelectedVersao(versao);
    setShowPreviewModal(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    refreshVersoes();
    toast.success('Arquivo enviado com sucesso!');
  };

  // Handlers para os novos componentes
  const handleEditVersao = (versao: ArteVersao) => {
    setSelectedVersao(versao);
    setActiveView('workflow');
  };

  const handleCompareVersoes = (versao1: ArteVersao, versao2: ArteVersao) => {
    setSelectedVersoesForComparison([versao1, versao2]);
    setShowComparisonModal(true);
  };

  const handleSendForApproval = async (versao: ArteVersao) => {
    try {
      // Implementar envio para aprovação
      toast.success(`Versão ${versao.versao} enviada para aprovação`);
    } catch (error) {
      toast.error('Erro ao enviar para aprovação');
    }
  };

  const handleSendToPCP = async (versao: ArteVersao) => {
    try {
      // Implementar envio para PCP
      toast.success(`Versão ${versao.versao} enviada para PCP`);
    } catch (error) {
      toast.error('Erro ao enviar para PCP');
    }
  };

  const handleStatusChange = async (versaoId: string, newStatus: ArteStatus) => {
    try {
      // Implementar mudança de status
      toast.success('Status atualizado com sucesso!');
      refreshVersoes();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleApprove = async (versao: ArteVersao) => {
    try {
      await handleStatusChange(versao.id, ArteStatus.APROVADA);
    } catch (error) {
      toast.error('Erro ao aprovar versão');
    }
  };

  const handleReject = async (versao: ArteVersao, motivo: string) => {
    try {
      await handleStatusChange(versao.id, ArteStatus.REVISAO_SOLICITADA);
      toast.success(`Versão ${versao.versao} marcada para revisão: ${motivo}`);
    } catch (error) {
      toast.error('Erro ao rejeitar versão');
    }
  };

  const handleBlock = async (versao: ArteVersao, motivo: string) => {
    try {
      await handleStatusChange(versao.id, ArteStatus.BLOQUEADA);
      toast.success(`Versão ${versao.versao} bloqueada: ${motivo}`);
    } catch (error) {
      toast.error('Erro ao bloquear versão');
    }
  };

  const handleUnblock = async (versao: ArteVersao) => {
    try {
      await handleStatusChange(versao.id, ArteStatus.RASCUNHO);
      toast.success(`Versão ${versao.versao} desbloqueada`);
    } catch (error) {
      toast.error('Erro ao desbloquear versão');
    }
  };

  const handleUploadComplete = (arquivos: any[]) => {
    toast.success(`${arquivos.length} arquivo(s) enviado(s) com sucesso!`);
    refreshVersoes();
  };

  const handleUploadError = (error: string) => {
    toast.error(`Erro no upload: ${error}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Carregando versões...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Erro ao carregar versões: {error}</p>
              <Button 
                onClick={refreshVersoes} 
                variant="outline" 
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navegação entre views */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeView === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Histórico de Versões
        </button>
        <button
          onClick={() => setActiveView('workflow')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeView === 'workflow'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Workflow
        </button>
        <button
          onClick={() => setActiveView('upload')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeView === 'upload'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Upload Múltiplo
        </button>
      </div>

      {/* Conteúdo baseado na view ativa */}
      {activeView === 'history' && (
        <ArteVersionHistory
          versoes={versoes}
          osId={osId}
          onCreateVersao={handleCreateVersao}
          onEditVersao={handleEditVersao}
          onDeleteVersao={handleDeleteVersao}
          onViewVersao={handleViewVersao}
          onCompareVersoes={handleCompareVersoes}
          onSendForApproval={handleSendForApproval}
          onSendToPCP={handleSendToPCP}
          readonly={readonly}
        />
      )}

      {activeView === 'workflow' && (
        <>
          {selectedVersao ? (
            <ArteWorkflowManager
              versao={selectedVersao}
              onStatusChange={handleStatusChange}
              onSendForApproval={handleSendForApproval}
              onApprove={handleApprove}
              onReject={handleReject}
              onSendToPCP={handleSendToPCP}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              readonly={readonly}
            />
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhuma versão selecionada</p>
                  <p className="text-sm mb-4">
                    Selecione uma versão no histórico para gerenciar o workflow.
                  </p>
                  <Button onClick={() => setActiveView('history')}>
                    Voltar ao Histórico
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeView === 'upload' && (
        <>
          {selectedVersao ? (
            <ArteFileUploadMultiple
              versaoId={selectedVersao.id}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              readonly={readonly}
            />
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhuma versão selecionada</p>
                  <p className="text-sm mb-4">
                    Selecione uma versão no histórico para fazer upload de arquivos.
                  </p>
                  <Button onClick={() => setActiveView('history')}>
                    Voltar ao Histórico
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modais */}
      {showPreviewModal && selectedVersao && (
        <ArtePreviewModal
          versao={selectedVersao}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showComparisonModal && selectedVersoesForComparison.length === 2 && (
        <ArteComparisonModal
          versao1={selectedVersoesForComparison[0]}
          versao2={selectedVersoesForComparison[1]}
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
        />
      )}
    </div>
  );
}

