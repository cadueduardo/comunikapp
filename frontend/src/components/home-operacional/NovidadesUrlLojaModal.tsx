'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/contexts/UserContext';
import { isProvisionalLojaSlug } from '@/lib/loja-slug';
import { buildCanonicalLojaUrl } from '@/lib/tenant-host';

const STORAGE_KEY = 'comunikapp.novidades.url-loja.2026-07';

/**
 * Novidade: cada loja passa a ter endereço próprio
 * ({slug}.comunikapp.com.br). Copy amigável — sem jargão "slug".
 * Admin: CTA para personalizar em Configurações → Loja.
 */
export function NovidadesUrlLojaModal() {
  const { user, loading } = useUser();
  const [aberto, setAberto] = useState(false);

  const isAdmin = user?.funcao === 'ADMINISTRADOR';
  const slug = user?.loja?.slug?.trim().toLowerCase() ?? '';
  const url =
    user?.loja?.url_canonica ||
    (slug ? buildCanonicalLojaUrl(slug) : '');
  const precisaPersonalizar = !slug || isProvisionalLojaSlug(slug);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(STORAGE_KEY) === 'dispensado') return;
    setAberto(true);
  }, [loading, user, isAdmin]);

  function dispensar() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'dispensado');
    }
    setAberto(false);
  }

  if (!isAdmin || !aberto) return null;

  return (
    <Dialog
      open={aberto}
      onOpenChange={(novoAberto) => !novoAberto && dispensar()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <Link2 className="h-5 w-5" />
            </div>
            <DialogTitle>Novidade: endereço próprio da sua loja</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-left">
            Agora cada loja no ComunikApp pode ter uma URL só dela para
            acessar o sistema — mais fácil de lembrar e de liberar em
            redes corporativas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          {precisaPersonalizar ? (
            <>
              <p>
                Em poucos cliques você escolhe o nome que aparece no
                endereço, por exemplo{' '}
                <span className="font-mono text-foreground">
                  minhaloja.comunikapp.com.br
                </span>
                .
              </p>
              <p>
                Depois do login pelo site principal, o sistema já te leva
                para o endereço da sua loja automaticamente.
              </p>
            </>
          ) : (
            <>
              <p>O endereço atual da sua loja é:</p>
              <p className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-foreground break-all">
                {url}
              </p>
              <p>
                Você pode personalizar esse endereço a qualquer momento em
                Configurações → Loja.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={dispensar}>
            Agora não
          </Button>
          <Button asChild onClick={dispensar}>
            <Link href="/configuracoes/loja#acesso-url">
              {precisaPersonalizar
                ? 'Escolher meu endereço'
                : 'Ver ou alterar endereço'}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
