import type { Metadata } from 'next';
import { BRAND_SOCIAL_PREVIEW } from '@/lib/brand';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://comunikapp.com.br';

export const SITE_NAME = 'Comunikapp';

export const SITE_DEFAULT_TITLE = 'Comunikapp';

export const SITE_DEFAULT_DESCRIPTION =
  'Gestão simplificada para empresas de comunicação visual. Orçamentos, produção e finanças em um só lugar.';

const openGraphImage = {
  url: BRAND_SOCIAL_PREVIEW.path1x,
  width: BRAND_SOCIAL_PREVIEW.export1x.width,
  height: BRAND_SOCIAL_PREVIEW.export1x.height,
  alt: BRAND_SOCIAL_PREVIEW.alt,
  type: 'image/png' as const,
};

/** Metadados padrao do site (Open Graph + Twitter Card para preview de link). */
export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [openGraphImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [BRAND_SOCIAL_PREVIEW.path1x],
  },
};

export function buildPageMetadata(overrides: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const title = overrides.title ?? SITE_DEFAULT_TITLE;
  const description = overrides.description ?? SITE_DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: overrides.path ?? '/',
      images: [openGraphImage],
    },
    twitter: {
      title,
      description,
      images: [BRAND_SOCIAL_PREVIEW.path1x],
    },
  };
}
