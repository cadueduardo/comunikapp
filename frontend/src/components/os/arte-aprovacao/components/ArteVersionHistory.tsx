'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Copy,
  Send,
  Download,
  FileText,
  Image,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { ArteVersionCard } from './ArteVersionCard';
import { ArteVersao, ArteStatus } from '../types/arte-types';

interface ArteVersionHistoryProps {
  versoes: ArteVersao[];
  osId: string;
  onCreateVersao: () => void;
  onEditVersao: (versao: ArteVersao) => void;
  onDeleteVersao: (versaoId: string) => void;
  onViewVersao: (versao: ArteVersao) => void;
  onCompareVersoes: (versao1: ArteVersao, versao2: ArteVersao) => void;
  onSendForApproval: (versao: ArteVersao) => void;
  onSendToPCP: (versao: ArteVersao) => void;
  readonly?: boolean;
}

export function ArteVersionHistory({
  versoes,
  osId,
  onCreateVersao,
  onEditVersao,
  onDeleteVersao,
  onViewVersao,
  onCompareVersoes,
  onSendForApproval,
  onSendToPCP,
  readonly = false
}: ArteVersionHistoryProps) {
  const [selectedVersoes, setSelectedVersoes] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<ArteStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'data' | 'versao' | 'status'>('data');

  // Filtrar versões por status
  const filteredVersoes = versoes.filter(versao => 
    filterStatus === 'ALL' || versao.status === filterStatus
  );

  // Ordenar versões
  const sortedVersoes = [...filteredVersoes].sort((a, b) => {
    switch (sortBy) {
      case 'data':
        return new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime();
      case 'versao':
        return b.versao.localeCompare(a.versao);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // Estatísticas das versões
  const stats = {
    total: versoes.length,
    aprovadas: versoes.filter(v => v.status === ArteStatus.APROVADA).length,
    pendentes: versoes.filter(v => v.status === ArteStatus.ENVIADA_CLIENTE).length,
    rascunho: versoes.filter(v => v.status === ArteStatus.RASCUNHO).length,
    revisao: versoes.filter(v => v.status === ArteStatus.REVISAO_SOLICITADA).length
  };

  const handleSelectVersao = (versaoId: string) => {
    setSelectedVersoes(prev => 
      prev.includes(versaoId) 
        ? prev.filter(id => id !== versaoId)
        : [...prev, versaoId]
    );
  };

  const handleSelectAll = () => {
    setSelectedVersoes(
      selectedVersoes.length === sortedVersoes.length 
        ? [] 
        : sortedVersoes.map(v => v.id)
    );
  };

  const handleCompareSelected = () => {
    if (selectedVersoes.length === 2) {
      const [versao1, versao2] = selectedVersoes.map(id => 
        versoes.find(v => v.id === id)!
      );
      onCompareVersoes(versao1, versao2);
    }
  };

  const getStatusIcon = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ArteStatus.ENVIADA_CLIENTE:
        return <Send className="h-4 w-4 text-blue-600" />;
      case ArteStatus.RASCUNHO:
        return <Edit className="h-4 w-4 text-gray-600" />;
      case ArteStatus.REVISAO_SOLICITADA:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case ArteStatus.BLOQUEADA:
        return <XCircle className="h-4 w-4 text-orange-600" />;
      case ArteStatus.ENVIADA_PCP:
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ArteStatus) => {
    switch (status) {
      case ArteStatus.APROVADA:
        return 'bg-green-100 text-green-800 border-green-200';
      case ArteStatus.ENVIADA_CLIENTE:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ArteStatus.RASCUNHO:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case ArteStatus.REVISAO_SOLICITADA:
        return 'bg-red-100 text-red-800 border-red-200';
      case ArteStatus.BLOQUEADA:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ArteStatus.ENVIADA_PCP:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Versões</h2>
          <p className="text-gray-600 mt-1">
            Gerencie todas as versões de arte desta OS
          </p>
        </div>
        
        {!readonly && (
          <Button onClick={onCreateVersao} className="w-full lg:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Versão
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.aprovadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Rascunho</p>
                <p className="text-2xl font-bold text-gray-600">{stats.rascunho}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Revisão</p>
                <p className="text-2xl font-bold text-red-600">{stats.revisao}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Filtros */}
            <div className="flex flex-wrap items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filtrar:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ArteStatus | 'ALL')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="ALL">Todas</option>
                  <option value={ArteStatus.RASCUNHO}>Rascunho</option>
                  <option value={ArteStatus.ENVIADA_CLIENTE}>Enviada</option>
                  <option value={ArteStatus.APROVADA}>Aprovada</option>
                  <option value={ArteStatus.REVISAO_SOLICITADA}>Revisão</option>
                  <option value={ArteStatus.BLOQUEADA}>Bloqueada</option>
                  <option value={ArteStatus.ENVIADA_PCP}>Enviada PCP</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Ordenar:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'data' | 'versao' | 'status')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="data">Data</option>
                  <option value="versao">Versão</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            {/* Ações em Lote */}
            {selectedVersoes.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedVersoes.length} selecionada(s)
                </span>
                {selectedVersoes.length === 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCompareSelected}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Comparar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVersoes([])}
                >
                  Limpar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Versões */}
      <div className="space-y-4">
        {sortedVersoes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma versão encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {filterStatus === 'ALL' 
                  ? 'Crie a primeira versão de arte para esta OS.'
                  : `Nenhuma versão com status "${filterStatus}" encontrada.`
                }
              </p>
              {!readonly && filterStatus === 'ALL' && (
                <Button onClick={onCreateVersao}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Versão
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedVersoes.map((versao) => (
            <ArteVersionCard
              key={versao.id}
              versao={versao}
              selected={selectedVersoes.includes(versao.id)}
              onSelect={() => handleSelectVersao(versao.id)}
              onEdit={() => onEditVersao(versao)}
              onDelete={() => onDeleteVersao(versao.id)}
              onView={() => onViewVersao(versao)}
              onSendForApproval={() => onSendForApproval(versao)}
              onSendToPCP={() => onSendToPCP(versao)}
              readonly={readonly}
            />
          ))
        )}
      </div>
    </div>
  );
}
