"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, 'src/orcamentos/orcamentos.service.ts');
let content = fs.readFileSync(filePath, 'utf8');
const corrections = [
    {
        from: /loja\.margem_lucro_padrao/g,
        to: '0.30'
    },
    {
        from: /loja\.impostos_padrao/g,
        to: '0.05'
    },
    {
        from: /loja\.horas_produtivas_mensais/g,
        to: '352'
    },
    {
        from: /loja\.custos_indiretos_mensais/g,
        to: '0'
    },
    {
        from: /loja\.custo_maquinaria_hora/g,
        to: '0'
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
corrections.forEach(correction => {
    content = content.replace(correction.from, correction.to);
});
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Arquivo orcamentos.service.ts corrigido!');
console.log('Principais correções aplicadas:');
console.log('- Removidas referências a campos inexistentes do modelo Loja');
console.log('- Corrigidos nomes de campos dos relacionamentos');
console.log('- Aplicados valores padrão para configurações');
//# sourceMappingURL=fix-orcamentos-service.js.map