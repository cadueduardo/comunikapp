'use client';

import { Loader2, Megaphone, Plus, RefreshCw } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createAdminProductUpdateColumns } from '@/components/gestao/admin-product-update-columns';
import {
  AdminCrudViewMode,
  AdminCrudViewToggle,
} from '@/components/gestao/AdminCrudViewToggle';
import { AdminProductUpdateCard } from '@/components/gestao/AdminProductUpdateCard';
import { DataTable } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/use-media-query';
import { adminApi } from '@/lib/gestao/admin-api';
import { PRODUCT_UPDATE_CATEGORY_LABELS } from '@/lib/gestao/admin-labels';
import {
  ProductUpdate,
  ProductUpdateCategory,
  ProductUpdateInput,
} from '@/lib/gestao/admin-types';

const EMPTY_FORM: ProductUpdateInput = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  version: '',
  category: 'IMPROVEMENT',
  modules: [],
  audience: [],
  changelogEnabled: true,
  inAppEnabled: false,
  emailEnabled: false,
  changeReason: '',
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 191);
}

export function AdminProductUpdatesManager() {
  const { admin } = useAdmin();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<AdminCrudViewMode>('table');
  const [updates, setUpdates] = useState<ProductUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductUpdateInput>(EMPTY_FORM);

  const canWrite = ['SUPER_ADMIN', 'OPERACAO'].includes(admin?.role || '');
  const canPublish = admin?.role === 'SUPER_ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listProductUpdates<{
        data: ProductUpdate[];
      }>();
      setUpdates(result.data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar as novidades.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createProductUpdate<ProductUpdate>({
        ...form,
        modules: form.modules.filter(Boolean),
        audience: form.audience.filter(Boolean),
        version: form.version?.trim() || undefined,
        changeReason: form.changeReason?.trim() || undefined,
      });
      toast.success('Rascunho criado.');
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível criar o rascunho.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const requestReview = useCallback(
    async (update: ProductUpdate) => {
      try {
        await adminApi.requestProductUpdateReview(update.id);
        toast.success('Novidade enviada para revisão.');
        await load();
      } catch (cause) {
        toast.error(
          cause instanceof Error ? cause.message : 'Falha na revisão.',
        );
      }
    },
    [load],
  );

  const publish = useCallback(
    async (update: ProductUpdate) => {
      try {
        await adminApi.publishProductUpdate(update.id);
        toast.success('Novidade publicada no changelog.');
        await load();
      } catch (cause) {
        toast.error(
          cause instanceof Error ? cause.message : 'Falha na publicação.',
        );
      }
    },
    [load],
  );

  const columns = useMemo(
    () =>
      createAdminProductUpdateColumns({
        canWrite,
        canPublish,
        onRequestReview: (update) => {
          void requestReview(update);
        },
        onPublish: (update) => {
          void publish(update);
        },
      }),
    [canPublish, canWrite, publish, requestReview],
  );

  const showCards = isMobile || viewMode === 'cards';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novidades"
        subtitle="Revise os rascunhos dos deploys antes de publicar para os clientes."
        icon={<Megaphone className="h-7 w-7" />}
        actions={
          <>
            {!isMobile && (
              <AdminCrudViewToggle value={viewMode} onChange={setViewMode} />
            )}
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            {canWrite && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo rascunho
              </Button>
            )}
          </>
        }
      />

      <Alert>
        <AlertDescription>
          Rascunhos automáticos nunca são publicados ou enviados sem aprovação
          humana. E-mail e comunicação dentro do produto permanecem desativados
          até a configuração dos respectivos provedores.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : updates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Megaphone className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <h2 className="font-semibold">Nenhuma novidade preparada</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              O próximo deploy poderá criar o primeiro rascunho automaticamente.
            </p>
            {canWrite && (
              <Button className="mt-5" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo rascunho
              </Button>
            )}
          </CardContent>
        </Card>
      ) : showCards ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {updates.map((update) => (
            <AdminProductUpdateCard
              key={update.id}
              update={update}
              canWrite={canWrite}
              canPublish={canPublish}
              onRequestReview={(item) => {
                void requestReview(item);
              }}
              onPublish={(item) => {
                void publish(item);
              }}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={updates} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={create}>
            <DialogHeader>
              <DialogTitle>Novo rascunho</DialogTitle>
              <DialogDescription>
                Escreva para clientes. Não inclua segredos, IDs internos ou
                detalhes de vulnerabilidades ainda não corrigidas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="update-title">Título</Label>
                <Input
                  id="update-title"
                  value={form.title}
                  maxLength={180}
                  required
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                      slug:
                        current.slug === slugify(current.title)
                          ? slugify(event.target.value)
                          : current.slug,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="update-slug">Slug público</Label>
                  <Input
                    id="update-slug"
                    value={form.slug}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    maxLength={191}
                    required
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        slug: slugify(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-version">Versão</Label>
                  <Input
                    id="update-version"
                    value={form.version}
                    maxLength={80}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        version: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-category">Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(category) =>
                    setForm((current) => ({
                      ...current,
                      category: category as ProductUpdateCategory,
                    }))
                  }
                >
                  <SelectTrigger id="update-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_UPDATE_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-summary">Resumo</Label>
                <Textarea
                  id="update-summary"
                  value={form.summary}
                  maxLength={500}
                  rows={3}
                  required
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-content">Conteúdo detalhado</Label>
                <Textarea
                  id="update-content"
                  value={form.content}
                  maxLength={50000}
                  rows={10}
                  required
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Texto simples nesta fase; quebras de linha serão preservadas.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['changelogEnabled', 'Changelog público'],
                  ['inAppEnabled', 'Dentro do produto'],
                  ['emailEnabled', 'Resumo por e-mail'],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className="flex items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <Checkbox
                      checked={Boolean(form[field as keyof ProductUpdateInput])}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          [field]: checked === true,
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar rascunho
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
