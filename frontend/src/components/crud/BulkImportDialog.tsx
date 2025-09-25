'use client';

import { useState } from 'react';
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
import { Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export interface BulkImportResult {
  sucesso: number;
  erros: { linha: number; motivo: string }[];
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  downloadTemplate: () => Promise<void>;
  onImport: (file: File) => Promise<BulkImportResult>;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  title = 'Importar registros',
  description = 'Faça upload de um arquivo Excel (.xlsx) seguindo o template para importar registros em massa.',
  downloadTemplate,
  onImport,
}: BulkImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setResult(null);
    setErrorMessage(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setErrorMessage(null);
  };

  const handleImportClick = async () => {
    if (!selectedFile) {
      setErrorMessage('Selecione um arquivo Excel antes de importar.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      const importResult = await onImport(selectedFile);
      setResult(importResult);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Falha ao importar arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Não foi possível baixar o template.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Arquivo (.xlsx)
            </label>
            <Input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Baixar template
            </Button>
            <Button onClick={handleImportClick} disabled={isUploading}>
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Importando...
                </span>
              ) : (
                'Importar arquivo'
              )}
            </Button>
          </div>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {result && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 space-y-2 text-sm">
              <p>
                <span className="font-semibold">Importação concluída.</span>{' '}
                Registros criados: {result.sucesso}
              </p>
              {result.erros.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Linhas com erro ({result.erros.length}):
                  </p>
                  <div className="max-h-40 overflow-auto rounded-md border border-red-200 bg-white">
                    <ul className="list-disc pl-5 py-2 space-y-1 text-red-600 text-xs">
                      {result.erros.map((item) => (
                        <li key={`${item.linha}-${item.motivo}`}>
                          Linha {item.linha}: {item.motivo}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

