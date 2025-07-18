'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import OrcamentoForm from '@/components/ui/orcamento-form';

interface OrcamentoData {
  cliente_id: string;
  margem_lucro_customizada?: string;
  impostos_customizados?: string;
  condicoes_comerciais?: string;
  itens_produto: Array<{
    nome_servico: string;
    descricao?: string;
    largura_produto?: string;
    altura_produto?: string;
    unidade_medida_produto?: string;
    area_produto?: string;
    materiais: Array<{
      insumo_id: string;
      quantidade: string;
    }>;
    maquinas: Array<{
      maquina_id: string;
      horas_utilizadas: string;
    }>;
    funcoes: Array<{
      funcao_id: string;
      horas_trabalhadas: string;
    }>;
  }>;
}

export default function EditarOrcamentoPage() {
  const params = useParams();
  const [orcamentoData, setOrcamentoData] = useState<OrcamentoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrcamento = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`http://localhost:3001/orcamentos/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setOrcamentoData(data);
        }
      } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrcamento();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Carregando orçamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!orcamentoData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Orçamento não encontrado</h1>
          <p className="text-muted-foreground">
            O orçamento que você está procurando não foi encontrado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <OrcamentoForm 
      mode="editar" 
      initialData={orcamentoData}
      orcamentoId={params.id as string}
      onSuccess={() => {
        // Redirecionar para a listagem após salvar
        window.location.href = '/orcamentos';
      }}
    />
  );
} 