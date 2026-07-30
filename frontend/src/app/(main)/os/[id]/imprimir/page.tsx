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
import { cn } from '@/lib/utils';

type VersaoImpressao = 'simples' | 'completa';

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
  }>;
  materiais: Array<{
    nome: string;
    quantidade?: number | null;
    unidade?: string | null;
    observacoes?: string | null;
  }>;
  qr_code_data_url?: string | null;
  qr_code_url?: string | null;
};

function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

function formatDimensoes(p: DadosImpressaoOs['produtos'][number]): string {
  const parts: string[] = [];
  if (p.largura != null) parts.push(`${p.largura}`);
  if (p.altura != null) parts.push(`${p.altura}`);
  if (p.profundidade != null) parts.push(`${p.profundidade}`);
  if (parts.length === 0) return '—';
  const dims = parts.join(' × ');
  if (p.area != null) return `${dims} (área ${p.area})`;
  return dims;
}

export default function ImprimirOSPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const osId = String(params.id || '');

  const versaoParam = searchParams.get('versao');
  const versao: VersaoImpressao =
    versaoParam === 'completa' ? 'completa' : 'simples';

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
        incluirDetalhesTecnicos: versao === 'completa' ? 'true' : 'false',
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
                Timbrado da loja · QR para abrir a OS no sistema
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
              tituloDocumento="ORDEM DE SERVIÇO"
            />
          </div>

          <div className="os-print-body space-y-6 p-6 print:px-6 print:py-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1 text-sm text-gray-800">
                <p>
                  <strong>Serviço:</strong>{' '}
                  {dados.os.nome_servico || 'Não informado'}
                </p>
                <p>
                  <strong>Status:</strong> {dados.os.status || '—'}
                  {dados.os.prioridade
                    ? ` · Prioridade: ${dados.os.prioridade}`
                    : ''}
                </p>
                <p>
                  <strong>Abertura:</strong> {formatDate(dados.os.data_abertura)}
                  {' · '}
                  <strong>Prazo:</strong> {formatDate(dados.os.data_prazo)}
                </p>
                {dados.os.data_instalacao_agendada && (
                  <p>
                    <strong>Instalação agendada:</strong>{' '}
                    {formatDate(dados.os.data_instalacao_agendada)}
                  </p>
                )}
              </div>
              {dados.qr_code_data_url && (
                <div className="flex shrink-0 flex-col items-center gap-1 rounded border border-gray-300 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dados.qr_code_data_url}
                    alt={`QR Code OS ${dados.os.numero}`}
                    className="h-24 w-24"
                  />
                  <span className="max-w-[7rem] text-center text-[10px] leading-tight text-gray-600">
                    Escaneie para abrir a OS no ComunikApp
                  </span>
                </div>
              )}
            </div>

            <section>
              <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-900">
                Cliente
              </h2>
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-800 sm:grid-cols-2">
                <p>
                  <strong>Nome:</strong> {cliente.nome || '—'}
                </p>
                <p>
                  <strong>Documento:</strong> {cliente.documento || '—'}
                </p>
                <p>
                  <strong>Telefone:</strong> {cliente.telefone || '—'}
                </p>
                <p>
                  <strong>E-mail:</strong> {cliente.email || '—'}
                </p>
                {(cliente.endereco || cliente.cidade) && (
                  <p className="sm:col-span-2">
                    <strong>Endereço:</strong>{' '}
                    {[
                      cliente.endereco,
                      cliente.cidade,
                      cliente.estado,
                      cliente.cep,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-900">
                Itens
              </h2>
              {produtos.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum item na OS.</p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-600">
                      <th className="py-1 pr-2">Produto / serviço</th>
                      <th className="py-1 pr-2">Qtd</th>
                      <th className="py-1 pr-2">Dimensões</th>
                      {versao === 'completa' && (
                        <th className="py-1">Obs.</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((p, idx) => (
                      <tr
                        key={p.id || `${p.nome}-${idx}`}
                        className="border-b border-gray-100 align-top"
                      >
                        <td className="py-2 pr-2 font-medium text-gray-900">
                          {p.nome}
                        </td>
                        <td className="py-2 pr-2 whitespace-nowrap text-gray-800">
                          {p.quantidade ?? '—'}
                          {p.unidade_medida ? ` ${p.unidade_medida}` : ''}
                        </td>
                        <td className="py-2 pr-2 text-gray-800">
                          {formatDimensoes(p)}
                        </td>
                        {versao === 'completa' && (
                          <td className="py-2 text-gray-600">
                            {p.observacoes || '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {versao === 'completa' && (
              <section>
                <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-900">
                  Materiais previstos
                </h2>
                {materiais.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhum material previsto registrado nesta OS.
                  </p>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-600">
                        <th className="py-1 pr-2">Material</th>
                        <th className="py-1 pr-2">Qtd</th>
                        <th className="py-1">Obs.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiais.map((m, idx) => (
                        <tr
                          key={`${m.nome}-${idx}`}
                          className="border-b border-gray-100"
                        >
                          <td className="py-2 pr-2 text-gray-900">{m.nome}</td>
                          <td className="py-2 pr-2 whitespace-nowrap text-gray-800">
                            {m.quantidade ?? '—'}
                            {m.unidade ? ` ${m.unidade}` : ''}
                          </td>
                          <td className="py-2 text-gray-600">
                            {m.observacoes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}

            {(dados.os.observacoes ||
              (versao === 'completa' && dados.os.observacoes_instalacao)) && (
              <section>
                <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-900">
                  Observações
                </h2>
                {dados.os.observacoes && (
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {dados.os.observacoes}
                  </p>
                )}
                {versao === 'completa' && dados.os.observacoes_instalacao && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    <strong>Instalação:</strong>{' '}
                    {dados.os.observacoes_instalacao}
                  </p>
                )}
              </section>
            )}

            <section className="rounded border border-gray-400 p-4">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="text-center">
                  <p className="mb-2 text-xs font-semibold text-gray-900">
                    Conferência / produção
                  </p>
                  <div className="mb-2 mt-10 border-b border-gray-400" />
                  <p className="text-[10px] text-gray-600">
                    Assinatura e data
                  </p>
                </div>
                <div className="text-center">
                  <p className="mb-2 text-xs font-semibold text-gray-900">
                    Cliente / responsável
                  </p>
                  <div className="mb-2 mt-10 border-b border-gray-400" />
                  <p className="text-[10px] text-gray-600">
                    Assinatura e data
                  </p>
                </div>
              </div>
            </section>
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
          A4. Versão completa inclui materiais previstos.
        </p>
      </div>
    </>
  );
}
