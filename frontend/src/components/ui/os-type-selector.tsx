'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Package, Target, Zap } from 'lucide-react';

export type TipoOS = 'COMERCIAL' | 'INTERNA';

interface OSTypeSelectorProps {
  onSelectType: (tipo: TipoOS) => void;
  selectedType?: TipoOS;
}

const osTypes = [
  {
    id: 'COMERCIAL' as TipoOS,
    title: 'OS Comercial',
    description: 'Ordem de serviço para cliente externo',
    icon: <Users className="h-8 w-8 text-blue-600" />,
    features: [
      'Cliente obrigatório',
      'Aprovação técnica',
      'Agendamento de instalação',
      'Controle de satisfação',
      'Valores comerciais'
    ],
    color: 'blue'
  },
  {
    id: 'INTERNA' as TipoOS,
    title: 'OS Interna',
    description: 'Produção para estoque, marketing ou uso interno',
    icon: <Building2 className="h-8 w-8 text-green-600" />,
    features: [
      'Sem cliente obrigatório',
      'Departamento solicitante',
      'Centro de custo',
      'Aprovação gerencial',
      'Controle orçamentário'
    ],
    color: 'green'
  }
];

export function OSTypeSelector({ onSelectType, selectedType }: OSTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Criar Nova Ordem de Serviço</h2>
        <p className="text-gray-600">Selecione o tipo de OS que deseja criar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {osTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === type.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => onSelectType(type.id)}
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {type.icon}
              </div>
              <CardTitle className="text-xl">{type.title}</CardTitle>
              <CardDescription className="text-base">
                {type.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {type.features.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`text-xs ${
                        type.color === 'blue' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
                
                <Button
                  className={`w-full ${
                    type.color === 'blue' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectType(type.id);
                  }}
                >
                  Selecionar {type.title}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="text-center">
          <Badge variant="outline" className="text-sm">
            Tipo selecionado: {osTypes.find(t => t.id === selectedType)?.title}
          </Badge>
        </div>
      )}
    </div>
  );
}
