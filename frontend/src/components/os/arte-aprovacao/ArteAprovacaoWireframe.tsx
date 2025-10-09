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
  Copy,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  Settings,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ArteAprovacaoWireframeProps {
  osId: string;
  readonly?: boolean;
}

export function ArteAprovacaoWireframe({ osId, readonly = false }: ArteAprovacaoWireframeProps) {
  const [selectedAsset, setSelectedAsset] = useState('fachada');

  const assets = [
    {
      id: 'fachada',
      nome: 'Fachada Principal',
      versao: 'v3',
      status: 'aprovada',
      dotColor: 'bg-green-400'
    },
    {
      id: 'banner',
      nome: 'Banner Interno', 
      versao: 'v1',
      status: 'pendente',
      dotColor: 'bg-yellow-400'
    },
    {
      id: 'painel',
      nome: 'Painel Externo',
      versao: 'v2', 
      status: 'revisar',
      dotColor: 'bg-red-400'
    }
  ];

  const versoes = [
    {
      id: 'v3',
      data: '08/10/2025 10:12',
      autor: 'Pedro (Design)',
      status: 'Enviada ao cliente',
      statusColor: 'bg-yellow-100 text-yellow-800',
      preview: 'Preview v3',
      arquivos: ['Prova PDF (low-res)', 'Mockup JPG'],
      descricao: 'Ajuste de margem e tipografia',
      acoes: [
        { label: 'Enviar p/ aprovação', icon: Mail },
        { label: 'Comparar com v2', icon: Eye },
        { label: 'Substituir arquivos', icon: Upload }
      ]
    },
    {
      id: 'v2',
      data: '07/10/2025 16:40',
      autor: 'Pedro (Design)',
      status: 'Rascunho interno',
      statusColor: 'bg-blue-100 text-blue-800',
      preview: 'Preview v2',
      arquivos: ['AI (editável)', 'PDF CMYK'],
      descricao: 'Alteração de logo e cores do totem',
      acoes: [
        { label: 'Gerar prova baixa', icon: Download },
        { label: 'Duplicar como v3', icon: Copy }
      ]
    },
    {
      id: 'v1',
      data: '05/10/2025 11:05',
      autor: 'Pedro (Design)',
      status: 'Aprovada',
      statusColor: 'bg-green-100 text-green-800',
      preview: 'Preview v1',
      arquivos: ['PDF baixa (assinatura)', 'PNG Preview'],
      descricao: 'Versão base aprovada para estudo',
      acoes: [
        { label: 'Bloquear edição', icon: Lock },
        { label: 'Gerar técnicos', icon: Settings },
        { label: 'Enviar ao PCP', icon: ArrowRight }
      ]
    }
  ];

  const comentarios = [
    {
      autor: 'Cliente',
      texto: 'Aumentar 10% o logo na fachada lateral.',
      data: '07/10 09:15'
    },
    {
      autor: 'Design',
      texto: 'Aplicado e reenviado na v3.',
      data: '08/10 10:05'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Arte & Aprovação</h3>
      </div>

      {/* Filtros de Serviços */}
      <div className="flex flex-wrap gap-2">
        {assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => setSelectedAsset(asset.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 transition-colors ${
              selectedAsset === asset.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${asset.dotColor}`} />
            <span>{asset.versao} {asset.nome} • {asset.status}</span>
          </button>
        ))}
      </div>

      {/* Lista de Versões */}
      <div className="space-y-4">
        {console.log('Total de versões:', versoes.length, versoes.map(v => v.id))}
        {versoes.map((versao, index) => {
          console.log(`Renderizando versão ${index + 1}/${versoes.length}:`, versao.id, versao.status);
          return (
          <Card key={versao.id} className={`hover:shadow-md transition-shadow ${versao.id === 'v1' ? 'bg-red-50 border-red-200' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                {/* Header da Versão */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-lg">{versao.id}</h4>
                    <Badge className={versao.statusColor}>
                      {versao.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {versao.data} • {versao.autor}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Preview */}
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-gray-900">Preview</h5>
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">{versao.preview}</p>
                  </div>
                </div>

                {/* Arquivos */}
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-gray-900">Arquivos</h5>
                  <div className="space-y-2">
                    {versao.arquivos.map((arquivo, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-2 rounded-full text-xs text-gray-700">
                        {arquivo}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{versao.descricao}</p>
                </div>

                {/* Ações */}
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-gray-900">Ações</h5>
                  <div className="space-y-2">
                    {versao.acoes.map((acao, index) => {
                      const Icon = acao.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs"
                        >
                          <Icon className="h-3 w-3 mr-2" />
                          {acao.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
