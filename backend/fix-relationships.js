const fs = require('fs');

// Ler o arquivo
const filePath = './src/orcamentos/orcamentos.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Mapeamento dos relacionamentos
const relationshipMappings = {
  'itens:': 'itemorcamento:',
  'maquinas:': 'maquinaorcamento:',
  'funcoes:': 'funcaoorcamento:',
  'insumo:': 'insumos:',
  'orcamento.itens': 'orcamento.itemorcamento',
  'orcamento.maquinas': 'orcamento.maquinaorcamento',
  'orcamento.funcoes': 'orcamento.funcaoorcamento'
};

// Aplicar todas as correções
for (const [oldName, newName] of Object.entries(relationshipMappings)) {
  if (content.includes(oldName)) {
    content = content.replace(new RegExp(oldName, 'g'), newName);
    console.log(`✅ Corrigido ${oldName} -> ${newName}`);
  }
}

// Salvar o arquivo
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Relacionamentos corrigidos com sucesso!');
