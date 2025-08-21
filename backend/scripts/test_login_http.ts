import fetch from 'node-fetch';

async function run() {
  try {
    console.log('🧪 Testando login via HTTP...');
    
    // Dados do usuário apto
    const loginData = {
      email: 'clientes.cadueduardo@gmail.com',
      password: 'teste123' // Senha de teste
    };
    
    console.log(`📧 Tentando login com: ${loginData.email}`);
    
    // Fazer requisição de login
    const response = await fetch('http://localhost:4000/lojas/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Login realizado com sucesso!');
      console.log(`  - Message: ${data.message}`);
      console.log(`  - Access Token: ${data.access_token ? '✅ Gerado' : '❌ Não gerado'}`);
      console.log(`  - User ID: ${data.user?.id}`);
      console.log(`  - User Name: ${data.user?.nome_completo}`);
      console.log(`  - Loja ID: ${data.user?.loja_id}`);
      console.log(`  - Função: ${data.user?.funcao}`);
      
      if (data.access_token) {
        console.log('\n🔑 Token JWT válido gerado!');
        console.log(`  - Token: ${data.access_token.substring(0, 50)}...`);
        
        // Testar se o token funciona no dashboard
        console.log('\n🧪 Testando token no dashboard...');
        
        const dashboardResponse = await fetch('http://localhost:4000/api/estoque/itens/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'x-loja-id': data.user.loja_id,
            'x-user-roles': data.user.funcao
          }
        });
        
        console.log(`📊 Dashboard Status: ${dashboardResponse.status} ${dashboardResponse.statusText}`);
        
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
          
        } else {
          const errorText = await dashboardResponse.text();
          console.log(`❌ Erro no dashboard: ${errorText}`);
        }
        
      } else {
        console.log('❌ Token não foi gerado!');
      }
      
    } else {
      const errorData = await response.json();
      console.log(`❌ Erro no login: ${errorData.message}`);
      
      if (errorData.message === 'Credenciais inválidas.') {
        console.log('\n💡 Possíveis causas:');
        console.log('  - Senha incorreta');
        console.log('  - Email não encontrado');
        console.log('  - Usuário não ativo');
        console.log('  - Email não verificado');
      }
    }
    
  } catch (e: any) {
    console.error('❌ Erro na requisição:', e.message);
    
    if (e.message.includes('Failed to fetch')) {
      console.log('\n💡 Possíveis causas:');
      console.log('  - Backend não está rodando');
      console.log('  - Porta 4000 não está acessível');
      console.log('  - Problema de CORS');
    }
  }
}

run();
