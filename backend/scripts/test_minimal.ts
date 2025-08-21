console.log('🧪 Teste mínimo para isolar o problema');

// 1. Criar map simples
const map = { ENTRADA: 2, SAIDA: 4, AJUSTE: 1, TRANSFERENCIA: 2 };

console.log('\n📋 Map criado:');
console.log(`  - map.ENTRADA = ${map.ENTRADA}`);
console.log(`  - map.SAIDA = ${map.SAIDA}`);
console.log(`  - map.AJUSTE = ${map.AJUSTE}`);
console.log(`  - map.TRANSFERENCIA = ${map.TRANSFERENCIA}`);

// 2. Criar objeto de estatísticas
const estatisticas = {
  entradas: map.ENTRADA,
  saidas: map.SAIDA,
  ajustes: map.AJUSTE,
  transferencias: map.TRANSFERENCIA,
};

console.log('\n🏗️ Objeto de estatísticas criado:');
console.log(`  - entradas: ${estatisticas.entradas}`);
console.log(`  - saidas: ${estatisticas.saias}`);
console.log(`  - ajustes: ${estatisticas.ajustes}`);
console.log(`  - transferencias: ${estatisticas.transferencias}`);

// 3. Verificar se o problema persiste
if (estatisticas.saias === 4) {
  console.log('\n✅ PROBLEMA RESOLVIDO!');
  console.log('  - saidas = 4 (correto)');
} else {
  console.log('\n❌ PROBLEMA PERSISTE!');
  console.log(`  - saidas = ${estatisticas.saias} (esperado: 4)`);
}

// 4. Teste alternativo
console.log('\n🔍 Teste alternativo:');
const saidas = map.SAIDA;
console.log(`  - saidas = ${saidas}`);

const estatisticas2 = {
  entradas: map.ENTRADA,
  saidas: saidas,
  ajustes: map.AJUSTE,
  transferencias: map.TRANSFERENCIA,
};

console.log('  Objeto alternativo:');
console.log(`    - saidas: ${estatisticas2.saias}`);
