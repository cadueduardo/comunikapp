'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ArteSendToPCPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  produtoNome: string;
  versao: string;
  processing?: boolean;
}

export function ArteSendToPCPModal({
  isOpen,
  onClose,
  onConfirm,
  produtoNome,
  versao,
  processing = false
}: ArteSendToPCPModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="h-5 w-5 text-purple-600" />
            </div>
            <DialogTitle className="text-xl">Enviar para PCP</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da arte */}
          <div className="text-base leading-relaxed text-gray-600">
            Você está prestes a enviar para o PCP:
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="font-semibold text-gray-900">{produtoNome}</div>
              <div className="text-sm text-gray-600">Versão: {versao}</div>
            </div>
          </div>

          {/* Alerta de conferência */}
          <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-purple-400" />
              </div>
              <div className="ml-3">
                <div className="text-sm text-purple-700 font-medium">
                  Conferência Final
                </div>
                <div className="text-sm text-purple-700 mt-1">
                  Certifique-se de que você revisou todos os pontos da arte antes de enviar para produção:
                </div>
                <ul className="text-sm text-purple-700 mt-2 list-disc list-inside space-y-1">
                  <li>Medidas e dimensões corretas</li>
                  <li>Cores e acabamentos especificados</li>
                  <li>Arquivos finais anexados</li>
                  <li>Observações e detalhes técnicos</li>
                </ul>
              </div>
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
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Sim, Enviar para PCP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

