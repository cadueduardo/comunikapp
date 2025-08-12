const http = require('http');

async function testarMovimentacoes() {
  try {
    console.log('📦 Testando movimentações de estoque...');
    
    // Simular requisição do frontend
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/estoque/movimentacoes',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoiYWRtaW5AY29tdW5pa2FwcC5jb20iLCJsb2phX2lkIjoiY21lMW9wczE1MDAwMHc0aWtrZHRxMGgzeCIsImZ1bmNhbyI6IkFETUlOSVNUUkFET1IiLCJub21lX2NvbXBsZXRvIjoiQWRtaW5pc3RyYWRvciBDb211bmlrYXBwIiwiaWF0IjoxNzU0NjA0MjQ1LCJleHAiOjE3NTQ2OTA2NDV9.7HS9PFmfQ7rKQiZeive8L5ciTZ8-VBJlrgSVGiA0wsg',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    const req = http.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`📡 Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📋 Resposta completa:');
        try {
          const jsonData = JSON.parse(data);
          console.log(JSON.stringify(jsonData, null, 2));
          
          if (jsonData.data && Array.isArray(jsonData.data)) {
            console.log(`\n✅ Movimentações carregadas com sucesso!`);
            console.log(`   Total de movimentações: ${jsonData.data.length}`);
            jsonData.data.forEach((mov, index) => {
              console.log(`   ${index + 1}. ${mov.tipo} - ${mov.insumoNome} (${mov.quantidade})`);
            });
          } else {
            console.log('\n❌ Movimentações não retornaram dados válidos');
          }
        } catch (e) {
          console.log('❌ Erro ao parsear JSON:', data);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Erro na requisição:', e.message);
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testarMovimentacoes();
