'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Image,
  Eye,
  Send,
  Clock,
  User,
  MessageSquare,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { ArteCommentsPanel } from '@/components/os/arte-aprovacao/components/ArteCommentsPanel';

interface ArtePublicApprovalPageProps {}

interface ArteData {
  versao: {
    id: string;
    versao: string;
    status: string;
    descricao?: string;
    data_criacao: string;
    autor: {
      nome: string;
      email: string;
    };
  };
  os: {
    id: string;
    numero: string;
    cliente: {
      nome: string;
      email: string;
    };
  };
  arquivos: Array<{
    id: string;
    nome_original: string;
    tipo_arquivo: string;
    url_arquivo: string;
    url_thumbnail?: string;
  }>;
  comentarios: Array<{
    id: string;
    comentario: string;
    tipo: string;
    data_comentario: string;
    usuario: {
      nome: string;
      email: string;
    };
  }>;
  link: {
    id: string;
    expira_em: string;
    aprovado: boolean;
  };
}

export default function ArtePublicApprovalPage({}: ArtePublicApprovalPageProps) {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [arteData, setArteData] = useState<ArteData | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados da arte
  useEffect(() => {
    const loadArteData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/arte-aprovacao/links/public/${token}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        setArteData(data.data);
        
        // Selecionar primeiro arquivo por padrão
        if (data.data.arquivos.length > 0) {
          setSelectedFile(data.data.arquivos[0].id);
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados da arte:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadArteData();
    }
  }, [token]);

  const handleDownloadFile = async (arquivo: ArteData['arquivos'][0], type: 'original' | 'jpg') => {
    try {
      // Para download, vamos abrir em nova aba
      const url = `${arquivo.url_arquivo}?token=${token}`;
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
      console.error('Erro ao baixar:', error);
    }
  };

  const handleViewFile = (arquivo: ArteData['arquivos'][0]) => {
    setSelectedFile(arquivo.id);
  };

  const handleApprove = async () => {
    if (!declarationChecked) {
      toast.error('Por favor, confirme que revisou e aprova a arte');
      return;
    }

    await processApproval(true);
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Por favor, adicione um comentário explicando as alterações necessárias');
      return;
    }

    await processApproval(false);
  };

  const processApproval = async (aprovado: boolean) => {
    try {
      setProcessing(true);
      
      const response = await fetch(`/api/arte-aprovacao/links/public/${token}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aprovado,
          comentario: aprovado ? undefined : comment,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success(data.data.mensagem);
      
      // Redirecionar ou mostrar mensagem de sucesso
      setTimeout(() => {
        window.location.href = '/arte/aprovacao/sucesso';
      }, 2000);
      
    } catch (error) {
      toast.error('Erro ao processar aprovação');
      console.error('Erro ao aprovar:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REVISAO_SOLICITADA':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ENVIADA_CLIENTE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'Aprovada';
      case 'REVISAO_SOLICITADA':
        return 'Revisão Solicitada';
      case 'ENVIADA_CLIENTE':
        return 'Aguardando Aprovação';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REVISAO_SOLICITADA':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ENVIADA_CLIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isImageFile = (tipo: string) => {
    return tipo.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(tipo.toLowerCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da arte...</p>
        </div>
      </div>
    );
  }

  if (error || !arteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Inválido</h2>
            <p className="text-gray-600 mb-4">
              {error || 'O link de aprovação não foi encontrado ou expirou.'}
            </p>
            <p className="text-sm text-gray-500">
              Entre em contato com o designer para solicitar um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedArquivo = arteData.arquivos.find(f => f.id === selectedFile);
  const imageFiles = arteData.arquivos.filter(f => isImageFile(f.tipo_arquivo));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comunikapp</h1>
              <p className="text-gray-600">Aprovação de Arte</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(arteData.versao.status)}>
                {getStatusIcon(arteData.versao.status)}
                <span className="ml-1">{getStatusLabel(arteData.versao.status)}</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Esquerda - Informações */}
          <div className="space-y-6">
            {/* Informações da OS */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Informações da Ordem de Serviço</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">OS:</span>
                    <span className="font-medium">#{arteData.os.numero}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{arteData.os.cliente.nome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Versão:</span>
                    <span className="font-medium">{arteData.versao.versao}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Criado por:</span>
                    <span className="font-medium">{arteData.versao.autor.nome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">
                      {new Date(arteData.versao.data_criacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download de Arquivos */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Download de Arquivos</h2>
                <div className="space-y-2">
                  {arteData.arquivos.map((arquivo) => (
                    <div key={arquivo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        {isImageFile(arquivo.tipo_arquivo) ? (
                          <Image className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium">{arquivo.nome_original}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(arquivo, 'original')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comentários */}
            <ArteCommentsPanel 
              versaoId={arteData.versao.id}
              token={token}
              readonly={arteData.versao.status !== 'ENVIADA_CLIENTE' || arteData.link.aprovado}
            />
          </div>

          {/* Coluna Central - Preview */}
          <div className="space-y-6">
            {/* Preview da Arte */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold">Pré-visualização da Arte</h2>
                  <p className="text-sm text-gray-600">
                    {selectedArquivo?.tipo_arquivo.toUpperCase() || 'Selecione um arquivo'}
                  </p>
                </div>
                
                {selectedArquivo ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    {isImageFile(selectedArquivo.tipo_arquivo) ? (
                      <img
                        src={`${selectedArquivo.url_thumbnail || selectedArquivo.url_arquivo}?token=${token}`}
                        alt={selectedArquivo.nome_original}
                        className="max-w-full max-h-96 mx-auto object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="text-center text-gray-500">
                              <FileText class="h-16 w-16 mx-auto mb-4 opacity-50" />
                              <p>Erro ao carregar imagem</p>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="mb-2">Preview não disponível</p>
                        <p className="text-sm">Clique no botão de download para visualizar</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum arquivo selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações de Aprovação */}
            {arteData.versao.status === 'ENVIADA_CLIENTE' && !arteData.link.aprovado && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Aprovação da Arte</h2>
                  
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleApprove}
                        disabled={processing || !declarationChecked}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar Arte
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={processing}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Solicitar Alteração
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="declaration"
                        checked={declarationChecked}
                        onCheckedChange={setDeclarationChecked}
                      />
                      <label htmlFor="declaration" className="text-sm text-gray-700">
                        Declaro que revisei e aprovo a arte final
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Coluna Direita - Navegação de Arquivos */}
          <div className="space-y-6">
            {/* Lista de Arquivos */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Arquivos Disponíveis</h2>
                <div className="space-y-2">
                  {arteData.arquivos.map((arquivo) => (
                    <button
                      key={arquivo.id}
                      onClick={() => handleViewFile(arquivo)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedFile === arquivo.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isImageFile(arquivo.tipo_arquivo) ? (
                          <Image className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium truncate">{arquivo.nome_original}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {arquivo.tipo_arquivo.toUpperCase()}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações do Link */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Informações do Link</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Expira em:</span>
                    <span className="font-medium">
                      {new Date(arteData.link.expira_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getStatusColor(arteData.versao.status)}>
                      {getStatusLabel(arteData.versao.status)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
