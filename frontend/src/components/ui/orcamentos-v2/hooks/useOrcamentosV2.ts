'use client';

import { useState, useEffect } from 'react';
import { orcamentosApi } from '@/lib/api-client';

export interface OrcamentoV2 {
  id: string;
  numero: string;
  nome_servico: string;
  descricao?: string;
  preco_final: number;
  criado_em: string;
  data_atualizacao?: string;
  status?: string;
  status_aprovacao?: string;
  cliente?: {
    id: string;
    nome: string;
  };
  cliente_id?: string;
  quantidade_produto?: number;
  custo_total?: number;
  margem_lucro?: number;
  impostos?: number;
  atendente?: string;
  validade_proposta?: string;
  forma_pagamento?: string;
  prazo_entrega?: string;
}

interface UseOrcamentosV2Return {
  orcamentos: OrcamentoV2[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrcamentosV2(): UseOrcamentosV2Return {
  const [orcamentos, setOrcamentos] = useState<OrcamentoV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrcamentos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      console.log('🔍 Buscando orçamentos do backend (API v2)...');
      console.log('🔍 Token usado:', token ? 'Token presente' : 'Token ausente');
      console.log('🔍 URL da API:', 'http://localhost:4000/orcamentos-v2');
      console.log('🔍 Timestamp da busca:', new Date().toISOString());
      
      const data = await orcamentosApi.v2.getAll(token);
      
      console.log('📋 Orçamentos recebidos:', data);
      console.log('📋 Tipo dos dados:', typeof data);
      console.log('📋 É array?', Array.isArray(data));
      
      // Verificar se é estrutura paginada ou array direto
      const orcamentosArray = Array.isArray(data) ? data : data.orcamentos || [];
      
      // Debug: verificar estrutura dos dados
      console.log('🔍 Debug - Estrutura dos dados recebidos:', {
        orcamentosArray,
        length: orcamentosArray.length,
        firstItem: orcamentosArray[0]
      });
      
      // Debug: verificar campos específicos do primeiro item
      if (orcamentosArray[0]) {
        console.log('🔍 Debug - Campos do primeiro orçamento:', {
          id: orcamentosArray[0].id,
          nome_servico: orcamentosArray[0].nome_servico,
          preco_final: orcamentosArray[0].preco_final,
          criado_em: orcamentosArray[0].criado_em,
          cliente: orcamentosArray[0].cliente,
          status: orcamentosArray[0].status,
          status_aprovacao: orcamentosArray[0].status_aprovacao
        });
        
        // Debug: verificar estrutura completa do objeto
        console.log('🔍 Debug - Estrutura completa do primeiro item:', orcamentosArray[0]);
        console.log('🔍 Debug - Chaves disponíveis:', Object.keys(orcamentosArray[0]));
        
        // Procurar pelo orçamento específico
        const orcamentoEspecifico = orcamentosArray.find(o => o.id === 'cmfygr9l90001w4fo0r09klw4');
        if (orcamentoEspecifico) {
          console.log('🎯 Orçamento específico encontrado:', {
            id: orcamentoEspecifico.id,
            status: orcamentoEspecifico.status,
            status_aprovacao: orcamentoEspecifico.status_aprovacao
          });
        } else {
          console.log('❌ Orçamento específico não encontrado na lista');
        }
      }
      
      // Transformar dados do backend para o formato esperado pelo frontend
      const orcamentosTransformados: OrcamentoV2[] = orcamentosArray.map((orcamento: any) => {
        console.log('🔄 Transformando orçamento:', {
          id: orcamento.id,
          status: orcamento.status,
          status_aprovacao: orcamento.status_aprovacao,
          hasStatusAprovacao: 'status_aprovacao' in orcamento,
          titulo: orcamento.titulo,
          custos: orcamento.custos,
          allKeys: Object.keys(orcamento)
        });
        
        return {
          id: orcamento.id,
          numero: orcamento.numero || `#${orcamento.id.slice(-6)}`,
          nome_servico: orcamento.titulo || 'Orçamento sem nome', // ✅ Título do orçamento
          descricao: orcamento.descricao,
          preco_final: orcamento.custos?.preco_final || 0, // ✅ Valor total do orçamento
          criado_em: orcamento.data_criacao ? new Date(orcamento.data_criacao).toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : null, // ✅ Data de criação no fuso do Brasil com horário
          atualizado_em: orcamento.data_atualizacao ? new Date(orcamento.data_atualizacao).toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : null, // ✅ Data de última atualização no fuso do Brasil com horário
          status: orcamento.status || 'rascunho',
          status_aprovacao: orcamento.status_aprovacao || null,
        cliente: orcamento.cliente ? {
          id: orcamento.cliente.id,
          nome: orcamento.cliente.nome || orcamento.cliente.razao_social || 'Cliente sem nome'
        } : undefined,
        cliente_id: orcamento.cliente_id,
        quantidade_produto: orcamento.quantidade_produto,
        custo_total: orcamento.custos?.custo_total || 0, // ✅ CORRIGIDO: custos.custo_total
        margem_lucro: orcamento.custos?.margem_lucro || 0, // ✅ CORRIGIDO: custos.margem_lucro
        impostos: orcamento.custos?.impostos || 0, // ✅ CORRIGIDO: custos.impostos
        atendente: orcamento.atendente,
        validade_proposta: orcamento.validade_proposta,
        forma_pagamento: orcamento.forma_pagamento,
        prazo_entrega: orcamento.prazo_entrega,
        };
      });

      setOrcamentos(orcamentosTransformados);
      console.log('✅ Orçamentos carregados com sucesso:', orcamentosTransformados.length);
      console.log('🔍 Debug - Dados transformados:', orcamentosTransformados);
      
    } catch (err) {
      console.error('❌ Erro ao buscar orçamentos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setOrcamentos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  return {
    orcamentos,
    loading,
    error,
    refetch: fetchOrcamentos,
  };
}
