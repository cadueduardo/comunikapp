'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutTemplate } from 'lucide-react';

interface ModeloOrcamentoSectionProps {
  modo: 'novo' | 'editar' | 'template';
  desabilitado?: boolean;
  onCarregarModelo?: () => void;
}

export function ModeloOrcamentoSection({
  modo,
  desabilitado,
  onCarregarModelo,
}: ModeloOrcamentoSectionProps) {
  if (modo === 'template' || !onCarregarModelo) {
    return null;
  }

  return (
    <Card flatOnMobile>
      <CardHeader>
        <CardTitle className="text-base">Modelo de orçamento</CardTitle>
        <CardDescription>
          Substitui todos os produtos e configurações atuais por um modelo salvo anteriormente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="outline"
          disabled={desabilitado}
          onClick={onCarregarModelo}
          className="flex items-center gap-2"
        >
          <LayoutTemplate className="h-4 w-4" />
          Carregar modelo
        </Button>
      </CardContent>
    </Card>
  );
}
