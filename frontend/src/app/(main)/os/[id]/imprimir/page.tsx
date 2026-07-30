'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  TimbradoCabecalhoDocumento,
  TimbradoRodapeDocumento,
} from '@/components/configuracoes/TimbradoPreview';
import { StatusFormatterHelper } from '@/components/ui/os/helpers/status-formatter.helper';
import {
  STATUS_ARTE_LABEL,
  arteProdutoPendente,
} from '@/lib/arte-produto-utils';
import { cn } from '@/lib/utils';

type VersaoImpressao = 'simples' | 'completa';

type LoteInstalacaoImpressao = {
  item_nome: string;
  endereco: string;
  data_previsao?: string | null;
  turno?: string | null;
  status?: string | null;
  responsavel_local?: string | null;
};

type DadosImpressaoOs = {
  os: {
    id: string;
    numero: string;
    data_abertura?: string | null;
    data_prazo?: string | null;
    status?: string | null;
    nome_servico?: string | null;
    quantidade?: number | null;
    observacoes?: string | null;
    prioridade?: string | null;
    data_instalacao_agendada?: string | null;
    observacoes_instalacao?: string | null;
  };
  cliente: {
    nome?: string | null;
    documento?: string | null;
    telefone?: string | null;
    email?: string | null;
    endereco?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
  };
  loja: {
    nome?: string | null;
    nome_fantasia?: string | null;
    razao_social?: string | null;
    logo_url?: string | null;
    cnpj?: string | null;
    cpf?: string | null;
    inscricao_estadual?: string | null;
    inscricao_municipal?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    telefone?: string | null;
    email?: string | null;
    site_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    linkedin_url?: string | null;
  };
  orcamento?: {
    id?: string;
    numero?: string | null;
  } | null;
  produtos: Array<{
    id?: string;
    nome: string;
    quantidade?: number | null;
    unidade_medida?: string | null;
    largura?: number | null;
    altura?: number | null;
    profundidade?: number | null;
    area?: number | null;
    observacoes?: string | null;
    data_prazo_produto?: string | null;
    ordem_producao?: number | null;
    prioridade_produto?: string | null;
    status_arte?: string | null;
    materiais_disponivel?: boolean | null;
  }>;
  materiais: Array<{
    nome: string;
    quantidade?: number | null;
    unidade?: string | null;
    observacoes?: string | null;
    produto_nome?: string | null;
    disponivel_estoque?: boolean | null;
    quantidade_disponivel?: number | null;
    localizacao_estoque?: string | null;
  }>;
  instalacao?: {
    tem_instalacao: boolean;
    data_agendada?: string | null;
    status?: string | null;
    observacoes?: string | null;
    lotes: LoteInstalacaoImpressao[];
  } | null;
  qr_code_data_url?: string | null;
  qr_code_url?: string | null;
};

const ETAPAS_ROTEIRO = [
  'Impressão',
  'Corte / usinagem',
  'Acabamento',
  'Montagem',
  'Instalação',
  'Expedição',
] as const;

const CHECKLIST_QUALIDADE = [
  'Medidas conferidas com a OS',
  'Cores conferidas com a arte aprovada',
  'Acabamento sem rebarbas ou falhas',
  'Limpeza da peça',
  'Embalagem adequada para transporte',
] as const;

const PRIORIDADE_LABEL: Record<string, string> = {
  URGENTE: 'Urgente',
  ALTA: 'Alta',
  NORMAL: 'Normal',
  BAIXA: 'Baixa',
};

const TURNO_LABEL: Record<string, string> = {
  MANHA: 'manhã',
  TARDE: 'tarde',
  NOITE: 'noite',
  HORARIO_COMERCIAL: 'horário comercial',
};

function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

function formatNumero(value?: number | null): string {
  if (value == null) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function formatDimensoes(p: DadosImpressaoOs['produtos'][number]): string {
  const parts: string[] = [];
  if (p.largura != null) parts.push(formatNumero(p.largura));
  if (p.altura != null) parts.push(formatNumero(p.altura));
  if (p.profundidade != null) parts.push(formatNumero(p.profundidade));
  if (parts.length === 0) return '—';
  return parts.join(' × ');
}

/** Tag impressa (borda preta) para status curtos — arte, disponibilidade. */
function TagImpressa({
  destaque,
  children,
}: {
  destaque?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        destaque
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-400 text-gray-700',
      )}
    >
      {children}
    </span>
  );
}

function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-900">
      {children}
    </h2>
  );
}

export default function ImprimirOSPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const osId = String(params.id || '');

  const versaoParam = searchParams.get('versao');
  const versao: VersaoImpressao =
    versaoParam === 'simples' ? 'simples' : 'completa';

  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<DadosImpressaoOs | null>(null);

  const carregar = useCallback(async () => {
    if (!osId) return;
    try {
      setLoading(true);
      const qs = new URLSearchParams({
        versao,
        incluirQRCode: 'true',
        incluirLogo: 'true',
        incluirDetalhesTecnicos: 'true',
      });
      const response = await fetch(
        `/api/os/${encodeURIComponent(osId)}/imprimir/dados?${qs}`,
        { credentials: 'include', cache: 'no-store' },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.message || err.error || `Erro ${response.status}`,
        );
      }
      const payload = await response.json();
      const body = (payload?.dados ?? payload?.data ?? null) as
        | DadosImpressaoOs
        | null;
      if (!body?.os?.id) {
        throw new Error('Dados de impressão inválidos');
      }
      setDados({
        ...body,
        cliente: body.cliente ?? {},
        loja: body.loja ?? {},
        produtos: Array.isArray(body.produtos) ? body.produtos : [],
        materiais: Array.isArray(body.materiais) ? body.materiais : [],
        instalacao: body.instalacao ?? null,
      });
    } catch (error) {
      console.error('Erro ao carregar impressão da OS:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar impressão da OS',
      );
      router.push(`/os/${osId}`);
    } finally {
      setLoading(false);
    }
  }, [osId, router, versao]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const setVersao = (proxima: VersaoImpressao) => {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set('versao', proxima);
    router.replace(`/os/${osId}/imprimir?${qs.toString()}`);
  };

  const handleImprimir = () => {
    window.print();
  };

  const metaLinha = useMemo(() => {
    if (!dados) return '';
    return `#${dados.os.numero} / ${formatDate(dados.os.data_abertura)}`;
  }, [dados]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Preparando impressão da OS...
          </p>
        </div>
      </div>
    );
  }

  if (!dados) {
    return null;
  }

  const loja = dados.loja ?? {};
  const cliente = dados.cliente ?? {};
  const produtos = dados.produtos ?? [];
  const materiais = dados.materiais ?? [];
  const instalacao = dados.instalacao ?? null;
  const completa = versao === 'completa';

  const prioridadeLabel = dados.os.prioridade
    ? PRIORIDADE_LABEL[dados.os.prioridade] ?? dados.os.prioridade
    : '—';

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .os-print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 20;
            background: white;
          }
          .os-print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 20;
            background: white;
          }
          .os-print-body {
            padding-top: 42mm;
            padding-bottom: 28mm;
          }
          .os-print-section {
            break-inside: avoid;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          a,
          a:visited {
            color: inherit !important;
            text-decoration: none !important;
          }
        }
      `}</style>

      <header className="print:hidden sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-[210mm] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/os/${osId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                Impressão — OS {dados.os.numero}
              </h1>
              <p className="text-xs text-muted-foreground">
                Via de produção (sem valores) · timbrado da loja · QR code
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={versao === 'simples' ? 'default' : 'outline'}
              onClick={() => setVersao('simples')}
            >
              Simples
            </Button>
            <Button
              type="button"
              size="sm"
              variant={versao === 'completa' ? 'default' : 'outline'}
              onClick={() => setVersao('completa')}
            >
              Completa
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void carregar()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button type="button" size="sm" onClick={handleImprimir}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir / PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-muted/40 p-4 print:bg-white print:p-0">
        <div
          className={cn(
            'mx-auto max-w-[210mm] bg-white shadow-lg print:max-w-none print:shadow-none',
          )}
          style={{ minHeight: '297mm' }}
        >
          <div className="os-print-header">
            <TimbradoCabecalhoDocumento
              data={{
                logo_url: loja.logo_url,
                nome_destaque: loja.nome_fantasia || loja.nome,
                razao_social: loja.razao_social,
                cnpj: loja.cnpj,
                cpf: loja.cpf,
              }}
              metaLinha={metaLinha}
              tituloDocumento="ORDEM DE SERVIÇO — PRODUÇÃO"
            />
          </div>

          <div className="os-print-body space-y-5 p-6 print:px-6 print:py-0">
            {/* Faixa de destaque: prazo, prioridade, status, origem + QR */}
            <section className="os-print-section flex items-stretch gap-4">
              <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-2 rounded border border-gray-300 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Prazo de entrega
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatDate(dados.os.data_prazo)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Prioridade
                  </p>
                  <p className="text-sm font-bold uppercase text-gray-900">
                    {prioridadeLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {dados.os.status
                      ? StatusFormatterHelper.formatarStatus(dados.os.status)
                      : '—'}
                  </p>
                </div>
                {dados.orcamento?.numero && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Orçamento de origem
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      #{dados.orcamento.numero}
                    </p>
                  </div>
                )}
              </div>
              {dados.qr_code_data_url && (
                <div className="flex shrink-0 flex-col items-center justify-center gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dados.qr_code_data_url}
                    alt={`QR Code OS ${dados.os.numero}`}
                    className="h-20 w-20"
                  />
                  <span className="max-w-[6rem] text-center text-[9px] leading-tight text-gray-600">
                    Escaneie para abrir a OS no sistema
                  </span>
                </div>
              )}
            </section>

            {/* Cliente e entrega / instalação */}
            <section className="os-print-section">
              <TituloSecao>Cliente e entrega / instalação</TituloSecao>
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-800 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">Cliente</p>
                  <p>{cliente.nome || '—'}</p>
                  <p className="text-xs text-gray-600">
                    {[cliente.telefone, cliente.email]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                  {(cliente.endereco || cliente.cidade) && (
                    <p className="text-xs text-gray-600">
                      {[
                        cliente.endereco,
                        cliente.cidade,
                        cliente.estado,
                        cliente.cep,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">Instalação</p>
                    <TagImpressa destaque={Boolean(instalacao?.tem_instalacao)}>
                      {instalacao?.tem_instalacao ? 'SIM' : 'NÃO'}
                    </TagImpressa>
                    {instalacao?.tem_instalacao &&
                      instalacao?.data_agendada && (
                        <span className="text-xs text-gray-700">
                          agendada {formatDate(instalacao.data_agendada)}
                        </span>
                      )}
                  </div>
                  {instalacao?.tem_instalacao &&
                    (instalacao.lotes?.length ?? 0) > 0 && (
                      <ul className="space-y-1">
                        {instalacao.lotes.map((lote, idx) => (
                          <li key={idx} className="text-xs text-gray-700">
                            <span className="font-medium text-gray-900">
                              {lote.item_nome}:
                            </span>{' '}
                            {lote.endereco || 'Endereço não informado'}
                            {lote.data_previsao && (
                              <>
                                {' · '}
                                {formatDate(lote.data_previsao)}
                                {lote.turno
                                  ? ` (${TURNO_LABEL[lote.turno] ?? lote.turno})`
                                  : ''}
                              </>
                            )}
                            {lote.responsavel_local && (
                              <> · resp.: {lote.responsavel_local}</>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  {instalacao?.observacoes && (
                    <p className="whitespace-pre-wrap text-xs text-gray-600">
                      Obs.: {instalacao.observacoes}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Itens da OS — um bloco por item */}
            <section className="os-print-section">
              <TituloSecao>Itens da OS</TituloSecao>
              {produtos.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum item na OS.</p>
              ) : (
                <div className="space-y-3">
                  {produtos.map((p, idx) => {
                    const arteLabel = p.status_arte
                      ? STATUS_ARTE_LABEL[p.status_arte] ?? p.status_arte
                      : null;
                    const artePendente = arteProdutoPendente(p.status_arte);
                    return (
                      <div
                        key={p.id || `${p.nome}-${idx}`}
                        className="os-print-section rounded border border-gray-300 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Item {idx + 1}/{produtos.length}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {p.nome}
                          </span>
                          <span className="flex-1" />
                          {arteLabel && p.status_arte !== 'NAO_APLICA' && (
                            <TagImpressa destaque={artePendente}>
                              Arte: {arteLabel}
                            </TagImpressa>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                              Quantidade
                            </p>
                            <p className="font-semibold text-gray-900">
                              {formatNumero(p.quantidade)}
                              {p.unidade_medida ? ` ${p.unidade_medida}` : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                              Dimensões
                            </p>
                            <p className="font-semibold text-gray-900">
                              {formatDimensoes(p)}
                            </p>
                          </div>
                          {p.area != null && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                Área
                              </p>
                              <p className="font-semibold text-gray-900">
                                {formatNumero(p.area)} m²
                              </p>
                            </div>
                          )}
                          {p.data_prazo_produto && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                Prazo do item
                              </p>
                              <p className="font-semibold text-gray-900">
                                {formatDate(p.data_prazo_produto)}
                              </p>
                            </div>
                          )}
                          {p.ordem_producao != null && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                Ordem prod.
                              </p>
                              <p className="font-semibold text-gray-900">
                                {p.ordem_producao}º
                              </p>
                            </div>
                          )}
                        </div>
                        {p.observacoes && (
                          <p className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
                            Obs.: {p.observacoes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Materiais a provisionar (pick list) */}
            <section className="os-print-section">
              <TituloSecao>Materiais a provisionar</TituloSecao>
              {materiais.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum material previsto registrado nesta OS.
                </p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-gray-600">
                      <th className="w-1/2 border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Material
                      </th>
                      <th className="border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Qtd necessária
                      </th>
                      <th className="border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Disponível
                      </th>
                      <th className="border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Em estoque
                      </th>
                      <th className="border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Localização
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiais.map((m, idx) => (
                      <tr
                        key={`${m.nome}-${idx}`}
                        className="align-top"
                      >
                        <td className="w-1/2 border border-gray-300 px-2 py-1.5">
                          <span className="font-medium text-gray-900">
                            {m.nome}
                          </span>
                          {m.produto_nome && (
                            <span className="block text-[10px] text-gray-500">
                              {m.produto_nome}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap border border-gray-300 px-2 py-1.5 text-gray-800">
                          {formatNumero(m.quantidade)}
                          {m.unidade ? ` ${m.unidade}` : ''}
                        </td>
                        <td className="whitespace-nowrap border border-gray-300 px-2 py-1.5">
                          {m.disponivel_estoque == null ? null : (
                            <TagImpressa destaque={!m.disponivel_estoque}>
                              {m.disponivel_estoque ? 'Sim' : 'Comprar'}
                            </TagImpressa>
                          )}
                        </td>
                        <td className="whitespace-nowrap border border-gray-300 px-2 py-1.5 text-gray-800">
                          {m.quantidade_disponivel != null
                            ? formatNumero(m.quantidade_disponivel)
                            : null}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-gray-600">
                          {m.localizacao_estoque || null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Observações gerais da OS */}
            {dados.os.observacoes && (
              <section className="os-print-section">
                <TituloSecao>Observações</TituloSecao>
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                  {dados.os.observacoes}
                </p>
              </section>
            )}

            {/* Roteiro de produção — apontamento manual (versão completa) */}
            {completa && (
              <section className="os-print-section">
                <TituloSecao>
                  Roteiro de produção — apontamento manual
                </TituloSecao>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-gray-600">
                      <th className="w-[28%] border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Etapa
                      </th>
                      <th className="w-[26%] border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Operador
                      </th>
                      <th className="w-[14%] border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Início
                      </th>
                      <th className="w-[14%] border border-gray-400 bg-gray-50 px-2 py-1.5">
                        Fim
                      </th>
                      <th className="w-[18%] border border-gray-400 bg-gray-50 px-2 py-1.5">
                        OK / Refugo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ETAPAS_ROTEIRO.map((etapa) => (
                      <tr key={etapa}>
                        <td className="border border-gray-300 px-2 py-3 font-medium text-gray-900">
                          {etapa}
                        </td>
                        <td className="border border-gray-300 px-2 py-3" />
                        <td className="border border-gray-300 px-2 py-3" />
                        <td className="border border-gray-300 px-2 py-3" />
                        <td className="border border-gray-300 px-2 py-3" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Qualidade e assinaturas (versão completa) */}
            {completa && (
              <section className="os-print-section rounded border border-gray-400 p-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-900">
                      Conferência de qualidade
                    </p>
                    <ul className="space-y-1.5">
                      {CHECKLIST_QUALIDADE.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-xs text-gray-800"
                        >
                          <span className="inline-block h-3 w-3 shrink-0 rounded-[2px] border border-gray-700" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col justify-end gap-8">
                    <div className="text-center">
                      <div className="mb-1 border-b border-gray-400 pt-8" />
                      <p className="text-[10px] text-gray-600">
                        Produção — assinatura e data
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="mb-1 border-b border-gray-400 pt-8" />
                      <p className="text-[10px] text-gray-600">
                        Conferência / expedição — assinatura e data
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="os-print-footer mt-6 print:mt-0">
            <TimbradoRodapeDocumento
              data={{
                nome_destaque: loja.nome_fantasia || loja.nome,
                razao_social: loja.razao_social,
                cnpj: loja.cnpj,
                cpf: loja.cpf,
                inscricao_estadual: loja.inscricao_estadual,
                inscricao_municipal: loja.inscricao_municipal,
                cep: loja.cep,
                logradouro: loja.logradouro,
                numero: loja.numero,
                complemento: loja.complemento,
                bairro: loja.bairro,
                cidade: loja.cidade,
                uf: loja.uf,
                telefone: loja.telefone,
                email: loja.email,
                site_url: loja.site_url,
                instagram_url: loja.instagram_url,
                facebook_url: loja.facebook_url,
                linkedin_url: loja.linkedin_url,
              }}
            />
          </div>
        </div>
      </div>

      <div className="print:hidden border-t border-border bg-muted/30 px-4 py-3">
        <p className="mx-auto max-w-[210mm] text-xs text-muted-foreground">
          Use <strong>Imprimir / PDF</strong> e, se necessário, ative
          &quot;Gráficos de segundo plano&quot; no diálogo do navegador. Papel
          A4. A versão completa inclui roteiro de apontamento manual e
          checklist de qualidade. Esta via não exibe valores financeiros.
        </p>
      </div>
    </>
  );
}
