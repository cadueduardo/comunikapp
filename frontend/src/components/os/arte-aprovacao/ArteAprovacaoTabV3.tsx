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
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Copy,
  Send,
  Download,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useArteVersoes } from './hooks/useArteVersoes';
import { ArteVersao, ArteStatus } from './types/arte-types';
import { ArteAprovacaoTabProps } from './types/arte-types';
import { ArteFileUpload } from './components/ArteFileUpload';
import { ArtePreviewModal } from './components/ArtePreviewModal';

// Interface para produtos/componentes da OS
interface ProdutoArte {
  id: string;
  nome: string;
  versaoAtual: string;
  status: ArteStatus;
  cor: string;
}

export function ArteAprovacaoTab({ osId, readonly = false }: ArteAprovacaoTabProps) {
  const { versoes, loading, error, createVersao, deleteVersao, refreshVersoes } = useArteVersoes(osId);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedVersao, setSelectedVersao] = useState<ArteVersao | undefined>();
  const [creatingVersao, setCreatingVersao] = useState(false);
  
  // Estado para produto selecionado
  const [selectedProduto, setSelectedProduto] = useState<string>('fachada-principal');

  // Produtos/componentes da OS (baseado no wireframe)
  const produtos: ProdutoArte[] = [
    {
      id: 'fachada-principal',
      nome: 'Fachada Principal',
      versaoAtual: 'v3',
      status: ArteStatus.APROVADA,
      cor: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      id: 'banner-interno',
      nome: 'Banner Interno',
      versaoAtual: 'v1',
      status: ArteStatus.RASCUNHO,
      cor: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    {
      id: 'painel-externo',
      nome: 'Painel Externo',
      versaoAtual: 'v2',
      status: ArteStatus.REVISAO_SOLICITADA,
      cor: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  ];

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

  const getStatusIcon = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return <CheckCircle className="h-3 w-3" />;
      case ArteStatus.ENVIADA_CLIENTE:
        return <Send className="h-3 w-3" />;
      case ArteStatus.REVISAO_SOLICITADA:
        return <AlertCircle className="h-3 w-3" />;
      case ArteStatus.RASCUNHO:
        return <Clock className="h-3 w-3" />;
      case ArteStatus.BLOQUEADA:
        return <XCircle className="h-3 w-3" />;
      case ArteStatus.ENVIADA_PCP:
        return <ArrowRight className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handleCreateVersao = async () => {
    if (creatingVersao) return;
    
    try {
      setCreatingVersao(true);
      
      // Gerar próxima versão automaticamente para o produto selecionado
      const produtoAtual = produtos.find(p => p.id === selectedProduto);
      const proximaVersao = `v${parseInt(produtoAtual?.versaoAtual.replace('v', '') || '0') + 1}`;
      
      await createVersao({
        os_id: osId,
        versao: proximaVersao,
        status: ArteStatus.RASCUNHO,
        descricao: `Nova versão ${proximaVersao} - ${produtoAtual?.nome}`,
        produto_id: selectedProduto
      });
      
      toast.success(`Versão ${proximaVersao} criada para ${produtoAtual?.nome}!`);
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

  // Filtrar versões por produto selecionado
  const versoesDoProduto = versoes.filter(v => v.produto_id === selectedProduto);

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

      {/* Seleção de Produtos/Componentes */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {produtos.map((produto) => (
              <button
                key={produto.id}
                onClick={() => setSelectedProduto(produto.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedProduto === produto.id
                    ? produto.cor + ' border-current'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{produto.versaoAtual} {produto.nome}</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(produto.status)}
                    <span className="text-xs">{getStatusLabel(produto.status)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de versões do produto selecionado */}
      {versoesDoProduto.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma versão criada</p>
              <p className="text-sm mb-4">
                Comece criando a primeira versão da arte para <strong>{produtos.find(p => p.id === selectedProduto)?.nome}</strong>.
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
          {versoesDoProduto.map((versao) => (
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
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewVersao(versao)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {!readonly && versao.status === ArteStatus.RASCUNHO && (
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
                    )}
                    
                    {!readonly && versao.status === ArteStatus.RASCUNHO && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVersao(versao.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Preview/Thumbnail */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Preview</h4>
                    <div className="bg-gray-100 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                      <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Preview {versao.versao}</p>
                    </div>
                  </div>

                  {/* Informações da versão */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Informações</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(versao.data_criacao).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {versao.autor_nome || 'Desconhecido'}
                      </div>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Upload */}
      {showUploadModal && selectedVersao && (
        <ArteFileUpload
          versaoId={selectedVersao.id}
          onSuccess={handleUploadSuccess}
          onError={(error) => {
            toast.error(error);
            setShowUploadModal(false);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Modal de Preview */}
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

