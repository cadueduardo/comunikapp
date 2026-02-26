'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrcamentoV2Form } from '@/components/ui/orcamentos-v2/orcamento-v2-form';
import { Loader2 } from 'lucide-react';
import { orcamentosApi, clientesApi } from '@/lib/api-client';

interface OrcamentoData extends Record<string, unknown> {
  cliente_id: string;
  nome_servico: string;
  descricao: string;
  quantidade_produto: string;
  margem_lucro_customizada: string;
  impostos_customizados: string;
  tipo_margem_lucro: 'markup' | 'margem_por_dentro' | '';
  condicoes_comerciais: string;
  prazo_entrega: string;
  forma_pagamento: string;
  validade_proposta: string;
  atendente: string;
  comissao_percentual: string;
  itens_produto: unknown[];
}

export default function NovoOrcamentoV2Page() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<OrcamentoData | null>(null);
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null);
  const [orcamentoStatus, setOrcamentoStatus] = useState<string | null>(null);
  const [statusAprovacao, setStatusAprovacao] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é edição baseado nos query parameters
  const editId = searchParams.get('id');
  const isEditMode = !!editId;
  const mode = isEditMode ? 'editar' : 'novo';

  // Debug: verificar parâmetros
  useEffect(() => {
    console.log('🔍 Debug - Page - Parâmetros da URL:', {
      editId,
      isEditMode,
      mode,
      searchParams: searchParams.toString()
    });
  }, [editId, isEditMode, mode, searchParams]);

  // Carregar dados do orçamento se for edição
  useEffect(() => {
    if (isEditMode && editId) {
      const loadOrcamentoData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log('🔍 Carregando dados do orçamento para edição:', editId);
          
          // Carregar dados reais do backend
          const token = localStorage.getItem('access_token');
          if (!token) {
            throw new Error('Token de autenticação não encontrado');
          }

          const orcamentoData: any = await orcamentosApi.v2.getById(editId, token);
          // Debug logs removidos para limpar terminal
          // console.log('🔍 Debug - Page - Dados carregados do backend:', orcamentoData);
          // console.log('🔍 Debug - Page - Produtos encontrados:', orcamentoData.produtos);
          // console.log('🔍 Debug - Page - Cliente encontrado:', orcamentoData.cliente);
          // console.log('🔍 Debug - Page - Nome do serviço:', orcamentoData.nome_servico);
          // console.log('🔍 Debug - Page - Título:', orcamentoData.titulo);
          // console.log('🔍 Debug - Page - Descrição:', orcamentoData.descricao);
          // console.log('🔍 Debug - Page - Quantidade produto:', orcamentoData.quantidade_produto);
          // console.log('🔍 Debug - Page - TODOS os campos do orçamento:', {
          //   id: orcamentoData.id,
          //   status: orcamentoData.status,
          //   cliente_id: orcamentoData.cliente_id,
          //   titulo: orcamentoData.titulo,
          //   nome_servico: orcamentoData.nome_servico,
          //   descricao: orcamentoData.descricao,
          //   quantidade_produto: orcamentoData.quantidade_produto,
          //   largura_produto: orcamentoData.largura_produto,
          //   altura_produto: orcamentoData.altura_produto,
          //   area_produto: orcamentoData.area_produto,
          //   unidade_medida_produto: orcamentoData.unidade_medida_produto,
          //   condicoes_comerciais: orcamentoData.condicoes_comerciais,
          //   prazo_entrega: orcamentoData.prazo_entrega,
          //   forma_pagamento: orcamentoData.forma_pagamento,
          //   validade_proposta: orcamentoData.validade_proposta,
          //   atendente: orcamentoData.atendente
          // });

          // Se os relacionamentos não vieram, tentar carregar separadamente
          if (!orcamentoData.cliente && orcamentoData.cliente_id) {
            console.log('🔍 Tentando carregar cliente separadamente...');
            try {
              // Usar a API de clientes diretamente
              const clienteData = await clientesApi.getById(orcamentoData.cliente_id, token);
              orcamentoData.cliente = clienteData;
              console.log('✅ Cliente carregado separadamente:', clienteData);
            } catch (error) {
              console.error('❌ Erro ao carregar cliente:', error);
            }
          }

          if (!orcamentoData.produtos || orcamentoData.produtos.length === 0) {
            console.log('🔍 Tentando carregar produtos separadamente...');
            try {
              // Para produtos, vamos usar os dados que já temos no orçamento principal
              // e transformar em produtos se necessário
              if (orcamentoData.nome_servico || orcamentoData.descricao) {
                orcamentoData.produtos = [{
                  id: 'produto-principal',
                  nome_servico: orcamentoData.nome_servico || 'Produto Principal',
                  nome: orcamentoData.nome_servico || 'Produto Principal',
                  descricao: orcamentoData.descricao || '',
                  quantidade: orcamentoData.quantidade_produto || 1,
                  largura: orcamentoData.largura_produto,
                  altura: orcamentoData.altura_produto,
                  area_produto: orcamentoData.area_produto,
                  unidade_medida: orcamentoData.unidade_medida_produto || 'un',
                  insumos: [],
                  maquinas: [],
                  funcoes: [],
                  servicos_manuais: [],
                  custos_indiretos: [],
                }];
                console.log('✅ Produto criado a partir dos dados principais:', orcamentoData.produtos);
              }
            } catch (error) {
              console.error('❌ Erro ao processar produtos:', error);
            }
          }

          // Transformar dados do backend para o formato do formulário
          // Debug log removido para limpar terminal
          // console.log('🔍 Debug - Page - Antes da transformação - orcamentoData:', {
          //   titulo: orcamentoData.titulo,
          //   nome_servico: orcamentoData.nome_servico,
          //   descricao: orcamentoData.descricao,
          //   quantidade_produto: orcamentoData.quantidade_produto,
          //   largura_produto: orcamentoData.largura_produto,
          //   altura_produto: orcamentoData.altura_produto,
          //   area_produto: orcamentoData.area_produto,
          //   unidade_medida_produto: orcamentoData.unidade_medida_produto
          // });
          
          console.log('🔍 Debug - Unidade de medida do backend:', {
            unidade_medida_produto: orcamentoData.unidade_medida_produto,
            produtos_length: orcamentoData.produtos?.length || 0
          });

          const parsePercentual = (value: unknown, fallback: number): string => {
            const n = Number(value);
            // Tratar 0 como "não definido" para usar fallback (evita zerar margem/impostos ao reabrir)
            if (!Number.isFinite(n) || n <= 0) return String(fallback);
            return String(n);
          };
          const parseConfig = (raw: unknown): Record<string, unknown> => {
            if (!raw) return {};
            if (typeof raw === 'object') return raw as Record<string, unknown>;
            if (typeof raw !== 'string') return {};
            let parsed: unknown = raw;
            for (let i = 0; i < 2; i++) {
              if (typeof parsed !== 'string') break;
              try {
                parsed = JSON.parse(parsed);
              } catch {
                return {};
              }
            }
            if (parsed && typeof parsed === 'object') {
              return parsed as Record<string, unknown>;
            }
            return {};
          };
          const config = parseConfig((orcamentoData as any).configuracoes);

          // Prioridade: campo explícito > configuração persistida > fallback padrão.
          const margemPercentual = parsePercentual(
            (orcamentoData as any).margem_lucro_customizada ??
              config.margem_lucro_padrao,
            30,
          );
          const impostosPercentual = parsePercentual(
            (orcamentoData as any).impostos_customizados ??
              config.impostos_padrao,
            25,
          );
          const comissaoPercentual = parsePercentual(
            (orcamentoData as any).comissao_percentual ??
              config.comissao_padrao,
            5,
          );
          const tipoMargemRaw = (
            (orcamentoData as any).tipo_margem_lucro ??
            config.tipo_margem_lucro ??
            ''
          )
            .toString()
            .trim()
            .toLowerCase();
          const tipoMargemLucro: 'markup' | 'margem_por_dentro' | '' =
            tipoMargemRaw === 'markup' || tipoMargemRaw === 'margem_por_dentro'
              ? (tipoMargemRaw as 'markup' | 'margem_por_dentro')
              : '';

          const formData: any = {
            cliente_id: orcamentoData.cliente_id || '',
            titulo: orcamentoData.titulo || orcamentoData.nome_servico || '',
            nome_servico: orcamentoData.nome_servico || '',
            descricao: orcamentoData.descricao || '',
            quantidade_produto: String(orcamentoData.quantidade_produto || 1),
            condicoes_comerciais: orcamentoData.condicoes_comerciais || '',
            prazo_entrega: orcamentoData.prazo_entrega || '10 a 15 dias úteis',
            forma_pagamento: orcamentoData.forma_pagamento || '50% entrada, restante na entrega',
            validade_proposta: orcamentoData.validade_proposta || '30 dias',
            atendente: orcamentoData.atendente || 'Equipe Comercial',
            // Campos que não existem no backend mas são necessários para o form
            margem_lucro_customizada: margemPercentual,
            impostos_customizados: impostosPercentual,
            comissao_percentual: comissaoPercentual,
            tipo_margem_lucro: tipoMargemLucro,
            // Transformar produtos se existirem
            itens_produto: orcamentoData.produtos ? orcamentoData.produtos.map((produto: any, index: number) => {
              console.log(`🔍 Debug - Produto ${index}:`, {
                nome: produto.nome || produto.nome_servico,
                largura: produto.largura,
                altura: produto.altura,
                area: produto.area_produto || produto.area,
                larguraType: typeof produto.largura,
                alturaType: typeof produto.altura,
                areaType: typeof (produto.area_produto || produto.area)
              });
              return ({
              nome_servico: produto.nome_servico || produto.nome || '',
              descricao: produto.descricao || '',
              quantidade_produto: String(produto.quantidade || 1),
              largura_produto: String(produto.largura?.toString() || orcamentoData.largura_produto || ''),
              altura_produto: String(produto.altura?.toString() || orcamentoData.altura_produto || ''),
              unidade_medida_produto: produto.unidade_medida || produto.unidade || orcamentoData.unidade_medida_produto || 'un',
              area_produto: String(produto.area_produto?.toString() || produto.area?.toString() || orcamentoData.area_produto || ''),
              materiais: produto.insumos ? produto.insumos.map((insumo: any) => ({
                insumo_id: insumo.insumo_id,
                quantidade: String(insumo.quantidade || 1),
                unidade: insumo.unidade || 'un',
                material_do_cliente: Boolean(insumo.material_do_cliente),
              })) : [{ insumo_id: '', quantidade: '1', material_do_cliente: false }],
              maquinas: produto.maquinas ? produto.maquinas.map((maquina: any) => ({
                maquina_id: maquina.maquina_id,
                horas_utilizadas: String(maquina.tempo_horas || 1)
              })) : [{ maquina_id: '', horas_utilizadas: '1' }],
              funcoes: produto.funcoes ? produto.funcoes.map((funcao: any) => ({
                funcao_id: funcao.funcao_id,
                horas_trabalhadas: String(funcao.tempo_horas || 1)
              })) : [{ funcao_id: '', horas_trabalhadas: '1' }],
              servicos: produto.servicos_manuais ? produto.servicos_manuais.map((servico: any) => ({
                servico_id: servico.servico_id,
                horas_trabalhadas: String(servico.tempo_horas || 1)
              })) : [{ servico_id: '', horas_trabalhadas: '1' }],
              });
            }) : [
              {
                nome_servico: orcamentoData.nome_servico || '',
                descricao: orcamentoData.descricao || '',
                quantidade_produto: String(orcamentoData.quantidade_produto || 1),
                largura_produto: String(orcamentoData.largura_produto || ''),
                altura_produto: String(orcamentoData.altura_produto || ''),
                unidade_medida_produto: orcamentoData.unidade_medida_produto || 'un',
                area_produto: String(orcamentoData.area_produto || ''),
                materiais: [{ insumo_id: '', quantidade: '1', material_do_cliente: false }],
                maquinas: [{ maquina_id: '', horas_utilizadas: '1' }],
                funcoes: [{ funcao_id: '', horas_trabalhadas: '1' }],
                servicos: [{ servico_id: '', horas_trabalhadas: '1' }],
              }
            ],
          };

          console.log('🔍 Debug - Page - FormData transformado:', formData);
          setInitialData(formData);
          setOrcamentoId(editId);
          setOrcamentoStatus(orcamentoData.status as any);
          setStatusAprovacao(orcamentoData.status_aprovacao ?? null);
          console.log('🔍 Debug - Page - Estados atualizados');
          
        } catch (err: unknown) {
          console.error('❌ Erro ao carregar dados do orçamento:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar orçamento');
        } finally {
          setLoading(false);
        }
      };

      loadOrcamentoData();
    }
  }, [isEditMode, editId]);
  // Mostrar loading durante carregamento dos dados
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando dados do orçamento...</span>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Erro ao carregar orçamento</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full p-4 lg:p-6">
        {/* Área do Título - isolada */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {mode === 'editar' ? 'Editar Orçamento V2' : 'Novo Orçamento V2'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {mode === 'editar' 
                  ? 'Edite as informações do orçamento V2' 
                  : 'Crie um novo orçamento para o cliente usando o sistema V2'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Área do Formulário e Preview - mesma altura */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulário principal com preview integrado */}
          <div className="flex-1">
            <OrcamentoV2Form 
              mode={mode}
              initialData={initialData || undefined}
              orcamentoId={orcamentoId || undefined}
              showPreview={true}
              orcamentoStatus={orcamentoStatus || undefined}
              statusAprovacao={statusAprovacao || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
