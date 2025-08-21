'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import { Button } from './button';
import Image from 'next/image';
import { buildApiUrl } from '@/lib/config';

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  currentImageUrl?: string | null;
}

export function ImageUpload({ onFileSelect, currentImageUrl }: ImageUploadProps) {
  const getSanitizedUrl = (url: string | null | undefined): string | null => {
    if (!url || url.includes('undefined')) {
      return null;
    }
    return url;
  };

  const [preview, setPreview] = useState<string | null>(getSanitizedUrl(currentImageUrl));

  useEffect(() => {
    setPreview(getSanitizedUrl(currentImageUrl));
  }, [currentImageUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    multiple: false,
  });

  const handleRemoveImage = () => {
    setPreview(null);
    onFileSelect(null);
  };

  const imageUrl = (preview && preview.startsWith('blob:')) 
    ? preview 
            : (preview ? buildApiUrl(preview) : null);


  return (
    <div className="w-full">
      {imageUrl ? (
        <div className="relative w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
          {imageUrl.startsWith('blob:') ? (
            <Image 
              src={imageUrl} 
              alt="Pré-visualização do logo" 
              fill 
              style={{ objectFit: 'contain' }}
              className="rounded-lg" 
              onError={(e) => {
                console.error('Erro ao carregar imagem blob:', imageUrl);
              }}
            />
          ) : (
            <img 
              src={imageUrl} 
              alt="Pré-visualização do logo" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                borderRadius: '8px'
              }}
              onError={(e) => {
                console.error('Erro ao carregar imagem do servidor:', imageUrl);
              }}
              onLoad={(e) => {
                console.log('✅ Imagem carregada com sucesso:', imageUrl);
                const img = e.currentTarget as HTMLImageElement;
                const container = img.parentElement;
                
                if (container && img.naturalWidth && img.naturalHeight) {
                  const isHorizontal = img.naturalWidth > img.naturalHeight;
                  
                  if (isHorizontal) {
                    // Logo horizontal: aplicar max-width para manter proporção
                    container.style.maxWidth = '200px';
                    container.style.maxHeight = 'none';
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    console.log('📐 Logo horizontal detectado no preview, aplicando max-width: 200px');
                  } else {
                    // Logo vertical/quadrado: aplicar max-height para manter proporção
                    container.style.maxHeight = '120px';
                    container.style.maxWidth = 'none';
                    img.style.height = '100%';
                    img.style.width = 'auto';
                    console.log('📐 Logo vertical/quadrado detectado no preview, aplicando max-height: 120px');
                  }
                }
              }}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/70 hover:bg-white rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            Arraste e solte o logo aqui, ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
        </div>
      )}
    </div>
  );
} 