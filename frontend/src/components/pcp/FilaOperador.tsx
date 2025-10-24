'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
  IconRefresh,
  IconBuilding,
  IconUser
} from '@tabler/icons-react';

export interface ItemFila {
  id: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  data_prazo: string;
  progresso: number;
  alertas: string[];
  setor_atual?: string;
  observacoes?: string;
  quantidade_produzida?: number;
  quantidade_refugo?: number;
}

interface FilaOperadorProps {
  fila: ItemFila[];
  loading?: boolean;
  onIniciarProducao: (itemId: string, observacoes?: string) => Promise<void>;
  onConcluirEtapa: (itemId: string, observacoes?: string, quantidadeProduzida?: number) => Promise<void>;
  onPausarProducao: (itemId: string, motivo: string, observacoes?: string) => Promise<void>;
}

export function FilaOperador({
  fila,
  loading = false,
  onIniciarProducao,
  onConcluirEtapa,
  onPausarProducao
}: FilaOperadorProps) {
  const [selectedItem, setSelectedItem] = useState<ItemFila | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [quantidadeProduzida, setQuantidadeProduzida] = useState<number>(0);
  const [motivoPausa, setMotivoPausa] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'iniciar' | 'concluir' | 'pausar'>('iniciar');

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'CRITICA': return 'bg-red-100 text-red-800 border-red-200';
      case 'ALTA': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAIXA': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-gray-100 text-gray-800';
      case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-800';
      case 'PAUSADA': return 'bg-yellow-100 text-yellow-800';
      case 'CONCLUIDA': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE': return <IconClock className="h-4 w-4" />;
      case 'EM_ANDAMENTO': return <IconPlayerPlay className="h-4 w-4" />;
      case 'PAUSADA': return <IconPlayerPause className="h-4 w-4" />;
      case 'CONCLUIDA': return <IconCircleCheck className="h-4 w-4" />;
      default: return <IconClock className="h-4 w-4" />;
    }
  };

  const openDialog = (item: ItemFila, type: 'iniciar' | 'concluir' | 'pausar') => {
    setSelectedItem(item);
    setDialogType(type);
    setObservacoes('');
    setQuantidadeProduzida(0);
    setMotivoPausa('');
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedItem) return;

    try {
      switch (dialogType) {
        case 'iniciar':
          await onIniciarProducao(selectedItem.id, observacoes);
          break;
        case 'concluir':
          await onConcluirEtapa(selectedItem.id, observacoes, quantidadeProduzida);
          break;
        case 'pausar':
          await onPausarProducao(selectedItem.id, motivoPausa, observacoes);
          break;
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    }
  };

  const isAtrasada = (dataPrazo: string) => {
    if (!dataPrazo) return false;
    return new Date(dataPrazo) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (fila.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <IconBuilding className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhum item na fila
          </h3>
          <p className="text-gray-500">
            Não há itens pendentes para produção no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {fila.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Header do item */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.numero}
                    </Badge>
                    <Badge className={getPrioridadeColor(item.prioridade)}>
                      {item.prioridade}
                    </Badge>
                    <Badge className={getStatusColor(item.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        {item.status}
                      </div>
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{item.titulo}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.cliente}</p>
                </div>
                
                {/* Alertas */}
                {item.alertas.length > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <IconAlertTriangle className="h-4 w-4" />
                    <span className="text-xs">{item.alertas[0]}</span>
                  </div>
                )}
              </div>

              {/* Informações do item */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm">
                  <span className="text-gray-500">Prazo:</span>
                  <span className={`ml-2 font-medium ${
                    isAtrasada(item.data_prazo) ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    {item.data_prazo ? new Date(item.data_prazo).toLocaleDateString('pt-BR') : 'Não definido'}
                  </span>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-500">Progresso:</span>
                  <span className="ml-2 font-medium">{item.progresso}%</span>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-500">Setor:</span>
                  <span className="ml-2 font-medium">{item.setor_atual || 'Não definido'}</span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${item.progresso}%` }}
                />
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 pt-2">
                {item.status === 'PENDENTE' && (
                  <Button
                    size="sm"
                    onClick={() => openDialog(item, 'iniciar')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <IconPlayerPlay className="h-4 w-4 mr-2" />
                    Iniciar Produção
                  </Button>
                )}
                
                {item.status === 'EM_ANDAMENTO' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => openDialog(item, 'concluir')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <IconCircleCheck className="h-4 w-4 mr-2" />
                      Concluir Etapa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(item, 'pausar')}
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      <IconPlayerPause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  </>
                )}
                
                {item.status === 'PAUSADA' && (
                  <Button
                    size="sm"
                    onClick={() => openDialog(item, 'iniciar')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <IconPlayerPlay className="h-4 w-4 mr-2" />
                    Retomar Produção
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialog de ações */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'iniciar' && 'Iniciar Produção'}
              {dialogType === 'concluir' && 'Concluir Etapa'}
              {dialogType === 'pausar' && 'Pausar Produção'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  {dialogType === 'iniciar' && `Iniciar produção do item ${selectedItem.numero}`}
                  {dialogType === 'concluir' && `Concluir etapa do item ${selectedItem.numero}`}
                  {dialogType === 'pausar' && `Pausar produção do item ${selectedItem.numero}`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {dialogType === 'pausar' && (
              <div>
                <label className="text-sm font-medium">Motivo da pausa</label>
                <Input
                  value={motivoPausa}
                  onChange={(e) => setMotivoPausa(e.target.value)}
                  placeholder="Ex: Problema na máquina, falta de material..."
                  required
                />
              </div>
            )}

            {dialogType === 'concluir' && (
              <div>
                <label className="text-sm font-medium">Quantidade produzida</label>
                <Input
                  type="number"
                  value={quantidadeProduzida}
                  onChange={(e) => setQuantidadeProduzida(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações sobre a produção..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAction}>
              {dialogType === 'iniciar' && 'Iniciar'}
              {dialogType === 'concluir' && 'Concluir'}
              {dialogType === 'pausar' && 'Pausar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

