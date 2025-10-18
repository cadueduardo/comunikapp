'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Image } from 'lucide-react';

interface VersaoHistorico {
  id: string;
  versao: string;
  data: string;
  autor: string;
  status: string;
  thumbnail: string;
  isAtual: boolean;
}

interface ArtePublicPreviewProps {
  versaoAtual: VersaoHistorico | null;
  loading?: boolean;
}

export function ArtePublicPreview({
  versaoAtual,
  loading = false
}: ArtePublicPreviewProps) {
  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Carregando arte...</p>
        </div>
      </div>
    );
  }

  if (!versaoAtual) {
    return (
      <div className="w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Pré-visualização da arte selecionada (PDF/JPG)
          </p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    // TODO: Implementar download do arquivo
    console.log('Download da versão:', versaoAtual.id);
  };

  const handleView = () => {
    // TODO: Implementar visualização em modal
    console.log('Visualizar versão:', versaoAtual.id);
  };

  return (
    <div className="space-y-3">
      {/* Preview da Arte */}
      <div className="w-full h-48 bg-white rounded-lg border border-gray-200 overflow-hidden">
        {versaoAtual.thumbnail ? (
          <img
            src={versaoAtual.thumbnail}
            alt={`Versão ${versaoAtual.versao}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{versaoAtual.versao}</p>
            </div>
          </div>
        )}
      </div>

      {/* Informações da Versão */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Versão: {versaoAtual.versao}</span>
          <span>{versaoAtual.data}</span>
        </div>
        <div className="text-xs text-gray-500">
          Autor: {versaoAtual.autor}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex space-x-2">
        <Button
          onClick={handleView}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Visualizar
        </Button>
        
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>
    </div>
  );
}



