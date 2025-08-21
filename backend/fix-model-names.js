const fs = require('fs');
const path = require('path');

// Mapeamento dos nomes dos modelos (camelCase -> minúsculas)
const modelNameMappings = {
  'itemOrcamento': 'itemorcamento',
  'maquinaOrcamento': 'maquinaorcamento',
  'funcaoOrcamento': 'funcaoorcamento',
  'mensagemNegociacao': 'mensagemnegociacao',
  'custoIndireto': 'custoindireto'
};

// Função para corrigir nomes em um arquivo
function fixModelNamesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Aplicar todas as correções
    for (const [oldName, newName] of Object.entries(modelNameMappings)) {
      const regex = new RegExp(`this\\.prisma\\.${oldName}`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `this.prisma.${newName}`);
        hasChanges = true;
        console.log(`✅ Corrigido ${oldName} -> ${newName} em ${filePath}`);
      }
    }

    // Se houve mudanças, salvar o arquivo
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
  return false;
}

// Função para processar todos os arquivos TypeScript
function processTypeScriptFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processTypeScriptFiles(filePath);
    } else if (file.endsWith('.ts')) {
      fixModelNamesInFile(filePath);
    }
  }
}

// Executar o script
console.log('🔧 Iniciando correção dos nomes dos modelos...');
processTypeScriptFiles('./src');
console.log('✅ Correção concluída!');
