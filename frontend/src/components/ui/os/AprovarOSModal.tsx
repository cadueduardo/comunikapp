'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Package,
  CalendarRange,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { solicitarAtualizacaoBadgesSidebar } from '@/lib/sidebar-badge-refresh';
import { getMotivosBloqueioPcpFrontend, isArteOkParaPcp, produtoRequerArte } from '@/lib/arte-produto-utils';
import { itemRequerFabricaPcp, labelModoFulfillmentItem } from '@/lib/os-fulfillment-utils';
import { Checkbox } from '@/components/ui/checkbox';

// Formata Date em 'YYYY-MM-DD' no fuso local (input type=date espera esse
// formato). NÃO usa toISOString() porque ela converte para UTC e pode pular
// um dia em fusos negativos.
function formatarDataInput(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function parseDataInput(valor: string): Date | null {
  if (!valor) return null;
  // 'YYYY-MM-DD' interpretado no fuso local
  const [ano, mes, dia] = valor.split('-').map((s) => Number(s));
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia);
}

interface AprovarOSModalProps {
  osId: string | null;
  osNumero?: string | null;
  // Status atual da OS — usado para sinalizar se a aprovação será retroativa
  // (OS já avançou no operacional sem passar pelo checkpoint).
  osStatus?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAprovado?: () => void;
}

// Status do fluxo padrão — aprovação avança o workflow para LIBERADA_PARA_PCP.
// Qualquer outro status permitido vira aprovação retroativa.
const STATUS_FLUXO_PADRAO = new Set([
  'AGUARDANDO_APROVACAO_TECNICA',
  'FILA',
  'PARCIALMENTE_LIBERADA',
]);

interface ValidacoesAprovacao {
  estoque_ok: boolean;
  arte_anexada: boolean;
  dados_completos: boolean;
  prazo_viavel: boolean;
  alertas: string[];
}

interface ItemAprovacaoInfo {
  item_id: string;
  produto_servico: string;
  data_inicio_producao?: string | null;
  data_prazo_produto?: string | null;
  status_liberacao_pcp?: string | null;
  responsabilidade_arte?: string | null;
  status_arte?: string | null;
  modo_fulfillment?: string | null;
  personalizacao_modo?: string | null;
  tipo_item?: string | null;
  requer_pcp_fabrica?: boolean;
  elegivel_pcp?: boolean;
  motivos_bloqueio?: string[];
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
  data_prazo?: string | null;
  itens?: ItemAprovacaoInfo[];
  validacoes: ValidacoesAprovacao;
}

// Estado editável de cada item dentro do modal. Datas em formato 'YYYY-MM-DD'
// para compatibilidade direta com <input type="date">.
interface ItemPrazoState {
  item_id: string;
  produto_servico: string;
  data_inicio: string;
  data_fim: string;
  // Mensagem de erro local (validação em tempo real) para este item.
  erro?: string | null;
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
  const eLiberarRestante = statusUpper === 'PARCIALMENTE_LIBERADA';
  const [carregando, setCarregando] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [validacoes, setValidacoes] = useState<ValidacoesAprovacao | null>(
    null,
  );
  const [itensInfo, setItensInfo] = useState<ItemAprovacaoInfo[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Prazos por serviço (1 par início/fim por ItemOS). Pré-preenchido a partir
  // do response GET /aprovacao-tecnica/status.
  const [itensPrazo, setItensPrazo] = useState<ItemPrazoState[]>([]);
  // Prazo guarda-chuva atual da OS (read-only no modal, apenas info).
  const [prazoOS, setPrazoOS] = useState<string | null>(null);

  // Prazo "mãe" — atalho para aplicar o mesmo par (início, fim) a todos os
  // serviços com um clique. NÃO é persistido; serve apenas como input de
  // conveniência. Pré-preenchido com hoje / hoje+7.
  const [prazoMaeInicio, setPrazoMaeInicio] = useState<string>('');
  const [prazoMaeFim, setPrazoMaeFim] = useState<string>('');

  useEffect(() => {
    if (!open || !osId) {
      setValidacoes(null);
      setErroCarga(null);
      setItensPrazo([]);
      setItensInfo([]);
      setSelecionados(new Set());
      setPrazoOS(null);
      setPrazoMaeInicio('');
      setPrazoMaeFim('');
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
            txt || 'Falha ao carregar pré-validações da aprovação',
          );
        }
        const data = (await response.json()) as AprovacaoStatusResponse;
        if (cancelado) return;

        setValidacoes(
          data.validacoes ?? {
            estoque_ok: false,
            arte_anexada: false,
            dados_completos: false,
            prazo_viavel: false,
            alertas: [],
          },
        );

        setPrazoOS(data.data_prazo ?? null);
        const itensApi = data.itens ?? [];
        setItensInfo(itensApi);

        const pendentes = itensApi.filter(
          (it) =>
            (it.status_liberacao_pcp || 'PENDENTE').toUpperCase() !==
            'LIBERADO',
        );

        const hoje = new Date();
        const hoje7 = new Date();
        hoje7.setDate(hoje7.getDate() + 7);
        const fallbackFim = data.data_prazo
          ? new Date(data.data_prazo)
          : hoje7;

        const itensPrazoInicial: ItemPrazoState[] = (data.itens ?? []).map(
          (it) => {
            const inicioAtual = it.data_inicio_producao
              ? new Date(it.data_inicio_producao)
              : null;
            const fimAtual = it.data_prazo_produto
              ? new Date(it.data_prazo_produto)
              : null;

            return {
              item_id: it.item_id,
              produto_servico: it.produto_servico,
              data_inicio: formatarDataInput(
                inicioAtual && !Number.isNaN(inicioAtual.getTime())
                  ? inicioAtual
                  : hoje,
              ),
              data_fim: formatarDataInput(
                fimAtual && !Number.isNaN(fimAtual.getTime())
                  ? fimAtual
                  : fallbackFim,
              ),
            };
          },
        );

        const osMateriaisOk = data.validacoes?.estoque_ok === true;
        const elegiveis = pendentes.filter((it) => {
          const prazoLocal = itensPrazoInicial.find(
            (p) => p.item_id === it.item_id,
          );
          const motivos = getMotivosBloqueioPcpFrontend(
            {
              status_liberacao_pcp: it.status_liberacao_pcp,
              data_prazo_produto:
                prazoLocal?.data_fim || it.data_prazo_produto,
              responsabilidade_arte: it.responsabilidade_arte,
              status_arte: it.status_arte,
            },
            osMateriaisOk,
          );
          return motivos.length === 0;
        });

        const idsIniciais =
          pendentes.length === 1
            ? pendentes.map((it) => it.item_id)
            : elegiveis.map((it) => it.item_id);
        setSelecionados(new Set(idsIniciais));

        setPrazoMaeInicio(formatarDataInput(hoje));
        setPrazoMaeFim(formatarDataInput(fallbackFim));
        setItensPrazo(itensPrazoInicial);
      } catch (error) {
        if (!cancelado) {
          setErroCarga(
            error instanceof Error
              ? error.message
              : 'Erro inesperado ao carregar validações',
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

  // Validação em tempo real dos prazos por item. Calcula erros individuais.
  // Em fluxo padrão todos os itens precisam ter data_fim preenchida.
  // Em retroativo, erros não bloqueiam aprovação.
  const itensValidados = useMemo(() => {
    return itensPrazo.map((it) => {
      let erro: string | null = null;
      if (!eAprovacaoRetroativa && !it.data_fim) {
        erro = 'Defina a data de entrega';
      } else if (
        it.data_inicio &&
        it.data_fim &&
        it.data_inicio > it.data_fim
      ) {
        erro = 'Início não pode ser posterior à entrega';
      } else if (prazoOS && it.data_fim && it.data_fim > prazoOS.slice(0, 10)) {
        erro = 'Excede o prazo limite da OS';
      }
      return { ...it, erro };
    });
  }, [itensPrazo, eAprovacaoRetroativa, prazoOS]);

  const algumItemInvalido = useMemo(
    () => itensValidados.some((it) => !!it.erro),
    [itensValidados],
  );

  /** Elegibilidade no modal: considera prazos preenchidos na UI (ainda não salvos no banco). */
  const elegibilidadeModal = useMemo(() => {
    const map = new Map<string, { elegivel: boolean; motivos: string[] }>();
    const osMateriaisOk = validacoes?.estoque_ok === true;

    for (const it of itensValidados) {
      const info = itensInfo.find((i) => i.item_id === it.item_id);
      if (!info) continue;

      if (!itemRequerFabricaPcp(info)) {
        map.set(it.item_id, { elegivel: true, motivos: [] });
        continue;
      }

      const motivos = getMotivosBloqueioPcpFrontend(
        {
          status_liberacao_pcp: info.status_liberacao_pcp,
          data_prazo_produto: it.data_fim || info.data_prazo_produto,
          responsabilidade_arte: info.responsabilidade_arte,
          status_arte: info.status_arte,
          modo_fulfillment: info.modo_fulfillment,
          personalizacao_modo: info.personalizacao_modo,
          requer_pcp_fabrica: info.requer_pcp_fabrica,
        },
        osMateriaisOk,
      );

      if (!eAprovacaoRetroativa && it.erro) {
        motivos.push(it.erro);
      }

      map.set(it.item_id, {
        elegivel: motivos.length === 0,
        motivos,
      });
    }

    return map;
  }, [itensValidados, itensInfo, validacoes, eAprovacaoRetroativa]);

  const atualizarItem = (
    itemId: string,
    campo: 'data_inicio' | 'data_fim',
    valor: string,
  ) => {
    setItensPrazo((prev) =>
      prev.map((it) =>
        it.item_id === itemId ? { ...it, [campo]: valor } : it,
      ),
    );
  };

  // Aplica o par (início, fim) do prazo "mãe" a todos os serviços.
  // Comportamento conservador: só sobrescreve o campo que estiver preenchido
  // no prazo mãe. Se o usuário deixar um lado vazio, esse lado é preservado
  // nos itens individuais.
  const aplicarPrazoMaeATodos = () => {
    if (!prazoMaeInicio && !prazoMaeFim) {
      toast.info('Informe ao menos uma data no prazo geral.');
      return;
    }
    if (
      prazoMaeInicio &&
      prazoMaeFim &&
      prazoMaeInicio > prazoMaeFim
    ) {
      toast.error('A data de início não pode ser posterior à entrega.');
      return;
    }
    if (
      prazoOS &&
      prazoMaeFim &&
      prazoMaeFim > prazoOS.slice(0, 10)
    ) {
      toast.error('A data de entrega excede o prazo limite da OS.');
      return;
    }

    setItensPrazo((prev) =>
      prev.map((it) => ({
        ...it,
        data_inicio: prazoMaeInicio || it.data_inicio,
        data_fim: prazoMaeFim || it.data_fim,
      })),
    );
    toast.success(
      `Prazo aplicado a ${itensPrazo.length} serviço(s).`,
    );
  };

  const itensPendentes = useMemo(
    () =>
      itensInfo.filter(
        (it) =>
          (it.status_liberacao_pcp || 'PENDENTE').toUpperCase() !== 'LIBERADO',
      ),
    [itensInfo],
  );

  const itensPendentesPcp = useMemo(
    () =>
      itensPendentes.filter((it) => {
        const info = itensInfo.find((i) => i.item_id === it.item_id);
        return info ? itemRequerFabricaPcp(info) : false;
      }),
    [itensPendentes, itensInfo],
  );

  const multiProduto = itensPendentesPcp.length > 1;
  const idsSelecionados = useMemo(
    () => Array.from(selecionados),
    [selecionados],
  );

  const toggleSelecionado = (itemId: string, checked: boolean) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const selecionarTodosElegiveis = () => {
    const ids = itensPendentesPcp
      .filter((it) => elegibilidadeModal.get(it.item_id)?.elegivel !== false)
      .map((it) => it.item_id);
    const idsExpedicao = itensPendentes
      .filter((it) => {
        const info = itensInfo.find((i) => i.item_id === it.item_id);
        return info && !itemRequerFabricaPcp(info);
      })
      .map((it) => it.item_id);
    setSelecionados(new Set([...ids, ...idsExpedicao]));
  };

  const handleAprovar = async () => {
    if (!osId) return;

    const idsExpedicao = itensPendentes
      .filter((it) => {
        const info = itensInfo.find((i) => i.item_id === it.item_id);
        return info && !itemRequerFabricaPcp(info);
      })
      .map((it) => it.item_id);

    const alvoIds =
      multiProduto && !eAprovacaoRetroativa
        ? Array.from(new Set([...idsSelecionados, ...idsExpedicao]))
        : itensPendentes.map((it) => it.item_id);

    if (!eAprovacaoRetroativa && alvoIds.length === 0) {
      toast.error('Selecione ao menos um produto para liberar.');
      return;
    }

    const itensAlvoPrazo =
      multiProduto && !eAprovacaoRetroativa
        ? itensValidados.filter((it) => alvoIds.includes(it.item_id))
        : itensValidados;

    if (
      !eAprovacaoRetroativa &&
      itensAlvoPrazo.some((it) => !!it.erro)
    ) {
      toast.error(
        'Ajuste os prazos dos serviços selecionados antes de continuar.',
      );
      return;
    }

    try {
      setAprovando(true);
      const response = await apiRequest(`/os/${osId}/aprovar-tecnica`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovado: true,
          observacoes: eLiberarRestante
            ? 'Liberação restante via grid de OS'
            : eAprovacaoRetroativa
              ? 'Aprovada via grid de OS (retroativa)'
              : multiProduto
                ? 'Liberação parcial via grid de OS'
                : 'Aprovada via grid de OS',
          prazos_itens: itensAlvoPrazo.map((it) => ({
            item_id: it.item_id,
            ...(it.data_inicio
              ? { data_inicio_producao: it.data_inicio }
              : {}),
            ...(it.data_fim ? { data_prazo_produto: it.data_fim } : {}),
          })),
          ...(multiProduto && !eAprovacaoRetroativa
            ? { item_ids: Array.from(alvoIds) }
            : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          (data && (data.message as string)) || 'Erro ao aprovar OS',
        );
      }

      toast.success(
        eLiberarRestante
          ? `Produtos restantes liberados${osNumero ? ` — OS #${osNumero}` : ''}`
          : multiProduto
            ? `${alvoIds.length} produto(s) liberado(s)${osNumero ? ` — OS #${osNumero}` : ''}`
            : `OS ${osNumero ? `#${osNumero} ` : ''}aprovada com sucesso`,
      );
      solicitarAtualizacaoBadgesSidebar();
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

  const arteOkNoModal = useMemo(() => {
    if (itensInfo.length === 0) {
      return validacoes?.arte_anexada ?? false;
    }
    return itensInfo.every((it) => {
      if (!produtoRequerArte(it.responsabilidade_arte, it.status_arte)) {
        return true;
      }
      return isArteOkParaPcp(it.responsabilidade_arte, it.status_arte);
    });
  }, [itensInfo, validacoes?.arte_anexada]);

  /** Prazo viável com base nas datas preenchidas no modal (não só data_prazo da OS). */
  const prazoViavelNoModal = useMemo(() => {
    const datasFim = itensValidados
      .map((it) => it.data_fim)
      .filter(Boolean) as string[];

    const referenciaStr =
      datasFim.length > 0
        ? datasFim.sort().at(-1)!
        : prazoOS?.slice(0, 10) ?? '';

    if (!referenciaStr) {
      return validacoes?.prazo_viavel ?? false;
    }

    const fim = parseDataInput(referenciaStr);
    if (!fim) return false;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    fim.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil(
      (fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diasRestantes >= 1;
  }, [itensValidados, prazoOS, validacoes?.prazo_viavel]);

  const totalAlertas = validacoes
    ? [
        !validacoes.estoque_ok,
        !arteOkNoModal,
        !prazoViavelNoModal,
      ].filter(Boolean).length
    : 0;

  const dadosIncompletos = validacoes ? !validacoes.dados_completos : false;

  const prazoOSLabel = useMemo(() => {
    const d = prazoOS ? parseDataInput(prazoOS.slice(0, 10)) : null;
    if (!d) return null;
    return d.toLocaleDateString('pt-BR');
  }, [prazoOS]);

  // Erro local do prazo mãe (apenas avisa o usuário antes de aplicar).
  const erroPrazoMae = useMemo(() => {
    if (
      prazoMaeInicio &&
      prazoMaeFim &&
      prazoMaeInicio > prazoMaeFim
    ) {
      return 'Início não pode ser posterior à entrega';
    }
    if (
      prazoOS &&
      prazoMaeFim &&
      prazoMaeFim > prazoOS.slice(0, 10)
    ) {
      return 'Excede o prazo limite da OS';
    }
    return null;
  }, [prazoMaeInicio, prazoMaeFim, prazoOS]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {eLiberarRestante
              ? `Liberar restante${osNumero ? ` — OS #${osNumero}` : ''}`
              : `Aprovar OS${osNumero ? ` #${osNumero}` : ''}`}
          </DialogTitle>
          <DialogDescription>
            {eLiberarRestante
              ? 'Selecione os produtos elegíveis que ainda não foram liberados para o PCP.'
              : eAprovacaoRetroativa
                ? 'Esta OS já avançou no operacional. Aprovar agora registra a decisão retroativamente, sem alterar o status atual.'
                : multiProduto
                  ? 'Selecione os produtos a liberar para produção. Cada um precisa de prazo e elegibilidade (arte, materiais).'
                  : 'Esta ação aprova tecnicamente a OS e libera o avanço para produção. Confira os critérios abaixo antes de prosseguir.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {eAprovacaoRetroativa && osStatus && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium">Aprovação retroativa</p>
                <p className="text-xs mt-0.5">
                  A OS está atualmente em <strong>{osStatus}</strong>. A
                  aprovação será registrada mas o status não será alterado.
                </p>
              </div>
            </div>
          )}

          {carregando && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando validações...
            </div>
          )}

          {erroCarga && !carregando && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {erroCarga}
            </div>
          )}

          {!carregando && !erroCarga && (
            <div className="space-y-2 rounded-md border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  Plano de produção por serviço
                </div>
                {prazoOSLabel && (
                  <span className="text-xs text-muted-foreground">
                    Prazo limite da OS: <strong>{prazoOSLabel}</strong>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {eAprovacaoRetroativa
                  ? 'OS já avançou no operacional. Edite os prazos por serviço se necessário.'
                  : 'Defina o início e a entrega de cada serviço. A data de entrega é obrigatória.'}
              </p>

              {/* Prazo "mãe" — atalho para aplicar o mesmo prazo a todos */}
              {itensPrazo.length > 1 && (
                <div className="rounded-md border border-dashed bg-muted/40 p-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarRange className="h-3.5 w-3.5" />
                    Aplicar prazo a todos os serviços de uma vez
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <Label
                        htmlFor="prazo-mae-inicio"
                        className="text-xs text-muted-foreground"
                      >
                        Início
                      </Label>
                      <Input
                        id="prazo-mae-inicio"
                        type="date"
                        value={prazoMaeInicio}
                        onChange={(e) => setPrazoMaeInicio(e.target.value)}
                        disabled={aprovando}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="prazo-mae-fim"
                        className="text-xs text-muted-foreground"
                      >
                        Entrega
                      </Label>
                      <Input
                        id="prazo-mae-fim"
                        type="date"
                        value={prazoMaeFim}
                        onChange={(e) => setPrazoMaeFim(e.target.value)}
                        disabled={aprovando}
                        min={prazoMaeInicio || undefined}
                        max={prazoOS ? prazoOS.slice(0, 10) : undefined}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={aplicarPrazoMaeATodos}
                      disabled={
                        aprovando ||
                        !!erroPrazoMae ||
                        (!prazoMaeInicio && !prazoMaeFim)
                      }
                    >
                      Aplicar a todos
                    </Button>
                  </div>
                  {erroPrazoMae && (
                    <p className="text-xs text-destructive">{erroPrazoMae}</p>
                  )}
                </div>
              )}

              {itensValidados.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2">
                  Nenhum serviço cadastrado nesta OS.
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {multiProduto && !eAprovacaoRetroativa && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={selecionarTodosElegiveis}
                        disabled={aprovando}
                      >
                        Selecionar todos elegíveis
                      </Button>
                    </div>
                  )}
                  {itensValidados.map((it) => {
                    const info = itensInfo.find((i) => i.item_id === it.item_id);
                    const eleg = elegibilidadeModal.get(it.item_id);
                    const requerPcp = info ? itemRequerFabricaPcp(info) : true;
                    const statusLiberacao = (
                      info?.status_liberacao_pcp || 'PENDENTE'
                    ).toUpperCase();
                    const jaLiberado =
                      statusLiberacao === 'LIBERADO' ||
                      statusLiberacao === 'NAO_APLICA';
                    if (jaLiberado) return null;
                    return (
                    <div
                      key={it.item_id}
                      className={`rounded-md border p-2 ${
                        it.erro ? 'border-destructive/40 bg-destructive/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {multiProduto && !eAprovacaoRetroativa && requerPcp && (
                          <Checkbox
                            checked={selecionados.has(it.item_id)}
                            disabled={
                              aprovando || eleg?.elegivel === false
                            }
                            onCheckedChange={(c) =>
                              toggleSelecionado(it.item_id, c === true)
                            }
                            className="mt-0.5"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium flex-wrap">
                            <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {it.produto_servico}
                            {info && (
                              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {labelModoFulfillmentItem(info)}
                              </span>
                            )}
                          </div>
                          {!requerPcp && (
                            <p className="text-xs text-blue-700 mt-1">
                              Produto de estoque — vai para expedição, não para o PCP.
                            </p>
                          )}
                          {eleg?.motivos && eleg.motivos.length > 0 && (
                              <p className="text-xs text-amber-700 mt-1">
                                {eleg.motivos.join(' · ')}
                              </p>
                            )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor={`inicio-${it.item_id}`}
                            className="text-xs"
                          >
                            Data de início
                          </Label>
                          <Input
                            id={`inicio-${it.item_id}`}
                            type="date"
                            value={it.data_inicio}
                            onChange={(e) =>
                              atualizarItem(
                                it.item_id,
                                'data_inicio',
                                e.target.value,
                              )
                            }
                            disabled={aprovando}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor={`fim-${it.item_id}`}
                            className="text-xs"
                          >
                            Data de entrega{' '}
                            {!eAprovacaoRetroativa && (
                              <span className="text-destructive">*</span>
                            )}
                          </Label>
                          <Input
                            id={`fim-${it.item_id}`}
                            type="date"
                            value={it.data_fim}
                            onChange={(e) =>
                              atualizarItem(
                                it.item_id,
                                'data_fim',
                                e.target.value,
                              )
                            }
                            disabled={aprovando}
                            min={it.data_inicio || undefined}
                            max={prazoOS ? prazoOS.slice(0, 10) : undefined}
                          />
                        </div>
                      </div>
                      {it.erro && (
                        <p className="text-xs text-destructive pt-1">
                          {it.erro}
                        </p>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {validacoes && !carregando && (
            <>
              {totalAlertas === 0 && !dadosIncompletos ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  Todos os critérios estão atendidos. Pode aprovar com
                  segurança.
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    {totalAlertas > 0 && (
                      <p className="font-medium">
                        Existem {totalAlertas} alerta(s). Você pode aprovar
                        mesmo assim sob sua responsabilidade.
                      </p>
                    )}
                    {dadosIncompletos && (
                      <p className="font-medium text-destructive">
                        Dados técnicos incompletos. Corrija antes de aprovar.
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
                  okLabel="Dados técnicos completos"
                  warnLabel="Dados técnicos incompletos (bloqueia aprovação)"
                />
                <CritItem
                  ok={arteOkNoModal}
                  okIcon={<ImageIcon className="h-4 w-4" />}
                  warnIcon={<ImageIcon className="h-4 w-4" />}
                  okLabel="Arte anexada"
                  warnLabel="Nenhuma versão de arte anexada"
                />
                <CritItem
                  ok={validacoes.estoque_ok}
                  okIcon={<CheckCircle2 className="h-4 w-4" />}
                  warnIcon={<PackageX className="h-4 w-4" />}
                  okLabel="Materiais confirmados"
                  warnLabel="Materiais ainda não confirmados"
                />
                <CritItem
                  ok={prazoViavelNoModal}
                  okIcon={<Calendar className="h-4 w-4" />}
                  warnIcon={<Calendar className="h-4 w-4" />}
                  okLabel="Prazo viável"
                  warnLabel="Prazo não definido ou muito apertado"
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
              (!eAprovacaoRetroativa &&
                (multiProduto
                  ? idsSelecionados.length === 0 ||
                    itensValidados
                      .filter((it) => selecionados.has(it.item_id))
                      .some((it) => !!it.erro)
                  : algumItemInvalido))
            }
          >
            {aprovando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {eLiberarRestante
                  ? 'Liberar restante'
                  : multiProduto && !eAprovacaoRetroativa
                    ? `Liberar selecionados (${idsSelecionados.length})`
                    : totalAlertas > 0
                      ? 'Aprovar mesmo assim'
                      : 'Aprovar OS'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
