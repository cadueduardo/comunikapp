import {
  FormInput,
  Layers,
  LayoutDashboard,
  Package,
  Paintbrush,
} from 'lucide-react';
import type { ModuleNavConfig } from './types';

export const catalogoModuleNav: ModuleNavConfig = {
  id: 'catalogo',
  label: 'Catálogo',
  homeHref: '/catalogo',
  items: [
    {
      id: 'visao-geral',
      label: 'Visão geral',
      shortLabel: 'Geral',
      href: '/catalogo',
      description: 'Produtos, personalização e estampas.',
      icon: LayoutDashboard,
    },
    {
      id: 'produtos-prateleira',
      label: 'Produtos de prateleira',
      shortLabel: 'Produtos',
      href: '/produtos-finitos',
      description: 'SKU, preços, estoque e imagens.',
      icon: Package,
    },
    {
      id: 'personalizacao',
      label: 'Personalização',
      shortLabel: 'Personalizar',
      href: '/catalogo/personalizacao',
      description: 'Processos de decoração e faixas de preço.',
      icon: Paintbrush,
    },
    {
      id: 'estampas',
      label: 'Estampas',
      shortLabel: 'Estampas',
      href: '/catalogo/estampas',
      description: 'Arte-mestra e vínculos com processos.',
      icon: Layers,
    },
    {
      id: 'conjuntos-campos',
      label: 'Conjuntos de campos',
      shortLabel: 'Campos',
      href: '/catalogo/conjuntos-campos',
      description: 'Campos variáveis reutilizáveis.',
      icon: FormInput,
    },
  ],
};
