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
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { useArteVersoes } from './hooks/useArteVersoes';
import { ArteVersao, ArteStatus } from './types/arte-types';
import { ArteAprovacaoTabProps } from './types/arte-types';
import { ArteFileUpload } from './components/ArteFileUpload';
import { ArtePreviewModal } from './components/ArtePreviewModal';

export function ArteAprovacaoTab({ osId, readonly = false }: ArteAprovacaoTabProps) {
  const { versoes, loading, error, createVersao, deleteVersao, refreshVersoes } = useArteVersoes(osId);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedVersao, setSelectedVersao] = useState<ArteVersao | undefined>();
  const [creatingVersao, setCreatingVersao] = useState(false);

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
                className="mt-4"
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
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Arte & Aprovação</CardTitle>
            {!readonly && (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCreateVersao}
                  disabled={creatingVersao}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {creatingVersao ? 'Criando...' : 'Nova Versão'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lista de versões */}
      {versoes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma versão criada</p>
              <p className="text-sm mb-4">
                Comece criando a primeira versão da arte para esta OS.
              </p>
              {!readonly && (
                <Button onClick={handleCreateVersao} disabled={creatingVersao}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Versão
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {versoes.map((versao) => (
            <Card key={versao.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-semibold text-lg">{versao.versao}</h3>
                      {versao.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{versao.descricao}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(versao.status)}>
                      {getStatusLabel(versao.status)}
                    </Badge>
                  </div>
                  
                  {!readonly && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewVersao(versao)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVersao(versao);
                          setShowUploadModal(true);
                        }}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVersao(versao.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Informações da versão */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(versao.data_criacao).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {versao.autor_nome}
                    </div>
                  </div>

                  {/* Arquivos */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Arquivos ({versao.arquivos.length})</h4>
                    {versao.arquivos.length > 0 ? (
                      <div className="space-y-1">
                        {versao.arquivos.slice(0, 3).map((arquivo) => (
                          <div key={arquivo.id} className="flex items-center text-xs text-gray-600">
                            {arquivo.tipo_arquivo.startsWith('image/') ? (
                              <Image className="h-3 w-3 mr-1" />
                            ) : (
                              <FileText className="h-3 w-3 mr-1" />
                            )}
                            {arquivo.nome_original}
                          </div>
                        ))}
                        {versao.arquivos.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{versao.arquivos.length - 3} mais
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">
                        Nenhum arquivo anexado
                      </div>
                    )}
                  </div>

                  {/* Comentários */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Comentários ({versao.comentarios.length})</h4>
                    {versao.comentarios.length > 0 ? (
                      <div className="text-xs text-gray-600">
                        Último: {versao.comentarios[0].comentario.substring(0, 50)}...
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">
                        Nenhum comentário
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      {showUploadModal && selectedVersao && (
        <ArteFileUpload
          versaoId={selectedVersao.id}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={(error) => {
            toast.error(error);
            setShowUploadModal(false);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {showPreviewModal && selectedVersao && (
        <ArtePreviewModal
          versao={selectedVersao}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
