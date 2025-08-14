const http = require('http');

async function testarComunicacao() {
  try {
    console.log('🔍 Testando comunicação frontend-backend...');
    
    // Simular requisição do frontend
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/estoque/itens',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoiYWRtaW5AY29tdW5pa2FwcC5jb20iLCJsb2phX2lkIjoiY21lMW9wczE1MDAwMHc0aWtrZHRxMGgzeCIsImZ1bmNhbyI6IkFETUlOSVNUUkFET1IiLCJub21lX2NvbXBsZXRvIjoiQWRtaW5pc3RyYWRvciBDb211bmlrYXBwIiwiaWF0IjoxNzU0NjA0MjExLCJleHAiOjE3NTQ2OTA2MTF9.gcZ3gg5NZgbeM6n8BQ3XB5f_Ml-DDgZ7Jbwwy8DgEjU',
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
          
          if (jsonData.data && jsonData.data.length > 0) {
            console.log(`\n✅ ${jsonData.data.length} itens encontrados!`);
          } else {
            console.log('\n❌ Nenhum item encontrado');
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

testarComunicacao();
