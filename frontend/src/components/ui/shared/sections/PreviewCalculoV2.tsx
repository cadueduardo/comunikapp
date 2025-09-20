'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/contexts/UserContext';
import { ChevronDown, ChevronUp, Eye, Calculator, Clock, Package, AlertCircle } from 'lucide-react';
import { useOrcamentoData } from '../../orcamento/hooks/useOrcamentoData';
import { useCalculoWebSocket } from '@/hooks/use-calculo-websocket';

interface PreviewCalculoV2Props {
  variant?: 'orcamento' | 'produto';
  showAllProducts?: boolean;
  dadosCarregados?: boolean;
}

const PreviewCalculoV2: React.FC<PreviewCalculoV2Props> = ({
  variant = 'orcamento',
  showAllProducts = true,
  dadosCarregados = true
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showIndirectCosts, setShowIndirectCosts] = useState(false);
  
  // Tentar obter contexto do formulario (se disponivel)
  let form: any = null;
  try {
    form = useFormContext();
  } catch {
    // Formulario nao disponivel - usar dados mockados
  }

  // Hook para dados auxiliares (insumos, maquinas, etc.)
  const { insumos, maquinas, funcoes, custosIndiretos } = useOrcamentoData();
  const { user } = useUser();

  const resolvedLojaId = useMemo(() => {
    if (user?.loja?.id) return user.loja.id;
    if (user?.loja_id) return user.loja_id;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('loja_id') ?? undefined;
    }
    return undefined;
  }, [user]);

  const resolvedUsuarioId = useMemo(() => {
    if (user?.id) return user.id;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id') ?? undefined;
    }
    return undefined;
  }, [user]);
  
  // Hook para WebSocket em tempo real
  const { 
    connectionStatus,
    isConnected,
    executarCalculoOrcamento,
    resultadoOrcamento
  } = useCalculoWebSocket();

  // Dados mockados como fallback (mantendo estrutura original)
  const mockData = {
    resumo: {
      total_produtos: 3,
      total_custo_material: 5200.00,
      total_custo_maquinaria: 1015.00,
      total_custo_mao_obra: 565.00,
      total_custo_indireto: 2992.00,
      total_custo_producao: 9772.00,
      total_margem_lucro: 2931.60,
      total_impostos: 1954.40,
      preco_final: 14658.00,
      tempo_total_producao: 25.5,
      margem_lucro_percentual: 30,
      impostos_percentual: 20,
      comissao_percentual: 5,
      comissao_total: 732.90
    },
    produtos: [
      {
        id: '1',
        nome_servico: "Banner",
        descricao: "Banner promocional",
        quantidade: 100,
        dimensoes: { largura: 2, altura: 1, area_produto: 2, unidade_medida: 'm' },
        materiais: [
          { insumo_id: '1', nome: "Vinil Brilho", quantidade: 200, custo_unitario: 15.00, unidade_consumo: 'm2' },
          { insumo_id: '2', nome: "Cordao", quantidade: 600, custo_unitario: 2.50, unidade_consumo: 'm' }
        ],
        maquinas: [
          { maquina_id: '1', nome: "Plotter de Impressao", horas_utilizadas: 15, custo_por_hora: 50.00 }
        ],
        funcoes: [
          { funcao_id: '1', nome: "Operador de Plotter", horas_trabalhadas: 15, custo_por_hora: 30.00 }
        ],
        servicos: [
          { servico_id: '1', nome: "Acabamento", horas_trabalhadas: 10, custo_por_hora: 50.00 }
        ],
        custo_total_producao: 8500.00,
        preco_unitario: 125.00,
        preco_total: 12500.00,
        horas_producao: 20,
        custos_indiretos_rateados: 2300.00
      },
      {
        id: '2',
        nome_servico: "Painel",
        descricao: "Painel ACM com impressao",
        quantidade: 1,
        dimensoes: { largura: 3, altura: 2, area_produto: 6, unidade_medida: 'm' },
        materiais: [
          { insumo_id: '3', nome: "ACM", quantidade: 6, custo_unitario: 80.00, unidade_consumo: 'm2' },
          { insumo_id: '4', nome: "Adesivo", quantidade: 6, custo_unitario: 25.00, unidade_consumo: 'm2' }
        ],
        maquinas: [
          { maquina_id: '2', nome: "Router CNC", horas_utilizadas: 2, custo_por_hora: 120.00 }
        ],
        funcoes: [
          { funcao_id: '2', nome: "Operador CNC", horas_trabalhadas: 2, custo_por_hora: 35.00 }
        ],
        servicos: [
          { servico_id: '2', nome: "Montagem", horas_trabalhadas: 4, custo_por_hora: 40.00 }
        ],
        custo_total_producao: 1700.00,
        preco_unitario: 2500.00,
        preco_total: 2500.00,
        horas_producao: 4,
        custos_indiretos_rateados: 600.00
      },
      {
        id: '3',
        nome_servico: "Expositor PDV",
        descricao: "Expositor para ponto de venda",
        quantidade: 1,
        dimensoes: { largura: 1.5, altura: 0.8, area_produto: 1.2, unidade_medida: 'm' },
        materiais: [
          { insumo_id: '5', nome: "MDF 15mm", quantidade: 2, custo_unitario: 45.00, unidade_consumo: 'chapa' },
          { insumo_id: '6', nome: "Ponteiras", quantidade: 8, custo_unitario: 3.50, unidade_consumo: 'unidade' }
        ],
        maquinas: [
          { maquina_id: '3', nome: "Serra Circular", horas_utilizadas: 1, custo_por_hora: 25.00 }
        ],
        funcoes: [
          { funcao_id: '3', nome: "Marceneiro", horas_trabalhadas: 1, custo_por_hora: 45.00 }
        ],
        servicos: [
          { servico_id: '3', nome: "Acabamento", horas_trabalhadas: 0.5, custo_por_hora: 40.00 }
        ],
        custo_total_producao: 300.00,
        preco_unitario: 750.00,
        preco_total: 750.00,
        horas_producao: 1.5,
        custos_indiretos_rateados: 92.00
      }
    ],
    custosIndiretos: [
      { id: '1', nome: "Aluguel", categoria: "Infraestrutura", valor_mensal: 2000.00, ativo: true },
      { id: '2', nome: "Energia Eletrica", categoria: "Servicos", valor_mensal: 800.00, ativo: true },
      { id: '3', nome: "Agua", categoria: "Servicos", valor_mensal: 200.00, ativo: true },
      { id: '4', nome: "Internet", categoria: "Servicos", valor_mensal: 150.00, ativo: true },
      { id: '5', nome: "Seguro", categoria: "Seguros", valor_mensal: 300.00, ativo: true }
    ],
    metadata: {
      timestamp_calculo: new Date(),
      versao_motor: '2.1.3',
      tempo_execucao_ms: 245,
      estagios_executados: ['validacao', 'materiais', 'maquinas', 'funcoes', 'custos_indiretos', 'margem_lucro', 'impostos']
    }
  };

  // Toggle de expansao de itens
  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Formatar dimensoes
  const formatarDimensoes = (dimensoes: any): string => {
    if (dimensoes.unidade_medida === 'm') {
      return `${dimensoes.largura}x${dimensoes.altura}m`;
    }
    return `${dimensoes.largura}x${dimensoes.altura}${dimensoes.unidade_medida}`;
  };

  // Formatar consumo de material
  const formatarConsumoMaterial = (material: any): string => {
    return `${material.quantidade} ${material.unidade_consumo}`;
  };

  // Formatar horas
  const formatarHoras = (horas: number): string => {
    return `${horas}h`;
  };

  // Formatar valores monetarios (aceita numeros ou "Aguardando...")
  const formatarValor = (valor: unknown): string => {
    if (typeof valor === 'string') {
      return valor;
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    return '0,00';
  };

  const formatarNumero = (numero: unknown): string => {
    if (typeof numero === 'string') {
      return numero;
    }

    if (typeof numero === 'number' && Number.isFinite(numero)) {
      return numero.toLocaleString('pt-BR', {
        maximumFractionDigits: 2,
      });
    }

    return '0';
  };
  // Funcao para transformar dados do formulario para o motor V2
  const transformarDadosParaMotor = () => {
    if (!form) return null;

    try {
      const formData = form.getValues();
      const itensFormulario = formData.itens_produto || [];
      
      if (itensFormulario.length === 0) return null;

      // Transformar cada produto do formulario seguindo a interface DTOCalculo
      const produtos = itensFormulario.map((item: any, index: number) => ({
        id: `produto_${index}`,
        nome: item.nome_servico || `Produto ${index + 1}`,
        nome_servico: item.nome_servico || `Produto ${index + 1}`,
        quantidade: Number(item.quantidade_produto?.replace(',', '.')) || 1,
        insumos: (item.materiais || [])
          .filter((material: any) => {
            if (!material.insumo_id || !material.quantidade) return false;
            const insumoData = insumos.find(i => i.id === material.insumo_id);
            if (!insumoData) {
              console.warn(` Insumo ${material.insumo_id} nao encontrado para WebSocket, ignorando`);
              return false;
            }
            return true;
          })
          .map((material: any) => {
            const insumoData = insumos.find(i => i.id === material.insumo_id)!;
            return {
              id: material.insumo_id,
              nome: insumoData.nome,
              unidade: insumoData.unidade_uso || 'un',
              preco_unitario: Number(insumoData.custo_unitario) || 0,
              quantidade: Number(material.quantidade?.replace(',', '.')) || 0,
              categoria: 'Material',
              fornecedor: 'Fornecedor Padrao',
              estoque_disponivel: 100,
            };
          }),
        maquinas: (item.maquinas || [])
          .filter((maquina: any) => {
            if (!maquina.maquina_id || !maquina.horas_utilizadas) return false;
            const maquinaData = maquinas.find(m => m.id === maquina.maquina_id);
            if (!maquinaData) {
              console.warn(` Maquina ${maquina.maquina_id} nao encontrada para WebSocket, ignorando`);
              return false;
            }
            return true;
          })
          .map((maquina: any) => {
            const maquinaData = maquinas.find(m => m.id === maquina.maquina_id)!;
            return {
              id: maquina.maquina_id,
              nome: maquinaData.nome,
              tipo: maquinaData.tipo || 'Equipamento',
              custo_hora: Number(maquinaData.custo_hora) || 0,
              tempo_setup: Number(maquina.horas_utilizadas?.replace(',', '.')) || 1,
              eficiencia: 100,
              disponivel: true,
            };
          }),
        funcoes: (item.funcoes || [])
          .filter((funcao: any) => {
            if (!funcao.funcao_id || !funcao.horas_trabalhadas) return false;
            const funcaoData = funcoes.find(f => f.id === funcao.funcao_id);
            if (!funcaoData) {
              console.warn(` Funcao ${funcao.funcao_id} nao encontrada para WebSocket, ignorando`);
              return false;
            }
            return true;
          })
          .map((funcao: any) => {
            const funcaoData = funcoes.find(f => f.id === funcao.funcao_id)!;
            return {
              id: funcao.funcao_id,
              nome: funcaoData.nome,
              categoria: 'Operacional',
              custo_hora: Number(funcaoData.custo_hora) || 0,
              tempo_estimado: Number(funcao.horas_trabalhadas?.replace(',', '.')) || 1,
              nivel_experiencia: 'Intermediario',
              disponivel: true,
            };
          }),
        servicos_manuais: (item.servicos || []).map((servico: any) => ({
          id: servico.servico_id,
          nome: `Servico ${servico.servico_id}`,
          horas: Number(servico.horas_trabalhadas?.replace(',', '.')) || 1,
          custo_por_hora: 50, // TODO: Obter do cadastro de servicos
        })),
        custos_indiretos: custosIndiretos.map((custo: any) => ({
          id: custo.id,
          nome: custo.nome || 'Custo Indireto',
          tipo: 'rateio',
          percentual: 15, // Rateio padrao
          valor_fixo: Number(custo.valor_mensal) || 0,
        })),
        metadata: {
          largura: Number(item.largura_produto?.replace(',', '.')) || 0,
          altura: Number(item.altura_produto?.replace(',', '.')) || 0,
          area_produto: Number(item.area_produto?.replace(',', '.')) || 0,
          unidade_medida: item.unidade_medida_produto || 'm',
        },
      }));

      // Formato completo para DTOCalculo
      const dtoCalculo = {
        lojaId: resolvedLojaId ?? 'loja_preview',
        produtos,
        configuracoes: {
          margem_lucro_padrao: (Number(formData.margem_lucro_customizada?.replace(',', '.')) || 30) / 100,
          impostos_padrao: (Number(formData.impostos_customizados?.replace(',', '.')) || 18) / 100,
          custos_indiretos_padrao: 0.15,
          desconto_padrao: 0,
          prazo_entrega_padrao: 10,
          horas_produtivas_mensais: 160,
          unidade_monetaria: 'BRL',
          timezone: 'America/Sao_Paulo',
          modo_calculo: 'preview' as const,
          aplicar_regras_negocio: true,
          validar_estoque: false, // Para preview nao validar estoque
        },
        metadata: {
          timestamp_criacao: new Date(),
          versao_motor: '2.0.0',
          modo_calculo: 'preview' as const,
          origem: 'preview_formulario',\r\n          loja_id: resolvedLojaId ?? null,\r\n          usuario_id: resolvedUsuarioId ?? null,
        }
      };

      console.log(' Dados transformados para Motor V2:', dtoCalculo);
      return dtoCalculo;
      
    } catch (error) {
      console.error('Erro ao transformar dados do formulario:', error);
      return null;
    }
  };

  // Executar calculo via WebSocket quando dados do formulario mudarem
  useEffect(() => {
    if (form && dadosCarregados && isConnected) {
      const subscription = form.watch(() => {
        // Debounce para evitar muitas chamadas
        const timeoutId = setTimeout(() => {
          const dadosMotor = transformarDadosParaMotor();
          if (dadosMotor && dadosMotor.produtos.length > 0) {
            // Verificar se pelo menos um produto tem insumos, maquinas ou funcoes
            const temDadosSuficientes = dadosMotor.produtos.some(produto => 
              produto.insumos.length > 0 || produto.maquinas.length > 0 || produto.funcoes.length > 0
            );
            
            if (temDadosSuficientes) {
              console.log(' Enviando calculo via WebSocket:', dadosMotor);
              executarCalculoOrcamento(dadosMotor);
            } else {
              console.log(' Dados insuficientes para calculo, aguardando mais inputs...');
            }
          }
        }, 500);
        
        return () => clearTimeout(timeoutId);
      });

      // Executar calculo inicial (so se tiver dados suficientes)
      const dadosMotor = transformarDadosParaMotor();
      if (dadosMotor && dadosMotor.produtos.length > 0) {
        // Verificar se pelo menos um produto tem insumos, maquinas ou funcoes
        const temDadosSuficientes = dadosMotor.produtos.some(produto => 
          produto.insumos.length > 0 || produto.maquinas.length > 0 || produto.funcoes.length > 0
        );
        
        if (temDadosSuficientes) {
          console.log(' Calculo inicial via WebSocket:', dadosMotor);
          executarCalculoOrcamento(dadosMotor);
        } else {
          console.log(' Dados insuficientes para calculo, aguardando mais inputs...');
        }
      }

      return () => subscription?.unsubscribe?.();
    }
  }, [form, dadosCarregados, isConnected, insumos, maquinas, funcoes, executarCalculoOrcamento]);

  // Funcao para processar dados reais e converter para formato do preview
  const processarDadosReais = () => {
    // Usar resultado do WebSocket se disponivel
    if (resultadoOrcamento && resultadoOrcamento.resultado) {
      console.log(' Usando resultado do Motor V2:', resultadoOrcamento);
      
      try {
        // Converter resultado do motor V2 para formato do preview
        const resultadoMotor = resultadoOrcamento.resultado;
        
        return {
          produtos: resultadoMotor.produtos.map((produto: any) => ({
            id: produto.id,
            nome: produto.nome,
            quantidade: produto.quantidade,
            dimensoes: produto.metadata || {
              largura: 0,
              altura: 0,
              unidade_medida: 'm'
            },
            insumos: produto.insumos.map((insumo: any) => ({
              insumo_id: insumo.id,
              nome: insumo.nome,
              quantidade: insumo.quantidade,
              custo_unitario: insumo.preco_unitario,
              unidade_consumo: insumo.unidade,
              custo_total: insumo.quantidade * insumo.preco_unitario
            })),
            maquinas: produto.maquinas.map((maquina: any) => ({
              maquina_id: maquina.id,
              nome: maquina.nome,
              horas_utilizadas: maquina.tempo_setup,
              custo_por_hora: maquina.custo_hora,
              custo_total: maquina.tempo_setup * maquina.custo_hora
            })),
            funcoes: produto.funcoes.map((funcao: any) => ({
              funcao_id: funcao.id,
              nome: funcao.nome,
              horas_trabalhadas: funcao.tempo_estimado,
              custo_por_hora: funcao.custo_hora,
              custo_total: funcao.tempo_estimado * funcao.custo_hora
            })),
            servicos: produto.servicos_manuais.map((servico: any) => ({
              servico_id: servico.id,
              nome: servico.nome,
              horas_trabalhadas: servico.horas,
              custo_por_hora: servico.custo_por_hora,
              custo_total: servico.horas * servico.custo_por_hora
            })),
            custos_indiretos_rateados: produto.custos_indiretos.reduce((acc: number, custo: any) => {
              return acc + (custo.valor_fixo || 0);
            }, 0),
            custo_total_producao: resultadoMotor.custo_total_producao || 0,
            preco_unitario: resultadoMotor.preco_unitario || 0,
            preco_total: resultadoMotor.preco_total || 0,
            horas_producao: produto.tempo_total_producao || 0,
          })),
          recursos_compartilhados: resultadoMotor.recursos_compartilhados || {},
          contexto_comercial: {
            margem_lucro: resultadoMotor.margem_lucro_aplicada || 0,
            impostos: resultadoMotor.impostos_aplicados || 0,
            desconto: resultadoMotor.desconto_aplicado || 0
          },
          metadata: {
            timestamp_calculo: new Date(),
            versao_motor: resultadoOrcamento.versao_motor || '2.0.0',
            tempo_execucao_ms: resultadoOrcamento.tempo_execucao_ms || 0,
            estagios_executados: ['validacao', 'calculo', 'consolidacao']
          }
        };
      } catch (error) {
        console.error(' Erro ao processar resultado do motor V2:', error);
        return mockData;
      }
    }
    
    if (!form) {
      console.log(' Debug Preview V2 - Sem formulario, usando mockData');
      return mockData;
    }

    try {
      const formData = form.getValues();
      const itensFormulario = formData.itens_produto || [];

      console.log(' Debug Preview V2 - Dados do formulario:', {
        formData,
        itensFormulario,
        insumos: insumos.length,
        maquinas: maquinas.length,
        funcoes: funcoes.length
      });

      if (itensFormulario.length === 0) {
        console.log(' Debug Preview V2 - Nenhum item no formulario, usando mockData');
        return mockData;
      }

      // Converter dados do formulario para formato do preview com estado "Aguardando..."
      const produtos = itensFormulario.map((item: any, index: number) => {
        // Verificar se campos basicos estao preenchidos
        const temNome = item.nome_servico && item.nome_servico.trim() !== '';
        const temQuantidade = item.quantidade_produto && Number(item.quantidade_produto.replace(',', '.')) > 0;
        
        // Processar insumos apenas se estiverem selecionados, com quantidade E existirem no banco
        const insumosDoProduto = (item.materiais || [])
          .filter((material: any) => {
            if (!material.insumo_id || !material.quantidade) return false;
            const insumoData = insumos.find(i => i.id === material.insumo_id);
            if (!insumoData) {
              console.warn(` Insumo ${material.insumo_id} nao encontrado na lista, ignorando`);
              return false;
            }
            return true;
          })
          .map((material: any) => {
            const insumoData = insumos.find(i => i.id === material.insumo_id)!; // ! porque ja validamos no filter
            const quantidade = Number(material.quantidade?.replace(',', '.')) || 0;
            const custoUnitario = Number(insumoData.custo_unitario) || 0;
            
            return {
              insumo_id: material.insumo_id,
              nome: insumoData.nome,
              quantidade: quantidade,
              custo_unitario: custoUnitario,
              unidade_consumo: insumoData.unidade_uso || 'un',
              custo_total: quantidade * custoUnitario
            };
          });

        // Processar maquinas apenas se estiverem selecionadas, com horas E existirem no banco
        const maquinasDoProduto = (item.maquinas || [])
          .filter((maquina: any) => {
            if (!maquina.maquina_id || !maquina.horas_utilizadas) return false;
            const maquinaData = maquinas.find(m => m.id === maquina.maquina_id);
            if (!maquinaData) {
              console.warn(` Maquina ${maquina.maquina_id} nao encontrada na lista, ignorando`);
              return false;
            }
            return true;
          })
          .map((maquina: any) => {
            const maquinaData = maquinas.find(m => m.id === maquina.maquina_id)!;
            const horasUtilizadas = Number(maquina.horas_utilizadas?.replace(',', '.')) || 0;
            const custoPorHora = Number(maquinaData.custo_hora) || 0;
            
            return {
              maquina_id: maquina.maquina_id,
              nome: maquinaData.nome,
              horas_utilizadas: horasUtilizadas,
              custo_por_hora: custoPorHora,
              custo_total: horasUtilizadas * custoPorHora
            };
          });

        // Processar funcoes apenas se estiverem selecionadas, com horas E existirem no banco
        const funcoesDoProduto = (item.funcoes || [])
          .filter((funcao: any) => {
            if (!funcao.funcao_id || !funcao.horas_trabalhadas) return false;
            const funcaoData = funcoes.find(f => f.id === funcao.funcao_id);
            if (!funcaoData) {
              console.warn(` Funcao ${funcao.funcao_id} nao encontrada na lista, ignorando`);
              return false;
            }
            return true;
          })
          .map((funcao: any) => {
            const funcaoData = funcoes.find(f => f.id === funcao.funcao_id)!;
            const horasTrabalhadas = Number(funcao.horas_trabalhadas?.replace(',', '.')) || 0;
            const custoPorHora = Number(funcaoData.custo_hora) || 0;
            
            return {
              funcao_id: funcao.funcao_id,
              nome: funcaoData.nome,
              horas_trabalhadas: horasTrabalhadas,
              custo_por_hora: custoPorHora,
              custo_total: horasTrabalhadas * custoPorHora
            };
          });

        // Processar servicos apenas se estiverem selecionados e com horas
        const servicosDoProduto = (item.servicos || [])
          .filter((servico: any) => servico.servico_id && servico.horas_trabalhadas)
          .map((servico: any) => {
            const horasTrabalhadas = Number(servico.horas_trabalhadas?.replace(',', '.')) || 0;
            
            return {
              servico_id: servico.servico_id,
              nome: 'Servico Manual',
              horas_trabalhadas: horasTrabalhadas,
              custo_por_hora: 50, // TODO: Obter do cadastro
              custo_total: horasTrabalhadas * 50
            };
          });

        // Calcular custos do produto (so se tiver dados)
        const custoMateriais = insumosDoProduto.reduce((acc, mat) => acc + mat.custo_total, 0);
        const custoMaquinas = maquinasDoProduto.reduce((acc, maq) => acc + maq.custo_total, 0);
        const custoFuncoes = funcoesDoProduto.reduce((acc, func) => acc + func.custo_total, 0);
        const custoServicos = servicosDoProduto.reduce((acc, serv) => acc + serv.custo_total, 0);
        
        const custoTotalProducao = custoMateriais + custoMaquinas + custoFuncoes + custoServicos;
        const horasProducao = maquinasDoProduto.reduce((acc, maq) => acc + maq.horas_utilizadas, 0) +
                             funcoesDoProduto.reduce((acc, func) => acc + func.horas_trabalhadas, 0) +
                             servicosDoProduto.reduce((acc, serv) => acc + serv.horas_trabalhadas, 0);
        
        const quantidade = temQuantidade ? Number(item.quantidade_produto.replace(',', '.')) : 1;
        
        // Aplicar "Aguardando..." para campos nao preenchidos
        const custosIndiretos = custoTotalProducao > 0 ? custoTotalProducao * 0.15 : 'Aguardando...';
        const precoUnitario = custoTotalProducao > 0 ? (custoTotalProducao + (typeof custosIndiretos === 'number' ? custosIndiretos : 0)) * 1.3 * 1.18 : 'Aguardando...';
        const precoTotal = (typeof precoUnitario === 'number') ? precoUnitario * quantidade : 'Aguardando...';

        return {
          id: `${index + 1}`,
          nome_servico: temNome ? item.nome_servico : 'Aguardando...',
          descricao: item.descricao || 'Aguardando descricao...',
          quantidade: temQuantidade ? quantidade : 'Aguardando...',
          dimensoes: {
            largura: (item.largura_produto && Number(item.largura_produto.replace(',', '.'))) || 'Aguardando...',
            altura: (item.altura_produto && Number(item.altura_produto.replace(',', '.'))) || 'Aguardando...',
            area_produto: (item.area_produto && Number(item.area_produto.replace(',', '.'))) || 'Aguardando...',
            unidade_medida: item.unidade_medida_produto || 'Aguardando...',
          },
          materiais: insumosDoProduto,
          maquinas: maquinasDoProduto,
          funcoes: funcoesDoProduto,
          servicos: servicosDoProduto,
          custo_total_producao: custoTotalProducao > 0 ? custoTotalProducao : 'Aguardando...',
          preco_unitario: precoUnitario,
          preco_total: precoTotal,
          horas_producao: horasProducao > 0 ? horasProducao : 'Aguardando...',
          custos_indiretos_rateados: custosIndiretos,
        };
      });

      // Calcular resumo geral com estado "Aguardando..."
      const totalCustoMaterial = produtos.reduce((acc, p) => {
        const custoMateriais = p.materiais.reduce((acc2: number, m: any) => acc2 + m.custo_total, 0);
        return acc + custoMateriais;
      }, 0);
      
      const totalCustoMaquinaria = produtos.reduce((acc, p) => {
        const custoMaquinas = p.maquinas.reduce((acc2: number, m: any) => acc2 + m.custo_total, 0);
        return acc + custoMaquinas;
      }, 0);
      
      const totalCustoMaoObra = produtos.reduce((acc, p) => {
        const custoFuncoes = p.funcoes.reduce((acc2: number, f: any) => acc2 + f.custo_total, 0);
        const custoServicos = p.servicos.reduce((acc2: number, s: any) => acc2 + s.custo_total, 0);
        return acc + custoFuncoes + custoServicos;
      }, 0);
      
      const totalCustoIndireto = produtos.reduce((acc, p) => {
        if (typeof p.custos_indiretos_rateados === 'number') {
          return acc + p.custos_indiretos_rateados;
        }
        return acc;
      }, 0);
      
      const totalCustoProducao = totalCustoMaterial + totalCustoMaquinaria + totalCustoMaoObra + totalCustoIndireto;
      
      const margemLucroPercentual = Number(formData.margem_lucro_customizada?.replace(',', '.')) || 30;
      const impostosPercentual = Number(formData.impostos_customizados?.replace(',', '.')) || 18;
      const comissaoPercentual = Number(formData.comissao_percentual?.replace(',', '.')) || 5;
      
      // Aplicar "Aguardando..." se nao houver custos calculados
      const totalMargemLucro = totalCustoProducao > 0 ? totalCustoProducao * (margemLucroPercentual / 100) : 'Aguardando...';
      const subtotalComLucro = (totalCustoProducao > 0 && typeof totalMargemLucro === 'number') ? totalCustoProducao + totalMargemLucro : 'Aguardando...';
      const totalImpostos = (typeof subtotalComLucro === 'number') ? subtotalComLucro * (impostosPercentual / 100) : 'Aguardando...';
      const precoFinal = (typeof subtotalComLucro === 'number' && typeof totalImpostos === 'number') ? subtotalComLucro + totalImpostos : 'Aguardando...';
      const comissaoTotal = (typeof precoFinal === 'number') ? precoFinal * (comissaoPercentual / 100) : 'Aguardando...';
      
      const tempoTotalProducao = produtos.reduce((acc, p) => {
        if (typeof p.horas_producao === 'number') {
          return acc + p.horas_producao;
        }
        return acc;
      }, 0);

      return {
        resumo: {
          total_produtos: produtos.length,
          total_custo_material: totalCustoMaterial > 0 ? totalCustoMaterial : 'Aguardando...',
          total_custo_maquinaria: totalCustoMaquinaria > 0 ? totalCustoMaquinaria : 'Aguardando...',
          total_custo_mao_obra: totalCustoMaoObra > 0 ? totalCustoMaoObra : 'Aguardando...',
          total_custo_indireto: totalCustoIndireto > 0 ? totalCustoIndireto : 'Aguardando...',
          total_custo_producao: totalCustoProducao > 0 ? totalCustoProducao : 'Aguardando...',
          total_margem_lucro: totalMargemLucro,
          total_impostos: totalImpostos,
          preco_final: precoFinal,
          tempo_total_producao: tempoTotalProducao > 0 ? tempoTotalProducao : 'Aguardando...',
          margem_lucro_percentual: margemLucroPercentual,
          impostos_percentual: impostosPercentual,
          comissao_percentual: comissaoPercentual,
          comissao_total: comissaoTotal,
        },
        produtos: produtos,
        custosIndiretos: custosIndiretos.map((custo: any) => ({
          id: custo.id,
          nome: custo.nome,
          categoria: custo.categoria || 'Geral',
          valor_mensal: Number(custo.valor_mensal) || 0,
          ativo: true,
        })),
        metadata: {
          timestamp_calculo: new Date(),
          versao_motor: '2.1.3',
          tempo_execucao_ms: 0,
          estagios_executados: ['validacao', 'materiais', 'maquinas', 'funcoes', 'custos_indiretos', 'margem_lucro', 'impostos'],
        },
      };
    } catch (error) {
      console.error('Erro ao processar dados reais:', error);
      return mockData;
    }
  };

  // Usar dados reais se disponiveis, senao usar mockados
  const data = (() => {
    console.log(' Debug Preview V2 - Estados:', {
      form: !!form,
      dadosCarregados,
      isConnected,
      connectionStatus,
      resultadoOrcamento: !!resultadoOrcamento,
      resultadoOrcamento_detalhes: resultadoOrcamento
    });

    if (form && dadosCarregados) {
      const dadosReais = processarDadosReais();
      console.log(' Debug Preview V2 - Dados processados:', dadosReais);
      return dadosReais;
    }
    
    console.log(' Debug Preview V2 - Usando mockData porque:', {
      form: !!form,
      dadosCarregados,
      motivo: !form ? 'sem formulario' : !dadosCarregados ? 'dados nao carregados' : 'desconhecido'
    });
    
    // TEMPORARIO: Vamos forcar usar dados reais mesmo sem form completo
    if (form) {
      console.log(' FORCANDO processamento de dados reais...');
      const dadosReais = processarDadosReais();
      console.log(' Dados reais processados:', dadosReais);
      return dadosReais;
    }
    
    return mockData;
  })();

  // Calcular total dos custos indiretos
  const totalCustosIndiretos = data.custosIndiretos.reduce((total: number, custo: any) => {
    return total + custo.valor_mensal;
  }, 0);

  // Se nao ha dados, mostrar estado vazio
  if (!data) {
    return (
      <div className="sticky top-6 bg-white rounded-lg shadow-sm border max-h-[calc(100vh-3rem)] flex flex-col">
        {/* Header fixo */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preview do Calculo</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Desconectado
          </Badge>
        </div>
        
        {/* Conteudo com scroll */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhum calculo disponivel</p>
            <p className="text-sm">Adicione produtos para ver o preview</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-6 bg-white rounded-lg shadow-sm border max-h-[calc(100vh-3rem)] flex flex-col">
      {/* Header fixo */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Preview do Calculo</h2>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs ${isConnected ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}
        >
          {connectionStatus === 'connecting' ? 'Conectando...' : 
           isConnected ? 'Tempo real ativo' : 
           connectionStatus === 'error' ? 'Erro de conexao' : 'Desconectado'}
        </Badge>
      </div>

      {/* Conteudo com scroll */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <div className="space-y-4">
        {/* Resumo do Orcamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resumo do Orcamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Valor Total (Venda)</span>
              <span className="text-lg font-bold text-green-600">
                R$ {formatarValor(data.resumo.preco_final)}
              </span>
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Custo de Producao</span>
                <span>R$ {formatarValor(data.resumo.total_custo_producao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Margem de Lucro ({data.resumo.margem_lucro_percentual}%)</span>
                <span className="text-green-600">+R$ {formatarValor(data.resumo.total_margem_lucro)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impostos ({data.resumo.impostos_percentual}%)</span>
                <span className="text-red-600">+R$ {formatarValor(data.resumo.total_impostos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comissao ({data.resumo.comissao_percentual}%)</span>
                <span className="text-orange-600">+R$ {formatarValor(data.resumo.comissao_total)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-gray-600">Horas Totais</span>
              </div>
              <span>{formatarNumero(data.resumo.tempo_total_producao)}h</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Itens no Orcamento</span>
              <span>{data.resumo.total_produtos}</span>
            </div>
          </CardContent>
        </Card>

        {/* Detalhamento por Produto */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Produtos no Orcamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.produtos.map((produto) => (
              <div key={produto.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{produto.nome_servico}</h4>
                    <p className="text-xs text-gray-500">
                      {formatarNumero(produto.quantidade)}x - {formatarDimensoes(produto.dimensoes)} - {produto.descricao}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      R$ {formatarValor(produto.preco_total)}
                    </div>
                    {produto.quantidade > 1 && (
                      <div className="text-xs text-gray-500">
                        R$ {formatarValor(produto.preco_unitario)}/un
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custo de Producao</span>
                    <span>R$ {formatarValor(produto.custo_total_producao)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horas de Producao</span>
                    <span>{formatarNumero(produto.horas_producao)}h</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 h-7 text-xs"
                  onClick={() => toggleItemExpansion(produto.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver Detalhes de Custo
                  {expandedItems[produto.id] ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>

                {expandedItems[produto.id] && (
                  <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                    {/* Materiais */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Materiais</h5>
                      <div className="space-y-1">
                        {produto.materiais.map((material, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <div className="font-medium">{material.nome}</div>
                              <div className="text-gray-500">
                                {formatarConsumoMaterial(material)} - R$ {formatarValor(material.custo_unitario)}
                              </div>
                            </div>
                            <div className="text-right">
                              R$ {formatarValor(material.quantidade * material.custo_unitario)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Maquinas */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Maquinas</h5>
                      <div className="space-y-1">
                        {produto.maquinas.map((maquina, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <div className="font-medium">{maquina.nome}</div>
                              <div className="text-gray-500">
                                {formatarHoras(maquina.horas_utilizadas)} - R$ {formatarValor(maquina.custo_por_hora)}/h
                              </div>
                            </div>
                            <div className="text-right">
                              R$ {formatarValor(maquina.horas_utilizadas * maquina.custo_por_hora)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Funcoes */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Mao de Obra</h5>
                      <div className="space-y-1">
                        {produto.funcoes.map((funcao, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <div className="font-medium">{funcao.nome}</div>
                              <div className="text-gray-500">
                                {formatarHoras(funcao.horas_trabalhadas)} - R$ {formatarValor(funcao.custo_por_hora)}/h
                              </div>
                            </div>
                            <div className="text-right">
                              R$ {formatarValor(funcao.horas_trabalhadas * funcao.custo_por_hora)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Servicos Manuais */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Servicos Manuais</h5>
                      <div className="space-y-1">
                        {produto.servicos.map((servico, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <div>
                              <div className="font-medium">{servico.nome}</div>
                              <div className="text-gray-500">
                                {formatarHoras(servico.horas_trabalhadas)} - R$ {formatarValor(servico.custo_por_hora)}/h
                              </div>
                            </div>
                            <div className="text-right">
                              R$ {formatarValor(servico.horas_trabalhadas * servico.custo_por_hora)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custos Indiretos Rateados */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Custos Indiretos (Rateados)</h5>
                      <div className="flex justify-between text-xs">
                        <span>Total rateado para este item</span>
                        <span>R$ {formatarValor(produto.custos_indiretos_rateados)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Custos Indiretos Globais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Custos Indiretos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Total dos Custos Indiretos</span>
              <span className="font-semibold">
                R$ {formatarValor(totalCustosIndiretos)}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => setShowIndirectCosts(!showIndirectCosts)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver Detalhes
              {showIndirectCosts ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>

            {showIndirectCosts && (
              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                {data.custosIndiretos.map((custo) => (
                  <div key={custo.id} className="flex justify-between text-xs">
                    <span>{custo.nome}</span>
                    <span>R$ {formatarValor(custo.valor_mensal)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informacoes de Sistema */}
        <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded">
          <div>Ultima atualizacao: {data.metadata.timestamp_calculo.toLocaleTimeString('pt-BR')}</div>
          <div className="mt-1">Versao do calculo: {data.metadata.versao_motor}</div>
          <div className="mt-1">Tempo de execucao: {data.metadata.tempo_execucao_ms}ms</div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCalculoV2;







