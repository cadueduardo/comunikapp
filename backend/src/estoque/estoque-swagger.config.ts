import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export const setupEstoqueSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Estoque API')
    .setDescription('API para controle de estoque do Comunikapp')
    .setVersion('1.0')
    .addTag('estoque', 'Endpoints do módulo de estoque')
    .addTag('health', 'Endpoints de saúde do módulo')
    .addTag('localizacoes', 'Gerenciamento de localizações de estoque')
    .addTag('itens', 'Gerenciamento de itens de estoque')
    .addTag('movimentacoes', 'Controle de movimentações de estoque')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [
      // Incluir apenas os controllers do módulo de estoque
    ],
  });

  SwaggerModule.setup('api/estoque/docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  return document;
};

// Schemas para documentação OpenAPI
export const estoqueSchemas = {
  LocalizacaoEstoque: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID único da localização' },
      nome: { type: 'string', description: 'Nome da localização' },
      descricao: { type: 'string', description: 'Descrição da localização' },
      tipo: { 
        type: 'string', 
        enum: ['PRATELEIRA', 'GAVETA', 'AREA', 'SETOR'],
        description: 'Tipo da localização'
      },
      endereco: { type: 'string', description: 'Endereço físico da localização' },
      capacidade: { type: 'number', description: 'Capacidade máxima da localização' },
      lojaId: { type: 'string', description: 'ID da loja (multi-tenant)' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },

  ItemEstoque: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID único do item' },
      nome: { type: 'string', description: 'Nome do item' },
      descricao: { type: 'string', description: 'Descrição do item' },
      codigo: { type: 'string', description: 'Código do item' },
      categoria: { 
        type: 'string', 
        enum: ['MATERIAL', 'PRODUTO', 'EQUIPAMENTO', 'SUPRIMENTO'],
        description: 'Categoria do item'
      },
      unidadeMedida: { 
        type: 'string', 
        enum: ['UNIDADE', 'KG', 'LITRO', 'METRO', 'METRO_QUADRADO'],
        description: 'Unidade de medida'
      },
      precoUnitario: { type: 'number', description: 'Preço unitário' },
      quantidadeAtual: { type: 'number', description: 'Quantidade atual em estoque' },
      quantidadeMinima: { type: 'number', description: 'Quantidade mínima para alerta' },
      quantidadeMaxima: { type: 'number', description: 'Quantidade máxima permitida' },
      localizacaoId: { type: 'string', description: 'ID da localização' },
      lojaId: { type: 'string', description: 'ID da loja (multi-tenant)' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },

  MovimentacaoEstoque: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID único da movimentação' },
      itemId: { type: 'string', description: 'ID do item movimentado' },
      tipo: { 
        type: 'string', 
        enum: ['ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA'],
        description: 'Tipo da movimentação'
      },
      quantidade: { type: 'number', description: 'Quantidade movimentada' },
      quantidadeAnterior: { type: 'number', description: 'Quantidade antes da movimentação' },
      quantidadePosterior: { type: 'number', description: 'Quantidade após a movimentação' },
      motivo: { type: 'string', description: 'Motivo da movimentação' },
      observacoes: { type: 'string', description: 'Observações adicionais' },
      lojaId: { type: 'string', description: 'ID da loja (multi-tenant)' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },

  DashboardEstoque: {
    type: 'object',
    properties: {
      totalItens: { type: 'number', description: 'Total de itens em estoque' },
      totalLocalizacoes: { type: 'number', description: 'Total de localizações' },
      valorTotalEstoque: { type: 'number', description: 'Valor total do estoque' },
      itensBaixoEstoque: { 
        type: 'array', 
        items: { $ref: '#/components/schemas/ItemEstoque' },
        description: 'Itens com estoque baixo'
      },
      movimentacoesRecentes: { 
        type: 'array', 
        items: { $ref: '#/components/schemas/MovimentacaoEstoque' },
        description: 'Movimentações recentes'
      }
    }
  },

  HealthStatus: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['ok', 'error'], description: 'Status do módulo' },
      module: { type: 'string', description: 'Nome do módulo' },
      timestamp: { type: 'string', format: 'date-time', description: 'Timestamp da verificação' },
      uptime: { type: 'number', description: 'Tempo de atividade em segundos' }
    }
  },

  ModuleInfo: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Nome do módulo' },
      version: { type: 'string', description: 'Versão do módulo' },
      description: { type: 'string', description: 'Descrição do módulo' },
      features: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Funcionalidades disponíveis'
      }
    }
  }
};

// Exemplos de requisição
export const estoqueExamples = {
  CreateLocalizacao: {
    summary: 'Criar nova localização',
    value: {
      nome: 'Prateleira A1',
      descricao: 'Prateleira principal do setor A',
      tipo: 'PRATELEIRA',
      endereco: 'A1-01-01',
      capacidade: 100,
      lojaId: 'loja-123'
    }
  },

  CreateItem: {
    summary: 'Criar novo item',
    value: {
      nome: 'Produto Teste',
      descricao: 'Produto para teste de estoque',
      codigo: 'PROD001',
      categoria: 'MATERIAL',
      unidadeMedida: 'UNIDADE',
      precoUnitario: 10.50,
      quantidadeMinima: 5,
      quantidadeMaxima: 100,
      localizacaoId: 'localizacao-123',
      lojaId: 'loja-123'
    }
  },

  CreateMovimentacao: {
    summary: 'Criar nova movimentação',
    value: {
      itemId: 'item-123',
      tipo: 'ENTRADA',
      quantidade: 10,
      motivo: 'Compra inicial',
      observacoes: 'Movimento de entrada de produtos',
      lojaId: 'loja-123'
    }
  }
};

// Respostas de erro
export const estoqueErrorResponses = {
  400: {
    description: 'Dados inválidos',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Dados inválidos' },
            error: { type: 'string', example: 'Bad Request' }
          }
        }
      }
    }
  },

  401: {
    description: 'Não autorizado',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: { type: 'string', example: 'Token inválido' },
            error: { type: 'string', example: 'Unauthorized' }
          }
        }
      }
    }
  },

  403: {
    description: 'Acesso negado',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Acesso negado ao módulo de estoque' },
            error: { type: 'string', example: 'Forbidden' }
          }
        }
      }
    }
  },

  404: {
    description: 'Recurso não encontrado',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: { type: 'string', example: 'Item não encontrado' },
            error: { type: 'string', example: 'Not Found' }
          }
        }
      }
    }
  },

  500: {
    description: 'Erro interno do servidor',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 500 },
            message: { type: 'string', example: 'Erro interno do servidor' },
            error: { type: 'string', example: 'Internal Server Error' }
          }
        }
      }
    }
  }
};
