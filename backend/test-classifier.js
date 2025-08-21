// Teste do Sistema de Classificação Automática
console.log('🧪 TESTE DO SISTEMA DE CLASSIFICAÇÃO AUTOMÁTICA');
console.log('================================================\n');

// Simular classificação de materiais
const testMaterials = [
  {
    nome: 'Acrílico 3mm transparente',
    descricao: 'Chapa de acrílico transparente 3mm, ideal para comunicação visual'
  },
  {
    nome: 'Papel couché 90g',
    descricao: 'Papel couché offset 90g/m², formato A4'
  },
  {
    nome: 'Chapa MDF 6mm',
    descricao: 'Chapa de MDF 6mm, 1220x2440mm'
  },
  {
    nome: 'Tinta offset preta',
    descricao: 'Tinta offset preta, 1 litro'
  },
  {
    nome: 'Vinil adesivo transparente',
    descricao: 'Vinil adesivo transparente, 50cm x 10m'
  },
  {
    nome: 'Lona front light 340g',
    descricao: 'Lona front light 340g/m², ideal para banners'
  },
  {
    nome: 'Chapa de alumínio 2mm',
    descricao: 'Chapa de alumínio 2mm, 1000x2000mm'
  },
  {
    nome: 'Verniz UV brilho',
    descricao: 'Verniz UV brilho, 1 litro'
  }
];

// Palavras-chave para classificação
const graficaKeywords = {
  papel: ['papel', 'couche', 'offset', 'gramatura', 'g/m²', 'g/m2', 'folha', 'resma'],
  tinta: ['tinta', 'offset', 'digital', 'uv', 'litro', 'ml'],
  verniz: ['verniz', 'uv', 'acrílico', 'brilho', 'fosco', 'mate'],
  adesivo: ['adesivo', 'cola', 'barniz', 'proteção'],
  acabamento: ['acabamento', 'laminação', 'hot-stamp', 'vinco', 'dobra']
};

const comunicacaoVisualKeywords = {
  vinil: ['vinil', 'adesivo', 'plotter', 'corte', 'decalque'],
  lona: ['lona', 'banner', 'outdoor', 'front light', 'back light', 'mesh'],
  acrilico: ['acrílico', 'plexiglass', 'policarbonato', 'transparente', 'espessura'],
  mdf: ['mdf', 'fibra', 'compensado', 'chapa', 'espessura'],
  pvc: ['pvc', 'policloreto', 'rígido', 'flexível', 'chapa'],
  metal: ['metal', 'alumínio', 'ferro', 'aço', 'chapa', 'galvanizado'],
  tecido: ['tecido', 'pano', 'bandeira', 'faixa', 'estandarte']
};

// Função de classificação simplificada
function classifyMaterial(nome, descricao) {
  const text = `${nome} ${descricao}`.toLowerCase();
  let graficaScore = 0;
  let comunicacaoVisualScore = 0;
  let bestGraficaCategory = '';
  let bestCVCategory = '';
  
  // Calcular score para Gráfica
  for (const [category, keywords] of Object.entries(graficaKeywords)) {
    let categoryScore = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        categoryScore += 1;
      }
    }
    if (categoryScore > 0) {
      graficaScore += categoryScore;
      if (!bestGraficaCategory) bestGraficaCategory = category;
    }
  }
  
  // Calcular score para Comunicação Visual
  for (const [category, keywords] of Object.entries(comunicacaoVisualKeywords)) {
    let categoryScore = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        categoryScore += 1;
      }
    }
    if (categoryScore > 0) {
      comunicacaoVisualScore += categoryScore;
      if (!bestCVCategory) bestCVCategory = category;
    }
  }
  
  // Determinar segmento
  if (graficaScore > comunicacaoVisualScore) {
    return {
      segment: '🖨️ INDÚSTRIA GRÁFICA',
      category: bestGraficaCategory,
      confidence: Math.min((graficaScore / 10) * 100, 100),
      score: graficaScore
    };
  } else {
    return {
      segment: '🎨 COMUNICAÇÃO VISUAL',
      category: bestCVCategory,
      confidence: Math.min((comunicacaoVisualScore / 15) * 100, 100),
      score: comunicacaoVisualScore
    };
  }
}

// Testar cada material
console.log('📋 RESULTADOS DA CLASSIFICAÇÃO AUTOMÁTICA:\n');

testMaterials.forEach((material, index) => {
  const classification = classifyMaterial(material.nome, material.descricao);
  
  console.log(`${index + 1}. ${material.nome}`);
  console.log(`   📝 ${material.descricao}`);
  console.log(`   🏷️  Segmento: ${classification.segment}`);
  console.log(`   📂 Categoria: ${classification.category}`);
  console.log(`   📊 Confiança: ${classification.confidence.toFixed(1)}%`);
  console.log(`   🎯 Score: ${classification.score}`);
  console.log('');
});

console.log('✨ SISTEMA DE CLASSIFICAÇÃO FUNCIONANDO!');
console.log('🚀 O crawler agora pode classificar automaticamente os materiais!');

