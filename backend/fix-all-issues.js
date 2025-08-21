const fs = require('fs');

// Ler o arquivo
const filePath = './src/orcamentos/orcamentos.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Mapeamento abrangente de todas as correções necessárias
const corrections = [
  // Relacionamentos nos includes
  { from: 'itens:', to: 'itemorcamento:' },
  { from: 'maquinas:', to: 'maquinaorcamento:' },
  { from: 'funcoes:', to: 'funcaoorcamento:' },
  { from: 'insumo:', to: 'insumos:' },
  
  // Referências aos relacionamentos
  { from: 'orcamento.itens', to: 'orcamento.itemorcamento' },
  { from: 'orcamento.maquinas', to: 'orcamento.maquinaorcamento' },
  { from: 'orcamento.funcoes', to: 'orcamento.funcaoorcamento' },
  
  // Variáveis locais
  { from: 'const itens =', to: 'const itemorcamento =' },
  { from: 'const maquinas =', to: 'const maquinaorcamento =' },
  { from: 'const funcoes =', to: 'const funcaoorcamento =' },
  
  // Parâmetros de função
  { from: 'itens: any[]', to: 'itemorcamento: any[]' },
  { from: 'maquinas: any[]', to: 'maquinaorcamento: any[]' },
  { from: 'funcoes: any[]', to: 'funcaoorcamento: any[]' },
  
  // Referências em loops
  { from: 'for (const item of itens)', to: 'for (const item of itemorcamento)' },
  { from: 'for (const maquina of maquinas)', to: 'for (const maquina of maquinaorcamento)' },
  { from: 'for (const funcao of funcoes)', to: 'for (const funcao of funcaoorcamento)' },
  
  // Verificações de existência
  { from: 'if (!itens || itens.length === 0)', to: 'if (!itemorcamento || itemorcamento.length === 0)' },
  { from: 'if (!maquinas || maquinas.length === 0)', to: 'if (!maquinaorcamento || maquinaorcamento.length === 0)' },
  { from: 'if (!funcoes || funcoes.length === 0)', to: 'if (!funcaoorcamento || funcaoorcamento.length === 0)' },
  
  // Mapeamentos
  { from: 'itens.map(', to: 'itemorcamento.map(' },
  { from: 'maquinas.map(', to: 'maquinaorcamento.map(' },
  { from: 'funcoes.map(', to: 'funcaoorcamento.map(' },
  
  // Propriedades de objetos
  { from: 'itemorcamento:', to: 'itemorcamento:' },
  { from: 'maquinaorcamento:', to: 'maquinaorcamento:' },
  { from: 'funcaoorcamento:', to: 'funcaoorcamento:' },
  
  // Nomes de campos
  { from: 'nome_insumos:', to: 'nome_insumo:' },
  
  // Parâmetros de função corrigidos
  { from: 'private calcularQuantidadePersonalizada(insumos: any, item: any)', to: 'private calcularQuantidadePersonalizada(insumo: any, item: any)' },
  { from: 'private calcularCustoPorUnidadeUso(insumos: any)', to: 'private calcularCustoPorUnidadeUso(insumo: any)' }
];

// Aplicar todas as correções
let totalCorrections = 0;
for (const correction of corrections) {
  if (content.includes(correction.from)) {
    const regex = new RegExp(correction.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, correction.to);
      totalCorrections += matches.length;
      console.log(`✅ Corrigido ${correction.from} -> ${correction.to} (${matches.length} ocorrências)`);
    }
  }
}

// Salvar o arquivo
fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n✅ Total de correções aplicadas: ${totalCorrections}`);
console.log('✅ Arquivo corrigido com sucesso!');
