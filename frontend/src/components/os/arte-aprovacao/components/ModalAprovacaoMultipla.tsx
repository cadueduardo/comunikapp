'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProdutoParaAprovacao {
  id: string;
  nome: string;
  versaoAtual: string;
  status: string;
}

interface ModalAprovacaoMultiplaProps {
  isOpen: boolean;
  onClose: () => void;
  produtos: ProdutoParaAprovacao[];
  onConfirmarAprovacao: (produtosAprovados: string[]) => Promise<void>;
}

export function ModalAprovacaoMultipla({ 
  isOpen, 
  onClose, 
  produtos, 
  onConfirmarAprovacao 
}: ModalAprovacaoMultiplaProps) {
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [confirmando, setConfirmando] = useState(false);

  const handleToggleProduto = (produtoId: string) => {
    setProdutosSelecionados(prev => 
      prev.includes(produtoId) 
        ? prev.filter(id => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  const handleConfirmar = async () => {
    if (produtosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um produto para aprovar');
      return;
    }

    try {
      setConfirmando(true);
      await onConfirmarAprovacao(produtosSelecionados);
      toast.success(`${produtosSelecionados.length} produto(s) aprovado(s) com sucesso!`);
      onClose();
      setProdutosSelecionados([]);
    } catch (error) {
      console.error('Erro ao aprovar produtos:', error);
      toast.error('Erro ao aprovar produtos');
    } finally {
      setConfirmando(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ENVIADA_CLIENTE':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'RASCUNHO':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'Aprovada';
      case 'ENVIADA_CLIENTE':
        return 'Enviada ao Cliente';
      case 'RASCUNHO':
        return 'Rascunho';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return 'bg-green-100 text-green-800';
      case 'ENVIADA_CLIENTE':
        return 'bg-blue-100 text-blue-800';
      case 'RASCUNHO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Registrar Aprovação - Múltiplos Produtos</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <p className="text-sm text-gray-600 mb-4">
            Selecione quais produtos deseja aprovar. Apenas produtos com status "Enviada ao Cliente" podem ser aprovados.
          </p>

          <div className="space-y-3">
            {produtos.map((produto) => {
              const podeAprovar = produto.status === 'ENVIADA_CLIENTE';
              const isSelected = produtosSelecionados.includes(produto.id);

              return (
                <div 
                  key={produto.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    podeAprovar ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-100 bg-gray-50'
                  } ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleProduto(produto.id)}
                    disabled={!podeAprovar}
                    className="flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(produto.status)}
                      <span className="font-medium text-sm text-gray-900">{produto.nome}</span>
                      <Badge variant="outline" className={getStatusColor(produto.status)}>
                        {getStatusLabel(produto.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">Versão: {produto.versaoAtual}</p>
                    {!podeAprovar && (
                      <p className="text-xs text-orange-600 mt-1">
                        Este produto não pode ser aprovado no momento
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {produtosSelecionados.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{produtosSelecionados.length}</strong> produto(s) selecionado(s) para aprovação
              </p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t pt-4 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={confirmando}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar}
            disabled={produtosSelecionados.length === 0 || confirmando}
            className="bg-green-600 hover:bg-green-700"
          >
            {confirmando ? 'Aprovando...' : `Aprovar ${produtosSelecionados.length} produto(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
