'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Loader2,
  Mail,
  MessageCircleWarning,
  Phone,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { platformApi } from '@/lib/api-client';
import {
  BETA_FEEDBACK_CONFIG,
  buildBetaFeedbackMailtoUrl,
  buildBetaFeedbackVersionLabel,
  buildBetaFeedbackWhatsAppMessage,
  buildBetaFeedbackWhatsAppUrl,
  isBetaFeedbackEnabled,
} from '@/lib/beta-feedback-config';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function getPageContext(pathname: string) {
  const paginaUrl =
    typeof window !== 'undefined' ? window.location.href : '';
  const paginaTitulo =
    typeof document !== 'undefined' ? document.title : '';
  const userAgent =
    typeof navigator !== 'undefined' ? navigator.userAgent : '';

  return {
    pagina_url: paginaUrl,
    pagina_path: pathname || '/',
    pagina_titulo: paginaTitulo,
    versao_plataforma: buildBetaFeedbackVersionLabel(),
    user_agent: userAgent,
  };
}

export function BetaFeedbackButton() {
  const pathname = usePathname();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [expectativa, setExpectativa] = useState('');
  const [loading, setLoading] = useState(false);

  const pageContext = useMemo(
    () => getPageContext(pathname),
    [pathname, open],
  );

  if (!isBetaFeedbackEnabled()) {
    return null;
  }

  const feedbackPayload = {
    descricao,
    expectativa,
    paginaUrl: pageContext.pagina_url,
    paginaPath: pageContext.pagina_path,
    usuarioNome: user?.nome_completo,
    usuarioEmail: user?.email,
    lojaNome: user?.loja?.nome,
    versaoPlataforma: pageContext.versao_plataforma,
  };

  const resetForm = () => {
    setDescricao('');
    setExpectativa('');
  };

  const handleSubmit = async () => {
    const trimmed = descricao.trim();
    if (trimmed.length < 10) {
      toast.error('Descreva o problema com pelo menos 10 caracteres.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    setLoading(true);
    try {
      await platformApi.submitBetaFeedback(
        {
          descricao: trimmed,
          expectativa: expectativa.trim() || undefined,
          ...pageContext,
        },
        token,
      );
      toast.success('Feedback enviado. Obrigado por ajudar no beta!');
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o feedback.',
      );
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const trimmed = descricao.trim();
    if (trimmed.length < 10) {
      toast.error('Descreva o problema antes de abrir o WhatsApp.');
      return;
    }

    const message = buildBetaFeedbackWhatsAppMessage(feedbackPayload);
    window.open(
      buildBetaFeedbackWhatsAppUrl(message),
      '_blank',
      'noopener,noreferrer',
    );
  };

  const openMailto = () => {
    const trimmed = descricao.trim();
    if (trimmed.length < 10) {
      toast.error('Descreva o problema antes de abrir o e-mail.');
      return;
    }

    window.location.href = buildBetaFeedbackMailtoUrl(feedbackPayload);
  };

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50 print:hidden md:bottom-6 md:right-6">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 w-10 rounded-full p-0 shadow-lg"
          aria-label="Beta — feedback"
          title="Beta — feedback"
        >
          <MessageCircleWarning className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'flex max-h-[min(92dvh,920px)] w-full flex-col gap-0 overflow-hidden p-0',
            // Mobile: sheet inferior, sem estourar a viewport
            'top-auto bottom-0 left-0 right-0 max-w-none translate-x-0 translate-y-0',
            'rounded-t-2xl rounded-b-none border-x-0 border-b-0',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
            // Desktop: modal centralizado
            'sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:right-auto sm:max-w-lg',
            'sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border',
            'sm:data-[state=open]:slide-in-from-top-0 sm:data-[state=closed]:slide-out-to-top-0',
            'sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95',
          )}
        >
          <div className="flex shrink-0 items-start gap-2 border-b px-4 py-3 pr-3">
            <DialogHeader className="flex-1 space-y-1 text-left">
              <DialogTitle>Beta · Feedback</DialogTitle>
              <DialogDescription className="text-left">
                Encontrou algo estranho? Conte o que aconteceu. A página atual
                será enviada automaticamente.
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 h-9 w-9 shrink-0"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Página atual</p>
              <p className="mt-1 break-all text-muted-foreground">
                {pageContext.pagina_url || pageContext.pagina_path}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beta-feedback-descricao">O que aconteceu?</Label>
              <Textarea
                id="beta-feedback-descricao"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Ex.: ao salvar o orçamento apareceu erro 500..."
                rows={4}
                className="max-h-40 resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beta-feedback-expectativa">
                O que você esperava? (opcional)
              </Label>
              <Textarea
                id="beta-feedback-expectativa"
                value={expectativa}
                onChange={(event) => setExpectativa(event.target.value)}
                placeholder="Ex.: o orçamento deveria salvar e voltar para a lista."
                rows={3}
                className="max-h-32 resize-y"
              />
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="detalhes" className="rounded-lg border px-3">
                <AccordionTrigger className="py-3 hover:no-underline">
                  Detalhes enviados automaticamente
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Rota:</strong>{' '}
                    {pageContext.pagina_path}
                  </p>
                  <p>
                    <strong className="text-foreground">Usuário:</strong>{' '}
                    {user?.nome_completo || 'N/A'} ({user?.email || 'N/A'})
                  </p>
                  <p>
                    <strong className="text-foreground">Loja:</strong>{' '}
                    {user?.loja?.nome || 'N/A'}
                  </p>
                  <p>
                    <strong className="text-foreground">Versão:</strong>{' '}
                    {pageContext.versao_plataforma}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">Prefere enviar manualmente?</p>
              <p className="mt-1 text-muted-foreground">
                Você também pode falar direto conosco:
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={`mailto:${BETA_FEEDBACK_CONFIG.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    {BETA_FEEDBACK_CONFIG.email}
                  </a>
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <a
                    href={`https://wa.me/${BETA_FEEDBACK_CONFIG.whatsappE164}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    {BETA_FEEDBACK_CONFIG.whatsappDisplay}
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter
            className={cn(
              'shrink-0 gap-2 border-t bg-background px-4 py-3',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
              'flex-col sm:flex-col',
            )}
          >
            <Button
              type="button"
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar reporte'
              )}
            </Button>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={openMailto}
                disabled={loading}
              >
                Enviar por e-mail
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={openWhatsApp}
                disabled={loading}
              >
                Enviar por WhatsApp
              </Button>
            </div>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="w-full sm:hidden">
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
