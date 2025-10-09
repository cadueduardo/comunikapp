'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ValidacoesAutomaticasCard } from '@/components/configuracoes/ValidacoesAutomaticasCard';
import {
  Settings,
  Tag,
  DollarSign,
  Truck,
  Users,
  Wrench,
  Building2,
  Package,
  Shield,
  Grid3x3
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ConfiguracoesPage() {
  const [statsValidacoes, setStatsValidacoes] = useState<any>(null);

  useEffect(() => {
    // Carregar estatísticas de validações
    const loadStats = async () => {
      try {
        const response = await fetch('/api/configuracoes/validacoes-automaticas/dashboard');
        const data = await response.json();
        setStatsValidacoes({
          totalRegras: data.totalRegras || 0,
          regrasAtivas: data.regrasAtivas || 0,
          execucoesHoje: data.execucoesHoje || 0,
          taxaSucesso: data.taxaSucesso || 0
        });
      } catch (error) {
        console.error('Erro ao carregar stats:', error);
      }
    };

    loadStats();
  }, []);

  const configuracoes = [
    {
      titulo: 'Categorias de Insumos',
      descricao: 'Gerencie as categorias de insumos',
      href: '/configuracoes/categorias',
      icone: Tag,
      cor: 'bg-blue-100 text-blue-600'
    },
    {
      titulo: 'Custos Indiretos',
      descricao: 'Configure custos indiretos e impostos',
      href: '/configuracoes/custos-indiretos',
      icone: DollarSign,
      cor: 'bg-green-100 text-green-600'
    },
    {
      titulo: 'Fornecedores',
      descricao: 'Cadastro de fornecedores',
      href: '/configuracoes/fornecedores',
      icone: Truck,
      cor: 'bg-purple-100 text-purple-600'
    },
    {
      titulo: 'Funções',
      descricao: 'Gerencie funções e mão de obra',
      href: '/configuracoes/funcoes',
      icone: Users,
      cor: 'bg-orange-100 text-orange-600'
    },
    {
      titulo: 'Máquinas',
      descricao: 'Cadastro de máquinas e equipamentos',
      href: '/configuracoes/maquinas',
      icone: Wrench,
      cor: 'bg-red-100 text-red-600'
    },
    {
      titulo: 'Loja',
      descricao: 'Configurações da loja',
      href: '/configuracoes/loja',
      icone: Building2,
      cor: 'bg-indigo-100 text-indigo-600'
    },
    {
      titulo: 'Tipos de Material',
      descricao: 'Gerencie tipos de material',
      href: '/configuracoes/tipos-material',
      icone: Package,
      cor: 'bg-pink-100 text-pink-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      {/* Card de Validações Automáticas em destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ValidacoesAutomaticasCard stats={statsValidacoes} />
      </div>

      {/* Grid de outras configurações */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Outras Configurações</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configuracoes.map((config) => {
            const Icone = config.icone;
            return (
              <Link key={config.href} href={config.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${config.cor}`}>
                        <Icone className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{config.titulo}</CardTitle>
                        <CardDescription className="text-sm">
                          {config.descricao}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}