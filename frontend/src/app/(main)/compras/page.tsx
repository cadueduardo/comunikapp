'use client';

import Link from 'next/link';
import { ClipboardList, FileText, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ComprasHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Compras</h1>
        <p className="mt-1 text-muted-foreground">
          Solicitações e pedidos de compra, suprimentos e despesas externas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Registre a necessidade, envie para aprovação e acompanhe o status.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/compras/solicitacoes">Ver solicitações</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/compras/solicitacoes/nova">Nova solicitação</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Formalize fornecedor, preços e condições do pedido de compra.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/compras/pedidos">Ver pedidos</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/compras/pedidos/novo">Novo pedido</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        MVP Fase 1: rascunho, listagem, detalhe e aprovação básica.
      </p>
    </div>
  );
}
