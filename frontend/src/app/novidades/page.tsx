import { ArrowRight, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBackendBaseUrl } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

interface PublicProductUpdate {
  id: string;
  title: string;
  slug: string;
  summary: string;
  version?: string | null;
  category: string;
  published_at: string;
}

async function getUpdates(): Promise<PublicProductUpdate[]> {
  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/public/v1/product-updates`,
      { cache: 'no-store' },
    );
    if (!response.ok) return [];
    return (await response.json()) as PublicProductUpdate[];
  } catch {
    return [];
  }
}

export default async function ProductUpdatesPage() {
  const updates = await getUpdates();

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Novidades do ComunikApp
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Novos módulos, melhorias importantes e correções que tornam sua
          operação mais simples e segura.
        </p>
      </div>

      {updates.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="font-medium">Nenhuma novidade publicada ainda.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Volte em breve para acompanhar a evolução da plataforma.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {updates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{update.category}</Badge>
                  {update.version && (
                    <Badge variant="secondary">Versão {update.version}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'long',
                      timeZone: 'America/Sao_Paulo',
                    }).format(new Date(update.published_at))}
                  </span>
                </div>
                <CardTitle>{update.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{update.summary}</p>
                <Link
                  href={`/novidades/${update.slug}`}
                  className="mt-5 inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Ver detalhes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
