const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.CATALOGO_INSUMOS_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: 'catalogo-insumos',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: 'mock',
    version: '1.0.0',
    message: 'Servidor funcionando!'
  });
});

// Mock endpoints para teste
app.get('/api/catalogo-insumos', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'mock-1',
        codigo_catalogo: 'PAPEL-001',
        nome: 'Papel Couchê 90g',
        unidade_compra: 'resma',
        unidade_uso: 'folha',
        fator_conversao: 500,
        logica_consumo: 'area',
        disponibilidade: true,
        ativo: true
      },
      {
        id: 'mock-2',
        codigo_catalogo: 'TINTA-001',
        nome: 'Tinta Offset Preta',
        unidade_compra: 'kg',
        unidade_uso: 'ml',
        fator_conversao: 1000,
        logica_consumo: 'volume',
        disponibilidade: true,
        ativo: true
      }
    ],
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1
  });
});

app.post('/api/catalogo-insumos', (req, res) => {
  const { nome, codigo_catalogo, unidade_compra, unidade_uso, fator_conversao, logica_consumo } = req.body;
  
  if (!nome || !codigo_catalogo || !unidade_compra || !unidade_uso || !fator_conversao || !logica_consumo) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios: nome, codigo_catalogo, unidade_compra, unidade_uso, fator_conversao, logica_consumo'
    });
  }
  
  res.status(201).json({
    success: true,
    data: {
      id: 'mock-' + Date.now(),
      ...req.body,
      disponibilidade: true,
      ativo: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
});

app.get('/api/catalogo-insumos/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      codigo_catalogo: 'PAPEL-001',
      nome: 'Papel Couchê 90g',
      unidade_compra: 'resma',
      unidade_uso: 'folha',
      fator_conversao: 500,
      logica_consumo: 'area',
      disponibilidade: true,
      ativo: true
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor do Catálogo de Insumos iniciado!');
  console.log(`📡 API rodando em: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Endpoints disponíveis:');
  console.log('  GET    /health                    - Health check');
  console.log('  GET    /api/catalogo-insumos      - Listar insumos');
  console.log('  POST   /api/catalogo-insumos      - Criar insumo');
  console.log('  GET    /api/catalogo-insumos/:id  - Buscar por ID');
  console.log('');
  console.log('🧪 Este é um servidor MOCK para testes!');
  console.log('💡 Use Postman, Insomnia ou cURL para testar os endpoints');
});
