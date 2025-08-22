'use client';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Wrench, Users, Hand, DollarSign } from 'lucide-react';

export default function CentrosDeTrabalhoPage() {
  const options = [
    {
      title: 'Máquinas',
      description: 'Gerencie máquinas e modos de impressão.',
      icon: Wrench,
      href: '/centros-de-trabalho/maquinas',
    },
    {
      title: 'Funções',
      description: 'Gerencie funções e regras de cálculo.',
      icon: Users,
      href: '/centros-de-trabalho/funcoes',
    },
    {
      title: 'Serviços Manuais',
      description: 'Cadastre serviços manuais e parâmetros.',
      icon: Hand,
      href: '/centros-de-trabalho/servicos',
    },
    {
      title: 'Custos Indiretos',
      description: 'Configure custos indiretos e alocação.',
      icon: DollarSign,
      href: '/centros-de-trabalho/custos-indiretos',
    },
  ];

  return (
    <div className="p-2 md:p-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Centros de Trabalho</h1>
        <p className="text-sm text-gray-500">Escolha uma área para gerenciar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {options.map((opt) => (
          <Link key={opt.href} href={opt.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <opt.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{opt.title}</CardTitle>
                    <CardDescription className="text-sm">{opt.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}


