'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConversionExample {
  title: string;
  description: string;
  compra: string;
  uso: string;
  fator: string;
  formula: string;
}

const examples: ConversionExample[] = [
  {
    title: "Lona Banner",
    description: "1 bobina = 13.2 m²",
    compra: "1 BOBINA",
    uso: "1 M²",
    fator: "1.0",
    formula: "1 m² comprado = 1 m² usado"
  },
  {
    title: "Cordão",
    description: "1 rolo = 100 metros",
    compra: "1 ROLO",
    uso: "1 M",
    fator: "1.0",
    formula: "1 m comprado = 1 m usado"
  },
  {
    title: "Tinta",
    description: "1 litro cobre 10 m²",
    compra: "1 LITRO",
    uso: "1 M²",
    fator: "0.1",
    formula: "1 litro = 10 m² (1 ÷ 10 = 0.1)"
  },
  {
    title: "Cola",
    description: "1 kg cola 5 m²",
    compra: "1 KG",
    uso: "1 M²",
    fator: "0.2",
    formula: "1 kg = 5 m² (1 ÷ 5 = 0.2)"
  },
  {
    title: "Fita",
    description: "1 rolo = 50 metros",
    compra: "1 ROLO",
    uso: "1 M",
    fator: "50",
    formula: "1 rolo = 50 m (50 ÷ 1 = 50)"
  }
];

export function ConversionExamples() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Exemplos de Fator de Conversão</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {examples.map((example, index) => (
              <div key={index} className="border rounded-lg p-3 bg-muted/30">
                <div className="font-medium text-sm">{example.title}</div>
                <div className="text-xs text-muted-foreground mb-2">{example.description}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Compra:</span> {example.compra}
                  </div>
                  <div>
                    <span className="font-medium">Uso:</span> {example.uso}
                  </div>
                  <div>
                    <span className="font-medium">Fator:</span> {example.fator}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {example.formula}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
} 