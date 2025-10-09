'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ArteFileUploadProps } from '../types/arte-types';

export function ArteFileUpload({
  versaoId,
  onUploadSuccess,
  onUploadError,
  onClose,
  readonly = false
}: ArteFileUploadProps & { onClose: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (readonly) return;
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/postscript'];
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (!validTypes.includes(file.type)) {
        onUploadError?.('Tipo de arquivo não permitido. Aceitos: PDF, JPG, PNG, AI');
        return false;
      }
      
      if (file.size > maxSize) {
        onUploadError?.('Arquivo muito grande. Tamanho máximo: 50MB');
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('arquivo', file);
        
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/arte-aprovacao/versoes/versao/${versaoId}/arquivos/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao fazer upload do arquivo');
        }
      }
      
      onUploadSuccess?.();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erro no upload:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Arquivos</DialogTitle>
          <DialogDescription>
            Envie arquivos para esta versão. Tipos aceitos: PDF, JPG, PNG, AI (máximo 50MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de drag & drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${readonly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !readonly && fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              {dragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-500">
              PDF, JPG, PNG, AI até 50MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.ai"
            onChange={handleFileInput}
            className="hidden"
            disabled={readonly}
          />

          {/* Lista de arquivos selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Arquivos selecionados:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações de validação */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Tipos de arquivo aceitos:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>PDF - Para provas e documentos</li>
                  <li>JPG/PNG - Para imagens e previews</li>
                  <li>AI - Para arquivos editáveis do Adobe Illustrator</li>
                </ul>
                <p className="mt-2">Tamanho máximo: 50MB por arquivo</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            onClick={uploadFiles} 
            disabled={selectedFiles.length === 0 || uploading || readonly}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enviar {selectedFiles.length > 0 && `(${selectedFiles.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
