#!/usr/bin/env ts-node

/**
 * Script para corrigir materiais de OSs existentes diretamente no banco
 * Aplica a nova lógica de cálculo sem depender de serviços externos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para calcular quantidade necessária (copiada do os.service.ts)
function calcularQuantidadeNecessaria(
  itemInsumo: any,
  quantidadeProdutos: number
): number {
  const quantidade_base = parseFloat(itemInsumo.quantidade || '0');
  const logica_consumo = itemInsumo.insumo?.logica_consumo || 'area';
  const unidade_uso = itemInsumo.insumo?.unidade_uso?.toLowerCase() || '';
  
  // Determinar se precisa multiplicar pela quantidade do produto
  // IMPORTANTE: Para materiais calculados por área, a quantidade no orçamento
  // já representa o TOTAL de m² necessários, não por unidade
  const precisaMultiplicar = 
    (unidade_uso.includes('un') || unidade_uso.includes('unidade')) &&
    !unidade_uso.includes('m2') && 
    !unidade_uso.includes('m²') &&
    logica_consumo !== 'area';
  
  return precisaMultiplicar ? quantidade_base * quantidadeProdutos : quantidade_base;
}

// Função para gerar display (copiada do os.service.ts)
function gerarDisplay(
  insumo: any,
  quantidade_necessaria: number,
  quantidadeProdutos: number
): string {
  const nome = insumo.nome;
  const unidade = insumo.unidade_uso || 'un';
  
  let display = `${quantidade_necessaria} ${unidade}`;
  
  if (nome?.toLowerCase().includes('bobina') && nome?.toLowerCase().includes('lona')) {
    // Para bobinas, mostrar área + unidades físicas
    let areaPorBobina = 70; // Default
    const match = nome.match(/(\d+[,.]?\d*)\s*[x×]\s*(\d+[,.]?\d*)\s*m/i);
    if (match) {
      const largura = parseFloat(match[1].replace(',', '.'));
      const altura = parseFloat(match[2].replace(',', '.'));
      areaPorBobina = largura * altura;
    }
    const bobinasNecessarias = Math.ceil(quantidade_necessaria / areaPorBobina);
    display = `${quantidade_necessaria} M2 - ${bobinasNecessarias} UNID - BOBINA`;
  } else if (nome?.toLowerCase().includes('cordao') || nome?.toLowerCase().includes('cordão')) {
    // Para cordão, mostrar metros + unidades físicas
    let metrosPorTubo = 205;
    const match = nome.match(/(\d+)\s*m\s+branco/i) || nome.match(/(\d+)\s*m\s*$/i);
    if (match) {
      metrosPorTubo = parseInt(match[1]);
    }
    const metrosPorBanner = 12;
    const metrosTotaisNecessarios = metrosPorBanner * quantidadeProdutos;
    const tubosNecessarios = Math.ceil(metrosTotaisNecessarios / metrosPorTubo);
    display = `${metrosTotaisNecessarios}M - ${tubosNecessarios} UNID - ROLO`;
  }
  
  return display;
}

async function corrigirMateriaisDireto() {
  console.log('🔧 Iniciando correção direta de materiais de OSs...\n');

  try {
    // Buscar todas as OSs que possuem orçamento vinculado
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
                    insumo: {
                      include: {
                        categoria: true,
                        tipoMaterial: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        criado_em: 'desc'
      }
    });

    console.log(`📊 Encontradas ${osComOrcamento.length} OSs com orçamento vinculado\n`);

    if (osComOrcamento.length === 0) {
      console.log('✅ Nenhuma OS encontrada para correção');
      return;
    }

    let sucessos = 0;
    let erros = 0;
    const errosDetalhes: Array<{ osId: string; erro: string }> = [];

    // Processar cada OS
    for (const os of osComOrcamento) {
      try {
        console.log(`🔄 Processando OS ${os.numero} (ID: ${os.id})...`);
        
        if (!os.orcamento || !os.orcamento.produtos) {
          console.log(`  ⚠️  OS ${os.numero} sem orçamento válido, pulando...`);
          continue;
        }

        const materiais: any[] = [];

        // Processar cada produto do orçamento
        os.orcamento.produtos.forEach(produto => {
          if (!produto.insumos || !Array.isArray(produto.insumos)) {
            return;
          }

          const quantidadeProdutos = parseFloat(String(produto.quantidade || '1'));

          produto.insumos.forEach(itemInsumo => {
            if (!itemInsumo.insumo) {
              return;
            }

            // Calcular quantidade necessária com a nova lógica
            const quantidade_necessaria = calcularQuantidadeNecessaria(
              itemInsumo,
              quantidadeProdutos
            );

            // Gerar display com a nova lógica
            const display = gerarDisplay(
              itemInsumo.insumo,
              quantidade_necessaria,
              quantidadeProdutos
            );

            materiais.push({
              insumo_id: itemInsumo.insumo.id,
              nome: itemInsumo.insumo.nome,
              quantidade_necessaria: quantidade_necessaria,
              unidade: itemInsumo.unidade || itemInsumo.insumo.unidade_uso || 'un',
              display: display,
              custo_unitario: parseFloat(String((itemInsumo as any).custo_unitario || '0')),
              custo_total: parseFloat(String((itemInsumo as any).custo_total || '0')),
              produto_nome: produto.nome || 'Produto sem nome',
              logica_consumo: itemInsumo.insumo.logica_consumo || 'area',
              parametros_consumo: itemInsumo.insumo.parametros_consumo ? 
                (typeof itemInsumo.insumo.parametros_consumo === 'string' ? 
                  JSON.parse(itemInsumo.insumo.parametros_consumo) : 
                  itemInsumo.insumo.parametros_consumo) : null,
              origem: 'orcamento',
              orcamento_id: os.orcamento_id,
              data_calculo: os.orcamento.data_ultimo_calculo || os.orcamento.criado_em,
              disponivel_estoque: true,
              quantidade_disponivel: quantidade_necessaria,
              localizacao_estoque: 'A1-B2'
            });
          });
        });

        // Atualizar OS com materiais corrigidos
        await prisma.ordemServico.update({
          where: { id: os.id },
          data: {
            insumos_calculados: JSON.stringify(materiais),
            atualizado_em: new Date()
          }
        });

        console.log(`  ✅ OS ${os.numero} corrigida com sucesso`);
        console.log(`     📦 ${materiais.length} materiais atualizados`);
        
        // Mostrar exemplo de material corrigido
        if (materiais.length > 0) {
          const primeiroMaterial = materiais[0];
          console.log(`     📋 Exemplo: ${primeiroMaterial.nome} - ${primeiroMaterial.display}`);
        }
        
        sucessos++;
        
      } catch (error) {
        console.log(`  ❌ Erro ao processar OS ${os.numero}: ${error.message}`);
        errosDetalhes.push({
          osId: os.id,
          erro: error.message
        });
        erros++;
      }
      
      console.log(''); // Linha em branco para separar
    }

    // Relatório final
    console.log('📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ OSs corrigidas com sucesso: ${sucessos}`);
    console.log(`❌ OSs com erro: ${erros}`);
    console.log(`📦 Total processado: ${osComOrcamento.length}`);
    
    if (errosDetalhes.length > 0) {
      console.log('\n🔍 DETALHES DOS ERROS:');
      errosDetalhes.forEach(({ osId, erro }) => {
        console.log(`  - OS ${osId}: ${erro}`);
      });
    }

    console.log('\n🎉 Correção de materiais concluída!');

  } catch (error) {
    console.error('❌ Erro geral na execução do script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
if (require.main === module) {
  corrigirMateriaisDireto()
    .then(() => {
      console.log('\n✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

export { corrigirMateriaisDireto };
