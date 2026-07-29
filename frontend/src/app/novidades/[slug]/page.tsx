import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getBackendBaseUrl } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type RouteProps = { params: Promise<{ slug: string }> };

interface PublicProductUpdate {
  title: string;
  slug: string;
  summary: string;
  content: string;
  version?: string | null;
  category: string;
  modules?: string[];
  published_at: string;
}

async function getUpdate(slug: string): Promise<PublicProductUpdate | null> {
  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/public/v1/product-updates/${encodeURIComponent(slug)}`,
      { cache: 'no-store' },
    );
    if (!response.ok) return null;
    return (await response.json()) as PublicProductUpdate;
  } catch {
    return null;
  }
}

export default async function ProductUpdateDetailPage({
  params,
}: RouteProps) {
  const { slug } = await params;
  const update = await getUpdate(slug);
  if (!update) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/novidades"
        className="mb-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Todas as novidades
      </Link>
      <div className="flex flex-wrap gap-2">
        <Badge>{update.category}</Badge>
        {update.version && (
          <Badge variant="secondary">Versão {update.version}</Badge>
        )}
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
        {update.title}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{update.summary}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Publicado em{' '}
        {new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'long',
          timeZone: 'America/Sao_Paulo',
        }).format(new Date(update.published_at))}
      </p>
      <div className="mt-10 whitespace-pre-wrap border-t pt-8 leading-7 text-foreground">
        {update.content}
      </div>
      {Array.isArray(update.modules) && update.modules.length > 0 && (
        <div className="mt-10 border-t pt-6">
          <p className="mb-3 text-sm font-medium">Módulos relacionados</p>
          <div className="flex flex-wrap gap-2">
            {update.modules.map((module) => (
              <Badge key={module} variant="outline">
                {module}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
