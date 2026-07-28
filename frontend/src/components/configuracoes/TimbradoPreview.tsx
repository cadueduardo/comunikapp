'use client';

import {
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Mail,
  MapPin,
  Phone,
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

function formatEndereco(d: TimbradoLojaData): string {
  const linha1 = [d.logradouro, d.numero].filter(Boolean).join(', ');
  const linha2 = [d.bairro, d.complemento].filter(Boolean).join(' — ');
  const cidadeUf = [d.cidade, d.uf].filter(Boolean).join(' / ');
  const cep = d.cep ? `CEP ${d.cep}` : '';
  return [linha1, linha2, cidadeUf, cep].filter(Boolean).join(' · ');
}

function formatDocumento(d: TimbradoLojaData): string {
  const parts: string[] = [];
  if (d.cnpj) parts.push(`CNPJ ${d.cnpj}`);
  else if (d.cpf) parts.push(`CPF ${d.cpf}`);
  if (d.inscricao_estadual) parts.push(`IE ${d.inscricao_estadual}`);
  if (d.inscricao_municipal) parts.push(`IM ${d.inscricao_municipal}`);
  return parts.join(' · ');
}

type TimbradoPreviewProps = {
  data: TimbradoLojaData;
  className?: string;
  /** Variante compacta para a coluna da config */
  compact?: boolean;
};

export function TimbradoPreview({
  data,
  className,
  compact = false,
}: TimbradoPreviewProps) {
  const logoSrc =
    data.logoPreviewUrl ||
    resolveAssetUrl(data.logo_url) ||
    null;
  const nome =
    data.nome_destaque?.trim() ||
    data.razao_social?.trim() ||
    'Nome da empresa';
  const endereco = formatEndereco(data);
  const fiscal = formatDocumento(data);
  const iniciais = nome.charAt(0).toUpperCase() || 'L';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border bg-white text-gray-900 shadow-sm',
        className,
      )}
    >
      {/* Cabeçalho */}
      <div
        className={cn(
          'flex items-center gap-3 border-b border-gray-300',
          compact ? 'p-3' : 'p-5',
        )}
      >
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt="Logo"
            className={cn(
              'object-contain',
              compact ? 'h-12 w-12' : 'h-16 w-16',
            )}
          />
        ) : (
          <div
            className={cn(
              'flex items-center justify-center rounded bg-gray-100 font-bold text-gray-500',
              compact ? 'h-12 w-12 text-lg' : 'h-16 w-16 text-2xl',
            )}
          >
            {iniciais}
          </div>
        )}
        <div className="min-w-0">
          <p
            className={cn(
              'truncate font-bold tracking-tight',
              compact ? 'text-base' : 'text-xl',
            )}
          >
            {nome}
          </p>
          {data.razao_social &&
          data.nome_destaque &&
          data.razao_social !== data.nome_destaque ? (
            <p className="truncate text-xs text-gray-500">{data.razao_social}</p>
          ) : null}
        </div>
      </div>

      {/* Área fictícia do documento */}
      <div
        className={cn(
          'bg-gradient-to-b from-gray-50 to-white text-center text-gray-400',
          compact ? 'px-3 py-8 text-xs' : 'px-6 py-14 text-sm',
        )}
      >
        Pré-visualização do papel timbrado
        <br />
        <span className="text-[10px] text-gray-300">
          (conteúdo do orçamento aparece aqui)
        </span>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-300" />

      {/* Rodapé */}
      <div
        className={cn(
          'space-y-2 text-gray-600',
          compact ? 'p-3 text-[10px] leading-snug' : 'p-4 text-xs leading-relaxed',
        )}
      >
        {endereco ? (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
            <span>{endereco}</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-gray-400">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Endereço (preencha CEP e dados acima)</span>
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {data.telefone ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-500" />
              {data.telefone}
            </span>
          ) : null}
          {data.email ? (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              {data.email}
            </span>
          ) : null}
          {!data.telefone && !data.email ? (
            <span className="inline-flex items-center gap-1.5 text-gray-400">
              <Phone className="h-3.5 w-3.5" />
              Telefone e e-mail
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {data.site_url ? (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-gray-500" />
              {data.site_url.replace(/^https?:\/\//, '')}
            </span>
          ) : null}
          {data.instagram_url ? (
            <span className="inline-flex items-center gap-1.5">
              <Instagram className="h-3.5 w-3.5 text-gray-500" />
              Instagram
            </span>
          ) : null}
          {data.facebook_url ? (
            <span className="inline-flex items-center gap-1.5">
              <Facebook className="h-3.5 w-3.5 text-gray-500" />
              Facebook
            </span>
          ) : null}
          {data.linkedin_url ? (
            <span className="inline-flex items-center gap-1.5">
              <Linkedin className="h-3.5 w-3.5 text-gray-500" />
              LinkedIn
            </span>
          ) : null}
        </div>

        {fiscal ? (
          <p className="text-gray-500">{fiscal}</p>
        ) : (
          <p className="text-gray-400">Dados fiscais (CNPJ / IE / IM)</p>
        )}
      </div>
    </div>
  );
}

/** Bloco de rodapé para o documento público do orçamento (print/PDF). */
export function TimbradoRodapeDocumento({ data }: { data: TimbradoLojaData }) {
  const endereco = formatEndereco(data);
  const fiscal = formatDocumento(data);

  return (
    <div className="mt-6 border-t border-gray-300 pt-4 text-xs text-gray-600 print:text-[10px]">
      <div className="space-y-2">
        {endereco ? (
          <div className="flex items-start justify-center gap-2 text-center">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{endereco}</span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {data.telefone ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {data.telefone}
            </span>
          ) : null}
          {data.email ? (
            <a
              href={`mailto:${data.email}`}
              className="inline-flex items-center gap-1.5 text-blue-700 underline"
            >
              <Mail className="h-3.5 w-3.5" />
              {data.email}
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {data.site_url ? (
            <a
              href={
                data.site_url.startsWith('http')
                  ? data.site_url
                  : `https://${data.site_url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              {data.site_url.replace(/^https?:\/\//, '')}
            </a>
          ) : null}
          {data.instagram_url ? (
            <a
              href={data.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <Instagram className="h-3.5 w-3.5" />
              Instagram
            </a>
          ) : null}
          {data.facebook_url ? (
            <a
              href={data.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <Facebook className="h-3.5 w-3.5" />
              Facebook
            </a>
          ) : null}
          {data.linkedin_url ? (
            <a
              href={data.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </a>
          ) : null}
        </div>
        {fiscal ? <p className="text-center text-gray-500">{fiscal}</p> : null}
      </div>
    </div>
  );
}
