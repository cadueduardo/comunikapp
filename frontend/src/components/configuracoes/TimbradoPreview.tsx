'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
} from 'lucide-react';
import { resolveAssetUrl } from '@/lib/config';
import { cn } from '@/lib/utils';

export type TimbradoLojaData = {
  logo_url?: string | null;
  /** Object URL local enquanto o logo ainda não foi salvo */
  logoPreviewUrl?: string | null;
  nome_destaque?: string | null;
  razao_social?: string | null;
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

type RedeItem = {
  key: string;
  Icon: LucideIcon;
  handle: string;
  href: string;
};

function normalizeHref(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`;
}

/** Extrai handle visual: /usuario a partir da URL da rede. */
export function extrairHandleRede(url: string): string {
  const raw = url.trim();
  if (!raw) return '';
  try {
    const withProto = raw.startsWith('http') ? raw : `https://${raw}`;
    const u = new URL(withProto);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length > 0) return `/${parts[0]}`;
    return u.hostname.replace(/^www\./, '');
  } catch {
    const cleaned = raw.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const slash = cleaned.indexOf('/');
    if (slash >= 0) {
      const handle = cleaned.slice(slash).split(/[?#]/)[0];
      return handle.startsWith('/') ? handle : `/${handle}`;
    }
    return cleaned ? `/${cleaned}` : '';
  }
}

/** Até 2 redes, na ordem Instagram → Facebook → LinkedIn. */
export function selecionarRedesTimbrado(data: TimbradoLojaData): RedeItem[] {
  const candidates: Array<{
    key: string;
    Icon: LucideIcon;
    url?: string | null;
  }> = [
    { key: 'instagram', Icon: Instagram, url: data.instagram_url },
    { key: 'facebook', Icon: Facebook, url: data.facebook_url },
    { key: 'linkedin', Icon: Linkedin, url: data.linkedin_url },
  ];

  const out: RedeItem[] = [];
  for (const c of candidates) {
    const url = c.url?.trim();
    if (!url) continue;
    const handle = extrairHandleRede(url);
    if (!handle) continue;
    out.push({ key: c.key, Icon: c.Icon, handle, href: normalizeHref(url) });
    if (out.length >= 2) break;
  }
  return out;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function formatSiteDisplay(site?: string | null): string {
  if (!site?.trim()) return '';
  return site
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

function formatCnpjHeader(data: TimbradoLojaData): string {
  if (data.cnpj?.trim()) return `CNPJ ${data.cnpj.trim()}`;
  if (data.cpf?.trim()) return `CPF ${data.cpf.trim()}`;
  return '';
}

function razaoSocialHeader(data: TimbradoLojaData): string {
  return data.razao_social?.trim() || '';
}

/** Bloco do meio do rodapé: site na 1ª linha; até 2 redes lado a lado na 2ª. */
function BlocoSiteRedes({
  data,
  iconCls,
  placeholder,
}: {
  data: TimbradoLojaData;
  iconCls: string;
  placeholder?: boolean;
}) {
  const site = formatSiteDisplay(data.site_url);
  const redes = selecionarRedesTimbrado(data);

  const siteEl = site ? (
    <p className="truncate text-gray-800">{site}</p>
  ) : placeholder ? (
    <p className="truncate text-gray-300">website.com.br</p>
  ) : null;

  const redesEl =
    redes.length > 0 ? (
      <p className="flex min-w-0 items-center gap-1.5">
        {redes.map((r, i) => (
          <span key={r.key} className="flex min-w-0 items-center gap-1.5">
            {i > 0 ? (
              <span className="shrink-0 text-gray-400" aria-hidden>
                |
              </span>
            ) : null}
            <span className="flex min-w-0 items-center gap-1 truncate">
              <r.Icon className={cn(iconCls, 'shrink-0 text-gray-500')} />
              <span className="truncate">{r.handle}</span>
            </span>
          </span>
        ))}
      </p>
    ) : placeholder ? (
      <p className="flex items-center gap-1.5 text-gray-300">
        <Instagram className={cn(iconCls, 'shrink-0')} />
        <span>/rede</span>
        <span aria-hidden>|</span>
        <Facebook className={cn(iconCls, 'shrink-0')} />
        <span>/rede</span>
      </p>
    ) : null;

  if (!siteEl && !redesEl) return null;

  return (
    <div className="min-w-0 space-y-1">
      {siteEl}
      {redesEl}
    </div>
  );
}

function formatCepDisplay(cep?: string | null): string {
  const digits = (cep ?? '').replace(/\D/g, '');
  if (digits.length !== 8) return (cep ?? '').trim();
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function enderecoLinhas(data: TimbradoLojaData): {
  linha1: string;
  linha2: string;
} {
  const ruaNumero = [data.logradouro?.trim(), data.numero?.trim()]
    .filter(Boolean)
    .join(', ');
  const complemento = data.complemento?.trim();
  const linha1 = [ruaNumero, complemento].filter(Boolean).join(' — ');

  const cidadeUf = [data.cidade?.trim(), data.uf?.trim()]
    .filter(Boolean)
    .join('/');
  const cepFmt = formatCepDisplay(data.cep);
  const linha2 = cepFmt
    ? [cidadeUf, `CEP: ${cepFmt}`].filter(Boolean).join(' - ')
    : cidadeUf;

  return { linha1, linha2 };
}

function SkeletonMiolo({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'space-y-3 bg-white',
        compact ? 'px-3 py-4' : 'px-5 py-6',
      )}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="h-2 w-20 rounded bg-gray-200" />
          <div className="h-2 w-full rounded bg-gray-100" />
          <div className="h-2 w-4/5 rounded bg-gray-100" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-16 rounded bg-gray-200" />
          <div className="h-2 w-3/4 rounded bg-gray-100" />
        </div>
      </div>
      <div className="space-y-1.5 border border-gray-100 p-2">
        <div className="flex gap-2">
          <div className="h-2 w-8 rounded bg-gray-200" />
          <div className="h-2 flex-1 rounded bg-gray-200" />
          <div className="h-2 w-12 rounded bg-gray-200" />
          <div className="h-2 w-12 rounded bg-gray-200" />
        </div>
        <div className="h-2 w-full rounded bg-gray-100" />
        <div className="h-2 w-full rounded bg-gray-100" />
        <div className="h-2 w-2/3 rounded bg-gray-100" />
        <div className="ml-auto h-2 w-24 rounded bg-gray-200" />
      </div>
      <div className="space-y-1 border border-gray-100 p-2">
        <div className="h-2 w-full rounded bg-gray-100" />
        <div className="h-2 w-full rounded bg-gray-100" />
        <div className="h-2 w-3/4 rounded bg-gray-100" />
      </div>
      <div className="mx-auto h-5 w-36 rounded-full bg-gray-100" />
    </div>
  );
}

type TimbradoPreviewProps = {
  data: TimbradoLojaData;
  className?: string;
  compact?: boolean;
};

export function TimbradoPreview({
  data,
  className,
  compact = false,
}: TimbradoPreviewProps) {
  const logoSrc = data.logoPreviewUrl || resolveAssetUrl(data.logo_url) || null;
  const nome =
    data.nome_destaque?.trim() ||
    data.razao_social?.trim() ||
    'Nome da empresa';
  const iniciais = nome.charAt(0).toUpperCase() || 'L';
  const razao = razaoSocialHeader(data);
  const doc = formatCnpjHeader(data);
  const { linha1, linha2 } = enderecoLinhas(data);
  const iconCls = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const textCls = compact ? 'text-[10px] leading-snug' : 'text-xs leading-snug';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border bg-white text-gray-900 shadow-sm',
        className,
      )}
    >
      {/* Cabeçalho: logo (ou iniciais+nome) | razão social + CNPJ */}
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b border-gray-300',
          compact ? 'p-3' : 'p-4',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt="Logo"
              className={cn(
                'object-contain',
                compact ? 'h-11 w-11' : 'h-14 w-14',
              )}
            />
          ) : (
            <>
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded bg-gray-100 font-bold text-gray-500',
                  compact ? 'h-11 w-11 text-base' : 'h-14 w-14 text-xl',
                )}
              >
                {iniciais}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'truncate font-semibold text-gray-900',
                    compact ? 'text-sm' : 'text-base',
                  )}
                >
                  {nome}
                </p>
              </div>
            </>
          )}
        </div>
        <div className={cn('min-w-0 max-w-[55%] shrink text-right text-gray-600', textCls)}>
          {razao || doc ? (
            <p className="truncate text-gray-800">
              {[razao, doc].filter(Boolean).join(' - ')}
            </p>
          ) : (
            <p className="text-gray-300">Razão social - CNPJ</p>
          )}
        </div>
      </div>

      <SkeletonMiolo compact={compact} />

      <div className="border-t border-gray-300" />

      {/* Rodapé: 3 blocos — contato | site+redes | endereço */}
      <div
        className={cn(
          'grid grid-cols-3 gap-4 text-gray-600',
          compact ? 'p-3' : 'p-4',
          textCls,
        )}
      >
        <div className="min-w-0 space-y-1">
          {data.telefone ? (
            <p className="flex items-center gap-1.5 truncate">
              <WhatsAppIcon className={cn(iconCls, 'shrink-0 text-gray-500')} />
              <span className="truncate">{data.telefone}</span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-gray-300">
              <WhatsAppIcon className={cn(iconCls, 'shrink-0')} />
              WhatsApp
            </p>
          )}
          {data.email ? (
            <p className="flex items-center gap-1.5 truncate">
              <Mail className={cn(iconCls, 'shrink-0 text-gray-500')} />
              <span className="truncate">{data.email}</span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-gray-300">
              <Mail className={cn(iconCls, 'shrink-0')} />
              e-mail
            </p>
          )}
        </div>

        <BlocoSiteRedes data={data} iconCls={iconCls} placeholder />

        <div className="min-w-0 space-y-1 text-right">
          {linha1 ? (
            <p className="truncate">{linha1}</p>
          ) : (
            <p className="truncate text-gray-300">Rua, número — complemento</p>
          )}
          {linha2 ? (
            <p className="truncate">{linha2}</p>
          ) : (
            <p className="truncate text-gray-300">Cidade/UF - CEP</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Rodapé do documento público do orçamento (print/PDF). */
export function TimbradoRodapeDocumento({ data }: { data: TimbradoLojaData }) {
  const { linha1, linha2 } = enderecoLinhas(data);

  return (
    <div className="border-t border-gray-300 bg-white pt-3 text-xs text-gray-600 print:text-[10px]">
      <div className="grid grid-cols-3 gap-4 px-6 pb-4 print:px-4 print:pb-3">
        <div className="min-w-0 space-y-1">
          {data.telefone ? (
            <p className="flex items-center gap-1.5 truncate">
              <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{data.telefone}</span>
            </p>
          ) : null}
          {data.email ? (
            <p className="flex items-center gap-1.5 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{data.email}</span>
            </p>
          ) : null}
        </div>

        <BlocoSiteRedes data={data} iconCls="h-3.5 w-3.5" />

        <div className="min-w-0 space-y-1 text-right">
          {linha1 ? <p className="truncate">{linha1}</p> : null}
          {linha2 ? <p className="truncate">{linha2}</p> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Cabeçalho do documento:
 * Logo | razão social - CNPJ
 *      | #número / data
 * ----------------
 *            TITULO (centralizado)
 */
export function TimbradoCabecalhoDocumento({
  data,
  metaLinha,
  tituloDocumento = 'ORÇAMENTO',
  mostrarTitulo = true,
}: {
  data: TimbradoLojaData;
  /** Ex.: "#ORC-... / 23/07/2026" */
  metaLinha?: string | null;
  tituloDocumento?: string;
  mostrarTitulo?: boolean;
}) {
  const logoSrc = resolveAssetUrl(data.logo_url);
  const nome =
    data.nome_destaque?.trim() ||
    data.razao_social?.trim() ||
    'Comunikapp';
  const razao = razaoSocialHeader(data);
  const doc = formatCnpjHeader(data);
  const linhaEmpresa = [razao, doc].filter(Boolean).join(' - ');

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between gap-4 px-6 pb-3 pt-6 print:px-4 print:pb-2 print:pt-4">
        <div className="flex min-w-0 items-center gap-3">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt="Logo"
              className="h-16 w-16 object-contain print:h-12 print:w-12"
            />
          ) : (
            <>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-gray-200 print:h-12 print:w-12">
                <span className="text-2xl font-bold text-gray-600 print:text-xl">
                  {nome.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-gray-900 print:text-xl">
                  {nome}
                </h1>
              </div>
            </>
          )}
        </div>

        <div className="min-w-0 max-w-[60%] text-right text-sm text-gray-600">
          {linhaEmpresa ? (
            <p className="truncate text-gray-800">{linhaEmpresa}</p>
          ) : null}
          {metaLinha?.trim() ? (
            <p className="truncate text-gray-600">{metaLinha.trim()}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-gray-300" />

      {mostrarTitulo ? (
        <h2 className="py-3 text-center text-xl font-bold tracking-wide text-gray-900 print:py-2 print:text-lg">
          {tituloDocumento}
        </h2>
      ) : null}
    </div>
  );
}
