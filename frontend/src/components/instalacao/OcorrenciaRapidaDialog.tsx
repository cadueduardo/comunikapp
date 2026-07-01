'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EvidenciaFotosUpload } from '@/components/instalacao/EvidenciaFotosUpload';
import { TIPOS_OCORRENCIA_OPTIONS } from '@/lib/instalacao/instalacao-labels';
import type { PainelOsInstalacao } from '@/lib/instalacao/instalacao.types';
import { IconLoader2, IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface OcorrenciaRapidaDialogProps {
  osId: string;
  painel?: PainelOsInstalacao;
  onRegistrar: (dados: {
    os_id: string;
    item_instalacao_id?: string;
    tipo: string;
    descricao: string;
    fotos_evidencia?: string[];
  }) => Promise<void>;
  onUpload: (arquivo: File) => Promise<{ url: string }>;
  /** Quando o usuário está no detalhe de um lote, o vínculo é automático. */
  loteIdFixo?: string | null;
  loteRotuloFixo?: string | null;
  /** Rótulo do botão (padrão: Nova ocorrência) */
  rotuloBotao?: string;
  /** Variante visual do botão */
  varianteBotao?: 'default' | 'outline';
  classNameBotao?: string;
}

export function OcorrenciaRapidaDialog({
  osId,
  painel,
  onRegistrar,
  onUpload,
  loteIdFixo,
  loteRotuloFixo,
  rotuloBotao = 'Nova ocorrência',
  varianteBotao = 'default',
  classNameBotao,
}: OcorrenciaRapidaDialogProps) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState('VISITA_IMPRODUTIVA');
  const [loteId, setLoteId] = useState<string>('nenhum');
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const loteVinculado = Boolean(loteIdFixo);

  useEffect(() => {
    if (aberto && loteIdFixo) {
      setLoteId(loteIdFixo);
    }
  }, [aberto, loteIdFixo]);

  function resetar() {
    setTipo('VISITA_IMPRODUTIVA');
    setLoteId(loteIdFixo ?? 'nenhum');
    setDescricao('');
    setFotos([]);
  }

  async function handleSalvar() {
    if (descricao.trim().length < 3) return;

    setSalvando(true);
    try {
      await onRegistrar({
        os_id: osId,
        item_instalacao_id: loteId !== 'nenhum' ? loteId : undefined,
        tipo,
        descricao: descricao.trim(),
        fotos_evidencia: fotos.length > 0 ? fotos : undefined,
      });
      resetar();
      setAberto(false);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={varianteBotao}
        className={cn('h-9 shrink-0', classNameBotao)}
        onClick={() => setAberto(true)}
      >
        <IconPlus className="mr-1.5 h-4 w-4" />
        {rotuloBotao}
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="border-b border-border px-4 py-4 sm:px-6">
            <DialogTitle className="text-left">Registrar ocorrência</DialogTitle>
            {loteVinculado && loteRotuloFixo && (
              <DialogDescription className="text-left">
                Endereço: {loteRotuloFixo}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_OCORRENCIA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {painel && painel.lotes.length > 0 && !loteVinculado && (
              <div className="space-y-2">
                <Label>Lote (opcional)</Label>
                <Select value={loteId} onValueChange={setLoteId}>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Selecione o lote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem vínculo de lote</SelectItem>
                    {painel.lotes.map((lote) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.logradouro}, {lote.numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Relato técnico</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                placeholder="Descreva o que ocorreu no campo..."
                className="min-h-[100px] w-full min-w-0 resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label>Fotos (opcional)</Label>
              <EvidenciaFotosUpload
                fotos={fotos}
                onChange={setFotos}
                onUpload={onUpload}
                disabled={salvando}
                maxFotos={6}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border px-4 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={salvando}
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={salvando || descricao.trim().length < 3}
              onClick={() => void handleSalvar()}
            >
              {salvando ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
