const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testarQueryEstoque() {
  try {
    console.log('🔍 Testando query do service de estoque...');
    
    const lojaId = 'cme1ops150000w4ikkdtq0h3x'; // Loja dos dados que vimos
    
    // Simular a lógica do service
    const tableName = 'itens_estoque';
    
    // Verificar colunas disponíveis
    const colsResult = await prisma.$queryRawUnsafe(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_Schema = DATABASE() AND TABLE_NAME = ?',
      tableName,
    );
    const existing = new Set(colsResult.map((r) => r.COLUMN_NAME));
    
    console.log('📋 Colunas disponíveis na tabela:');
    existing.forEach(col => console.log(`  - ${col}`));
    
    // Mapear colunas como o service faz
    const lojaCol = existing.has('lojaId') ? 'lojaId' : (existing.has('loja_id') ? 'loja_id' : null);
    const insumoCol = existing.has('insumoId') ? 'insumoId' : (existing.has('insumo_id') ? 'insumo_id' : null);
    const localizacaoCol = existing.has('localizacaoId') ? 'localizacaoId' : (existing.has('localizacao_id') ? 'localizacao_id' : null);
    const qtdCol = existing.has('quantidadeAtual') ? 'quantidadeAtual' : (existing.has('quantidade') ? 'quantidade' : null);
    const qtdResCol = existing.has('quantidadeReservada') ? 'quantidadeReservada' : null;
    const estMinCol = existing.has('estoqueMinimo') ? 'estoqueMinimo' : (existing.has('estoque_minimo') ? 'estoque_minimo' : null);
    const estMaxCol = existing.has('estoqueMaximo') ? 'estoqueMaximo' : (existing.has('estoque_maximo') ? 'estoque_maximo' : null);
    const unMedCol = existing.has('unidadeMedida') ? 'unidadeMedida' : (existing.has('unidade_medida') ? 'unidade_medida' : null);
    const precoCol = existing.has('precoUnitario') ? 'precoUnitario' : (existing.has('preco_unitario') ? 'preco_unitario' : null);
    const nomeCol = existing.has('nome') ? 'nome' : null;
    const dataUltMovCol = existing.has('dataUltimaMov') ? 'dataUltimaMov' : null;
    const createdCol = existing.has('createdAt') ? 'createdAt' : (existing.has('criado_em') ? 'criado_em' : null);
    const updatedCol = existing.has('updatedAt') ? 'updatedAt' : (existing.has('atualizado_em') ? 'atualizado_em' : null);
    
    console.log('\n🔧 Mapeamento de colunas:');
    console.log(`  lojaCol: ${lojaCol}`);
    console.log(`  insumoCol: ${insumoCol}`);
    console.log(`  localizacaoCol: ${localizacaoCol}`);
    console.log(`  qtdCol: ${qtdCol}`);
    console.log(`  qtdResCol: ${qtdResCol}`);
    console.log(`  estMinCol: ${estMinCol}`);
    console.log(`  estMaxCol: ${estMaxCol}`);
    console.log(`  unMedCol: ${unMedCol}`);
    console.log(`  precoCol: ${precoCol}`);
    console.log(`  nomeCol: ${nomeCol}`);
    console.log(`  dataUltMovCol: ${dataUltMovCol}`);
    console.log(`  createdCol: ${createdCol}`);
    console.log(`  updatedCol: ${updatedCol}`);
    
    if (!lojaCol || !localizacaoCol || !qtdCol) {
      console.log('\n❌ Colunas mínimas ausentes!');
      return;
    }
    
    // Construir SELECT como o service faz
    const selectParts = [
      `t.id AS id`,
      insumoCol ? `t.${insumoCol} AS insumoId` : `NULL AS insumoId`,
      `t.${localizacaoCol} AS localizacaoId`,
      nomeCol ? `COALESCE(t.${nomeCol}, '') AS insumoNome` : `COALESCE(t.codigo, 'Item') AS insumoNome`,
      qtdCol ? `t.${qtdCol} AS quantidadeAtual` : `0 AS quantidadeAtual`,
      qtdResCol ? `t.${qtdResCol} AS quantidadeReservada` : `0 AS quantidadeReservada`,
      estMinCol ? `t.${estMinCol} AS estoqueMinimo` : `0 AS estoqueMinimo`,
      estMaxCol ? `t.${estMaxCol} AS estoqueMaximo` : `NULL AS estoqueMaximo`,
      unMedCol ? `COALESCE(t.${unMedCol}, '') AS unidadeCompra` : `'' AS unidadeCompra`,
      precoCol ? `t.${precoCol} AS valorUnitario` : `0 AS valorUnitario`,
      dataUltMovCol ? `t.${dataUltMovCol} AS dataUltimaMov` : `NULL AS dataUltimaMov`,
      createdCol ? `t.${createdCol} AS createdAt` : `NULL AS createdAt`,
      `COALESCE(l.codigo, '') AS localizacaoCodigo`
    ];
    
    const whereClause = lojaCol ? `t.${lojaCol} = ?` : `l.loja_id = ?`;
    const sql = `SELECT ${selectParts.join(', ')}\n` +
      `FROM ${tableName} t\n` +
      `LEFT JOIN localizacoes l ON l.id = t.${localizacaoCol}\n` +
      `WHERE ${whereClause}` +
      ` ORDER BY ${updatedCol ? `t.${updatedCol}` : 't.id'} DESC`;
    
    console.log('\n📝 SQL gerado:');
    console.log(sql);
    console.log(`\n🔍 Parâmetros: lojaId = ${lojaId}`);
    
    // Executar a query
    const items = await prisma.$queryRawUnsafe(sql, lojaId);
    console.log(`\n✅ Resultados encontrados: ${items.length}`);
    
    if (items.length > 0) {
      console.log('\n📦 Primeiros resultados:');
      items.slice(0, 3).forEach((item, i) => {
        console.log(`  ${i + 1}. ID: ${item.id}`);
        console.log(`     Insumo ID: ${item.insumoId}`);
        console.log(`     Insumo Nome: ${item.insumoNome}`);
        console.log(`     Localização ID: ${item.localizacaoId}`);
        console.log(`     Localização Código: ${item.localizacaoCodigo}`);
        console.log(`     Quantidade Atual: ${item.quantidadeAtual}`);
        console.log(`     Quantidade Reservada: ${item.quantidadeReservada}`);
        console.log(`     Estoque Mínimo: ${item.estoqueMinimo}`);
        console.log(`     Unidade Compra: ${item.unidadeCompra}`);
        console.log(`     Valor Unitário: ${item.valorUnitario}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testarQueryEstoque();
