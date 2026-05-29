'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type BrandLogoVariant,
  BRAND_LOGO_VARIANTS,
  getBrandPngSrc,
  getBrandPngSrcSet,
} from '@/lib/brand';

type BrandLogoProps = {
  /** Chave da variante; resolve PNG (1x/2x) e fallback SVG automaticamente. */
  variant: BrandLogoVariant;
  alt?: string;
  /** Altura de exibicao na tela (CSS), em pixels inteiros. */
  heightPx: number;
  className?: string;
  maxWidthPx?: number;
  /** false = forca SVG vetorial. Default: tenta PNG e cai para SVG se o arquivo nao existir. */
  preferPng?: boolean;
};

export function BrandLogo({
  variant,
  alt = 'Comunikapp',
  heightPx,
  className,
  maxWidthPx,
  preferPng = true,
}: BrandLogoProps) {
  const { aspectRatio, svg } = BRAND_LOGO_VARIANTS[variant];
  const [pngFailed, setPngFailed] = useState(false);

  let height = Math.round(heightPx);
  let width = Math.round(height * aspectRatio);

  if (maxWidthPx && width > maxWidthPx) {
    width = maxWidthPx;
    height = Math.round(width / aspectRatio);
  }

  const wrapperClass = cn(
    'inline-flex shrink-0 items-center leading-none [transform:translateZ(0)]',
    className,
  );
  const wrapperStyle = { height, width };

  const usePng = preferPng && !pngFailed;

  if (usePng) {
    const src1x = getBrandPngSrc(variant, '1x');
    const srcSet = getBrandPngSrcSet(variant);

    return (
      <span className={wrapperClass} style={wrapperStyle}>
        <img
          src={src1x}
          srcSet={srcSet}
          alt={alt}
          width={width}
          height={height}
          onError={() => setPngFailed(true)}
          className="pointer-events-none block h-full w-full select-none object-contain object-left"
          decoding="sync"
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span className={wrapperClass} style={wrapperStyle}>
      <object
        type="image/svg+xml"
        data={svg}
        aria-label={alt}
        role="img"
        width={width}
        height={height}
        className="pointer-events-none block h-full w-full select-none"
        draggable={false}
      />
    </span>
  );
}

export const BRAND_LOGO_HEIGHT = {
  /** Header inicial da landing (sem baseline). */
  landingHero: 56,
  landingCompact: 36,
  platformFull: 36,
  platformSymbol: 32,
} as const;
