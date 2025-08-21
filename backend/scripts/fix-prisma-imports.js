#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Corrigindo imports incorretos do Prisma...\n');

// Função para corrigir imports em um arquivo
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Corrigir import { Loja } from '@prisma/client';
    if (content.includes("import { Loja } from '@prisma/client';")) {
      content = content.replace(
        "import { Loja } from '@prisma/client';",
        "import { loja } from '@prisma/client';"
      );
      modified = true;
    }
    
    // Corrigir referências Loja para loja
    if (content.includes(': Loja')) {
      content = content.replace(/: Loja/g, ': loja');
      modified = true;
    }
    
    if (content.includes('?: Loja')) {
      content = content.replace(/\?: Loja/g, '?: loja');
      modified = true;
    }
    
    if (content.includes('<Loja>')) {
      content = content.replace(/<Loja>/g, '<loja>');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função para processar diretório recursivamente
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalFixed = 0;
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      totalFixed += processDirectory(fullPath);
    } else if (file.endsWith('.ts') && !file.includes('.d.ts')) {
      if (fixImportsInFile(fullPath)) {
        totalFixed++;
      }
    }
  }
  
  return totalFixed;
}

// Executar correções
try {
  const srcDir = path.join(__dirname, '..', 'src');
  const totalFixed = processDirectory(srcDir);
  
  console.log(`\n🎉 Correção concluída! ${totalFixed} arquivos corrigidos.`);
  
  // Regenerar cliente Prisma
  console.log('\n🔄 Regenerando cliente Prisma...');
  execSync('npm run db:generate', { 
    cwd: path.join(__dirname, '..'), 
    stdio: 'inherit' 
  });
  
  console.log('\n✅ Cliente Prisma regenerado!');
  console.log('📋 Agora tente executar o projeto novamente:');
  console.log('   cd ..');
  console.log('   npm run dev:test');
  
} catch (error) {
  console.error('❌ Erro durante a correção:', error.message);
  process.exit(1);
}

