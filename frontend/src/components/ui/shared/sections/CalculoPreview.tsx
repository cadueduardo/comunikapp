'use client';

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Insumo, Maquina, Funcao } from '../types/common.types';
import { calcularCustoPorUnidadeUso } from '../utils/calculo.utils';

interface CalculoPreviewProps {
  variant?: 'orcamento' | 'produto';
  itemIndex: number;
  insumos: Insumo[];
  maquinas: Maquina[];
  funcoes: Funcao[];
  margemLucroCustomizada?: string;
  impostosCustomizados?: string;
  customFields?: React.ReactNode;
  customActions?: React.ReactNode;
}

export function CalculoPreview({ 
  itemIndex,
  insumos,
  maquinas,
  funcoes,
  margemLucroCustomizada,
  impostosCustomizados,
  customFields,
  customActions
}: CalculoPreviewProps) {
  const form = useFormContext();
  
  // Verificar se o form está disponível
  if (!form) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular custos dos materiais
  const calcularCustosMateriais = () => {
    const materiais = form.watch(`itens_produto.${itemIndex}.materiais`) || [];
    let custoTotal = 0;
    const itensDetalhados: Array<{
      insumo_id: string;
      nome_insumo: string;
      quantidade: number;
      custo_unitario: number;
      custo_total: number;
      unidade_medida: string;
    }> = [];

    materiais.forEach((material: { insumo_id: string; quantidade: string }) => {
      if (material.insumo_id && material.quantidade) {
        const insumo = insumos.find(i => i.id === material.insumo_id);
        if (insumo) {
          const quantidade = Number(String(material.quantidade).replace(',', '.')) || 0;
          const custoPorUnidade = calcularCustoPorUnidadeUso(insumo);
          const custoTotalItem = custoPorUnidade * quantidade;
          
          custoTotal += custoTotalItem;
          
          itensDetalhados.push({
            insumo_id: insumo.id,
            nome_insumo: insumo.nome,
            quantidade,
            custo_unitario: custoPorUnidade,
            custo_total: custoTotalItem,
            unidade_medida: insumo.unidade_uso,
          });
        }
      }
    });

    return { custoTotal, itensDetalhados };
  };

  // Calcular custos das máquinas
  const calcularCustosMaquinas = () => {
    const maquinasUtilizadas = form.watch(`itens_produto.${itemIndex}.maquinas`) || [];
    let custoTotal = 0;
    const maquinasDetalhadas: Array<{
      maquina_id: string;
      nome_maquina: string;
      tipo_maquina: string;
      horas_utilizadas: number;
      custo_por_hora: number;
      custo_total: number;
    }> = [];

    maquinasUtilizadas.forEach((maquina: { maquina_id: string; horas_utilizadas: string }) => {
      if (maquina.maquina_id && maquina.horas_utilizadas) {
        const maquinaData = maquinas.find(m => m.id === maquina.maquina_id);
        if (maquinaData) {
          const horas = Number(String(maquina.horas_utilizadas).replace(',', '.')) || 0;
          const custoTotalItem = maquinaData.custo_hora * horas;
          
          custoTotal += custoTotalItem;
          
          maquinasDetalhadas.push({
            maquina_id: maquinaData.id,
            nome_maquina: maquinaData.nome,
            tipo_maquina: maquinaData.tipo,
            horas_utilizadas: horas,
            custo_por_hora: maquinaData.custo_hora,
            custo_total: custoTotalItem,
          });
        }
      }
    });

    return { custoTotal, maquinasDetalhadas };
  };

  // Calcular custos das funções
  const calcularCustosFuncoes = () => {
    const funcoesUtilizadas = form.watch(`itens_produto.${itemIndex}.funcoes`) || [];
    let custoTotal = 0;
    const funcoesDetalhadas: Array<{
      funcao_id: string;
      nome_funcao: string;
      horas_trabalhadas: number;
      custo_por_hora: number;
      custo_total: number;
      maquina_vinculada?: string;
    }> = [];

    funcoesUtilizadas.forEach((funcao: { funcao_id: string; horas_trabalhadas: string }) => {
      if (funcao.funcao_id && funcao.horas_trabalhadas) {
        const funcaoData = funcoes.find(f => f.id === funcao.funcao_id);
        if (funcaoData) {
          const horas = Number(String(funcao.horas_trabalhadas).replace(',', '.')) || 0;
          const custoTotalItem = funcaoData.custo_hora * horas;
          
          custoTotal += custoTotalItem;
          
          funcoesDetalhadas.push({
            funcao_id: funcaoData.id,
            nome_funcao: funcaoData.nome,
            horas_trabalhadas: horas,
            custo_por_hora: funcaoData.custo_hora,
            custo_total: custoTotalItem,
            maquina_vinculada: funcaoData.maquina?.nome,
          });
        }
      }
    });

    return { custoTotal, funcoesDetalhadas };
  };

  // Calcular custos totais
  const calcularCustosTotais = () => {
    const { custoTotal: custoMaterial } = calcularCustosMateriais();
    const { custoTotal: custoMaquinaria } = calcularCustosMaquinas();
    const { custoTotal: custoMaoObra } = calcularCustosFuncoes();
    
    const custoTotalProducao = custoMaterial + custoMaquinaria + custoMaoObra;
    
    // Margem de lucro (padrão 30% ou customizada)
    const margemLucroPercentual = margemLucroCustomizada ? 
      Number(margemLucroCustomizada.replace(',', '.')) : 30;
    const margemLucroValor = custoTotalProducao * (margemLucroPercentual / 100);
    const subtotalComLucro = custoTotalProducao + margemLucroValor;
    
    // Impostos (padrão 18% ou customizada)
    const impostosPercentual = impostosCustomizados ? 
      Number(impostosCustomizados.replace(',', '.')) : 18;
    const impostosValor = subtotalComLucro * (impostosPercentual / 100);
    const precoFinal = subtotalComLucro + impostosValor;
    
    return {
      custo_material: custoMaterial,
      custo_maquinaria: custoMaquinaria,
      custo_mao_obra: custoMaoObra,
      custo_total_producao: custoTotalProducao,
      margem_lucro_percentual: margemLucroPercentual,
      margem_lucro_valor: margemLucroValor,
      subtotal_com_lucro: subtotalComLucro,
      impostos_percentual: impostosPercentual,
      impostos_valor: impostosValor,
      preco_final: precoFinal,
    };
  };

  const { custoTotal: custoMaterial, itensDetalhados } = calcularCustosMateriais();
  const { custoTotal: custoMaquinaria, maquinasDetalhadas } = calcularCustosMaquinas();
  const { custoTotal: custoMaoObra, funcoesDetalhadas } = calcularCustosFuncoes();
  const custosTotais = calcularCustosTotais();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview do Cálculo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Custos de Materiais */}
          {custoMaterial > 0 && (
            <div>
              <h4 className="font-medium mb-2">Materiais</h4>
              <div className="space-y-2">
                {itensDetalhados.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.nome_insumo} ({item.quantidade} {item.unidade_medida})</span>
                    <span>{formatCurrency(item.custo_total)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Materiais:</span>
                  <span>{formatCurrency(custoMaterial)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Custos de Máquinas */}
          {custoMaquinaria > 0 && (
            <div>
              <h4 className="font-medium mb-2">Máquinas</h4>
              <div className="space-y-2">
                {maquinasDetalhadas.map((maquina, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{maquina.nome_maquina} ({maquina.horas_utilizadas}h)</span>
                    <span>{formatCurrency(maquina.custo_total)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Máquinas:</span>
                  <span>{formatCurrency(custoMaquinaria)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Custos de Funções */}
          {custoMaoObra > 0 && (
            <div>
              <h4 className="font-medium mb-2">Mão de Obra</h4>
              <div className="space-y-2">
                {funcoesDetalhadas.map((funcao, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{funcao.nome_funcao} ({funcao.horas_trabalhadas}h)</span>
                    <span>{formatCurrency(funcao.custo_total)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Mão de Obra:</span>
                  <span>{formatCurrency(custoMaoObra)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Resumo Final */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Custo Total de Produção:</span>
              <span>{formatCurrency(custosTotais.custo_total_producao)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Margem de Lucro ({custosTotais.margem_lucro_percentual}%):</span>
              <span>{formatCurrency(custosTotais.margem_lucro_valor)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Subtotal com Lucro:</span>
              <span>{formatCurrency(custosTotais.subtotal_com_lucro)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Impostos ({custosTotais.impostos_percentual}%):</span>
              <span>{formatCurrency(custosTotais.impostos_valor)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Preço Final:</span>
              <span>{formatCurrency(custosTotais.preco_final)}</span>
            </div>
          </div>

          {/* Campos customizados específicos do módulo */}
          {customFields}

          {/* Ações customizadas específicas do módulo */}
          {customActions}
        </CardContent>
      </Card>
    </div>
  );
} 