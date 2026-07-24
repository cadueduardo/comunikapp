'use client';

import { FormEvent, useState } from 'react';
import { Calculator, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { OsPosCalculoPanel } from '@/components/os/OsPosCalculoPanel';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { financeiroModuleNav } from '@/lib/module-nav';

export default function PosCalculoPage() {
  const [osIdInput, setOsIdInput] = useState('');
  const [osIdAtivo, setOsIdAtivo] = useState<string | null>(null);

  function buscar(event: FormEvent) {
    event.preventDefault();
    const id = osIdInput.trim();
    if (!id) {
      toast.error('Informe o ID da ordem de serviço.');
      return;
    }
    setOsIdAtivo(id);
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={financeiroModuleNav}
        title="Pós-cálculo (OS)"
        subtitle="Previsto × real por ordem de serviço — receitas, custos, margens e fechamento financeiro."
        icon={<Calculator className="h-7 w-7 sm:h-8 sm:w-8" />}
        backHref="/financeiro"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Consultar OS
          </CardTitle>
          <CardDescription>
            Informe o ID (cuid) da ordem de serviço. Na ficha da OS use a aba
            Financeiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={buscar}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="os-id">ID da OS</Label>
              <Input
                id="os-id"
                value={osIdInput}
                onChange={(e) => setOsIdInput(e.target.value)}
                placeholder="Ex.: clxxxxxxxx..."
                autoComplete="off"
              />
            </div>
            <Button type="submit">
              <Calculator className="mr-2 h-4 w-4" />
              Calcular
            </Button>
          </form>
        </CardContent>
      </Card>

      {osIdAtivo ? (
        <OsPosCalculoPanel key={osIdAtivo} osId={osIdAtivo} showJson />
      ) : null}
    </div>
  );
}
