'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface ArteCreateVersionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (versaoId: string) => void;
  osId: string;
  servicoId: string;
  servicoNome: string;
  proximaVersao: string;
}

interface UploadFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function ArteCreateVersionModal({
  open,
  onClose,
  onSuccess,
  osId,
  servicoId,
  servicoNome,
  proximaVersao
}: ArteCreateVersionModalProps) {
  const [descricao, setDescricao] = useState(`Nova versão ${proximaVersao} - ${servicoNome}`);
  const [observacoes, setObservacoes] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/postscript'];
      const maxSize = 50 * 1024 * 1024; // 50MB

      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Tipo não permitido. Use PDF, JPG, PNG ou AI`);
        return false;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: Arquivo muito grande (máx: 50MB)`);
        return false;
      }

      return true;
    });

    const uploadFiles: UploadFile[] = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFileToServer = async (uploadFile: UploadFile, versaoId: string): Promise<boolean> => {
    const formData = new FormData();
    formData.append('arquivo', uploadFile.file);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/arte-aprovacao/versoes/${versaoId}/arquivos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return true;
    } catch (error: any) {
      console.error('Erro no upload:', error);
      throw error;
    }
  };

  const handleCreate = async () => {
    if (files.length === 0) {
      toast.error('Adicione pelo menos um arquivo');
      return;
    }

    setIsCreating(true);

    try {
      // 1. Criar a versão
      const token = localStorage.getItem('access_token');
      const createResponse = await fetch('/api/arte-aprovacao/versoes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          os_id: osId,
          versao: proximaVersao,
          status: 'RASCUNHO',
          descricao,
          observacoes: observacoes || undefined,
          servico_id: servicoId
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || 'Erro ao criar versão');
      }

      const versaoCriada = await createResponse.json();
      const versaoId = versaoCriada.id;

      // 2. Upload dos arquivos
      let uploadedCount = 0;
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const uploadFile = files[i];
        
        // Atualizar status para uploading
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], status: 'uploading', progress: 0 };
          return newFiles;
        });

        try {
          await uploadFileToServer(uploadFile, versaoId);
          
          // Atualizar status para success
          setFiles(prev => {
            const newFiles = [...prev];
            newFiles[i] = { ...newFiles[i], status: 'success', progress: 100 };
            return newFiles;
          });
          
          uploadedCount++;
        } catch (error: any) {
          // Atualizar status para error
          setFiles(prev => {
            const newFiles = [...prev];
            newFiles[i] = { ...newFiles[i], status: 'error', error: error.message };
            return newFiles;
          });
        }
      }

      if (uploadedCount === totalFiles) {
        toast.success(`Versão ${proximaVersao} criada com ${uploadedCount} arquivo(s)!`);
        onSuccess(versaoId);
        handleClose();
      } else if (uploadedCount > 0) {
        toast.warning(`Versão criada com ${uploadedCount}/${totalFiles} arquivos. Alguns falharam.`);
        onSuccess(versaoId);
        handleClose();
      } else {
        toast.error('Versão criada, mas nenhum arquivo foi enviado');
        onSuccess(versaoId);
        handleClose();
      }
    } catch (error: any) {
      console.error('Erro ao criar versão:', error);
      toast.error(error.message || 'Erro ao criar versão');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      // Limpar previews
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);
      setDescricao(`Nova versão ${proximaVersao} - ${servicoNome}`);
      setObservacoes('');
      onClose();
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Versão - {servicoNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Versão */}
          <div>
            <Label>Versão</Label>
            <Input value={proximaVersao} disabled className="bg-gray-50" />
          </div>

          {/* Descrição */}
          <div>
            <Label>Descrição</Label>
            <Input 
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição da versão"
            />
          </div>

          {/* Observações */}
          <div>
            <Label>Observações (opcional)</Label>
            <Textarea 
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>

          {/* Upload Area */}
          <div>
            <Label>Arquivos</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              `}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG, AI • Máx: 50MB por arquivo
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.ai"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Lista de arquivos */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Arquivos selecionados ({files.length})</Label>
              {files.map((uploadFile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                >
                  {/* Preview ou ícone */}
                  <div className="flex-shrink-0">
                    {uploadFile.preview ? (
                      <img 
                        src={uploadFile.preview} 
                        alt={uploadFile.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded">
                        {getFileIcon(uploadFile.file)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium truncate" 
                      title={uploadFile.file.name}
                    >
                      {uploadFile.file.name.length > 40 
                        ? `${uploadFile.file.name.substring(0, 37)}...` 
                        : uploadFile.file.name
                      }
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                    
                    {/* Progress bar durante upload */}
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-1" />
                    )}
                    
                    {/* Status */}
                    {uploadFile.status === 'success' && (
                      <p className="text-xs text-green-600 mt-1">✓ Enviado</p>
                    )}
                    {uploadFile.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {uploadFile.error || 'Erro no upload'}
                      </p>
                    )}
                  </div>

                  {/* Remover */}
                  {!isCreating && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || files.length === 0}
            >
              {isCreating ? 'Criando...' : `Criar Versão ${proximaVersao}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

