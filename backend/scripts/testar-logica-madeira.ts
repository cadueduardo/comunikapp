/**
 * Script para testar a lógica de cálculo de madeira
 */

function testarLogicaMadeira() {
  console.log('🧪 TESTANDO LÓGICA DE MADEIRA\n');
  
  const cenarios = [
    { quantidadeBanners: 25, cmPorBanner: 100, cmDisponivel: 105, esperado: 25 },
    { quantidadeBanners: 25, cmPorBanner: 100, cmDisponivel: 104, esperado: 25 },
    { quantidadeBanners: 25, cmPorBanner: 100, cmDisponivel: 200, esperado: 13 }, // 200cm pode fazer 2 banners
    { quantidadeBanners: 10, cmPorBanner: 100, cmDisponivel: 105, esperado: 10 },
    { quantidadeBanners: 50, cmPorBanner: 100, cmDisponivel: 105, esperado: 50 },
  ];
  
  cenarios.forEach((cenario, index) => {
    console.log(`📋 Cenário ${index + 1}:`);
    console.log(`   Banners: ${cenario.quantidadeBanners}`);
    console.log(`   CM por banner: ${cenario.cmPorBanner}`);
    console.log(`   CM disponível: ${cenario.cmDisponivel}`);
    
    const sobra = cenario.cmDisponivel - cenario.cmPorBanner;
    console.log(`   Sobra: ${sobra}cm`);
    
    let resultado;
    if (sobra < cenario.cmPorBanner) {
      // Cada banner precisa de uma unidade completa
      resultado = cenario.quantidadeBanners;
      console.log(`   ✅ Sobra não aproveitável (< ${cenario.cmPorBanner}cm)`);
    } else {
      // Sobra pode ser aproveitada
      resultado = Math.ceil((cenario.cmPorBanner * cenario.quantidadeBanners) / cenario.cmDisponivel);
      console.log(`   🔄 Sobra aproveitável (>= ${cenario.cmPorBanner}cm)`);
    }
    
    const correto = resultado === cenario.esperado;
    console.log(`   📊 Resultado: ${resultado} UNID`);
    console.log(`   🎯 Esperado: ${cenario.esperado} UNID`);
    console.log(`   ${correto ? '✅' : '❌'} ${correto ? 'CORRETO' : 'INCORRETO'}\n`);
  });
  
  console.log('🏁 Teste concluído!');
}

// Executar teste
testarLogicaMadeira();
