/**
 * Script para aplicar lógica inteligente nas OSs existentes
 * Objetivo: Recalcular quantidades usando a lógica inteligente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function calcularQuantidadeInteligente(
  itemInsumo: any,
  produto: any
): { quantidade: number; unidade: string; display: string } {
  const nome = itemInsumo.insumo.nome;
  const quantidade_necessaria = parseFloat(itemInsumo.quantidade?.toString() || '0');
  const quantidadeProdutos = parseFloat(produto.quantidade || '1');
  
  // Lógica específica para bobinas (área em m² + unidades físicas)
  if (nome?.toLowerCase().includes('bobina') && nome?.toLowerCase().includes('lona')) {
    // Calcular área por bobina
    let areaPorBobina = 70; // Default 70m²
    const match = nome.match(/(\d+[,.]?\d*)\s*[x×]\s*(\d+[,.]?\d*)\s*m/i);
    if (match) {
      const largura = parseFloat(match[1].replace(',', '.'));
      const altura = parseFloat(match[2].replace(',', '.'));
      areaPorBobina = largura * altura;
    }
    
    const bobinasNecessarias = Math.ceil(quantidade_necessaria / areaPorBobina);
    return { 
      quantidade: bobinasNecessarias, 
      unidade: 'UNID',
      display: `${quantidade_necessaria} M2 - ${bobinasNecessarias} UNID - BOBINA`
    };
  }
  
  // Lógica específica para madeira (unidades físicas)
  if (nome?.toLowerCase().includes('madeira') || nome?.toLowerCase().includes('cabo')) {
    // Cada banner precisa de uma unidade completa de madeira
    const unidadesNecessarias = quantidadeProdutos;
    return { quantidade: unidadesNecessarias, unidade: 'UNID', display: `${unidadesNecessarias} UNID` };
  }
  
  // Lógica específica para cordão (unidades físicas de tubos)
  if (nome?.toLowerCase().includes('cordao') || nome?.toLowerCase().includes('cordão')) {
    // Extrair metros por tubo do nome do produto
    let metrosPorTubo = 205; // Default
    const match = nome.match(/(\d+)\s*m\s+branco/i) || nome.match(/(\d+)\s*m\s*$/i);
    if (match) {
      metrosPorTubo = parseInt(match[1]);
    }
    
    // Calcular metros necessários (ex: 12m por banner)
    const metrosPorBanner = 12;
    const metrosTotaisNecessarios = metrosPorBanner * quantidadeProdutos;
    
    // Calcular quantos tubos são necessários
    const tubosNecessarios = Math.ceil(metrosTotaisNecessarios / metrosPorTubo);
    
    return { 
      quantidade: tubosNecessarios, 
      unidade: 'UNID',
      display: `${metrosTotaisNecessarios}M - ${tubosNecessarios} UNID - ROLO`
    };
  }
  
  // Lógica específica para ponteiras (unidades)
  if (nome?.toLowerCase().includes('ponteira')) {
    const ponteirasPorBanner = 2;
    const unidadesNecessarias = ponteirasPorBanner * quantidadeProdutos;
    return { quantidade: unidadesNecessarias, unidade: 'UNID', display: `${unidadesNecessarias} UNID` };
  }
  
  // Lógica específica para ilhos (unidades) - IGUAL AO PREVIEW V2
  if (nome?.toLowerCase().includes('ilho')) {
    // Usar a mesma lógica do preview V2: cálculo por perímetro e espaçamento
    const larguraProduto = parseFloat(produto.largura?.toString() || '0');
    const alturaProduto = parseFloat(produto.altura?.toString() || '0');
    
    if (larguraProduto > 0 && alturaProduto > 0) {
      // Cálculo igual ao preview V2
      const perimetro = 2 * (larguraProduto + alturaProduto);
      const espacamento = 15; // cm entre ilhós (mesmo do preview V2)
      const quantidadeUnitaria = Math.ceil(perimetro / espacamento);
      const unidadesNecessarias = quantidadeUnitaria * quantidadeProdutos;
      
      return { 
        quantidade: unidadesNecessarias, 
        unidade: 'UNID', 
        display: `${unidadesNecessarias} UNID`
      };
    } else {
      // CORREÇÃO: Usar quantidade original do orçamento se disponível
      // Isso garante que a OS use o mesmo cálculo do preview V2
      if (quantidade_necessaria > 0 && quantidade_necessaria !== (4 * quantidadeProdutos)) {
        // Se a quantidade original não é 4×produtos, usar ela (vem do preview V2)
        return { 
          quantidade: quantidade_necessaria, 
          unidade: 'UNID', 
          display: `${quantidade_necessaria} UNID`
        };
      } else {
        // Fallback: 4 ilhós por banner (lógica antiga)
        const ilhosPorBanner = 4;
        const unidadesNecessarias = ilhosPorBanner * quantidadeProdutos;
        return { quantidade: unidadesNecessarias, unidade: 'UNID', display: `${unidadesNecessarias} UNID` };
      }
    }
  }

  // Fallback: retorna quantidade original
  return { quantidade: quantidade_necessaria, unidade: 'un', display: `${quantidade_necessaria} un` };
}

async function aplicarLogicaInteligente() {
  console.log('🧠 Aplicando lógica inteligente nas OSs existentes...\n');

  try {
    // 1. Buscar todas as OSs com orçamento e produtos
    const osComOrcamento = await prisma.ordemServico.findMany({
      where: {
        orcamento_id: {
          not: null
        }
      },
      include: {
        orcamento: {
          include: {
            produtos: {
              include: {
                insumos: {
                  include: {
                    insumo: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`📊 Encontradas ${osComOrcamento.length} OSs para processar\n`);

    let sucessos = 0;
    let erros = 0;

    // 2. Processar cada OS
    for (const os of osComOrcamento) {
      try {
        console.log(`🔧 Processando OS ${os.numero}...`);

        const materiaisInteligentes = [];

        // 3. Processar cada produto do orçamento
        for (const produto of os.orcamento.produtos) {
          // 4. Processar cada insumo do produto
          for (const itemInsumo of produto.insumos) {
            const resultado = calcularQuantidadeInteligente(itemInsumo, produto);
            
            materiaisInteligentes.push({
              insumo_id: itemInsumo.insumo.id,
              nome: itemInsumo.insumo.nome,
              quantidade_necessaria: resultado.quantidade,
              unidade: resultado.unidade,
              display: resultado.display,
              custo_unitario: parseFloat(itemInsumo.preco_unitario?.toString() || '0'),
              custo_total: parseFloat(itemInsumo.preco_total?.toString() || '0'),
              produto_nome: produto.nome || 'Produto sem nome',
              logica_consumo: itemInsumo.insumo.logica_consumo || 'area',
              origem: 'orcamento',
              orcamento_id: os.orcamento_id,
              data_calculo: new Date(),
              disponivel_estoque: true, // TODO: Implementar validação real
              quantidade_disponivel: parseFloat(itemInsumo.quantidade?.toString() || '0'),
              localizacao_estoque: 'A1-B2' // TODO: Implementar localização real
            });
          }
        }

        // 5. Atualizar OS com materiais inteligentes
        await prisma.ordemServico.update({
          where: { id: os.id },
          data: {
            insumos_calculados: JSON.stringify(materiaisInteligentes),
            atualizado_em: new Date()
          }
        });

        console.log(`✅ OS ${os.numero} atualizada com ${materiaisInteligentes.length} materiais inteligentes`);
        sucessos++;

      } catch (error) {
        console.error(`❌ Erro ao processar OS ${os.numero}:`, error.message);
        erros++;
      }
    }

    console.log('\n📈 RESUMO DA APLICAÇÃO:');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📊 Total processado: ${sucessos + erros}`);

    if (erros === 0) {
      console.log('\n🎉 Lógica inteligente aplicada com sucesso!');
    } else {
      console.log(`\n⚠️  Aplicação concluída com ${erros} erros. Verifique os logs acima.`);
    }

  } catch (error) {
    console.error('💥 Erro fatal durante a aplicação:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar aplicação
if (require.main === module) {
  aplicarLogicaInteligente()
    .then(() => {
      console.log('\n🏁 Script finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { aplicarLogicaInteligente };
