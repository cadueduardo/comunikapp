console.log('🧪 Teste com atribuição explícita');

// 1. Criar map simples
const map = { ENTRADA: 2, SAIDA: 4, AJUSTE: 1, TRANSFERENCIA: 2 };

console.log('\n📋 Map criado:');
console.log(`  - map.ENTRADA = ${map.ENTRADA}`);
console.log(`  - map.SAIDA = ${map.SAIDA}`);
console.log(`  - map.AJUSTE = ${map.AJUSTE}`);
console.log(`  - map.TRANSFERENCIA = ${map.TRANSFERENCIA}`);

// 2. Criar objeto de estatísticas com atribuição explícita
const estatisticas: any = {};
estatisticas.entradas = map.ENTRADA;
estatisticas.saias = map.SAIDA;
estatisticas.ajustes = map.AJUSTE;
estatisticas.transferencias = map.TRANSFERENCIA;

console.log('\n🏗️ Objeto de estatísticas criado com atribuição explícita:');
console.log(`  - entradas: ${estatisticas.entradas}`);
console.log(`  - saidas: ${estatisticas.saias}`);
console.log(`  - ajustes: ${estatisticas.ajustes}`);
console.log(`  - transferencias: ${estatisticas.transferencias}`);

// 3. Verificar se o problema foi resolvido
if (estatisticas.saias === 4) {
  console.log('\n✅ PROBLEMA RESOLVIDO!');
  console.log('  - saidas = 4 (correto)');
} else {
  console.log('\n❌ PROBLEMA PERSISTE!');
  console.log(`  - saidas = ${estatisticas.saias} (esperado: 4)`);
}

// 4. Teste alternativo com Object.assign
console.log('\n🔍 Teste com Object.assign:');
const estatisticas2 = Object.assign({}, {
  entradas: map.ENTRADA,
  saidas: map.SAIDA,
  ajustes: map.AJUSTE,
  transferencias: map.TRANSFERENCIA,
});

console.log('  Objeto com Object.assign:');
console.log(`    - saidas: ${estatisticas2.saias}`);

// 5. Teste com spread operator
console.log('\n🔍 Teste com spread operator:');
const estatisticas3 = {
  ...map,
  entradas: map.ENTRADA,
  saidas: map.SAIDA,
  ajustes: map.AJUSTE,
  transferencias: map.TRANSFERENCIA,
};

console.log('  Objeto com spread operator:');
console.log(`    - saidas: ${estatisticas3.saias}`);
