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
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface ArteAprovacaoTabSimpleProps {
  osId: string;
  readonly?: boolean;
}

export function ArteAprovacaoTabSimple({ osId, readonly = false }: ArteAprovacaoTabSimpleProps) {
  const [creatingVersao, setCreatingVersao] = useState(false);

  const handleCreateVersao = async () => {
    if (creatingVersao) return;
    
    try {
      setCreatingVersao(true);
      
      // Simular criação de versão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Versão criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar versão:', error);
      toast.error('Erro ao criar versão');
    } finally {
      setCreatingVersao(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">🎨 Arte & Aprovação</CardTitle>
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

      {/* Lista de versões - Mock data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Versões de Arte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Versão 1 */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-semibold text-lg">v1</h3>
                    <p className="text-sm text-gray-600">Versão inicial da arte</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Aprovada
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date().toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Designer
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Arquivos (2)</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-600">
                      <Image className="h-3 w-3 mr-1" />
                      fachada_v1.pdf
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <FileText className="h-3 w-3 mr-1" />
                      banner_v1.jpg
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Comentários (1)</h4>
                  <div className="text-xs text-gray-600">
                    Cliente aprovou a arte final
                  </div>
                </div>
              </div>
            </div>

            {/* Versão 2 */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-semibold text-lg">v2</h3>
                    <p className="text-sm text-gray-600">Ajustes solicitados pelo cliente</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Enviada ao Cliente
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date().toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Designer
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Arquivos (1)</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-600">
                      <Image className="h-3 w-3 mr-1" />
                      fachada_v2.pdf
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Comentários (0)</h4>
                  <div className="text-xs text-gray-500 italic">
                    Aguardando feedback
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da OS */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">
            <p><strong>OS ID:</strong> {osId}</p>
            <p><strong>Status:</strong> Módulo Arte & Aprovação ativo</p>
            <p><strong>Última atualização:</strong> {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

