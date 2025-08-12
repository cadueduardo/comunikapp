// Script para corrigir o serviço de orçamentos
// Execute: npx ts-node fix-orcamentos-service.ts

import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, 'src/orcamentos/orcamentos.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Correções necessárias
const corrections = [
  // Remover referências a campos que não existem mais no modelo Loja
  {
    from: /loja\.margem_lucro_padrao/g,
    to: '0.30' // valor padrão 30%
  },
  {
    from: /loja\.impostos_padrao/g,
    to: '0.05' // valor padrão 5%
  },
  {
    from: /loja\.horas_produtivas_mensais/g,
    to: '352' // valor padrão
  },
  {
    from: /loja\.custos_indiretos_mensais/g,
    to: '0' // valor padrão
  },
  {
    from: /loja\.custo_maquinaria_hora/g,
    to: '0' // valor padrão
  },
  {
    from: /custoIndireto\.valor_mensal/g,
    to: 'custoIndireto.valor'
  },
  {
    from: /maquina\.horas_utilizadas/g,
    to: 'maquina.horas'
  },
  {
    from: /funcao\.horas_trabalhadas/g,
    to: 'funcao.horas'
  }
];

// Aplicar correções
corrections.forEach(correction => {
  content = content.replace(correction.from, correction.to);
});

// Salvar arquivo corrigido
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Arquivo orcamentos.service.ts corrigido!');
console.log('Principais correções aplicadas:');
console.log('- Removidas referências a campos inexistentes do modelo Loja');
console.log('- Corrigidos nomes de campos dos relacionamentos');
console.log('- Aplicados valores padrão para configurações');


