'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload,
  X,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Download,
  Plus,
  FolderOpen,
  File,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ArteFileUploadMultipleProps {
  versaoId: string;
  onUploadComplete: (arquivos: any[]) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // em MB
  acceptedTypes?: string[];
  readonly?: boolean;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
}

export function ArteFileUploadMultiple({
  versaoId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSizePerFile = 50, // 50MB
  acceptedTypes = ['image/*', 'application/pdf', '.ai', '.psd', '.eps'],
  readonly = false
}: ArteFileUploadMultipleProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validar tamanho
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSizePerFile}MB`;
    }

    // Validar tipo
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const addFiles = useCallback(async (newFiles: File[]) => {
    if (readonly) return;

    // Validar limite de arquivos
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    const validFiles: UploadFile[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      const preview = await generatePreview(file);
      const uploadFile: UploadFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'pending',
        preview
      };

      validFiles.push(uploadFile);
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} arquivo(s) adicionado(s)`);
    }
  }, [files.length, maxFiles, maxSizePerFile, acceptedTypes, readonly]);

  const removeFile = (fileId: string) => {
    if (readonly) return;
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<any> => {
    const formData = new FormData();
    formData.append('arquivo', uploadFile.file);

      const response = await fetch(`/api/arte-aprovacao/versoes/${versaoId}/arquivos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro no upload');
    }

    return response.json();
  };

  const uploadAllFiles = async () => {
    if (readonly || files.length === 0) return;

    setIsUploading(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    const uploadedFiles: any[] = [];

    try {
      for (const uploadFile of pendingFiles) {
        // Atualizar status para uploading
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploading' as const }
            : f
        ));

        try {
          const result = await uploadFile(uploadFile);
          uploadedFiles.push(result);

          // Atualizar status para completed
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'completed' as const, progress: 100 }
              : f
          ));

        } catch (error: any) {
          // Atualizar status para error
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error' as const, error: error.message }
              : f
          ));
        }
      }

      if (uploadedFiles.length > 0) {
        onUploadComplete(uploadedFiles);
        toast.success(`${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`);
      }

    } catch (error: any) {
      onUploadError(error.message);
      toast.error('Erro no upload dos arquivos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-600" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-600" />;
    } else {
      return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const completedFiles = files.filter(f => f.status === 'completed');
  const errorFiles = files.filter(f => f.status === 'error');

  return (
    <div className="space-y-6">
      {/* Área de Upload */}
      {!readonly && (
        <Card>
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Arraste arquivos aqui ou clique para selecionar
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Máximo {maxFiles} arquivos, {maxSizePerFile}MB cada
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tipos aceitos: {acceptedTypes.join(', ')}
                  </p>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mx-auto"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Selecionar Arquivos
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={acceptedTypes.join(',')}
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Arquivos Selecionados ({files.length})
              </CardTitle>
              
              {!readonly && pendingFiles.length > 0 && (
                <Button
                  onClick={uploadAllFiles}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isUploading ? 'Enviando...' : `Enviar ${pendingFiles.length} arquivo(s)`}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className={`flex items-center space-x-4 p-4 border rounded-lg ${
                    uploadFile.status === 'completed' 
                      ? 'border-green-200 bg-green-50'
                      : uploadFile.status === 'error'
                        ? 'border-red-200 bg-red-50'
                        : uploadFile.status === 'uploading'
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Preview/Ícone */}
                  <div className="flex-shrink-0">
                    {uploadFile.preview ? (
                      <img
                        src={uploadFile.preview}
                        alt={uploadFile.file.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      getFileIcon(uploadFile.file)
                    )}
                  </div>

                  {/* Informações do arquivo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadFile.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </span>
                        
                        {uploadFile.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        
                        {uploadFile.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        )}
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={uploadFile.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadFile.progress}% enviado
                        </p>
                      </div>
                    )}

                    {/* Mensagem de erro */}
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadFile.error}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Implementar visualização
                        }}
                        className="p-1"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {!readonly && uploadFile.status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Pendentes</p>
                  <p className="text-lg font-semibold text-gray-900">{pendingFiles.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Enviados</p>
                  <p className="text-lg font-semibold text-green-600">{completedFiles.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Erros</p>
                  <p className="text-lg font-semibold text-red-600">{errorFiles.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
