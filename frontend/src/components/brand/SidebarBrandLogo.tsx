'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { BrandLogo, BRAND_LOGO_HEIGHT } from '@/components/brand/BrandLogo';
import type { BrandLogoVariant } from '@/lib/brand';
import { cn } from '@/lib/utils';

type SidebarBrandLogoProps = {
  collapsed?: boolean;
  className?: string;
};

/**
 * Logo da sidebar: variantes coloridas (claro) e brancas (escuro).
 */
export function SidebarBrandLogo({
  collapsed = false,
  className,
}: SidebarBrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  let variant: BrandLogoVariant = 'logoPlatform';
  if (collapsed) {
    variant = isDark ? 'logoSymbolWhite' : 'logoSymbol';
  } else if (isDark) {
    variant = 'logoWhiteCompact';
  }

  return (
    <Link
      href="/dashboard"
      className={cn(
        'relative z-20 mb-4 flex shrink-0 py-1 [transform:translateZ(0)] isolate',
        collapsed ? 'w-full justify-center' : 'items-center',
        className,
      )}
    >
      <BrandLogo
        variant={variant}
        heightPx={
          collapsed
            ? BRAND_LOGO_HEIGHT.platformSymbol
            : BRAND_LOGO_HEIGHT.platformFull
        }
        maxWidthPx={collapsed ? undefined : 220}
      />
    </Link>
  );
}
