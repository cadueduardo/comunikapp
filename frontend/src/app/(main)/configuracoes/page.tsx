'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';
import { Settings, Boxes, Truck, Store, Cog, Users, Receipt } from 'lucide-react';

const settingsOptions = [
  {
    title: 'Dados da Empresa',
    description: 'Gerencie o logo, custos e parâmetros do seu negócio.',
    icon: Store,
    href: '/configuracoes/loja',
  },
  {
    title: 'Máquinas',
    description: 'Gerencie as máquinas e seus custos operacionais.',
    icon: Cog,
    href: '/configuracoes/maquinas',
  },
  {
    title: 'Funções',
    description: 'Gerencie as funções e custos de mão de obra.',
    icon: Users,
    href: '/configuracoes/funcoes',
  },
  {
    title: 'Categorias',
    description: 'Organize seus insumos e produtos em categorias.',
    icon: Boxes,
    href: '/configuracoes/categorias',
  },
  {
    title: 'Fornecedores',
    description: 'Gerencie os fornecedores de insumos e serviços.',
    icon: Truck,
    href: '/configuracoes/fornecedores',
  },
  {
    title: 'Custos Indiretos',
    description: 'Gerencie os custos indiretos da sua empresa.',
    icon: Receipt,
    href: '/configuracoes/custos-indiretos',
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Configurações
        </h1>
        <p className="text-gray-600 mt-1">
          Ajustes e personalizações gerais do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsOptions.map((option) => (
          <Link href={option.href} key={option.title} passHref>
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <CardTitle className="text-xl font-semibold mb-2">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                  <option.icon className="h-8 w-8 text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 