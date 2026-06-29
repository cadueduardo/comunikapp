'use client';

import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormInput,
  Layers,
  Package,
  Paintbrush,
} from 'lucide-react';

const opcoes = [
  {
    title: 'Produtos de prateleira',
    description: 'Gerencie SKU, preços, estoque e imagens dos produtos finitos.',
    icon: Package,
    href: '/produtos-finitos',
  },
  {
    title: 'Personalização',
    description: 'Processos de decoração, setup e faixas de preço por quantidade.',
    icon: Paintbrush,
    href: '/catalogo/personalizacao',
  },
  {
    title: 'Estampas',
    description: 'Cadastre estampas, arte-mestra e vínculos com processos.',
    icon: Layers,
    href: '/catalogo/estampas',
  },
  {
    title: 'Conjuntos de campos',
    description: 'Defina campos variáveis reutilizáveis nas personalizações.',
    icon: FormInput,
    href: '/catalogo/conjuntos-campos',
  },
];

export default function CatalogoHubPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo de produtos</h1>
        <p className="text-muted-foreground">
          Configure produtos, personalização e estampas da sua loja.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {opcoes.map((opt) => (
          <Link key={opt.href} href={opt.href}>
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <opt.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{opt.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {opt.description}
                    </CardDescription>
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
