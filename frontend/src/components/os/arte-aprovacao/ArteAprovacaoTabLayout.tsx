'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Upload, 
  Eye, 
  Trash2, 
  FileText,
  Image,
  Calendar,
  User,
  MessageSquare,
  Download,
  Edit,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ArteAprovacaoTabLayoutProps {
  osId: string;
  readonly?: boolean;
}

export function ArteAprovacaoTabLayout({ osId, readonly = false }: ArteAprovacaoTabLayoutProps) {
  const [creatingVersao, setCreatingVersao] = useState(false);
  const [selectedVersao, setSelectedVersao] = useState<string | null>('v1');

  const handleCreateVersao = async () => {
    if (creatingVersao) return;
    
    try {
      setCreatingVersao(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Versão criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar versão');
    } finally {
      setCreatingVersao(false);
    }
  };

  // Mock data - será substituído pela API real
  const versoes = [
    {
      id: 'v1',
      nome: 'Fachada Principal',
      versao: 'v1',
      status: 'APROVADA',
      autor: 'Designer',
      data: '09/10/2025',
      arquivos: 2,
      comentarios: 1
    },
    {
      id: 'v2', 
      nome: 'Banner Interno',
      versao: 'v2',
      status: 'ENVIADA_CLIENTE',
      autor: 'Designer',
      data: '09/10/2025',
      arquivos: 1,
      comentarios: 0
    },
    {
      id: 'v3',
      nome: 'Painel Externo', 
      versao: 'v3',
      status: 'RASCUNHO',
      autor: 'Designer',
      data: '09/10/2025',
      arquivos: 0,
      comentarios: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'ENVIADA_CLIENTE':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'RASCUNHO':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ENVIADA_CLIENTE':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'RASCUNHO':
        return <Edit className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar Esquerdo - Persistente (25% desktop, full mobile) */}
      <div className="w-full lg:w-[25%] lg:pr-6 mb-6 lg:mb-0">
        <div className="space-y-6">
          {/* Header com botão Nova Versão */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Arte & Aprovação</h3>
              {!readonly && (
                <Button 
                  onClick={handleCreateVersao}
                  disabled={creatingVersao}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {creatingVersao ? 'Criando...' : 'Nova'}
                </Button>
              )}
            </div>
            
            {/* Estatísticas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de versões:</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aprovadas:</span>
                  <span className="font-medium text-green-600">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pendentes:</span>
                  <span className="font-medium text-blue-600">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rascunhos:</span>
                  <span className="font-medium text-gray-600">1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option>Todos</option>
                  <option>Aprovadas</option>
                  <option>Pendentes</option>
                  <option>Rascunhos</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Serviço</label>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option>Todos</option>
                  <option>Fachada Principal</option>
                  <option>Banner Interno</option>
                  <option>Painel Externo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Versões (Sidebar) */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Versões</h4>
            <div className="space-y-2">
              {versoes.map((versao) => (
                <button
                  key={versao.id}
                  onClick={() => setSelectedVersao(versao.id)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedVersao === versao.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{versao.nome}</span>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(versao.status)}`}>
                      {getStatusIcon(versao.status)}
                      <span className="ml-1">{versao.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {versao.versao} • {versao.data}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal - Versões (50% desktop) */}
      <div className="w-full lg:w-[50%] lg:px-6 mb-6 lg:mb-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Versões de Arte</h3>
            
            {/* Versão Selecionada */}
            {selectedVersao && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {versoes.find(v => v.id === selectedVersao)?.nome} - {selectedVersao}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                      {!readonly && (
                        <>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Informações da Versão */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Detalhamento Técnico</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Versão:</span>
                            <span className="font-medium">{selectedVersao}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium">{versoes.find(v => v.id === selectedVersao)?.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Autor:</span>
                            <span className="font-medium">{versoes.find(v => v.id === selectedVersao)?.autor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Data:</span>
                            <span className="font-medium">{versoes.find(v => v.id === selectedVersao)?.data}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Arquivos ({versoes.find(v => v.id === selectedVersao)?.arquivos})</h4>
                        {versoes.find(v => v.id === selectedVersao)?.arquivos ? (
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Image className="h-4 w-4 mr-2" />
                              fachada_{selectedVersao}.pdf
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="h-4 w-4 mr-2" />
                              banner_{selectedVersao}.jpg
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Nenhum arquivo anexado</p>
                        )}
                      </div>
                    </div>

                    {/* Comentários */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Comentários ({versoes.find(v => v.id === selectedVersao)?.comentarios})</h4>
                        {versoes.find(v => v.id === selectedVersao)?.comentarios ? (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center mb-2">
                              <User className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-sm font-medium">Cliente</span>
                              <span className="text-xs text-gray-500 ml-2">09/10/2025</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Arte aprovada! Pode seguir para produção.
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Nenhum comentário</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Painel Direito - Ações e Status (25% desktop) */}
      <div className="w-full lg:w-[25%]">
        <div className="space-y-6">
          {/* Status da Arte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status da Arte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Atual:</span>
                  <span className="text-sm font-medium">{selectedVersao || 'v1'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Aprovada:</span>
                  <span className="text-sm font-medium text-green-600">v1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Em revisão:</span>
                  <span className="text-sm font-medium text-blue-600">v2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rascunho:</span>
                  <span className="text-sm font-medium text-gray-600">v3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!readonly && (
                  <Button className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Versão
                  </Button>
                )}
                <Button variant="outline" className="w-full" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Arquivo
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Adicionar Comentário
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Todos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informações da OS */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>OS ID:</strong> {osId}</div>
                <div><strong>Status:</strong> Arte & Aprovação</div>
                <div><strong>Última atualização:</strong></div>
                <div>{new Date().toLocaleString('pt-BR')}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

