'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ArteApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  produtoNome: string;
  versao: string;
  processing?: boolean;
}

export function ArteApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  produtoNome,
  versao,
  processing = false
}: ArteApprovalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle className="text-xl">Confirmar Aprovação</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed pt-2">
            Você está prestes a aprovar a arte:
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900">{produtoNome}</p>
              <p className="text-sm text-gray-600">Versão: {versao}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700 font-medium">
                Atenção!
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Esta aprovação está <strong>liberando a arte para produção</strong>. 
                Certifique-se de que revisou todos os detalhes antes de confirmar.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processing}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
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

