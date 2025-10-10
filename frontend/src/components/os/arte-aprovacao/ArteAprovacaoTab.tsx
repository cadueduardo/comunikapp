'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { ArteCreateVersionModal } from './components/ArteCreateVersionModal';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVersao, setSelectedVersao] = useState<ArteVersao | undefined>();
  const [versaoToDelete, setVersaoToDelete] = useState<string | null>(null);
  
  // Estado para produto selecionado
  const [selectedProduto, setSelectedProduto] = useState<string>('fachada-principal');
  
  // Estado para versões selecionadas para envio
  const [versoesSelecionadas, setVersoesSelecionadas] = useState<Set<string>>(new Set());

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

  // Calcular próxima versão baseada nas versões reais do banco
  const getProximaVersao = (): string => {
    // Filtrar versões do produto selecionado
    const versoesDoProduto = versoes.filter(v => v.servico_id === selectedProduto);
    
    if (versoesDoProduto.length === 0) {
      return 'v1';
    }
    
    // Extrair números das versões e encontrar o maior
    const numeros = versoesDoProduto
      .map(v => parseInt(v.versao.replace('v', '').replace('V', '')))
      .filter(n => !isNaN(n));
    
    const maiorNumero = Math.max(...numeros, 0);
    return `v${maiorNumero + 1}`;
  };

  const handleCreateVersao = () => {
    // Abrir modal de criação com upload integrado
    setShowCreateModal(true);
  };

  const handleCreateSuccess = (versaoId: string) => {
    // Atualizar lista de versões
    refreshVersoes();
    
    // Auto-selecionar nova versão criada
    setVersoesSelecionadas(prev => new Set([...prev, versaoId]));
  };

  const handleDeleteVersao = (versaoId: string) => {
    setVersaoToDelete(versaoId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!versaoToDelete) return;
    
    try {
      await deleteVersao(versaoToDelete);
      toast.success('Versão removida com sucesso!');
      setShowDeleteDialog(false);
      setVersaoToDelete(null);
    } catch (error) {
      console.error('Erro ao remover versão:', error);
      toast.error('Erro ao remover versão');
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

  const handleViewFile = async (url: string, filename: string, tipoArquivo: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Para PNG, JPG, PDF - abrir em nova aba
      const tiposPreview = ['png', 'jpg', 'jpeg', 'pdf'];
      const extensao = tipoArquivo.toLowerCase();
      
      if (tiposPreview.includes(extensao)) {
        // Criar URL com token como query param para preview
        const previewUrl = `${url}?token=${token}`;
        window.open(previewUrl, '_blank');
      } else {
        // Para outros tipos, fazer download
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao baixar arquivo');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error);
      toast.error('Erro ao visualizar arquivo');
    }
  };

  // Funções para gerenciar seleção de versões
  const toggleVersaoSelecionada = (versaoId: string) => {
    setVersoesSelecionadas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versaoId)) {
        newSet.delete(versaoId);
      } else {
        newSet.add(versaoId);
      }
      return newSet;
    });
  };

  const selecionarTodasVersoesProduto = () => {
    const versoesProduto = versoesDoProduto.filter(v => v.status === 'RASCUNHO');
    const versaoIds = versoesProduto.map(v => v.id);
    setVersoesSelecionadas(prev => new Set([...prev, ...versaoIds]));
  };

  const desmarcarTodasVersoesProduto = () => {
    const versoesProduto = versoesDoProduto.filter(v => v.status === 'RASCUNHO');
    const versaoIds = versoesProduto.map(v => v.id);
    setVersoesSelecionadas(prev => {
      const newSet = new Set(prev);
      versaoIds.forEach(id => newSet.delete(id));
      return newSet;
    });
  };

  // Função para enviar versões de um produto específico
  const handleEnviarProduto = async (produtoId: string) => {
    try {
      const versoesProduto = versoesDoProduto.filter(v => v.status === 'RASCUNHO');
      const versoesSelecionadasProduto = versoesProduto.filter(v => versoesSelecionadas.has(v.id));
      
      if (versoesSelecionadasProduto.length === 0) {
        toast.warning('Nenhuma versão selecionada para envio');
        return;
      }

      const produto = produtos.find(p => p.id === produtoId);
      const produtoNome = produto?.nome || 'Produto';

      // Aqui você implementaria a lógica de envio
      // Por enquanto, apenas um toast de confirmação
      toast.success(`Enviando ${versoesSelecionadasProduto.length} versão(ões) selecionada(s) de ${produtoNome} para o cliente...`);
      
      // TODO: Implementar chamada para API de envio
      // await enviarVersoesParaCliente(versoesSelecionadasProduto.map(v => v.id));
      
    } catch (error) {
      console.error('Erro ao enviar produto:', error);
      toast.error('Erro ao enviar versões para o cliente');
    }
  };

  // Função para enviar todas as artes
  const handleEnviarTodasArtes = async () => {
    try {
      const versoesRascunho = versoes.filter(v => v.status === 'RASCUNHO');
      const versoesSelecionadasParaEnvio = versoesRascunho.filter(v => versoesSelecionadas.has(v.id));
      
      if (versoesSelecionadasParaEnvio.length === 0) {
        toast.warning('Nenhuma versão selecionada para envio');
        return;
      }

      // Agrupar por produto
      const versoesPorProduto = versoesSelecionadasParaEnvio.reduce((acc, versao) => {
        const produtoId = versao.servico_id || 'sem-produto';
        if (!acc[produtoId]) {
          acc[produtoId] = [];
        }
        acc[produtoId].push(versao);
        return acc;
      }, {} as Record<string, typeof versoesSelecionadasParaEnvio>);

      const produtosEnviados = Object.keys(versoesPorProduto).length;
      const totalVersoes = versoesSelecionadasParaEnvio.length;

      // Aqui você implementaria a lógica de envio
      // Por enquanto, apenas um toast de confirmação
      toast.success(`Enviando ${totalVersoes} versão(ões) selecionada(s) de ${produtosEnviados} produto(s) para o cliente...`);
      
      // TODO: Implementar chamada para API de envio
      // await enviarTodasVersoesParaCliente(versoesSelecionadasParaEnvio.map(v => v.id));
      
    } catch (error) {
      console.error('Erro ao enviar todas as artes:', error);
      toast.error('Erro ao enviar todas as artes para o cliente');
    }
  };

  // Filtrar versões por produto selecionado
  const versoesDoProduto = versoes.filter(v => v.servico_id === selectedProduto);

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
      {/* Header - Solto na página */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Arte & Aprovação</h2>
      </div>

      {/* Seleção de Produtos/Componentes */}
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

      {/* Controle de Versões - Solto na página */}
      {selectedProduto && (
        <div>
          {/* Título e subtítulo */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {produtos.find(p => p.id === selectedProduto)?.nome}
            </h3>
            <p className="text-sm text-gray-600">
              Gerencie as versões de arte para este produto
            </p>
          </div>
          
          {/* Botões */}
          <div className="flex gap-2">
            {!readonly && (
              <Button 
                onClick={handleCreateVersao}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Versão
              </Button>
            )}
            
            {/* Botões de seleção */}
            {versoesDoProduto.length > 0 && versoesDoProduto.some(v => v.status === 'RASCUNHO') && (
              <>
                <Button 
                  onClick={selecionarTodasVersoesProduto}
                  variant="outline"
                  size="sm"
                >
                  Selecionar Todas
                </Button>
                <Button 
                  onClick={desmarcarTodasVersoesProduto}
                  variant="outline"
                  size="sm"
                >
                  Desmarcar Todas
                </Button>
                <Button 
                  onClick={() => handleEnviarProduto(selectedProduto)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Selecionadas
                </Button>
              </>
            )}
          </div>
        </div>
      )}

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
                <Button onClick={handleCreateVersao}>
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
                {/* Título em uma linha: [check] V2 - Fachada Principal [badge] */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Checkbox para seleção */}
                    {versao.status === 'RASCUNHO' && (
                      <Checkbox
                        checked={versoesSelecionadas.has(versao.id)}
                        onCheckedChange={() => toggleVersaoSelecionada(versao.id)}
                      />
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{versao.versao}</h3>
                      <span className="text-gray-400">-</span>
                      <span className="text-gray-600">{produtos.find(p => p.id === versao.servico_id)?.nome || 'Produto'}</span>
                      <Badge className={getStatusColor(versao.status)}>
                        {getStatusLabel(versao.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Botões de ação */}
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
                    {versao.arquivos.length > 0 && versao.arquivos[0].url_thumbnail ? (
                      <div 
                        className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleViewVersao(versao)}
                      >
                        <img 
                          src={`${versao.arquivos[0].url_thumbnail}?token=${localStorage.getItem('access_token')}`}
                          alt={`Preview ${versao.versao}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            // Se falhar, mostrar ícone de arquivo
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-32"><svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg></div>';
                          }}
                        />
                      </div>
                    ) : versao.arquivos.length > 0 ? (
                      <div className="bg-gray-100 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-xs text-gray-500">{versao.arquivos[0].nome_original}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                        <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Sem preview</p>
                      </div>
                    )}
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
                    
                    {/* Separador */}
                    <div className="border-t border-gray-200 pt-2">
                      {versao.arquivos.length > 0 ? (
                        <div className="space-y-1">
                          {versao.arquivos.slice(0, 3).map((arquivo) => (
                            <div key={arquivo.id} className="flex items-center justify-between text-xs text-gray-600 hover:bg-gray-50 p-1 rounded">
                              <div className="flex items-center min-w-0 flex-1">
                                {arquivo.tipo_arquivo.startsWith('image/') || arquivo.tipo_arquivo === 'jpeg' || arquivo.tipo_arquivo === 'jpg' || arquivo.tipo_arquivo === 'png' ? (
                                  <Image className="h-3 w-3 mr-1 flex-shrink-0" />
                                ) : (
                                  <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                                )}
                                <span className="truncate">{arquivo.nome_original}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFile(arquivo.url_arquivo, arquivo.nome_original, arquivo.tipo_arquivo);
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
                                title="Visualizar arquivo"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
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
          onUploadSuccess={handleUploadSuccess}
          onUploadError={(error) => {
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

      {/* Modal de Criação de Versão com Upload */}
      {showCreateModal && (
        <ArteCreateVersionModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          osId={osId}
          servicoId={selectedProduto}
          servicoNome={produtos.find(p => p.id === selectedProduto)?.nome || ''}
          proximaVersao={getProximaVersao()}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta versão? Esta ação não pode ser desfeita e todos os arquivos associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setVersaoToDelete(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
