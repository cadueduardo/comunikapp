'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Building2, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { lojasApi } from '@/lib/api-client';
import { ENV_CONFIG } from '@/lib/env';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type MinhaLoja = {
  id: string;
  nome: string;
  email: string;
  status: string;
  criado_em: string;
  pcp_nivel?: string | null;
  trial_restante_dias?: number | null;
  trial_status?: string | null;
  assinatura_ativa?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE_VERIFICACAO: 'Pendente de verificação',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
};

const PCP_LABELS: Record<string, string> = {
  ESSENCIAL: 'Essencial',
  ORGANIZADO: 'Organizado',
  COMPLETO: 'Completo',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function InfoRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: ReactNode;
  copyValue?: string;
}) {
  const handleCopy = async () => {
    if (!copyValue) return;
    await navigator.clipboard.writeText(copyValue);
    toast.success(`${label} copiado.`);
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium break-all">{value}</div>
      </div>
      {copyValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={handleCopy}
          aria-label={`Copiar ${label}`}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function IdentificacaoLojaCard() {
  const { user } = useUser();
  const [loja, setLoja] = useState<MinhaLoja | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.funcao === 'ADMINISTRADOR';

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = (await lojasApi.getMinhaLoja(token)) as MinhaLoja;
        setLoja(data);
      } catch (err) {
        console.error('Erro ao carregar identificação da loja:', err);
        setError('Não foi possível carregar os dados da loja.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const platformVersion = ENV_CONFIG.GIT_SHA
    ? `${ENV_CONFIG.APP_VERSION} (${ENV_CONFIG.GIT_SHA.slice(0, 7)})`
    : ENV_CONFIG.APP_VERSION;

  const trialLabel =
    loja?.trial_status === 'expired'
      ? 'Trial expirado'
      : loja?.trial_restante_dias != null
        ? `${loja.trial_restante_dias} dia(s) restante(s)`
        : 'Sem trial';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Identificação da loja</CardTitle>
            <CardDescription>
              Dados da sua conta e referências para suporte. A versão da plataforma é global — todas as lojas recebem a mesma atualização em cada deploy.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}

        {!loading && !error && loja && user && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Nome da loja</p>
                <p className="text-sm font-medium">{loja.nome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-mail da loja</p>
                <p className="text-sm font-medium break-all">{loja.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline" className="mt-1">
                  {STATUS_LABELS[loja.status] ?? loja.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trial</p>
                <p className="text-sm font-medium">{trialLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PCP</p>
                <p className="text-sm font-medium">
                  {loja.pcp_nivel ? (PCP_LABELS[loja.pcp_nivel] ?? loja.pcp_nivel) : 'Não configurado'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cadastro</p>
                <p className="text-sm font-medium">{formatDate(loja.criado_em)}</p>
              </div>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="detalhes-tecnicos" className="border rounded-lg px-3">
                <AccordionTrigger className="py-3 hover:no-underline">
                  Detalhes técnicos
                </AccordionTrigger>
                <AccordionContent>
                  <InfoRow label="ID da loja" value={loja.id} copyValue={loja.id} />
                  <InfoRow label="ID do usuário" value={user.id} copyValue={user.id} />
                  <InfoRow
                    label="Usuário"
                    value={`${user.nome_completo} (${user.email})`}
                  />
                  <InfoRow
                    label="Versão da plataforma"
                    value={platformVersion}
                    copyValue={platformVersion}
                  />
                  <InfoRow
                    label="Assinatura"
                    value={loja.assinatura_ativa ? 'Ativa' : 'Inativa'}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
