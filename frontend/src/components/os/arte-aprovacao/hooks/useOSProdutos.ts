/**
 * Hook para carregar produtos de uma OS
 * Usa a mesma API que a aba Resumo usa para garantir consistência
 */

import { useState, useEffect } from 'react';

interface OSProduto {
  id: string;
  nome: string;
  descricao: string;
  quantidade: number;
  tipo: 'produto_orcamento' | 'item_os' | 'servico_principal';
  status: string;
}

interface UseOSProdutosReturn {
  produtos: OSProduto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOSProdutos(osId: string): UseOSProdutosReturn {
  const [produtos, setProdutos] = useState<OSProduto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProdutos = async () => {
    if (!osId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // ✅ USAR A MESMA API QUE A ABA RESUMO USA
      const response = await fetch(`/api/os/produtos/${osId}/status-produtos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar produtos da OS');
      }

      const result = await response.json();

      if (result.success) {
        // Converter produtos da API de status para o formato esperado
        const produtosOS: OSProduto[] = result.data.produtos.map((produto: any) => ({
          id: produto.item_id || produto.produto_id,
          nome: produto.produto_servico, // ✅ NOME CORRETO DO PRODUTO
          descricao: produto.produto_servico,
          quantidade: 1,
          tipo: 'item_os',
          status: 'ativo'
        }));

        // console.log('🔍 [useOSProdutos] Produtos carregados da API status-produtos:', produtosOS);
        setProdutos(produtosOS);
      } else {
        throw new Error(result.message || 'Erro ao carregar produtos');
      }
    } catch (err) {
      console.error('Erro ao carregar produtos da OS:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [osId]);

  return {
    produtos,
    loading,
    error,
    refetch: fetchProdutos,
  };
}