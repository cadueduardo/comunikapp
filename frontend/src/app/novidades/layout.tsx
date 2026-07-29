import { ReactNode } from 'react';
import Link from 'next/link';
import { BrandLogo, BRAND_LOGO_HEIGHT } from '@/components/brand/BrandLogo';

export default function ProductUpdatesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Página inicial do ComunikApp">
            <BrandLogo
              variant="logoPlatform"
              heightPx={BRAND_LOGO_HEIGHT.platformFull}
              maxWidthPx={200}
            />
          </Link>
          <span className="text-sm font-medium text-muted-foreground">
            Novidades
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
    </div>
  );
}
