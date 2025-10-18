'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ArteDesignerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  produtoNome: string;
  versao: string;
  processing?: boolean;
}

export function ArteDesignerApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  produtoNome,
  versao,
  processing = false
}: ArteDesignerApprovalModalProps) {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');

  const handleConfirm = () => {
    // Validar motivo
    if (!motivo.trim()) {
      setErro('O motivo é obrigatório para aprovar sem a alçada do cliente');
      return;
    }

    if (motivo.trim().length < 10) {
      setErro('O motivo deve ter no mínimo 10 caracteres');
      return;
    }

    // Limpar erro e confirmar
    setErro('');
    onConfirm(motivo.trim());
  };

  const handleClose = () => {
    setMotivo('');
    setErro('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle className="text-xl">Aprovar Arte sem Cliente</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da arte */}
          <div className="text-base leading-relaxed text-gray-600">
            Você está prestes a aprovar a arte:
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="font-semibold text-gray-900">{produtoNome}</div>
              <div className="text-sm text-gray-600">Versão: {versao}</div>
            </div>
          </div>

          {/* Alerta */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <div className="text-sm text-amber-700 font-medium">
                  Atenção!
                </div>
                <div className="text-sm text-amber-700 mt-1">
                  Esta aprovação está sendo feita <strong>sem a alçada do cliente</strong>. 
                  Você está assumindo a responsabilidade pela aprovação.
                </div>
              </div>
            </div>
          </div>

          {/* Campo de motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-sm font-medium">
              Motivo da aprovação <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da aprovação sem o cliente (mínimo 10 caracteres)..."
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setErro('');
              }}
              className={`min-h-[100px] ${erro ? 'border-red-500' : ''}`}
              disabled={processing}
            />
            {erro && (
              <p className="text-sm text-red-500">{erro}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex space-x-2 sm:space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            disabled={processing}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm} 
            disabled={processing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Aprovando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sim, Aprovar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

