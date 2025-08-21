import fetch from 'node-fetch';

async function run() {
  try {
    console.log('🧪 Verificando se o código corrigido foi carregado...');
    
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

    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Login realizado com sucesso!');

      if (loginResult.access_token) {
        // 2. Testar dashboard SEM cache (forçar nova requisição)
        console.log('\n🔑 Testando dashboard SEM cache...');
        
        const dashboardResponse = await fetch('http://localhost:4000/api/estoque/itens/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult.access_token}`,
            'x-loja-id': loginResult.user.loja_id,
            'x-user-roles': loginResult.user.funcao,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'If-None-Match': 'force-refresh'
          }
        });

        console.log(`📊 Status do dashboard: ${dashboardResponse.status} ${dashboardResponse.statusText}`);

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          console.log('\n✅ Dashboard acessado com sucesso!');
          
          console.log('\n📈 ESTATÍSTICAS (VERIFICANDO SE AS CORREÇÕES FUNCIONARAM):');
          console.log(`  - ENTRADAS: ${dashboardData.estatisticas?.entradas || 0}`);
          console.log(`  - SAÍDAS: ${dashboardData.estatisticas?.saias || 0} ← DEVE SER 4!`);
          console.log(`  - AJUSTES: ${dashboardData.estatisticas?.ajustes || 0}`);
          console.log(`  - TRANSFERÊNCIAS: ${dashboardData.estatisticas?.transferencias || 0}`);

          // 3. Verificar se as saídas estão funcionando
          if (dashboardData.estatisticas?.saias === 4) {
            console.log('\n🎉 PROBLEMA RESOLVIDO!');
            console.log('  - Dashboard agora retorna 4 SAÍDAS');
            console.log('  - Código corrigido foi carregado');
            console.log('  - Frontend receberá o valor correto');
          } else {
            console.log('\n❌ PROBLEMA PERSISTE');
            console.log(`  - Esperado: 4 SAÍDAS`);
            console.log(`  - Recebido: ${dashboardData.estatisticas?.saias || 0} SAÍDAS`);
            console.log('\n🔍 Possíveis causas:');
            console.log('  - Backend não foi reiniciado');
            console.log('  - Código corrigido não foi carregado');
            console.log('  - Outro problema na lógica');
          }
        } else {
          const errorText = await dashboardResponse.text();
          console.log(`❌ Erro no dashboard: ${errorText}`);
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
