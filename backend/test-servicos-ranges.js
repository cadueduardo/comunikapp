// Teste da API de serviços manuais com ranges
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Dados de teste com ranges
const servicoComRanges = {
  nome: 'Montagem de Banner (Teste)',
  descricao: 'Serviço de montagem com categorias por tamanho',
  custo_hora: 25.00,
  tipo_calculo: 'POR_PECA_COM_CATEGORIA',
  eficiencia_percent: 80,
  setup_min: 30, // 30 minutos de setup
  categorias: [
    {
      nome: 'Pequeno',
      ate_m2: 2.0,
      tempo_min: 15
    },
    {
      nome: 'Médio', 
      ate_m2: 6.0,
      tempo_min: 25
    },
    {
      nome: 'Grande',
      ate_m2: 999.0,
      tempo_min: 40
    }
  ]
};

async function testarAPI() {
  try {
    console.log('🧪 Testando API de Serviços Manuais com Ranges...');
    
    // Teste de criação
    console.log('\n📝 Criando serviço com ranges...');
    const response = await axios.post(`${BASE_URL}/servicos-manuais`, servicoComRanges, {
      headers: {
        'Authorization': 'Bearer SEU_TOKEN_AQUI',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Serviço criado:', response.data);
    
    // Teste de listagem
    console.log('\n📋 Listando serviços...');
    const listResponse = await axios.get(`${BASE_URL}/servicos-manuais`, {
      headers: {
        'Authorization': 'Bearer SEU_TOKEN_AQUI'
      }
    });
    
    console.log('✅ Serviços encontrados:', listResponse.data.length);
    
    // Verificar se categorias foram parseadas corretamente
    const servicoComCategorias = listResponse.data.find(s => s.tipo_calculo === 'POR_PECA_COM_CATEGORIA');
    if (servicoComCategorias) {
      console.log('✅ Categorias parseadas:', servicoComCategorias.categorias);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

console.log('⚠️  ATENÇÃO: Substitua SEU_TOKEN_AQUI por um token válido antes de executar');
console.log('⚠️  Execute: node test-servicos-ranges.js');

// testarAPI(); // Descomente para executar
