'use client';

import { ClipboardPlus, ShieldOff } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InstalacaoOcorrenciasFilaGrid } from '@/components/instalacao/InstalacaoOcorrenciasFilaGrid';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';

/**
 * Superfície fina de Aditivos dentro de Vendas.
 * Reutiliza a fila existente; não reescreve CRUD. Visível só com
 * `os_aditiva_habilitada` e permissão comercial no backend.
 */
export default function VendasAditivosPage() {
  const { acesso, loading: loadingAcesso } = useVendasAcesso(true);
  const {
    nav,
    aditivosHabilitados,
    loading: loadingConfig,
  } = useVendasNavFiltrado();

  const loading = loadingAcesso || loadingConfig;
  const habilitada = aditivosHabilitados;

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={nav}
        title="Aditivos"
        subtitle="Ocorrências de instalação pendentes de precificação."
        icon={<ClipboardPlus className="h-7 w-7 sm:h-8 sm:w-8" />}
        backHref="/vendas"
        backLabel="Vendas"
      />

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Carregando…</CardTitle>
            <CardDescription>
              Verificando permissão e configuração da loja.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!loading && !acesso.pode_acessar_modulo ? (
        <Card role="alert">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>Sem permissão</CardTitle>
                <CardDescription>
                  Você não tem acesso ao módulo Vendas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      {!loading && acesso.pode_acessar_modulo && habilitada === false ? (
        <Card>
          <CardHeader>
            <CardTitle>Aditivos desabilitados</CardTitle>
            <CardDescription>
              A loja não habilitou OS aditiva. Não há fila comercial de aditivos
              para exibir.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!loading && acesso.pode_acessar_modulo && habilitada === true ? (
        <InstalacaoOcorrenciasFilaGrid
          podePrecificar={acesso.permissoes.proposta_editar === true}
        />
      ) : null}
    </div>
  );
}
