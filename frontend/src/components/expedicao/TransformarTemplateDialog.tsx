'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconTemplate } from '@tabler/icons-react';

export interface TransformarTemplateDialogProps {
  open: boolean;
  osNumero?: string;
  nomeSugerido?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (nome: string) => Promise<void>;
}

export function TransformarTemplateDialog({
  open,
  osNumero,
  nomeSugerido,
  loading = false,
  onClose,
  onConfirm,
}: TransformarTemplateDialogProps) {
  const [nome, setNome] = useState('');

  useEffect(() => {
    if (open) {
      setNome(nomeSugerido?.trim() ?? '');
    } else {
      setNome('');
    }
  }, [open, nomeSugerido]);

  const formValido = nome.trim().length > 0 && nome.trim().length <= 120;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <IconTemplate className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-left">
                Salvar como template — OS {osNumero ?? '...'}
              </DialogTitle>
              <DialogDescription className="text-left">
                Clona os produtos do orçamento vinculado para reutilização em
                novos orçamentos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert>
            <AlertDescription className="text-sm">
              Se o orçamento tiver vários produtos, cada um vira um template com
              sufixo no nome.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="nome-template">Nome do template *</Label>
            <Input
              id="nome-template"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={120}
              placeholder="Ex.: Fachada ACM padrão"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!formValido || loading}
            onClick={() => void onConfirm(nome.trim())}
          >
            {loading ? 'Salvando...' : 'Criar template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
