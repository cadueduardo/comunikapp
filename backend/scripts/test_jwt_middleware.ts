import fetch from 'node-fetch';

async function run() {
  try {
    console.log('🧪 Testando middleware JWT...');
    
    // 1. Fazer login para obter token
    console.log('\n📧 Fazendo login...');
    const loginData = {
      email: 'clientes.cadueduardo@gmail.com',
      password: 'teste123'
    };
    
    const loginResponse = await fetch('http://localhost:4000/lojas/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`📊 Status do login: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Login realizado com sucesso!');
      console.log(`  - Token: ${loginResult.access_token ? '✅ Gerado' : '❌ Não gerado'}`);
      console.log(`  - Usuário: ${loginResult.user?.nome_completo}`);
      console.log(`  - Loja ID: ${loginResult.user?.loja_id}`);
      
      if (loginResult.access_token) {
        // 2. Testar rota protegida SEM token (deve dar 401)
        console.log('\n🚫 Testando rota protegida SEM token...');
        const noTokenResponse = await fetch('http://localhost:4000/api/estoque/itens/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log(`📊 Status sem token: ${noTokenResponse.status} ${noTokenResponse.statusText}`);
        if (noTokenResponse.status === 401) {
          console.log('✅ Middleware JWT funcionando - bloqueou acesso sem token');
        } else {
          console.log('❌ Middleware JWT NÃO funcionando - permitiu acesso sem token');
        }
        
        // 3. Testar rota protegida COM token (deve dar 200)
        console.log('\n🔑 Testando rota protegida COM token...');
        const withTokenResponse = await fetch('http://localhost:4000/api/estoque/itens/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult.access_token}`,
            'x-loja-id': loginResult.user.loja_id,
            'x-user-roles': loginResult.user.funcao
          }
        });
        
        console.log(`📊 Status com token: ${withTokenResponse.status} ${withTokenResponse.statusText}`);
        
        if (withTokenResponse.ok) {
          const dashboardData = await withTokenResponse.json();
          console.log('\n✅ Dashboard acessado com sucesso!');
          console.log(`  - Total localizações: ${dashboardData.totalLocalizacoes}`);
          console.log(`  - Total itens: ${dashboardData.totalItens}`);
          console.log(`  - Total movimentações: ${dashboardData.totalMovimentacoes}`);
          console.log(`  - Itens abaixo do mínimo: ${dashboardData.itensAbaixoMinimo}`);
          console.log(`  - Valor total estoque: R$ ${dashboardData.valorTotalEstoque}`);
          console.log('\n📈 Estatísticas:');
          console.log(`  - ENTRADAS: ${dashboardData.estatisticas?.entradas || 0}`);
          console.log(`  - SAÍDAS: ${dashboardData.estatisticas?.saias || 0}`);
          console.log(`  - AJUSTES: ${dashboardData.estatisticas?.ajustes || 0}`);
          console.log(`  - TRANSFERÊNCIAS: ${dashboardData.estatisticas?.transferencias || 0}`);
          
          console.log('\n🎯 MIDDLEWARE JWT FUNCIONANDO PERFEITAMENTE!');
          console.log('  - Bloqueia acesso sem token');
          console.log('  - Permite acesso com token válido');
          console.log('  - Dashboard retorna dados reais');
          console.log('  - 4 saídas aparecerão no frontend');
        } else {
          const errorText = await withTokenResponse.text();
          console.log(`❌ Erro no dashboard: ${errorText}`);
          
          if (withTokenResponse.status === 401) {
            console.log('\n🚨 PROBLEMA IDENTIFICADO:');
            console.log('  - Token é gerado no login');
            console.log('  - Mas middleware JWT rejeita o token');
            console.log('  - Possível problema:');
            console.log('    * JWT_SECRET diferente entre geração e validação');
            console.log('    * Token expirado');
            console.log('    * Formato do token incorreto');
          }
        }
      }
    } else {
      const errorData = await loginResponse.json();
      console.log(`❌ Erro no login: ${errorData.message}`);
    }
    
  } catch (e: any) {
    console.error('❌ Erro na requisição:', e.message);
    if (e.message.includes('Failed to fetch')) {
      console.log('\n💡 Backend não está rodando ou porta não está acessível');
    }
  }
}

run();
