const fs = require('fs');

// Ler o arquivo
const filePath = './src/orcamentos/orcamentos.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Mapeamento final de todas as correções necessárias
const corrections = [
  // Reverter para usar os nomes corretos dos DTOs
  { from: 'dto.itemorcamento', to: 'dto.itens' },
  { from: 'dto.maquinaorcamento', to: 'dto.maquinas' },
  { from: 'dto.funcaoorcamento', to: 'dto.funcoes' },
  
  // Corrigir propriedades de objetos
  { from: 'itemorcamento:', to: 'itens:' },
  { from: 'maquinaorcamento:', to: 'maquinas:' },
  { from: 'funcaoorcamento:', to: 'funcoes:' },
  
  // Corrigir referências aos resultados
  { from: 'resultado.itemorcamento', to: 'resultado.itens' },
  { from: 'resultado.maquinaorcamento', to: 'resultado.maquinas' },
  { from: 'resultado.funcaoorcamento', to: 'resultado.funcoes' },
  
  // Corrigir parâmetros de função
  { from: 'itemorcamento: any[]', to: 'itens: any[]' },
  { from: 'maquinaorcamento: any[]', to: 'maquinas: any[]' },
  { from: 'funcaoorcamento: any[]', to: 'funcoes: any[]' },
  
  // Corrigir variáveis locais
  { from: 'const itemorcamento =', to: 'const itens =' },
  { from: 'const maquinaorcamento =', to: 'const maquinas =' },
  { from: 'const funcaoorcamento =', to: 'const funcoes =' },
  
  // Corrigir loops
  { from: 'for (const item of itemorcamento)', to: 'for (const item of itens)' },
  { from: 'for (const maquina of maquinaorcamento)', to: 'for (const maquina of maquinas)' },
  { from: 'for (const funcao of funcaoorcamento)', to: 'for (const funcao of funcoes)' },
  
  // Corrigir verificações
  { from: 'if (!itemorcamento || itemorcamento.length === 0)', to: 'if (!itens || itens.length === 0)' },
  { from: 'if (!maquinaorcamento || maquinaorcamento.length === 0)', to: 'if (!maquinas || maquinas.length === 0)' },
  { from: 'if (!funcaoorcamento || funcaoorcamento.length === 0)', to: 'if (!funcoes || funcoes.length === 0)' },
  
  // Corrigir mapeamentos
  { from: 'itemorcamento.map(', to: 'itens.map(' },
  { from: 'maquinaorcamento.map(', to: 'maquinas.map(' },
  { from: 'funcaoorcamento.map(', to: 'funcoes.map(' },
  
  // Corrigir propriedades de objetos de resultado
  { from: 'orcamento.itemorcamento', to: 'orcamento.itemorcamento' }, // Manter para relacionamentos Prisma
  { from: 'orcamento.maquinaorcamento', to: 'orcamento.maquinaorcamento' }, // Manter para relacionamentos Prisma
  { from: 'orcamento.funcaoorcamento', to: 'orcamento.funcaoorcamento' }, // Manter para relacionamentos Prisma
  
  // Corrigir propriedades de objetos de resultado
  { from: 'orcamento.itens', to: 'orcamento.itemorcamento' }, // Converter para relacionamentos Prisma
  { from: 'orcamento.maquinas', to: 'orcamento.maquinaorcamento' }, // Converter para relacionamentos Prisma
  { from: 'orcamento.funcoes', to: 'orcamento.funcaoorcamento' }, // Converter para relacionamentos Prisma }
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
