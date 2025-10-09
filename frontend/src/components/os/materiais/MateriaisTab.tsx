'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

interface MateriaisTabProps {
  osData: any;
  dadosTransformados: any;
}

export default function MateriaisTab({ osData, dadosTransformados }: MateriaisTabProps) {
  const [selectedServicoId, setSelectedServicoId] = useState<string | null>(null);

  // Função para calcular unidades de compra necessárias
  const calcularUnidadesCompra = (quantidadeNecessaria: number, insumo: any) => {
    const quantidadeCompra = insumo.quantidade_compra || 1;
    const unidades = Math.ceil(quantidadeNecessaria / quantidadeCompra);
    const resto = (unidades * quantidadeCompra) - quantidadeNecessaria;
    
    return {
      unidades,
      resto,
      total: unidades * insumo.quantidade_compra,
      quantidade_compra: insumo.quantidade_compra
    };
  };

  // Função para formatar exibição do material
  const formatarMaterial = (material: any, insumo: any) => {
    // Se o material já tem display formatado (do PreviewCalculoV2), usar ele
    if (material.display) {
      // Extrair quantidade e compra do display (ex: "27 M2 - 1 UNID - BOBINA")
      const parts = material.display.split(' - ');
      const quantidade = parts[0] || `${material.quantidade_necessaria || material.quantidade} ${material.unidade}`.toUpperCase();
      const compra = parts.length > 1 ? `USARÁ ${parts.slice(1).join(' - ')}` : 'USARÁ 1 UNID';
      
      return {
        quantidade: quantidade,
        compra: compra,
        custo_total: material.custo_total || 0
      };
    }
    
    // Fallback para materiais sem display formatado
    const quantidadeNecessaria = material.quantidade || 0;
    const unidadeUso = material.unidade_consumo || insumo?.unidade_uso || 'UN';
    const unidadeCompra = material.unidade_compra || insumo?.unidade_compra || 'UNID';
    const quantidadeCompra = material.quantidade_compra || insumo?.quantidade_compra || 1;
    
    // Calcular unidades de compra necessárias
    const compra = calcularUnidadesCompra(quantidadeNecessaria, { 
      ...insumo, 
      quantidade_compra: quantidadeCompra 
    });
    
    // Formato da quantidade necessária (ex: "27M2", "300M", "50UN")
    const quantidadeFormatada = `${quantidadeNecessaria}${unidadeUso.toUpperCase()}`;
    
    // Formato da unidade de compra (ex: "USARÁ 1 BOBINA", "USARÁ 1 CAIXA (25 DE 50)")
    let compraFormatada = '';
    if (compra.unidades === 1) {
      compraFormatada = `USARÁ 1 ${unidadeCompra}`;
    } else {
      compraFormatada = `USARÁ ${compra.unidades} UNID. ${unidadeCompra}`;
    }
    
    // Se há resto (sobra), mostrar
    if (compra.resto > 0) {
      compraFormatada += ` (${compra.total - compra.resto} DE ${compra.total})`;
    }
    
    return {
      quantidade: quantidadeFormatada,
      compra: compraFormatada,
      custo_total: material.custo_total || 0
    };
  };
  
  // Criar serviços baseados nos produtos reais da OS
  const servicos = useMemo(() => {
    // Tentar diferentes caminhos para encontrar os produtos
    const produtosFinais = osData?.orcamento?.produtos || 
                          osData?.produtos || 
                          osData?.itens_produto || 
                          dadosTransformados?.produtos || 
                          [];

    if (produtosFinais.length === 0) {
      // Fallback para materiais principais se não encontrar produtos
      return dadosTransformados?.materiaisPrincipais?.map((material: any, index: number) => ({
        id: `material-${index}`,
        nome: `Material ${index + 1}`,
        quantidade: 1,
        materiais: [material],
        status_geral: 'disponivel'
      })) || [];
    }

    return produtosFinais.map((produto: any, index: number) => {
      // Extrair materiais do produto (do PreviewCalculoV2)
      const materiaisProduto = produto.materiais || produto.insumos_calculados || [];
      
      // Formatar materiais
      const materiaisFormatados = materiaisProduto.map((material: any) => ({
        ...material,
        formatado: formatarMaterial(material, material.insumo || {})
      }));

      return {
        id: produto.id || `produto-${index}`,
        nome: produto.nome || produto.descricao || `Produto ${index + 1}`,
        quantidade: produto.quantidade || 1,
        materiais: materiaisFormatados,
        status_geral: materiaisFormatados.every((m: any) => 
          m.disponivel_estoque === true || 
          m.quantidade_disponivel > 0 || 
          m.percentual_disponivel >= 100
        ) ? 'disponivel' : 'parcial'
      };
    });
  }, [osData, dadosTransformados]);

  // Função para determinar status do material
  const getMaterialStatus = (material: any) => {
    // Verificar múltiplos critérios de disponibilidade
    const isDisponivel = material.disponivel_estoque === true || 
                        material.quantidade_disponivel > 0 || 
                        material.percentual_disponivel >= 100 ||
                        (!material.disponivel_estoque && !material.quantidade_disponivel && !material.percentual_disponivel);
    
    if (isDisponivel) {
      return { status: 'disponivel', label: 'Disponível', color: 'text-green-600' };
    } else {
      return { status: 'em_falta', label: 'Falta comprar', color: 'text-red-600' };
    }
  };

  // Função para consolidar materiais por insumo_id - CORRIGIDA
  const consolidarMateriais = (servicos: any[]) => {
    const consolidado = new Map();
    
    servicos.forEach(servico => {
      servico.materiais.forEach(material => {
        const key = material.insumo_id || material.nome;
        
        if (!consolidado.has(key)) {
          consolidado.set(key, {
            ...material,
            quantidade_total: 0,
            consumo_por_servico: [],
            servicos_que_usam: new Set()
          });
        }
        
        const item = consolidado.get(key);
        
        // CORREÇÃO: Somar as quantidades numéricas, não as strings
        const quantidadeNumerica = typeof material.quantidade === 'number' ? 
          material.quantidade : 
          parseFloat(String(material.quantidade)) || 0;
        
        item.quantidade_total += quantidadeNumerica;
        
        item.consumo_por_servico.push({
          servico: servico.nome,
          quantidade: quantidadeNumerica
        });
        item.servicos_que_usam.add(servico.nome);
      });
    });
    
    // Converter Set para Array e ordenar
    return Array.from(consolidado.values()).map(item => ({
      ...item,
      servicos_que_usam: Array.from(item.servicos_que_usam),
      is_consolidado: item.servicos_que_usam.size > 1,
      formatado: formatarMaterial(item, item.insumo)
    }));
  };

  // Filtrar serviços baseado na seleção
  const servicosFiltrados = selectedServicoId 
    ? servicos.filter(s => s.id === selectedServicoId)
    : servicos;

  // Consolidar materiais quando "Todos" estiver selecionado
  const materiaisConsolidados = selectedServicoId === null 
    ? consolidarMateriais(servicos)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Materiais</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie os materiais necessários para execução dos serviços
          </p>
        </div>
      </div>

      {/* Filtros por Serviço */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedServicoId === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedServicoId(null)}
          className="flex items-center space-x-2"
        >
          <span>Todos os Serviços</span>
        </Button>
        
        {servicos.map((servico) => (
          <Button
            key={servico.id}
            variant={selectedServicoId === servico.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedServicoId(servico.id)}
            className="flex items-center space-x-2"
          >
            {servico.status_geral === 'disponivel' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{servico.nome}</span>
          </Button>
        ))}
      </div>

      {/* Conteúdo Central - Lista de Materiais por Serviço */}
      <div className="space-y-6">
        {selectedServicoId === null ? (
          // Modo consolidado - Todos os Serviços
          <div className="space-y-4">
            {materiaisConsolidados.map((material) => {
              const materialStatus = getMaterialStatus(material);
              return (
                <Card key={material.insumo_id || material.nome}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {materialStatus.status === 'disponivel' ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm leading-tight">
                            {material.nome}
                          </p>
                          <div className="mt-2 space-y-1">
                            {/* Quantidade necessária */}
                            <div className="text-sm text-gray-700 font-medium">
                              {material.formatado.quantidade}
                            </div>
                            
                            {/* Unidade de compra */}
                            <div className="text-sm text-gray-600">
                              {material.formatado.compra}
                            </div>
                          </div>
                          {material.formatado.custo_total > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              R$ {typeof material.formatado.custo_total === 'number' ? material.formatado.custo_total.toFixed(2) : material.formatado.custo_total}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <span className={`text-sm font-medium ${materialStatus.color}`}>
                          {materialStatus.label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Breakdown por serviço se consolidado */}
                    {material.is_consolidado && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="space-y-1">
                          {material.consumo_por_servico.map((consumo: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-500">
                              ├─ {consumo.servico}: {consumo.quantidade} {material.unidade}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // Modo serviço específico
          servicosFiltrados.map((servico) => (
            <Card key={servico.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{servico.nome}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {servico.quantidade} unidades
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{servico.materiais.length} materiais</span>
                    {servico.status_geral === 'parcial' && (
                      <Badge variant="destructive" className="text-xs">
                        Parcial
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {servico.materiais.map((material, index) => {
                    const materialStatus = getMaterialStatus(material);
                    return (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            {materialStatus.status === 'disponivel' ? (
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm leading-tight">
                                {material.nome}
                              </p>
                              <div className="mt-2 space-y-1">
                                {/* Quantidade necessária */}
                                <div className="text-sm text-gray-700 font-medium">
                                  {material.formatado.quantidade}
                                </div>
                                
                                {/* Unidade de compra */}
                                <div className="text-sm text-gray-600">
                                  {material.formatado.compra}
                                </div>
                              </div>
                              {material.formatado.custo_total > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  R$ {typeof material.formatado.custo_total === 'number' ? material.formatado.custo_total.toFixed(2) : material.formatado.custo_total}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <span className={`text-sm font-medium ${materialStatus.color}`}>
                              {materialStatus.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}