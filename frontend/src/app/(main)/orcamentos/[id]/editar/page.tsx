'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Orcamento {
  id: string;
  numero: string;
  nome_servico: string;
  descricao?: string;
  horas_producao: number;
  largura_produto?: number;
  altura_produto?: number;
  unidade_medida_produto?: string;
  area_produto?: number;
  custo_material: number;
  custo_mao_obra: number;
  custo_indireto: number;
  custo_total: number;
  margem_lucro: number;
  impostos: number;
  preco_final: number;
  cliente_id?: string;
  itens?: Array<{
    id: string;
    insumo_id: string;
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
  }>;
  maquinas?: Array<{
    id: string;
    maquina_id: string;
    horas_utilizadas: number;
    custo_total: number;
  }>;
  funcoes?: Array<{
    id: string;
    funcao_id: string;
    horas_trabalhadas: number;
    custo_total: number;
  }>;
}

export default function EditarOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOrcamento();
  }, [id]);

  const fetchOrcamento = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/orcamentos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrcamento(data);
      } else {
        toast.error('Falha ao buscar dados do orçamento.');
        router.push('/orcamentos');
      }
    } catch (err) {
      toast.error('Ocorreu um erro ao buscar o orçamento.');
      console.error(err);
      router.push('/orcamentos');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Orçamento não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O orçamento que você está procurando não existe ou foi removido.
          </p>
          <Link href="/orcamentos">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Orçamentos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/orcamentos/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Editar Orçamento</h1>
        <p className="text-gray-600 mt-1">
          Altere os detalhes do orçamento #{orcamento.numero} abaixo.
        </p>
      </div>

      {/* TODO: Implementar formulário de edição reutilizando o formulário de criação */}
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Formulário de Edição</h3>
        <p className="text-muted-foreground">
          O formulário de edição será implementado em breve, reutilizando o formulário de criação.
        </p>
      </div>
    </div>
  );
} 