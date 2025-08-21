#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Corrigindo TODOS os erros TypeScript...\n');

// Função para corrigir imports e tipos em um arquivo
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 1. Corrigir imports incorretos do Prisma
    if (content.includes("import { Loja } from '@prisma/client';")) {
      content = content.replace(
        "import { Loja } from '@prisma/client';",
        "import { loja } from '@prisma/client';"
      );
      modified = true;
    }
    
    if (content.includes("import { FuncaoUsuario, StatusConta, StatusLoja } from '@prisma/client';")) {
      content = content.replace(
        "import { FuncaoUsuario, StatusConta, StatusLoja } from '@prisma/client';",
        "import { usuario_funcao, usuario_status, loja_status } from '@prisma/client';"
      );
      modified = true;
    }
    
    // 2. Corrigir referências de tipos
    content = content.replace(/: Loja/g, ': loja');
    content = content.replace(/\?: Loja/g, '?: loja');
    content = content.replace(/<Loja>/g, '<loja>');
    
    // 3. Corrigir enums
    content = content.replace(/StatusConta\./g, 'usuario_status.');
    content = content.replace(/StatusLoja\./g, 'loja_status.');
    content = content.replace(/FuncaoUsuario\./g, 'usuario_funcao.');
    
    // 4. Corrigir constructors com tipos incorretos
    if (content.includes("constructor(private readonly lojasService: lojasService)")) {
      content = content.replace(
        "constructor(private readonly lojasService: lojasService)",
        "constructor(private readonly lojasService: LojasService)"
      );
      modified = true;
    }
    
    // 5. Corrigir criação de dados (adicionar campos obrigatórios)
    if (content.includes("await tx.loja.create({") && !content.includes("id:")) {
      content = content.replace(
        "await tx.loja.create({",
        "await tx.loja.create({\n          id: Math.random().toString(36).substr(2, 9),"
      );
      modified = true;
    }
    
    if (content.includes("await tx.usuario.create({") && !content.includes("id:")) {
      content = content.replace(
        "await tx.usuario.create({",
        "await tx.usuario.create({\n          id: Math.random().toString(36).substr(2, 9),"
      );
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
      if (fixFile(fullPath)) {
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

