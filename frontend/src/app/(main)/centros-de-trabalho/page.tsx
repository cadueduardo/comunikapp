'use client';
import Link from 'next/link';

export default function CentrosDeTrabalhoPage() {
  const cards = [
    {
      title: 'Máquinas',
      description: 'Gerencie máquinas e modos de impressão',
      href: '/centros-de-trabalho/maquinas',
    },
    {
      title: 'Funções',
      description: 'Gerencie funções e regras de cálculo',
      href: '/centros-de-trabalho/funcoes',
    },
    {
      title: 'Serviços Manuais',
      description: 'Cadastre serviços manuais e parâmetros',
      href: '/centros-de-trabalho/servicos',
    },
    {
      title: 'Custos Indiretos',
      description: 'Configure custos indiretos e alocação',
      href: '/centros-de-trabalho/custos-indiretos',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Centros de Trabalho</h1>
        <p className="text-sm text-gray-500">Escolha uma área para gerenciar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="block">
            <div className="rounded-lg border bg-white dark:bg-neutral-900 dark:border-neutral-700 p-4 hover:shadow transition">
              <div className="text-lg font-medium">{card.title}</div>
              <div className="text-sm text-gray-500 mt-1">{card.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


