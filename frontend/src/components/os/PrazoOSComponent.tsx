/**
 * Componente para gerenciamento de prazo da OS
 * Implementa todas as regras de negócio definidas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface PrazoOSComponentProps {
  osId: string;
  dataPrazo?: Date;
  onPrazoChange?: (data: Date | null) => void;
  readonly?: boolean;
}

interface StatusPrazo {
  os_id: string;
  data_prazo?: Date;
  status: 'SEM_PRAZO' | 'AGUARDANDO_INICIO' | 'PRONTA_PRODUCAO' | 'EM_PRODUCAO';
  dias_restantes?: number;
  is_retroativo: boolean;
  mensagem: string;
}

interface DefinirPrazoRequest {
  data_prazo: string;
  motivo?: string;
  confirmar_retroativa?: boolean;
}

export function PrazoOSComponent({ 
  osId, 
  dataPrazo, 
  onPrazoChange, 
  readonly = false 
}: PrazoOSComponentProps) {
  const [statusPrazo, setStatusPrazo] = useState<StatusPrazo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRetroactiveModal, setShowRetroactiveModal] = useState(false);
  const [pendingData, setPendingData] = useState<DefinirPrazoRequest | null>(null);
  
  // Formulário
  const [formData, setFormData] = useState({
    data_prazo: '',
    motivo: ''
  });

  // Carregar status do prazo
  useEffect(() => {
    if (osId) {
      carregarStatusPrazo();
    }
  }, [osId]);

  const carregarStatusPrazo = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/os/prazo/${osId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setStatusPrazo(result.data);
      } else {
        toast.error('Erro ao carregar status do prazo');
      }
    } catch (error) {
      console.error('Erro ao carregar status do prazo:', error);
      toast.error('Erro ao carregar status do prazo');
    } finally {
      setIsLoading(false);
    }
  };

  const iniciarEdicao = () => {
    if (readonly) return;
    
    const dataAtual = statusPrazo?.data_prazo 
      ? new Date(statusPrazo.data_prazo).toISOString().split('T')[0]
      : '';
    
    setFormData({
      data_prazo: dataAtual,
      motivo: ''
    });
    setIsEditing(true);
  };

  const cancelarEdicao = () => {
    setIsEditing(false);
    setFormData({
      data_prazo: '',
      motivo: ''
    });
  };

  const salvarPrazo = async (confirmarRetroativa = false) => {
    if (!formData.data_prazo) {
      toast.error('Data do prazo é obrigatória');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      
      const requestData: DefinirPrazoRequest = {
        data_prazo: new Date(formData.data_prazo).toISOString(),
        motivo: formData.motivo || undefined,
        confirmar_retroativa: confirmarRetroativa
      };

      const response = await fetch(`/api/os/prazo/${osId}/definir`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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

        // Sucesso - atualizar status
        await carregarStatusPrazo();
        setIsEditing(false);
        onPrazoChange?.(new Date(formData.data_prazo));
        toast.success('Prazo definido com sucesso!');
      } else {
        toast.error(result.message || 'Erro ao definir prazo');
      }
    } catch (error) {
      console.error('Erro ao salvar prazo:', error);
      toast.error('Erro ao salvar prazo');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarRetroativa = async () => {
    if (!pendingData) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/os/prazo/${osId}/definir`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pendingData,
          confirmar_retroativa: true
        }),
      });

      const result = await response.json();

      if (result.success) {
        await carregarStatusPrazo();
        setIsEditing(false);
        onPrazoChange?.(new Date(pendingData.data_prazo));
        toast.success('Prazo retroativo definido com sucesso!');
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

  const getStatusIcon = () => {
    if (!statusPrazo) return <Clock className="h-4 w-4 text-gray-400" />;
    
    switch (statusPrazo.status) {
      case 'SEM_PRAZO':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'AGUARDANDO_INICIO':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'PRONTA_PRODUCAO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!statusPrazo) return 'text-gray-500';
    
    switch (statusPrazo.status) {
      case 'SEM_PRAZO':
        return 'text-yellow-600';
      case 'AGUARDANDO_INICIO':
        return 'text-blue-600';
      case 'PRONTA_PRODUCAO':
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  };

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(data));
  };

  if (isLoading && !statusPrazo) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>Carregando prazo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com título e botão de editar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">Prazo de Produção</span>
        </div>
        
        {!readonly && (
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

      {/* Conteúdo principal */}
      {isEditing ? (
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
          <div className="space-y-2">
            <Label htmlFor="data_prazo">Data do Prazo</Label>
            <Input
              id="data_prazo"
              type="date"
              value={formData.data_prazo}
              onChange={(e) => setFormData(prev => ({ ...prev, data_prazo: e.target.value }))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Ex: Cliente solicitou antecipação da entrega"
              rows={2}
              className="w-full"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => salvarPrazo()}
              disabled={isLoading || !formData.data_prazo}
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
        <div className="space-y-2">
          {statusPrazo?.data_prazo ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  {formatarData(statusPrazo.data_prazo)}
                </span>
                {statusPrazo.is_retroativo && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Retroativo
                  </span>
                )}
              </div>
              
              <div className={`text-sm ${getStatusColor()}`}>
                {statusPrazo.mensagem}
              </div>
              
              {statusPrazo.dias_restantes !== undefined && statusPrazo.dias_restantes > 0 && (
                <div className="text-xs text-gray-500">
                  {statusPrazo.dias_restantes} dia(s) restante(s)
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Prazo não definido
            </div>
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
                    <li>Apenas usuários autorizados podem definir datas retroativas</li>
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
