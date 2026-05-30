export const BRAND_ASSETS = {
  favicon: '/brand/favicon.svg',
  logoWhite: '/brand/comunikapp-logo-white.svg',
  logoWhiteCompact: '/brand/comunikapp-logo-white-no-baseline.svg',
  /** Logo completo na sidebar aberta (area logada, sem baseline). */
  logoPlatform: '/brand/comunikapp-logo-no-baseline.svg',
  logoSymbol: '/brand/comunikapp-logo-symbol.svg',
  /** Simbolo branco para sidebar retraida em tema escuro. */
  logoSymbolWhite: '/brand/comunikapp-logo-symbol.svg',
  logoFull: '/brand/comunikapp-logo.svg',
} as const;

/** Pastas publicas para PNG: /brand/png/1x e /brand/png/2x (mesmo nome de arquivo). */
export const BRAND_PNG_DIR = {
  '1x': '/brand/png/1x',
  '2x': '/brand/png/2x',
} as const;

/**
 * Imagem de preview ao compartilhar link (Open Graph / WhatsApp / redes sociais).
 * Exportar o MESMO arquivo em 1x/ e 2x/ com as dimensoes abaixo.
 */
export const BRAND_SOCIAL_PREVIEW = {
  pngFile: 'comunikapp-comunicacao-visual.png',
  path1x: `${BRAND_PNG_DIR['1x']}/comunikapp-comunicacao-visual.png`,
  path2x: `${BRAND_PNG_DIR['2x']}/comunikapp-comunicacao-visual.png`,
  /** Proporcao 1.91:1 — padrao Open Graph (WhatsApp, Facebook, LinkedIn, Telegram). */
  export1x: { width: 1200, height: 630 },
  export2x: { width: 2400, height: 630 * 2 },
  alt: 'Comunikapp — Gestão para comunicação visual',
  usage:
    'Preview ao compartilhar link do site. Manter logo e texto na zona central (margem ~10%).',
} as const;

export type BrandLogoVariant =
  | 'logoWhite'
  | 'logoWhiteCompact'
  | 'logoPlatform'
  | 'logoSymbol'
  | 'logoSymbolWhite'
  | 'logoFull';

/**
 * Metadados de cada variante de logo.
 * PNG: salvar o MESMO nome em 1x/ e 2x/; dimensoes abaixo sao largura x altura do arquivo.
 */
export const BRAND_LOGO_VARIANTS: Record<
  BrandLogoVariant,
  {
    pngFile: string;
    svg: string;
    aspectRatio: number;
    export1x: { width: number; height: number };
    export2x: { width: number; height: number };
    usage: string;
  }
> = {
  logoWhite: {
    pngFile: 'comunikapp-logo-white.png',
    svg: BRAND_ASSETS.logoWhite,
    aspectRatio: 1292 / 310,
    export1x: { width: 500, height: 120 },
    export2x: { width: 1000, height: 240 },
    usage: 'Landing page, header inicial (fundo escuro, com baseline)',
  },
  logoWhiteCompact: {
    pngFile: 'comunikapp-logo-white-no-baseline.png',
    svg: BRAND_ASSETS.logoWhiteCompact,
    aspectRatio: 1296 / 310,
    export1x: { width: 150, height: 36 },
    export2x: { width: 300, height: 72 },
    usage: 'Landing page, header com scroll (fundo escuro, sem baseline)',
  },
  logoPlatform: {
    pngFile: 'comunikapp-logo-no-baseline.png',
    svg: BRAND_ASSETS.logoPlatform,
    aspectRatio: 1296 / 310,
    export1x: { width: 150, height: 36 },
    export2x: { width: 300, height: 72 },
    usage: 'Plataforma logada, sidebar aberta (fundo claro, sem baseline)',
  },
  logoSymbol: {
    pngFile: 'comunikapp-logo-symbol.png',
    svg: BRAND_ASSETS.logoSymbol,
    aspectRatio: 356 / 310,
    export1x: { width: 37, height: 32 },
    export2x: { width: 74, height: 64 },
    usage: 'Plataforma logada, sidebar retraida (somente simbolo, tema claro)',
  },
  logoSymbolWhite: {
    pngFile: 'comunikapp-logo-symbol-white.png',
    svg: BRAND_ASSETS.logoSymbolWhite,
    aspectRatio: 356 / 310,
    export1x: { width: 37, height: 32 },
    export2x: { width: 74, height: 64 },
    usage: 'Plataforma logada, sidebar retraida (somente simbolo, tema escuro)',
  },
  logoFull: {
    pngFile: 'comunikapp-logo.png',
    svg: BRAND_ASSETS.logoFull,
    aspectRatio: 1296 / 310,
    export1x: { width: 500, height: 120 },
    export2x: { width: 1000, height: 240 },
    usage: 'Reserva / materiais em fundo branco (colorido, com baseline)',
  },
};

export function getBrandPngSrc(
  variant: BrandLogoVariant,
  density: keyof typeof BRAND_PNG_DIR,
): string {
  const file = BRAND_LOGO_VARIANTS[variant].pngFile;
  return `${BRAND_PNG_DIR[density]}/${file}`;
}

export function getBrandPngSrcSet(variant: BrandLogoVariant): string {
  const src1x = getBrandPngSrc(variant, '1x');
  const src2x = getBrandPngSrc(variant, '2x');
  return `${src1x} 1x, ${src2x} 2x`;
}
