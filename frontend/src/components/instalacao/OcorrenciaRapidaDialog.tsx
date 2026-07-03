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
import { DataPrevisaoInstalacaoPicker } from '@/components/instalacao/DataPrevisaoInstalacaoPicker';
import { EvidenciaFotosUpload } from '@/components/instalacao/EvidenciaFotosUpload';
import {
  TIPOS_OCORRENCIA_OPTIONS,
  TURNO_PREVISAO_OPCOES,
} from '@/lib/instalacao/instalacao-labels';
import type {
  PainelOsInstalacao,
  TurnoPrevisaoInstalacao,
} from '@/lib/instalacao/instalacao.types';
import { IconLoader2, IconPlus } from '@tabler/icons-react';
import {
  INSTALACAO_DIALOG_BODY_CLASS,
  INSTALACAO_DIALOG_FOOTER_CLASS,
  INSTALACAO_DIALOG_FORM_CLASS,
  INSTALACAO_DIALOG_HEADER_CLASS,
} from '@/lib/instalacao/instalacao-modal-classes';
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
    data_retorno_previsao?: string;
    turno_retorno_previsao?: TurnoPrevisaoInstalacao;
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
  const [dataRetorno, setDataRetorno] = useState('');
  const [turnoRetorno, setTurnoRetorno] = useState<TurnoPrevisaoInstalacao | ''>(
    '',
  );
  const [salvando, setSalvando] = useState(false);

  const loteVinculado = Boolean(loteIdFixo);
  const visitaImprodutiva = tipo === 'VISITA_IMPRODUTIVA';

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
    setDataRetorno('');
    setTurnoRetorno('');
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
        ...(visitaImprodutiva && dataRetorno
          ? {
              data_retorno_previsao: dataRetorno,
              turno_retorno_previsao: turnoRetorno || undefined,
            }
          : {}),
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
        <DialogContent
          className={INSTALACAO_DIALOG_FORM_CLASS}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <DialogHeader className={INSTALACAO_DIALOG_HEADER_CLASS}>
            <DialogTitle className="text-left">Registrar ocorrência</DialogTitle>
            {loteVinculado && loteRotuloFixo && (
              <DialogDescription className="text-left">
                Endereço: {loteRotuloFixo}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className={INSTALACAO_DIALOG_BODY_CLASS}>
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

            {visitaImprodutiva && (
              <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-sm font-medium text-foreground">
                  Reagendamento da visita
                </p>
                <p className="text-xs text-muted-foreground">
                  Se já souber quando voltar, informe a data. Caso contrário, o
                  lote permanece em andamento com a flag{' '}
                  <strong>aguardando data</strong> para a gestão definir depois.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DataPrevisaoInstalacaoPicker
                    id="data-retorno-ocorrencia"
                    valor={dataRetorno}
                    disabled={salvando}
                    rotulo="Data de retorno (opcional)"
                    onChange={setDataRetorno}
                  />
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="turno-retorno-ocorrencia">
                      Turno (opcional)
                    </Label>
                    <Select
                      value={turnoRetorno || 'nenhum'}
                      onValueChange={(valor) =>
                        setTurnoRetorno(
                          valor === 'nenhum'
                            ? ''
                            : (valor as TurnoPrevisaoInstalacao),
                        )
                      }
                      disabled={!dataRetorno}
                    >
                      <SelectTrigger
                        id="turno-retorno-ocorrencia"
                        className="w-full min-w-0"
                      >
                        <SelectValue placeholder="Turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Não definido</SelectItem>
                        {TURNO_PREVISAO_OPCOES.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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

          <DialogFooter className={INSTALACAO_DIALOG_FOOTER_CLASS}>
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
