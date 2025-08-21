const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.CATALOGO_INSUMOS_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Documentação Swagger
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API do Catálogo de Insumos',
    description: 'API para gestão do catálogo global de insumos pré-cadastrados',
    version: '1.0.0',
    contact: {
      name: 'Equipe de Desenvolvimento',
      email: 'dev@comunikapp.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Servidor Local'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health Check'],
        summary: 'Verificar saúde do sistema',
        description: 'Endpoint para verificar se o sistema está funcionando',
        responses: {
          '200': {
            description: 'Sistema funcionando',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    module: { type: 'string', example: 'catalogo-insumos' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 80 },
                    database: { type: 'string', example: 'mock' },
                    version: { type: 'string', example: '1.0.0' },
                    message: { type: 'string', example: 'Servidor funcionando!' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/catalogo-insumos': {
      get: {
        tags: ['Catálogo de Insumos'],
        summary: 'Listar insumos',
        description: 'Retorna lista paginada de insumos do catálogo',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Número da página',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Itens por página',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'nome',
            in: 'query',
            description: 'Filtrar por nome',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de insumos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Insumo'
                      }
                    },
                    total: { type: 'number' },
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    totalPages: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Catálogo de Insumos'],
        summary: 'Criar novo insumo',
        description: 'Cria um novo insumo no catálogo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateInsumoRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Insumo criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Insumo' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Dados inválidos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/catalogo-insumos/{id}': {
      get: {
        tags: ['Catálogo de Insumos'],
        summary: 'Buscar insumo por ID',
        description: 'Retorna um insumo específico do catálogo',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID do insumo',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Insumo encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Insumo' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Insumo: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'mock-1' },
          codigo_catalogo: { type: 'string', example: 'PAPEL-001' },
          nome: { type: 'string', example: 'Papel Couchê 90g' },
          unidade_compra: { type: 'string', example: 'resma' },
          unidade_uso: { type: 'string', example: 'folha' },
          fator_conversao: { type: 'number', example: 500 },
          logica_consumo: { type: 'string', example: 'area' },
          disponibilidade: { type: 'boolean', example: true },
          ativo: { type: 'boolean', example: true }
        }
      },
      CreateInsumoRequest: {
        type: 'object',
        required: ['nome', 'codigo_catalogo', 'unidade_compra', 'unidade_uso', 'fator_conversao', 'logica_consumo'],
        properties: {
          nome: { type: 'string', example: 'Papel Sulfite A4' },
          codigo_catalogo: { type: 'string', example: 'PAPEL-002' },
          unidade_compra: { type: 'string', example: 'resma' },
          unidade_uso: { type: 'string', example: 'folha' },
          fator_conversao: { type: 'number', example: 500 },
          logica_consumo: { type: 'string', example: 'area' }
        }
      }
    }
  }
};

// Configurar Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
  console.log('🚀 Servidor do Catálogo de Insumos com Swagger iniciado!');
  console.log(`📡 API rodando em: http://localhost:${PORT}`);
  console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log('');
  console.log('📋 Endpoints disponíveis:');
  console.log('  GET    /health                    - Health check');
  console.log('  GET    /api/catalogo-insumos      - Listar insumos');
  console.log('  POST   /api/catalogo-insumos      - Criar insumo');
  console.log('  GET    /api/catalogo-insumos/:id  - Buscar por ID');
  console.log('');
  console.log('🧪 Este é um servidor MOCK para testes!');
  console.log('💡 Swagger UI disponível em /api-docs');
});
