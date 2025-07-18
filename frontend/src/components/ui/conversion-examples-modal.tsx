'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConversionExample {
  title: string;
  description: string;
  compra: string;
  uso: string;
  fator: string;
  formula: string;
  explicacao: string;
}

const examples: ConversionExample[] = [
  {
    title: "Lona Banner",
    description: "1 bobina = 13.2 m²",
    compra: "1 BOBINA",
    uso: "1 M²",
    fator: "1.0",
    formula: "1 m² comprado = 1 m² usado",
    explicacao: "A lona é comprada por bobina e usada por metro quadrado. Como 1 m² comprado = 1 m² usado, o fator é 1.0."
  },
  {
    title: "Cordão",
    description: "1 rolo = 100 metros",
    compra: "1 ROLO",
    uso: "1 M",
    fator: "1.0",
    formula: "1 m comprado = 1 m usado",
    explicacao: "O cordão é comprado por rolo e usado por metro. Como 1 m comprado = 1 m usado, o fator é 1.0."
  },
  {
    title: "Tinta",
    description: "1 litro cobre 10 m²",
    compra: "1 LITRO",
    uso: "1 M²",
    fator: "0.1",
    formula: "1 litro = 10 m² (1 ÷ 10 = 0.1)",
    explicacao: "A tinta é comprada por litro mas usada por metro quadrado. Como 1 litro cobre 10 m², o fator é 0.1 (1 ÷ 10)."
  },
  {
    title: "Cola",
    description: "1 kg cola 5 m²",
    compra: "1 KG",
    uso: "1 M²",
    fator: "0.2",
    formula: "1 kg = 5 m² (1 ÷ 5 = 0.2)",
    explicacao: "A cola é comprada por quilo mas usada por metro quadrado. Como 1 kg cola 5 m², o fator é 0.2 (1 ÷ 5)."
  },
  {
    title: "Fita",
    description: "1 rolo = 50 metros",
    compra: "1 ROLO",
    uso: "1 M",
    fator: "50",
    formula: "1 rolo = 50 m (50 ÷ 1 = 50)",
    explicacao: "A fita é comprada por rolo mas usada por metro. Como 1 rolo tem 50 metros, o fator é 50 (50 ÷ 1)."
  }
];

interface ConversionExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConversionExamplesModal({ isOpen, onClose }: ConversionExamplesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Exemplos de Fator de Conversão</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            O fator de conversão é o número que converte a unidade de compra para a unidade de uso. 
            Na maioria dos casos use 1.0. Veja os exemplos abaixo:
          </div>
          
          {examples.map((example, index) => (
            <div key={index} className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-lg">{example.title}</div>
                  <div className="text-sm text-muted-foreground">{example.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{example.fator}</div>
                  <div className="text-xs text-muted-foreground">Fator</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-xs text-blue-600 font-medium mb-1">COMPRA</div>
                  <div className="text-sm">{example.compra}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-xs text-green-600 font-medium mb-1">USO</div>
                  <div className="text-sm">{example.uso}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Fórmula:</span> {example.formula}
                </div>
                <div className="text-sm text-muted-foreground">
                  {example.explicacao}
                </div>
              </div>
            </div>
          ))}
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="font-medium text-yellow-800 mb-2">💡 Dica Importante</div>
            <div className="text-sm text-yellow-700">
              Na maioria dos casos, use <strong>1.0</strong> como fator de conversão. 
                             Só use valores diferentes quando o produto tem um &quot;rendimento&quot; específico 
               (como tinta que cobre uma área) ou quando há uma multiplicação 
               (como um rolo que contém vários metros).
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 