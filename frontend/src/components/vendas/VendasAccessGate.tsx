'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldOff } from 'lucide-react';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function VendasAccessGate({ children }: { children: ReactNode }) {
  const { acesso, loading, erro, resolvido, recarregar } = useVendasAcesso();

  // Já resolvido no shell (sidebar): não mostrar tela de espera ao entrar no módulo.
  if (loading && !resolvido) {
    return (
      <Card aria-busy="true">
        <CardHeader>
          <CardTitle>Carregando Vendas…</CardTitle>
          <CardDescription>Verificando sua permissão de acesso.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card role="alert">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <CardTitle>Não foi possível verificar o acesso</CardTitle>
              <CardDescription>{erro}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => void recarregar()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!acesso.pode_acessar_modulo) {
    return (
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
    );
  }

  return children;
}
