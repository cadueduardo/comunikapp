/**
 * Componente para gerenciamento de prazo de produto individual
 * Permite definir prazo, data de início e prioridade
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Edit3,
  Save,
  X,
  Play,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

interface PrazoProdutoComponentProps {
  osId: string;
  itemId: string;
  produtoNome: string;
  dataPrazoProduto?: Date;
  dataInicio?: Date;
  prioridade?: string;
  statusLiberacao?: string;
  prazoFinalOS?: Date;
  onPrazoChange?: () => void;
  readonly?: boolean;
}

export function PrazoProdutoComponent({ 
  osId,
  itemId,
  produtoNome,
  dataPrazoProduto,
  dataInicio,
  prioridade = 'NORMAL',
  statusLiberacao = 'PENDENTE',
  prazoFinalOS,
  onPrazoChange,
  readonly = false 
}: PrazoProdutoComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRetroactiveModal, setShowRetroactiveModal] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  
  // Formulário
  const [formData, setFormData] = useState({
    data_prazo_produto: '',
    data_inicio_producao: '',
    prioridade_produto: prioridade,
    motivo: ''
  });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        data_prazo_produto: dataPrazoProduto 
          ? new Date(dataPrazoProduto).toISOString().split('T')[0]
          : '',
        data_inicio_producao: dataInicio 
          ? new Date(dataInicio).toISOString().split('T')[0]
          : '',
        prioridade_produto: prioridade || 'NORMAL',
        motivo: ''
      });
    }
  }, [isEditing, dataPrazoProduto, dataInicio, prioridade]);

  const iniciarEdicao = () => {
    if (readonly || statusLiberacao === 'LIBERADO' || statusLiberacao === 'EM_PRODUCAO') {
      toast.error('Produto já foi liberado para PCP. Não é possível alterar o prazo.');
      return;
    }
    setIsEditing(true);
  };

  const cancelarEdicao = () => {
    setIsEditing(false);
    setFormData({
      data_prazo_produto: '',
      data_inicio_producao: '',
      prioridade_produto: 'NORMAL',
      motivo: ''
    });
  };

  const salvarPrazo = async (confirmarRetroativa = false) => {
    if (!formData.data_prazo_produto) {
      toast.error('Data do prazo é obrigatória');
      return;
    }

    try {
      setIsLoading(true);
      
      const requestData = {
        data_prazo_produto: new Date(formData.data_prazo_produto).toISOString(),
        data_inicio_producao: formData.data_inicio_producao 
          ? new Date(formData.data_inicio_producao).toISOString()
          : undefined,
        prioridade_produto: formData.prioridade_produto,
        motivo: formData.motivo || undefined,
        confirmar_retroativa: confirmarRetroativa
      };

      const response = await fetch(`/api/os/produtos/${osId}/item/${itemId}/definir-prazo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        if (result.data.requires_confirmation) {
          // Data retroativa - mostrar modal de confirmação
          setPendingData(requestData);
          setShowRetroactiveModal(true);
          setIsLoading(false);
          return;
        }

        // Sucesso
        setIsEditing(false);
        onPrazoChange?.();
        toast.success('Prazo do produto definido com sucesso!');
      } else {
        toast.error(result.message || 'Erro ao definir prazo do produto');
      }
    } catch (error) {
      console.error('Erro ao salvar prazo do produto:', error);
      toast.error('Erro ao salvar prazo do produto');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarRetroativa = async () => {
    if (!pendingData) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/os/produtos/${osId}/item/${itemId}/definir-prazo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pendingData,
          confirmar_retroativa: true
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEditing(false);
        onPrazoChange?.();
        toast.success('Prazo retroativo do produto definido com sucesso!');
        setShowRetroactiveModal(false);
        setPendingData(null);
      } else {
        toast.error(result.message || 'Erro ao definir prazo retroativo');
      }
    } catch (error) {
      console.error('Erro ao confirmar prazo retroativo:', error);
      toast.error('Erro ao confirmar prazo retroativo');
    } finally {
      setIsLoading(false);
    }
  };

  const liberarParaPCP = async () => {
    if (!dataPrazoProduto) {
      toast.error('Defina o prazo do produto antes de liberar para o PCP');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/os/produtos/${osId}/item/${itemId}/liberar-pcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivo: 'Liberação para produção'
        }),
      });

      const result = await response.json();

      if (result.success) {
        onPrazoChange?.();
        toast.success('Produto liberado para PCP com sucesso!');
      } else {
        toast.error(result.message || 'Erro ao liberar produto para PCP');
      }
    } catch (error) {
      console.error('Erro ao liberar produto para PCP:', error);
      toast.error('Erro ao liberar produto para PCP');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (statusLiberacao) {
      case 'LIBERADO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'EM_PRODUCAO':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'CONCLUIDO':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE':
        return 'bg-red-100 text-red-800';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'BAIXA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(data));
  };

  return (
    <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
      {/* Header do produto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-gray-600" />
          <div>
            <h4 className="font-medium text-gray-900">{produtoNome}</h4>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon()}
              <span className="text-xs text-gray-500">{statusLiberacao}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${getPrioridadeColor(prioridade)}`}>
                {prioridade}
              </span>
            </div>
          </div>
        </div>
        
        {!readonly && statusLiberacao === 'PENDENTE' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={iniciarEdicao}
            className="h-8 px-2"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Conteúdo */}
      {isEditing ? (
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio_producao}
                onChange={(e) => setFormData(prev => ({ ...prev, data_inicio_producao: e.target.value }))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Quando deve iniciar a produção</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_prazo">Prazo do Produto *</Label>
              <Input
                id="data_prazo"
                type="date"
                value={formData.data_prazo_produto}
                onChange={(e) => setFormData(prev => ({ ...prev, data_prazo_produto: e.target.value }))}
                className="w-full"
                max={prazoFinalOS ? new Date(prazoFinalOS).toISOString().split('T')[0] : undefined}
              />
              <p className="text-xs text-gray-500">
                {prazoFinalOS 
                  ? `Deve ser até ${formatarData(prazoFinalOS)} (prazo final da OS)`
                  : 'Prazo de conclusão do produto'
                }
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select
              value={formData.prioridade_produto}
              onValueChange={(value) => setFormData(prev => ({ ...prev, prioridade_produto: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="URGENTE">🔴 Urgente</SelectItem>
                <SelectItem value="ALTA">🟠 Alta</SelectItem>
                <SelectItem value="NORMAL">🔵 Normal</SelectItem>
                <SelectItem value="BAIXA">⚪ Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Ex: Produto prioritário para entrega"
              rows={2}
              className="w-full"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => salvarPrazo()}
              disabled={isLoading || !formData.data_prazo_produto}
              size="sm"
              className="flex items-center space-x-1"
            >
              <Save className="h-4 w-4" />
              <span>Salvar</span>
            </Button>
            
            <Button
              onClick={cancelarEdicao}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Cancelar</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Prazos definidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dataInicio && (
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Início:</span>
                <div className="flex items-center space-x-2">
                  <Play className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium">{formatarData(dataInicio)}</span>
                </div>
              </div>
            )}
            
            {dataPrazoProduto ? (
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Prazo:</span>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium">{formatarData(dataPrazoProduto)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Prazo:</span>
                <span className="text-sm text-yellow-600 italic">Não definido</span>
              </div>
            )}
          </div>

          {/* Botão de liberar para PCP */}
          {dataPrazoProduto && statusLiberacao === 'PENDENTE' && !readonly && (
            <Button
              onClick={liberarParaPCP}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Liberar para PCP</span>
            </Button>
          )}
        </div>
      )}

      {/* Modal de confirmação para data retroativa */}
      <Dialog open={showRetroactiveModal} onOpenChange={setShowRetroactiveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Data Retroativa</span>
            </DialogTitle>
            <DialogDescription>
              A data informada é anterior à data atual. Esta ação será registrada em log para auditoria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Atenção:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Esta ação será registrada em log de auditoria</li>
                    <li>Será capturado seu IP e informações do navegador</li>
                    <li>Produto: <strong>{produtoNome}</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowRetroactiveModal(false)}
              variant="outline"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarRetroativa}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Confirmando...' : 'Confirmar Data Retroativa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
