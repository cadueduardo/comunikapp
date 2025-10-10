'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X,
  Eye,
  Download,
  FileText,
  Image,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ArteVersao, ArteArquivo } from '../types/arte-types';

interface ArteComparisonModalProps {
  versao1: ArteVersao;
  versao2: ArteVersao;
  isOpen: boolean;
  onClose: () => void;
}

export function ArteComparisonModal({
  versao1,
  versao2,
  isOpen,
  onClose
}: ArteComparisonModalProps) {
  const [selectedArquivo1, setSelectedArquivo1] = useState<ArteArquivo | null>(
    versao1.arquivos[0] || null
  );
  const [selectedArquivo2, setSelectedArquivo2] = useState<ArteArquivo | null>(
    versao2.arquivos[0] || null
  );
  const [zoom1, setZoom1] = useState(100);
  const [zoom2, setZoom2] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  if (!isOpen) return null;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ENVIADA_CLIENTE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RASCUNHO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'REVISAO_SOLICITADA':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'Aprovada';
      case 'ENVIADA_CLIENTE':
        return 'Enviada para Cliente';
      case 'RASCUNHO':
        return 'Rascunho';
      case 'REVISAO_SOLICITADA':
        return 'Revisão Solicitada';
      default:
        return 'Desconhecido';
    }
  };

  const handleZoom = (version: 1 | 2, action: 'in' | 'out' | 'reset') => {
    if (version === 1) {
      switch (action) {
        case 'in':
          setZoom1(Math.min(zoom1 + 25, 300));
          break;
        case 'out':
          setZoom1(Math.max(zoom1 - 25, 25));
          break;
        case 'reset':
          setZoom1(100);
          break;
      }
    } else {
      switch (action) {
        case 'in':
          setZoom2(Math.min(zoom2 + 25, 300));
          break;
        case 'out':
          setZoom2(Math.max(zoom2 - 25, 25));
          break;
        case 'reset':
          setZoom2(100);
          break;
      }
    }
  };

  const renderArquivoPreview = (arquivo: ArteArquivo, zoom: number, version: 1 | 2) => {
    if (!arquivo) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Nenhum arquivo selecionado</p>
          </div>
        </div>
      );
    }

    const isImage = arquivo.tipo_arquivo.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isPDF = arquivo.tipo_arquivo.toLowerCase().includes('pdf');

    return (
      <div className="relative h-full bg-gray-50 rounded-lg overflow-hidden">
        {/* Controles de zoom */}
        <div className="absolute top-2 right-2 z-10 flex items-center space-x-1 bg-white rounded-md shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(version, 'out')}
            className="p-1 h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium px-2">{zoom}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(version, 'in')}
            className="p-1 h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(version, 'reset')}
            className="p-1 h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview do arquivo */}
        <div 
          className="h-full flex items-center justify-center p-4"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
        >
          {isImage ? (
            <img
              src={arquivo.url_arquivo}
              alt={arquivo.nome_original}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : isPDF ? (
            <div className="text-center">
              <FileText className="h-16 w-16 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {arquivo.nome_original}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Arquivo PDF - Preview não disponível
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(arquivo.url_arquivo, '_blank')}
              >
                <Download className="h-4 w-4 mr-1" />
                Abrir PDF
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {arquivo.nome_original}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {arquivo.tipo_arquivo.toUpperCase()}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(arquivo.url_arquivo, '_blank')}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl ${fullscreen ? 'w-full h-full' : 'w-full max-w-7xl h-full max-h-[90vh]'} flex flex-col`}>
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Comparação de Versões
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {versao1.versao} vs {versao2.versao}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'side-by-side' ? 'overlay' : 'side-by-side')}
              >
                {viewMode === 'side-by-side' ? 'Sobreposição' : 'Lado a Lado'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFullscreen(!fullscreen)}
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden p-6">
          <div className="h-full flex flex-col space-y-4">
            {/* Informações das versões */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Versão 1 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <ArrowLeft className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">{versao1.versao}</h3>
                    <Badge className={getStatusColor(versao1.status)}>
                      {getStatusLabel(versao1.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-700">
                    {formatDate(versao1.data_criacao)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">
                      {versao1.autor?.nome || 'Desconhecido'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">
                      {versao1.arquivos.length} arquivo(s)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">
                      {versao1.comentarios.length} comentário(s)
                    </span>
                  </div>
                </div>

                {/* Seletor de arquivo */}
                {versao1.arquivos.length > 1 && (
                  <div className="mt-3">
                    <select
                      value={selectedArquivo1?.id || ''}
                      onChange={(e) => {
                        const arquivo = versao1.arquivos.find(a => a.id === e.target.value);
                        setSelectedArquivo1(arquivo || null);
                      }}
                      className="w-full text-sm border border-blue-300 rounded-md px-2 py-1 bg-white"
                    >
                      {versao1.arquivos.map((arquivo) => (
                        <option key={arquivo.id} value={arquivo.id}>
                          {arquivo.nome_original}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Versão 2 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-green-900">{versao2.versao}</h3>
                    <Badge className={getStatusColor(versao2.status)}>
                      {getStatusLabel(versao2.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-green-700">
                    {formatDate(versao2.data_criacao)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="text-green-800">
                      {versao2.autor?.nome || 'Desconhecido'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-green-800">
                      {versao2.arquivos.length} arquivo(s)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-green-800">
                      {versao2.comentarios.length} comentário(s)
                    </span>
                  </div>
                </div>

                {/* Seletor de arquivo */}
                {versao2.arquivos.length > 1 && (
                  <div className="mt-3">
                    <select
                      value={selectedArquivo2?.id || ''}
                      onChange={(e) => {
                        const arquivo = versao2.arquivos.find(a => a.id === e.target.value);
                        setSelectedArquivo2(arquivo || null);
                      }}
                      className="w-full text-sm border border-green-300 rounded-md px-2 py-1 bg-white"
                    >
                      {versao2.arquivos.map((arquivo) => (
                        <option key={arquivo.id} value={arquivo.id}>
                          {arquivo.nome_original}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Área de comparação */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Preview Versão 1 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">{versao1.versao}</h4>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleZoom(1, 'out')}
                      className="p-1 h-6 w-6"
                    >
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <span className="text-xs">{zoom1}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleZoom(1, 'in')}
                      className="p-1 h-6 w-6"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  {renderArquivoPreview(selectedArquivo1!, zoom1, 1)}
                </div>
              </div>

              {/* Preview Versão 2 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-900">{versao2.versao}</h4>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleZoom(2, 'out')}
                      className="p-1 h-6 w-6"
                    >
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <span className="text-xs">{zoom2}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleZoom(2, 'in')}
                      className="p-1 h-6 w-6"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  {renderArquivoPreview(selectedArquivo2!, zoom2, 2)}
                </div>
              </div>
            </div>

            {/* Resumo das diferenças */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Resumo das Diferenças</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Arquivos</p>
                  <p className="text-gray-600">
                    {versao1.arquivos.length} vs {versao2.arquivos.length}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Comentários</p>
                  <p className="text-gray-600">
                    {versao1.comentarios.length} vs {versao2.comentarios.length}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Status</p>
                  <p className="text-gray-600">
                    {getStatusLabel(versao1.status)} vs {getStatusLabel(versao2.status)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
