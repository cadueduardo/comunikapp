import { useState, useEffect, useCallback } from 'react';
import { useOSProdutos } from './useOSProdutos';
import { ArteStatus } from '../types/arte-types';

interface ProdutoArte {
  id: string;
  nome: string;
  versaoAtual: string;
  status: ArteStatus;
  cor: string;
  quantidadeVersoes: number;
  ultimaVersao?: string;
  ultimaAtualizacao?: Date;
}

export function useArteProdutos(osId: string) {
  const { produtos: produtosOS, loading: loadingOS, error: errorOS } = useOSProdutos(osId);
  const [produtosArte, setProdutosArte] = useState<ProdutoArte[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar versões de arte para cada produto
  const fetchVersoesPorProduto = useCallback(async () => {
    if (!osId || produtosOS.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar todas as versões de arte da OS
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('Token de autenticação não encontrado');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/arte-aprovacao/versoes/os/${osId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Falha ao buscar versões`);
      }
      
      const data = await response.json();
      const versoes = data.success ? data.data : (Array.isArray(data) ? data : []);

      // Mapear produtos com suas versões
      const produtosComVersoes = produtosOS.map((produto, index) => {
        // Buscar versões para este produto específico
        const versoesProduto = versoes.filter((versao: any) => 
          versao.servico_id === produto.id || 
          versao.descricao?.toLowerCase().includes(produto.nome.toLowerCase()) ||
          versao.descricao?.toLowerCase().includes(produto.tipo || '')
        );

        // Determinar versão atual e status
        const versaoAtual = versoesProduto.length > 0 ? 
          `v${versoesProduto.length}` : 'v1';
        
        const statusAtual = versoesProduto.length > 0 ? 
          versoesProduto[0].status : ArteStatus.RASCUNHO;

        const ultimaVersao = versoesProduto.length > 0 ? versoesProduto[0] : null;

        // Determinar cor baseada no status
        let cor = 'bg-gray-100 text-gray-800 border-gray-200';
        if (statusAtual === ArteStatus.APROVADA) {
          cor = 'bg-green-100 text-green-800 border-green-200';
        } else if (statusAtual === ArteStatus.ENVIADA_CLIENTE) {
          cor = 'bg-blue-100 text-blue-800 border-blue-200';
        } else if (statusAtual === ArteStatus.REVISAO_SOLICITADA) {
          cor = 'bg-red-100 text-red-800 border-red-200';
        } else if (statusAtual === ArteStatus.RASCUNHO) {
          cor = 'bg-purple-100 text-purple-800 border-purple-200';
        }

        return {
          id: produto.id,
          nome: produto.nome,
          versaoAtual,
          status: statusAtual,
          cor,
          quantidadeVersoes: versoesProduto.length,
          ultimaVersao: ultimaVersao?.versao,
          ultimaAtualizacao: ultimaVersao ? new Date(ultimaVersao.data_criacao) : undefined
        };
      });

      setProdutosArte(produtosComVersoes);
    } catch (error) {
      console.error('Erro ao buscar versões por produto:', error);
      
      // Fallback: produtos sem versões
      const produtosFallback = produtosOS.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        versaoAtual: 'v0',
        status: ArteStatus.RASCUNHO,
        cor: 'bg-gray-100 text-gray-800 border-gray-200',
        quantidadeVersoes: 0
      }));
      
      setProdutosArte(produtosFallback);
    } finally {
      setLoading(false);
    }
  }, [osId, produtosOS]);

  useEffect(() => {
    if (!loadingOS && produtosOS.length > 0) {
      fetchVersoesPorProduto();
    } else if (!loadingOS) {
      setLoading(false);
    }
  }, [loadingOS, fetchVersoesPorProduto]); // Usar função memoizada

  return {
    produtos: produtosArte,
    loading: loading || loadingOS,
    error: errorOS,
    refresh: fetchVersoesPorProduto
  };
}
