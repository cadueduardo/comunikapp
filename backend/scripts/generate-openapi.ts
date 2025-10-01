import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para gerar documentação OpenAPI automaticamente
 * Objetivo: Gerar spec OpenAPI atualizada para o projeto
 * 
 * Execução: npx ts-node scripts/generate-openapi.ts
 */

async function generateOpenAPI() {
  console.log('🚀 Iniciando geração de documentação OpenAPI...');
  
  try {
    // 1. Criar aplicação NestJS
    const app = await NestFactory.create(AppModule);
    
    // 2. Configurar Swagger
    const config = new DocumentBuilder()
      .setTitle('Comunikapp API')
      .setDescription(`
        API do sistema Comunikapp - Comunicação Visual
        
        ## Módulos Disponíveis
        
        ### Orçamentos V2
        - Criação e gestão de orçamentos
        - Cálculo automático de custos
        - Integração com insumos e serviços
        
        ### Ordens de Serviço (OS)
        - Criação de OS derivadas de orçamentos
        - OS diretas/internas
        - Workflows de aprovação
        - Validação de estoque
        
        ### PCP (Planejamento e Controle de Produção)
        - Workflows configuráveis
        - Apontamentos de produção
        - Controle de qualidade
        
        ### Estoque
        - Gestão de insumos
        - Movimentações de estoque
        - Alertas de reposição
        
        ### Insumos
        - Catálogo de materiais
        - Preços e fornecedores
        - Categorização
        
        ## Autenticação
        
        Todas as APIs requerem autenticação JWT. Inclua o token no header:
        \`\`\`
        Authorization: Bearer <seu-token>
        \`\`\`
        
        ## Multi-Tenant
        
        O sistema é multi-tenant por loja. O lojaId é automaticamente 
        extraído do token JWT e aplicado a todas as operações.
        
        ## Versionamento
        
        - **v1**: APIs legadas (manutenção)
        - **v2**: APIs atuais (desenvolvimento ativo)
        
        ## Status Codes
        
        - **200**: Sucesso
        - **201**: Criado com sucesso
        - **400**: Dados inválidos
        - **401**: Não autenticado
        - **403**: Sem permissão
        - **404**: Recurso não encontrado
        - **500**: Erro interno do servidor
      `)
      .setVersion('2.0.0')
      .setContact('Equipe Comunikapp', 'https://comunikapp.com', 'contato@comunikapp.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Token JWT para autenticação',
          in: 'header',
        },
        'JWT-auth'
      )
      .addTag('Auth', 'Autenticação e autorização')
      .addTag('Orçamentos', 'Gestão de orçamentos V2')
      .addTag('OS', 'Ordens de Serviço')
      .addTag('PCP', 'Planejamento e Controle de Produção')
      .addTag('Estoque', 'Gestão de estoque')
      .addTag('Insumos', 'Catálogo de insumos')
      .addTag('Clientes', 'Gestão de clientes')
      .addTag('Lojas', 'Gestão de lojas')
      .addTag('Usuários', 'Gestão de usuários')
      .addServer('http://localhost:3000', 'Desenvolvimento')
      .addServer('https://api.comunikapp.com', 'Produção')
      .build();
    
    // 3. Gerar documentação
    const document = SwaggerModule.createDocument(app, config);
    
    // 4. Salvar arquivo JSON
    const outputPath = path.join(__dirname, '..', 'docs', 'openapi.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    
    // 5. Salvar arquivo YAML (opcional)
    const yamlPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
    const yaml = require('js-yaml');
    fs.writeFileSync(yamlPath, yaml.dump(document));
    
    // 6. Gerar HTML para visualização
    const htmlPath = path.join(__dirname, '..', 'docs', 'openapi.html');
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Comunikapp API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: './openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                validatorUrl: null,
                onComplete: function() {
                    console.log('OpenAPI documentation loaded successfully');
                }
            });
        };
    </script>
</body>
</html>
    `;
    
    fs.writeFileSync(htmlPath, html);
    
    console.log('✅ Documentação OpenAPI gerada com sucesso!');
    console.log(`📄 JSON: ${outputPath}`);
    console.log(`📄 YAML: ${yamlPath}`);
    console.log(`🌐 HTML: ${htmlPath}`);
    
    // 7. Estatísticas da documentação
    const stats = {
      paths: Object.keys(document.paths || {}).length,
      components: Object.keys(document.components || {}).length,
      tags: document.tags?.length || 0,
      servers: document.servers?.length || 0
    };
    
    console.log('\n📊 Estatísticas da documentação:');
    console.log(`- Endpoints: ${stats.paths}`);
    console.log(`- Componentes: ${stats.components}`);
    console.log(`- Tags: ${stats.tags}`);
    console.log(`- Servidores: ${stats.servers}`);
    
    // 8. Validar documentação
    await validarDocumentacao(document);
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Erro ao gerar documentação OpenAPI:', error);
    process.exit(1);
  }
}

async function validarDocumentacao(document: any): Promise<void> {
  console.log('\n🔍 Validando documentação OpenAPI...');
  
  const erros: string[] = [];
  
  // Validar estrutura básica
  if (!document.openapi) {
    erros.push('Versão OpenAPI não especificada');
  }
  
  if (!document.info) {
    erros.push('Informações da API não especificadas');
  }
  
  if (!document.paths || Object.keys(document.paths).length === 0) {
    erros.push('Nenhum endpoint documentado');
  }
  
  // Validar endpoints críticos
  const endpointsCriticos = [
    '/auth/login',
    '/orcamentos-v2',
    '/os',
    '/estoque',
    '/insumos'
  ];
  
  for (const endpoint of endpointsCriticos) {
    if (!document.paths[endpoint]) {
      erros.push(`Endpoint crítico não documentado: ${endpoint}`);
    }
  }
  
  // Validar componentes
  if (!document.components?.schemas) {
    erros.push('Schemas não documentados');
  }
  
  if (!document.components?.securitySchemes) {
    erros.push('Esquemas de segurança não documentados');
  }
  
  if (erros.length > 0) {
    console.log('⚠️ Problemas encontrados na documentação:');
    erros.forEach(erro => console.log(`- ${erro}`));
  } else {
    console.log('✅ Documentação validada com sucesso!');
  }
}

// Executar geração
if (require.main === module) {
  generateOpenAPI()
    .then(() => {
      console.log('\n🎉 Geração de documentação OpenAPI concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { generateOpenAPI };
