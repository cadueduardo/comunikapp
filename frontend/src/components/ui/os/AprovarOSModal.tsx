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
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  XCircle,
  PackageX,
  Image as ImageIcon,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';

// Formata Date em 'YYYY-MM-DD' no fuso local (input type=date espera esse
// formato). NAO usa toISOString() porque ela converte para UTC e pode pular
// um dia em fusos negativos.
function formatarDataInput(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

interface AprovarOSModalProps {
  osId: string | null;
  osNumero?: string | null;
  // Status atual da OS - usado para sinalizar se a aprovacao sera retroativa
  // (OS ja avancou no operacional sem passar pelo checkpoint).
  osStatus?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAprovado?: () => void;
}

// Status do fluxo padrao - aprovacao avanca o workflow para APROVADA_TECNICA.
// Qualquer outro status permitido vira aprovacao retroativa.
const STATUS_FLUXO_PADRAO = new Set([
  'AGUARDANDO_APROVACAO_TECNICA',
  'FILA',
]);

// Espelho do payload retornado por GET /os/:id/aprovacao-tecnica/status
interface ValidacoesAprovacao {
  estoque_ok: boolean;
  arte_anexada: boolean;
  dados_completos: boolean;
  prazo_viavel: boolean;
  alertas: string[];
}

interface AprovacaoStatusResponse {
  id: string;
  status: string;
  aprovacao_tecnica_status: string | null;
  aprovacao_tecnica_por: string | null;
  aprovacao_tecnica_em: string | null;
  aprovacao_tecnica_obs: string | null;
  data_instalacao_agendada: string | null;
  observacoes_instalacao: string | null;
  validacoes: ValidacoesAprovacao;
  // Prazos atuais da OS (carregados de GET /os/:id para pre-preencher os
  // campos editaveis do modal).
  data_inicio_prevista?: string | null;
  data_prazo?: string | null;
}

function CritItem({
  ok,
  okIcon,
  warnIcon,
  okLabel,
  warnLabel,
}: {
  ok: boolean;
  okIcon: React.ReactNode;
  warnIcon: React.ReactNode;
  okLabel: string;
  warnLabel: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span
        className={`mt-0.5 ${ok ? 'text-green-600' : 'text-amber-600'}`}
        aria-hidden
      >
        {ok ? okIcon : warnIcon}
      </span>
      <span className={ok ? 'text-foreground' : 'text-amber-700'}>
        {ok ? okLabel : warnLabel}
      </span>
    </div>
  );
}

export function AprovarOSModal({
  osId,
  osNumero,
  osStatus,
  open,
  onOpenChange,
  onAprovado,
}: AprovarOSModalProps) {
  const statusUpper = (osStatus || '').toUpperCase();
  const eAprovacaoRetroativa =
    !!statusUpper && !STATUS_FLUXO_PADRAO.has(statusUpper);
  const [carregando, setCarregando] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [validacoes, setValidacoes] = useState<ValidacoesAprovacao | null>(
    null,
  );
  // Datas do plano de producao (campos editaveis do modal). Sao strings no
  // formato 'YYYY-MM-DD' (compatibilidade com <input type="date">). Convertidos
  // para Date apenas na submissao.
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [erroPrazo, setErroPrazo] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !osId) {
      setValidacoes(null);
      setErroCarga(null);
      setDataInicio('');
      setDataFim('');
      setErroPrazo(null);
      return;
    }

    let cancelado = false;

    const carregarStatus = async () => {
      try {
        setCarregando(true);
        setErroCarga(null);
        const response = await apiRequest(
          `/os/${osId}/aprovacao-tecnica/status`,
        );
        if (!response.ok) {
          const txt = await response.text().catch(() => '');
          throw new Error(
            txt || 'Falha ao carregar pre-validacoes da aprovacao',
          );
        }
        const data = (await response.json()) as AprovacaoStatusResponse;
        if (!cancelado) {
          setValidacoes(
            data.validacoes ?? {
              estoque_ok: false,
              arte_anexada: false,
              dados_completos: false,
              prazo_viavel: false,
              alertas: [],
            },
          );

          // Pre-preenche os campos de prazo:
          //  - Data inicio: valor atual da OS OU hoje
          //  - Data fim: valor atual da OS OU hoje + 7 dias
          const hoje = new Date();
          const hoje7 = new Date();
          hoje7.setDate(hoje7.getDate() + 7);

          const inicioAtual = data.data_inicio_prevista
            ? new Date(data.data_inicio_prevista)
            : null;
          const fimAtual = data.data_prazo ? new Date(data.data_prazo) : null;

          setDataInicio(
            formatarDataInput(
              inicioAtual && !Number.isNaN(inicioAtual.getTime())
                ? inicioAtual
                : hoje,
            ),
          );
          setDataFim(
            formatarDataInput(
              fimAtual && !Number.isNaN(fimAtual.getTime())
                ? fimAtual
                : hoje7,
            ),
          );
        }
      } catch (error) {
        if (!cancelado) {
          setErroCarga(
            error instanceof Error
              ? error.message
              : 'Erro inesperado ao carregar validacoes',
          );
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    carregarStatus();

    return () => {
      cancelado = true;
    };
  }, [open, osId]);

  // Validacao em tempo real dos campos de prazo. Mantem mensagem visivel
  // junto aos inputs e bloqueia o botao de aprovar enquanto invalido.
  useEffect(() => {
    if (!dataFim) {
      setErroPrazo('Defina a data de entrega');
      return;
    }
    if (dataInicio && dataFim && dataInicio > dataFim) {
      setErroPrazo('A data de inicio nao pode ser posterior a data de entrega');
      return;
    }
    setErroPrazo(null);
  }, [dataInicio, dataFim]);

  const handleAprovar = async () => {
    if (!osId) return;

    // Em fluxo padrao, exigir data fim. Em fluxo retroativo, permitir aprovar
    // mesmo sem informar prazo (backend respeita o que estiver no banco).
    if (!eAprovacaoRetroativa && !dataFim) {
      toast.error('Defina a data de entrega antes de aprovar');
      return;
    }
    if (erroPrazo && !eAprovacaoRetroativa) {
      toast.error(erroPrazo);
      return;
    }

    try {
      setAprovando(true);
      const response = await apiRequest(`/os/${osId}/aprovar-tecnica`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovado: true,
          observacoes: eAprovacaoRetroativa
            ? 'Aprovada via grid de OS (retroativa)'
            : 'Aprovada via grid de OS',
          // Envia datas apenas quando informadas. Backend trata 'undefined'
          // como "manter o valor atual".
          ...(dataInicio ? { data_inicio_prevista: dataInicio } : {}),
          ...(dataFim ? { data_prazo: dataFim } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          (data && (data.message as string)) || 'Erro ao aprovar OS',
        );
      }

      toast.success(`OS ${osNumero ? `#${osNumero} ` : ''}aprovada com sucesso`);
      onAprovado?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao aprovar OS',
      );
    } finally {
      setAprovando(false);
    }
  };

  const totalAlertas = validacoes
    ? [
        !validacoes.estoque_ok,
        !validacoes.arte_anexada,
        !validacoes.prazo_viavel,
      ].filter(Boolean).length
    : 0;

  const dadosIncompletos = validacoes ? !validacoes.dados_completos : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Aprovar OS{osNumero ? ` #${osNumero}` : ''}
          </DialogTitle>
          <DialogDescription>
            {eAprovacaoRetroativa
              ? 'Esta OS ja avancou no operacional. Aprovar agora registra a decisao retroativamente, sem alterar o status atual.'
              : 'Esta acao aprova tecnicamente a OS e libera o avanco para producao. Confira os criterios abaixo antes de prosseguir.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {eAprovacaoRetroativa && osStatus && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium">Aprovacao retroativa</p>
                <p className="text-xs mt-0.5">
                  A OS esta atualmente em <strong>{osStatus}</strong>. A
                  aprovacao sera registrada mas o status nao sera alterado.
                </p>
              </div>
            </div>
          )}

          {carregando && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando validacoes...
            </div>
          )}

          {erroCarga && !carregando && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {erroCarga}
            </div>
          )}

          {!carregando && !erroCarga && (
            <div className="space-y-2 rounded-md border bg-card p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                Plano de producao
              </div>
              <p className="text-xs text-muted-foreground">
                {eAprovacaoRetroativa
                  ? 'OS ja avancou no operacional. Edite os prazos se necessario - aprovar nao retrocede o status.'
                  : 'Defina a janela planejada de producao. A data de entrega e obrigatoria.'}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="data-inicio" className="text-xs">
                    Data de inicio
                  </Label>
                  <Input
                    id="data-inicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    disabled={aprovando}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="data-fim" className="text-xs">
                    Data de entrega{' '}
                    {!eAprovacaoRetroativa && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <Input
                    id="data-fim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    disabled={aprovando}
                    min={dataInicio || undefined}
                  />
                </div>
              </div>
              {erroPrazo && (
                <p className="text-xs text-destructive pt-1">{erroPrazo}</p>
              )}
            </div>
          )}

          {validacoes && !carregando && (
            <>
              {totalAlertas === 0 && !dadosIncompletos ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  Todos os criterios estao atendidos. Pode aprovar com
                  seguranca.
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    {totalAlertas > 0 && (
                      <p className="font-medium">
                        Existem {totalAlertas} alerta(s). Voce pode aprovar
                        mesmo assim sob sua responsabilidade.
                      </p>
                    )}
                    {dadosIncompletos && (
                      <p className="font-medium text-destructive">
                        Dados tecnicos incompletos. Corrija antes de aprovar.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 rounded-md border bg-card p-3">
                <CritItem
                  ok={validacoes.dados_completos}
                  okIcon={<CheckCircle2 className="h-4 w-4" />}
                  warnIcon={<XCircle className="h-4 w-4" />}
                  okLabel="Dados tecnicos completos"
                  warnLabel="Dados tecnicos incompletos (bloqueia aprovacao)"
                />
                <CritItem
                  ok={validacoes.arte_anexada}
                  okIcon={<ImageIcon className="h-4 w-4" />}
                  warnIcon={<ImageIcon className="h-4 w-4" />}
                  okLabel="Arte anexada"
                  warnLabel="Nenhuma versao de arte anexada"
                />
                <CritItem
                  ok={validacoes.estoque_ok}
                  okIcon={<CheckCircle2 className="h-4 w-4" />}
                  warnIcon={<PackageX className="h-4 w-4" />}
                  okLabel="Materiais confirmados"
                  warnLabel="Materiais ainda nao confirmados"
                />
                <CritItem
                  ok={validacoes.prazo_viavel}
                  okIcon={<Calendar className="h-4 w-4" />}
                  warnIcon={<Calendar className="h-4 w-4" />}
                  okLabel="Prazo viavel"
                  warnLabel="Prazo nao definido ou muito apertado"
                />
              </div>

              {validacoes.alertas.length > 0 && (
                <details className="rounded-md border bg-muted/30 p-2 text-sm">
                  <summary className="cursor-pointer flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Detalhes ({validacoes.alertas.length})
                  </summary>
                  <ul className="mt-2 list-disc pl-6 space-y-1 text-xs text-muted-foreground">
                    {validacoes.alertas.map((alerta, idx) => (
                      <li key={idx}>{alerta}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={aprovando}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAprovar}
            disabled={
              aprovando ||
              carregando ||
              dadosIncompletos ||
              // Em fluxo padrao, prazo invalido bloqueia. Retroativo nao.
              (!eAprovacaoRetroativa && !!erroPrazo)
            }
          >
            {aprovando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aprovando...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {totalAlertas > 0 ? 'Aprovar mesmo assim' : 'Aprovar OS'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
