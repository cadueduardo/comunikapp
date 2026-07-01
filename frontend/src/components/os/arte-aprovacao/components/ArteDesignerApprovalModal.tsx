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
  /** Arte do cliente: conferência interna após preflight (observação opcional). */
  modo?: 'designer_override' | 'cliente_preflight';
}

export function ArteDesignerApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  produtoNome,
  versao,
  processing = false,
  modo = 'designer_override',
}: ArteDesignerApprovalModalProps) {
  const isClientePreflight = modo === 'cliente_preflight';
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');

  const handleConfirm = () => {
    if (!isClientePreflight) {
      if (!motivo.trim()) {
        setErro('O motivo é obrigatório para aprovar sem a alçada do cliente');
        return;
      }

      if (motivo.trim().length < 10) {
        setErro('O motivo deve ter no mínimo 10 caracteres');
        return;
      }
    }

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
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isClientePreflight ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {isClientePreflight ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <DialogTitle className="text-xl">
              {isClientePreflight
                ? 'Conferir arte e liberar para produção'
                : 'Aprovar Arte sem Cliente'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-base leading-relaxed text-gray-600">
            {isClientePreflight
              ? 'Confirme que o arquivo do cliente passou pelo preflight e está pronto para produção:'
              : 'Você está prestes a aprovar a arte:'}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="font-semibold text-gray-900">{produtoNome}</div>
              <div className="text-sm text-gray-600">Versão: {versao}</div>
            </div>
          </div>

          {isClientePreflight ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-sm text-blue-800">
              A arte foi enviada pelo cliente. Não é necessário solicitar aprovação externa —
              apenas registre observações internas, se houver.
            </div>
          ) : (
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
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-sm font-medium">
              {isClientePreflight ? 'Observação interna (opcional)' : (
                <>Motivo da aprovação <span className="text-red-500">*</span></>
              )}
            </Label>
            <Textarea
              id="motivo"
              placeholder={
                isClientePreflight
                  ? 'Ex.: ajustes de sangria e conversão CMYK conferidos...'
                  : 'Descreva o motivo da aprovação sem o cliente (mínimo 10 caracteres)...'
              }
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
                {isClientePreflight ? 'Liberando...' : 'Aprovando...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {isClientePreflight ? 'Conferir e liberar' : 'Sim, Aprovar'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

