/**
 * Script para testar o regex do cordão
 */

const nome = "Cordao Para Banner 3 Mm 205 M Branco";

console.log('🔍 Testando regex para cordão...\n');
console.log(`Nome: ${nome}\n`);

// Teste 1: Regex atual
const match1 = nome.match(/(\d+)\s*m\s+branco/i) || nome.match(/(\d+)\s*m\s*$/i);
console.log('Teste 1 (atual):');
console.log(`  Regex: /(\\d+)\\s*m\\s+branco/i || /(\\d+)\\s*m\\s*$/i`);
console.log(`  Resultado: ${match1 ? match1[1] : 'null'}\n`);

// Teste 2: Regex melhorado
const match2 = nome.match(/(\d+)\s*m\s+branco/i);
console.log('Teste 2 (melhorado):');
console.log(`  Regex: /(\\d+)\\s*m\\s+branco/i`);
console.log(`  Resultado: ${match2 ? match2[1] : 'null'}\n`);

// Teste 3: Regex alternativo
const match3 = nome.match(/(\d{3})\s*m/i);
console.log('Teste 3 (3 dígitos):');
console.log(`  Regex: /(\\d{3})\\s*m/i`);
console.log(`  Resultado: ${match3 ? match3[1] : 'null'}\n`);

// Teste 4: Regex mais específico
const match4 = nome.match(/(\d+)\s*m\s+branco/i);
console.log('Teste 4 (específico para "M Branco"):');
console.log(`  Regex: /(\\d+)\\s*m\\s+branco/i`);
console.log(`  Resultado: ${match4 ? match4[1] : 'null'}\n`);

// Teste 5: Regex que pega o último número antes de "M"
const match5 = nome.match(/(\d+)\s*m\s+branco$/i);
console.log('Teste 5 (final da string):');
console.log(`  Regex: /(\\d+)\\s*m\\s+branco$/i`);
console.log(`  Resultado: ${match5 ? match5[1] : 'null'}\n`);

console.log('🏁 Testes finalizados.');





