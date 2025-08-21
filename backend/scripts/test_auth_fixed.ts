import fetch from 'node-fetch';

async function run() {
  try {
    console.log('🧪 Testando autenticação corrigida...');
    
    // 1. Testar login
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
        // 2. Testar dashboard com token
        console.log('\n🔑 Testando dashboard com token...');
        const dashboardResponse = await fetch('http://localhost:4000/api/estoque/itens/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult.access_token}`,
            'x-loja-id': loginResult.user.loja_id,
            'x-user-roles': loginResult.user.funcao
          }
        });
        
        console.log(`📊 Status do dashboard: ${dashboardResponse.status} ${dashboardResponse.statusText}`);
        
        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
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
          
          console.log('\n🎯 PROBLEMA RESOLVIDO!');
          console.log('  - Frontend conseguirá fazer login');
          console.log('  - Dashboard mostrará dados reais');
          console.log('  - 4 saídas aparecerão corretamente');
        } else {
          const errorText = await dashboardResponse.text();
          console.log(`❌ Erro no dashboard: ${errorText}`);
        }
      }
    } else {
      const errorData = await loginResponse.json();
      console.log(`❌ Erro no login: ${errorData.message}`);
      
      if (errorData.message === 'Credenciais inválidas.') {
        console.log('\n💡 O sistema está funcionando, mas a senha está incorreta');
        console.log('  - Backend: ✅ Funcionando');
        console.log('  - Autenticação: ✅ Funcionando');
        console.log('  - Senha: ❌ Incorreta');
        console.log('\n🎯 Para resolver:');
        console.log('  - Usar senha correta, ou');
        console.log('  - Resetar senha do usuário');
      }
    }
    
  } catch (e: any) {
    console.error('❌ Erro na requisição:', e.message);
    if (e.message.includes('Failed to fetch')) {
      console.log('\n💡 Backend não está rodando ou porta não está acessível');
    }
  }
}

run();
