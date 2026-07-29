import { Building2, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';

export default function GestaoOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        subtitle="Controle operacional seguro da plataforma ComunikApp."
        icon={<ShieldCheck className="h-7 w-7" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <Building2 className="mb-2 h-6 w-6 text-primary" />
            <CardTitle>Lojas</CardTitle>
            <CardDescription>
              Consulte lojas e controle seu ciclo de vida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/gestao/lojas">Abrir lojas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Sparkles className="mb-2 h-6 w-6 text-primary" />
            <CardTitle>Próximas entregas</CardTitle>
            <CardDescription>
              Dashboard com indicadores, auditoria visual e adoção por loja
              serão conectados nas próximas fatias.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
