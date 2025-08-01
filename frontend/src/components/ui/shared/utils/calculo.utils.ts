import { Insumo } from '../types/common.types';

// Função para converter medidas para metros
export function converterParaMetros(valor: number, unidade: string): number {
  switch (unidade.toLowerCase()) {
    case 'mm':
      return valor / 1000;
    case 'cm':
      return valor / 100;
    case 'm':
      return valor;
    case 'm2':
      return valor;
    default:
      return valor;
  }
}

// Função para calcular área em m²
export function calcularArea(largura: number, altura: number, unidade: string): number {
  if (!largura || !altura) return 0;
  
  const larguraEmMetros = converterParaMetros(largura, unidade);
  const alturaEmMetros = converterParaMetros(altura, unidade);
  
  return larguraEmMetros * alturaEmMetros;
}

// Função para obter o tipo de campo baseado na unidade de uso
export function getCampoQuantidade(insumo: Insumo | undefined) {
  if (!insumo) return { label: 'Quantidade', placeholder: '0.00', step: '0.01' };
  
  switch (insumo.unidade_uso) {
    case 'M':
      return { label: 'Comprimento (metros)', placeholder: '0.00', step: '0.001' };
    case 'M2':
      return { label: 'Área (m²)', placeholder: '0.00', step: '0.01' };
    case 'M3':
      return { label: 'Volume (m³)', placeholder: '0.00', step: '0.001' };
    case 'CM':
    case 'CENTIMETRO':
      return { label: 'Comprimento (cm)', placeholder: '0.00', step: '0.01' };
    case 'CM2':
      return { label: 'Área (cm²)', placeholder: '0.00', step: '0.01' };
    case 'MM':
    case 'MILIMETRO':
      return { label: 'Comprimento (mm)', placeholder: '0.00', step: '0.1' };
    case 'KG':
      return { label: 'Peso (kg)', placeholder: '0.00', step: '0.01' };
    case 'GRAMAS':
      return { label: 'Peso (gramas)', placeholder: '0.00', step: '0.01' };
    case 'LITRO':
      return { label: 'Volume (litros)', placeholder: '0.00', step: '0.01' };
    case 'ML':
      return { label: 'Volume (ml)', placeholder: '0.00', step: '0.01' };
    case 'UNID':
    case 'PC':
      return { label: 'Quantidade (unidades)', placeholder: '0', step: '1' };
    case 'PARES':
      return { label: 'Quantidade (pares)', placeholder: '0', step: '1' };
    case 'DUZIA':
      return { label: 'Quantidade (dúzias)', placeholder: '0', step: '1' };
    case 'CENTO':
      return { label: 'Quantidade (centos)', placeholder: '0', step: '1' };
    case 'MILHEI':
      return { label: 'Quantidade (milheiros)', placeholder: '0', step: '1' };
    case 'BOBINA':
      return { label: 'Quantidade (bobinas)', placeholder: '0', step: '1' };
    case 'ROLO':
      return { label: 'Quantidade (rolos)', placeholder: '0', step: '1' };
    case 'FOLHA':
      return { label: 'Quantidade (folhas)', placeholder: '0', step: '1' };
    case 'CX':
    case 'CX2':
    case 'CX3':
    case 'CX5':
    case 'CX10':
    case 'CX15':
    case 'CX20':
    case 'CX25':
    case 'CX50':
    case 'CX100':
      return { label: 'Quantidade (caixas)', placeholder: '0', step: '1' };
    case 'PACOTE':
      return { label: 'Quantidade (pacotes)', placeholder: '0', step: '1' };
    case 'KIT':
      return { label: 'Quantidade (kits)', placeholder: '0', step: '1' };
    case 'JOGO':
      return { label: 'Quantidade (jogos)', placeholder: '0', step: '1' };
    case 'CONJUNTO':
      return { label: 'Quantidade (conjuntos)', placeholder: '0', step: '1' };
    case 'BALDE':
      return { label: 'Quantidade (baldes)', placeholder: '0', step: '1' };
    case 'BANDEJ':
      return { label: 'Quantidade (bandejas)', placeholder: '0', step: '1' };
    case 'BARRA':
      return { label: 'Quantidade (barras)', placeholder: '0', step: '1' };
    case 'BISNAG':
      return { label: 'Quantidade (bisnagas)', placeholder: '0', step: '1' };
    case 'BLOCO':
      return { label: 'Quantidade (blocos)', placeholder: '0', step: '1' };
    case 'BOMB':
      return { label: 'Quantidade (bombonas)', placeholder: '0', step: '1' };
    case 'CAPS':
      return { label: 'Quantidade (cápsulas)', placeholder: '0', step: '1' };
    case 'CART':
      return { label: 'Quantidade (cartelas)', placeholder: '0', step: '1' };
    case 'CJ':
      return { label: 'Quantidade (conjuntos)', placeholder: '0', step: '1' };
    case 'DISP':
      return { label: 'Quantidade (displays)', placeholder: '0', step: '1' };
    case 'EMBAL':
      return { label: 'Quantidade (embalagens)', placeholder: '0', step: '1' };
    case 'FARDO':
      return { label: 'Quantidade (fardos)', placeholder: '0', step: '1' };
    case 'FRASCO':
      return { label: 'Quantidade (frascos)', placeholder: '0', step: '1' };
    case 'GALAO':
      return { label: 'Quantidade (galões)', placeholder: '0', step: '1' };
    case 'GF':
      return { label: 'Quantidade (garrafas)', placeholder: '0', step: '1' };
    case 'LATA':
      return { label: 'Quantidade (latas)', placeholder: '0', step: '1' };
    case 'PALETE':
      return { label: 'Quantidade (pallets)', placeholder: '0', step: '1' };
    case 'POTE':
      return { label: 'Quantidade (potes)', placeholder: '0', step: '1' };
    case 'K':
      return { label: 'Quantidade (quilates)', placeholder: '0.00', step: '0.01' };
    case 'RESMA':
      return { label: 'Quantidade (resmas)', placeholder: '0', step: '1' };
    case 'SACO':
      return { label: 'Quantidade (sacos)', placeholder: '0', step: '1' };
    case 'SACOLA':
      return { label: 'Quantidade (sacolas)', placeholder: '0', step: '1' };
    case 'TAMBOR':
      return { label: 'Quantidade (tambores)', placeholder: '0', step: '1' };
    case 'TANQUE':
      return { label: 'Quantidade (tanques)', placeholder: '0', step: '1' };
    case 'TON':
      return { label: 'Quantidade (toneladas)', placeholder: '0.00', step: '0.01' };
    case 'TUBO':
      return { label: 'Quantidade (tubos)', placeholder: '0', step: '1' };
    case 'VASIL':
      return { label: 'Quantidade (vasilhames)', placeholder: '0', step: '1' };
    case 'VIDRO':
      return { label: 'Quantidade (vidros)', placeholder: '0', step: '1' };
    case 'AMPOLA':
      return { label: 'Quantidade (ampolas)', placeholder: '0', step: '1' };
    default:
      return { label: 'Quantidade', placeholder: '0.00', step: '0.01' };
  }
}

// Função para calcular o custo por unidade de uso
export function calcularCustoPorUnidadeUso(insumo: Insumo): number {
  if (!insumo || !insumo.custo_unitario || !insumo.quantidade_compra || !insumo.fator_conversao) {
    return 0;
  }
  
  const custo = Number(insumo.custo_unitario);
  const quantidade = Number(insumo.quantidade_compra);
  const fator = Number(insumo.fator_conversao);
  
  if (quantidade > 0 && fator > 0) {
    const quantidadeCalculada = quantidade;
    
    // Se temos dimensões e tipo de cálculo, usar a lógica específica
    if (insumo.altura && insumo.unidade_dimensao && insumo.tipo_calculo) {
      const alturaNum = Number(insumo.altura);
      
      if (!isNaN(alturaNum)) {
        // Converter altura para metros
        let alturaEmMetros = alturaNum;
        
        switch (insumo.unidade_dimensao) {
          case 'CENTÍMETROS':
          case 'CM':
            alturaEmMetros = alturaNum / 100;
            break;
          case 'MILÍMETROS':
          case 'MM':
            alturaEmMetros = alturaNum / 1000;
            break;
          case 'METROS':
          case 'M':
            // Já está em metros
            break;
        }
        
        // Calcular quantidade baseada no tipo de cálculo
        switch (insumo.tipo_calculo) {
          case 'COMPRIMENTO LINEAR':
          case 'LINEAR':
            // Para comprimento linear: calcular custo por unidade de uso
            const custoPorUnidade = custo / quantidade;
            
            if (insumo.unidade_uso === 'CENTIMETRO' || insumo.unidade_uso === 'CM') {
              // Se a unidade de uso é centímetro, calcular custo por centímetro
              // Para cordão: custo por metro ÷ 100 = custo por centímetro
              const custoPorCentimetro = custoPorUnidade / 100;
              
              return custoPorCentimetro;
            } else {
              // Para outras unidades de uso, usar o cálculo padrão
              return custoPorUnidade;
            }
            
          case 'AREA':
            // Para área: calcular custo por unidade de uso baseado na área da unidade
            if (insumo.largura) {
              const larguraNum = Number(insumo.largura);
              if (!isNaN(larguraNum)) {
                let larguraEmMetros = larguraNum;
                
                switch (insumo.unidade_dimensao) {
                  case 'CENTÍMETROS':
                  case 'CM':
                    larguraEmMetros = larguraNum / 100;
                    break;
                  case 'MILÍMETROS':
                  case 'MM':
                    larguraEmMetros = larguraNum / 1000;
                    break;
                }
                
                const areaPorUnidade = larguraEmMetros * alturaEmMetros;
                
                if (insumo.unidade_uso === 'METRO QUADRADO') {
                  // Se a unidade de uso é metro quadrado, calcular custo por m²
                  const custoPorMetroQuadrado = custo / areaPorUnidade;
                  
                  return custoPorMetroQuadrado;
                } else {
                  // Para outras unidades de uso, usar o cálculo padrão
                  return custo / quantidade;
                }
              }
            } else {
              return custo / quantidade;
            }
            break;
            
          case 'QUANTIDADE':
            // Para quantidade fixa: usar quantidade diretamente
            return custo / quantidade;
            
          default:
            // Padrão: usar quantidade diretamente
            return custo / quantidade;
        }
      }
    }
    
    return custo / (quantidadeCalculada * fator);
  }
  
  return 0;
} 