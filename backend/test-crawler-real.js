// Teste do Crawler Real - Simulando coleta de dados
console.log('🚀 TESTE DO CRAWLER REAL');
console.log('==========================\n');

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env-catalogo-insumos' });

// Dados simulados que seriam coletados pelo crawler
const simulatedCrawledData = [
  {
    nome: 'Acrílico 3mm transparente',
    descricao: 'Chapa de acrílico transparente 3mm, ideal para comunicação visual, sinalização e displays',
    categoria: 'acrilico',
    segment: 'comunicacao_visual',
    especificacoes: {
      unidadeCompra: 'chapa',
      unidadeUso: 'metro_quadrado',
      fatorConversao: 1,
      largura: 1220,
      altura: 2440,
      espessura: 3,
      unidadeDimensao: 'mm',
      tipoCalculo: 'por_area',
      logicaConsumo: 'area'
    },
    fornecedor: 'Acrilex',
    fonte: 'https://www.acrilex.com.br',
    dataColeta: new Date(),
    confiabilidade: 85
  },
  {
    nome: 'Papel couché 90g',
    descricao: 'Papel couché offset 90g/m², formato A4, ideal para impressão offset e digital',
    categoria: 'papel',
    segment: 'grafica',
    especificacoes: {
      unidadeCompra: 'resma',
      unidadeUso: 'folha',
      fatorConversao: 500,
      largura: 210,
      altura: 297,
      gramatura: 90,
      unidadeDimensao: 'mm',
      tipoCalculo: 'por_folha',
      logicaConsumo: 'quantidade_fixa'
    },
    fornecedor: 'Papelaria Gráfica',
    fonte: 'https://www.papelariagrafica.com.br',
    dataColeta: new Date(),
    confiabilidade: 90
  },
  {
    nome: 'Vinil adesivo transparente',
    descricao: 'Vinil adesivo transparente, 50cm x 10m, ideal para plotter e corte',
    categoria: 'vinil',
    segment: 'comunicacao_visual',
    especificacoes: {
      unidadeCompra: 'rolo',
      unidadeUso: 'metro_quadrado',
      fatorConversao: 5,
      largura: 500,
      altura: 10000,
      unidadeDimensao: 'mm',
      tipoCalculo: 'por_area',
      logicaConsumo: 'area'
    },
    fornecedor: 'Acrilex',
    fonte: 'https://www.acrilex.com.br',
    dataColeta: new Date(),
    confiabilidade: 80
  },
  {
    nome: 'Tinta offset preta',
    descricao: 'Tinta offset preta, 1 litro, para impressão offset em papel',
    categoria: 'tinta',
    segment: 'grafica',
    especificacoes: {
      unidadeCompra: 'litro',
      unidadeUso: 'litro',
      fatorConversao: 1,
      tipoCalculo: 'por_volume',
      logicaConsumo: 'volume'
    },
    fornecedor: 'Papelaria Gráfica',
    fonte: 'https://www.papelariagrafica.com.br',
    dataColeta: new Date(),
    confiabilidade: 95
  },
  {
    nome: 'Chapa MDF 6mm',
    descricao: 'Chapa de MDF 6mm, 1220x2440mm, ideal para comunicação visual e sinalização',
    categoria: 'mdf',
    segment: 'comunicacao_visual',
    especificacoes: {
      unidadeCompra: 'chapa',
      unidadeUso: 'metro_quadrado',
      fatorConversao: 2.9768,
      largura: 1220,
      altura: 2440,
      espessura: 6,
      unidadeDimensao: 'mm',
      tipoCalculo: 'por_area',
      logicaConsumo: 'area'
    },
    fornecedor: 'Metalúrgica',
    fonte: 'https://www.metalurgica.com.br',
    dataColeta: new Date(),
    confiabilidade: 75
  }
];

// Função para gerar código único do catálogo
function generateCatalogCode(material) {
  const prefix = material.segment === 'grafica' ? 'GRA' : 'CV';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// Função para salvar material no banco
async function saveMaterialToDatabase(material) {
  try {
    const connection = await mysql.createConnection({
      host: 'srv802.hstgr.io',
      user: 'u849952347_comunikapp',
      password: 'C@du27140797130622',
      database: 'u849952347_comunikapp'
    });

    const codigoCatalogo = generateCatalogCode(material);
    
    // Verificar se o material já existe (usando nome como identificador único)
    const [existingRows] = await connection.execute(
      'SELECT id FROM catalogo_insumos WHERE nome = ?',
      [material.nome]
    );

    if (existingRows.length > 0) {
      // Atualizar material existente
      await connection.execute(
        `UPDATE catalogo_insumos SET 
         descricao_tecnica = ?, 
         especificacoes = ?, 
         fonte_coleta = ?, 
         data_coleta = ?, 
         data_atualizacao = NOW()
         WHERE nome = ?`,
        [
          material.descricao,
          JSON.stringify(material.especificacoes),
          material.fonte,
          material.dataColeta,
          material.nome
        ]
      );
      
      console.log(`🔄 Material atualizado: ${material.nome}`);
    } else {
      // Criar novo material
      await connection.execute(
        `INSERT INTO catalogo_insumos (
          id, codigo_catalogo, nome, descricao_tecnica, especificacoes,
          unidade_compra, unidade_uso, fator_conversao, largura, altura,
          gramatura, unidade_dimensao, tipo_calculo, logica_consumo,
          fonte_coleta, data_coleta, ativo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          require('crypto').randomUUID(),
          codigoCatalogo,
          material.nome,
          material.descricao,
          JSON.stringify(material.especificacoes),
          material.especificacoes.unidadeCompra || 'unidade',
          material.especificacoes.unidadeUso || 'unidade',
          material.especificacoes.fatorConversao || 1,
          material.especificacoes.largura || null,
          material.especificacoes.altura || null,
          material.especificacoes.gramatura || null,
          material.especificacoes.unidadeDimensao || null,
          material.especificacoes.tipoCalculo || null,
          material.especificacoes.logicaConsumo || 'quantidade_fixa',
          material.fonte,
          material.dataColeta,
          true
        ]
      );
      
      console.log(`✨ Novo material criado: ${material.nome} (${codigoCatalogo})`);
    }

    await connection.end();
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao salvar material ${material.nome}: ${error.message}`);
    return false;
  }
}

// Função principal para simular o crawling
async function simulateCrawling() {
  console.log('🚀 Iniciando simulação de crawling...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const material of simulatedCrawledData) {
    console.log(`📡 Processando: ${material.nome}`);
    console.log(`   🏷️  Segmento: ${material.segment === 'grafica' ? '🖨️ Gráfica' : '🎨 Comunicação Visual'}`);
    console.log(`   📂 Categoria: ${material.categoria}`);
    console.log(`   🏭 Fornecedor: ${material.fornecedor}`);
    
    const success = await saveMaterialToDatabase(material);
    
    if (success) {
      successCount++;
      console.log(`   ✅ Salvo com sucesso!\n`);
    } else {
      errorCount++;
      console.log(`   ❌ Falha ao salvar\n`);
    }
    
    // Delay simulado entre processamentos
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('📊 RESUMO DO CRAWLING:');
  console.log(`   ✅ Sucessos: ${successCount}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log(`   📈 Taxa de sucesso: ${((successCount / simulatedCrawledData.length) * 100).toFixed(1)}%`);
  
  if (successCount > 0) {
    console.log('\n🎉 CRAWLING SIMULADO CONCLUÍDO COM SUCESSO!');
    console.log('💾 Dados foram salvos no banco de dados!');
    console.log('🔍 Verifique a tabela catalogo_insumos para ver os resultados.');
  }
}

// Executar o teste
simulateCrawling().catch(console.error);
