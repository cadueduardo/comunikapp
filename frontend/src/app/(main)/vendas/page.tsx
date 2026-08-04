'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, BriefcaseBusiness, RefreshCw, ShieldOff } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ModuleHubCards } from '@/components/layout/ModuleHubCards';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getModuleHubCardItems } from '@/lib/module-nav';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';

type EstadoHub = 'loading' | 'sem_permissao' | 'erro' | 'vazio' | 'pronto';

export default function VendasHomePage() {
  const { acesso, loading: loadingAcesso, erro: erroAcesso, recarregar } =
    useVendasAcesso(true);
  const {
    nav: navFiltrado,
    loading: loadingConfig,
    erro: erroConfig,
    recarregar: recarregarConfig,
  } = useVendasNavFiltrado();

  const cards = useMemo(
    () => getModuleHubCardItems(navFiltrado),
    [navFiltrado],
  );

  const estado: EstadoHub = (() => {
    if (loadingAcesso || loadingConfig) return 'loading';
    if (erroAcesso) return 'erro';
    if (!acesso.pode_acessar_modulo) return 'sem_permissao';
    if (cards.length === 0) return 'vazio';
    return 'pronto';
  })();

  const atualizar = () => {
    void recarregar();
    void recarregarConfig();
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={navFiltrado}
        title="Visão geral"
        subtitle="Casa do comercial: propostas, clientes e atalhos."
        icon={<BriefcaseBusiness className="h-7 w-7 sm:h-8 sm:w-8" />}
        actions={
          <Button
            onClick={atualizar}
            disabled={estado === 'loading'}
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${estado === 'loading' ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
        }
      />

      {estado === 'loading' ? (
        <Card>
          <CardHeader>
            <CardTitle>Carregando Vendas…</CardTitle>
            <CardDescription>
              Verificando permissões e configuração da loja.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {estado === 'sem_permissao' ? (
        <Card role="alert">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>Sem permissão</CardTitle>
                <CardDescription>
                  Você não tem acesso ao módulo Vendas. Se acredita que isso é um
                  erro, fale com o administrador da loja.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      {estado === 'erro' ? (
        <Card role="alert">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <CardTitle>Não foi possível abrir Vendas</CardTitle>
                <CardDescription>
                  {erroAcesso ?? 'Tente novamente em instantes.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={atualizar} variant="outline">
              Tentar de novo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {estado === 'vazio' ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum atalho disponível</CardTitle>
            <CardDescription>
              Não há seções comerciais para exibir neste momento.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {estado === 'pronto' ? (
        <>
          {erroConfig ? (
            <p className="text-sm text-muted-foreground" role="status">
              {erroConfig} O card de Aditivos permanece oculto até a configuração
              responder.
            </p>
          ) : null}

          <ModuleHubCards nav={navFiltrado} gridClassName="lg:grid-cols-3" />

          <div className="flex flex-wrap gap-3">
            {acesso.permissoes.proposta_criar ? (
              <Button asChild>
                <Link href="/orcamentos-v2/novo">Novo orçamento</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/clientes">Abrir clientes</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/orcamentos-v2/simulador">Abrir simulador</Link>
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
