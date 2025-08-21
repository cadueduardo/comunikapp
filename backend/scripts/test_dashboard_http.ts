import fetch from 'node-fetch';

async function run() {
  try {
    console.log('🧪 Testando rota do dashboard via HTTP...');
    
    // Simular uma requisição do frontend
    const url = 'http://localhost:4000/api/estoque/itens/dashboard';
    console.log(`📡 Fazendo requisição para: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'x-loja-id': 'xyjrwbqff',
        'x-user-roles': 'admin'
      }
    });
    
    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Dashboard retornado com sucesso:');
      console.log(`  - Total localizações: ${data.totalLocalizacoes}`);
      console.log(`  - Total itens: ${data.totalItens}`);
      console.log(`  - Total movimentações: ${data.totalMovimentacoes}`);
      console.log(`  - Itens abaixo do mínimo: ${data.itensAbaixoMinimo}`);
      console.log(`  - Valor total estoque: R$ ${data.valorTotalEstoque}`);
      
      console.log('\n📈 Estatísticas:');
      console.log(`  - ENTRADAS: ${data.estatisticas?.entradas || 0}`);
      console.log(`  - SAÍDAS: ${data.estatisticas?.saias || 0}`);
      console.log(`  - AJUSTES: ${data.estatisticas?.ajustes || 0}`);
      console.log(`  - TRANSFERÊNCIAS: ${data.estatisticas?.transferencias || 0}`);
      
      console.log('\n🔄 Últimas movimentações:');
      if (data.ultimasMovimentacoes && data.ultimasMovimentacoes.length > 0) {
        data.ultimasMovimentacoes.forEach((mov: any, index: number) => {
          console.log(`  ${index + 1}. ${mov.tipo} - ${mov.insumoNome} (${mov.quantidade})`);
        });
      } else {
        console.log('  ❌ Nenhuma movimentação retornada');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro na resposta: ${errorText}`);
    }
    
  } catch (e: any) {
    console.error('❌ Erro na requisição:', e.message);
  }
}

run();
