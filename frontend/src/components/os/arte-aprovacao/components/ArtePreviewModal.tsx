'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Download, 
  Eye, 
  FileText, 
  Image, 
  Calendar, 
  User,
  MessageSquare
} from 'lucide-react';
import { ArtePreviewModalProps, ArteStatus, ComentarioTipo } from '../types/arte-types';

export function ArtePreviewModal({ versao, isOpen, onClose }: ArtePreviewModalProps) {
  const [selectedArquivo, setSelectedArquivo] = useState<string | null>(null);

  if (!versao) return null;

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

  const getComentarioTipoColor = (tipo: ComentarioTipo) => {
    switch (tipo) {
      case ComentarioTipo.CLIENTE:
        return 'bg-blue-100 text-blue-800';
      case ComentarioTipo.SISTEMA:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getComentarioTipoLabel = (tipo: ComentarioTipo) => {
    switch (tipo) {
      case ComentarioTipo.CLIENTE:
        return 'Cliente';
      case ComentarioTipo.SISTEMA:
        return 'Sistema';
      default:
        return 'Interno';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (tipo: string) => {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(tipo.toLowerCase());
  };

  const handleDownload = (arquivo: any) => {
    // TODO: Implementar download real
    window.open(arquivo.url_arquivo, '_blank');
  };

  const handleViewArquivo = (arquivo: any) => {
    setSelectedArquivo(arquivo.url_arquivo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {versao.versao} - {versao.descricao || 'Sem descrição'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da versão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(versao.status)}>
                  {getStatusLabel(versao.status)}
                </Badge>
                {versao.aprovado_por_cliente && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Aprovado pelo Cliente
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Criado em: {new Date(versao.data_criacao).toLocaleDateString('pt-BR')}
                </div>
                
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Autor: {versao.autor_nome}
                </div>
                
                {versao.data_aprovacao && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Aprovado em: {new Date(versao.data_aprovacao).toLocaleDateString('pt-BR')}
                  </div>
                )}
                
                {versao.aprovador_nome && (
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Aprovador: {versao.aprovador_nome}
                  </div>
                )}
              </div>
            </div>

            {versao.observacoes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Observações:</h4>
                <p className="text-sm text-gray-700">{versao.observacoes}</p>
              </div>
            )}
          </div>

          {/* Arquivos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Arquivos ({versao.arquivos.length})</h3>
            
            {versao.arquivos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {versao.arquivos.map((arquivo) => (
                  <div key={arquivo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {isImageFile(arquivo.tipo_arquivo) ? (
                          <Image className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{arquivo.nome_original}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(arquivo.tamanho)} • {arquivo.tipo_arquivo.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewArquivo(arquivo)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(arquivo)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum arquivo anexado</p>
              </div>
            )}
          </div>

          {/* Comentários */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                Comentários ({versao.comentarios.length})
              </h3>
            </div>
            
            {versao.comentarios.length > 0 ? (
              <div className="space-y-3">
                {versao.comentarios.map((comentario) => (
                  <div key={comentario.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comentario.usuario_nome}</span>
                        <Badge className={getComentarioTipoColor(comentario.tipo)}>
                          {getComentarioTipoLabel(comentario.tipo)}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comentario.data_comentario).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comentario.comentario}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum comentário</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
