import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CatalogoInsumosModule } from './catalogo-insumos.module';

async function bootstrap() {
  const app = await NestFactory.create(CatalogoInsumosModule);

  // Configurar CORS
  app.enableCors();

  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('API do Catálogo de Insumos')
    .setDescription('API para gestão do catálogo global de insumos pré-cadastrados')
    .setVersion('1.0')
    .addTag('Catálogo de Insumos', 'Operações CRUD para o catálogo de insumos')
    .addTag('Health Check', 'Verificação de saúde do sistema')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.CATALOGO_INSUMOS_PORT || 3001;
  
  await app.listen(port);
  
  console.log('🚀 Servidor do Catálogo de Insumos iniciado!');
  console.log(`📡 API rodando em: http://localhost:${port}`);
  console.log(`📖 Swagger UI: http://localhost:${port}/api-docs`);
  console.log('');
  console.log('📋 Endpoints disponíveis:');
  console.log('  GET    /api/catalogo-insumos     - Listar insumos');
  console.log('  POST   /api/catalogo-insumos     - Criar insumo');
  console.log('  GET    /api/catalogo-insumos/:id - Buscar por ID');
  console.log('  PUT    /api/catalogo-insumos/:id - Atualizar');
  console.log('  DELETE /api/catalogo-insumos/:id/deactivate - Desativar');
  console.log('  PUT    /api/catalogo-insumos/:id/activate   - Ativar');
}

bootstrap().catch(err => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});
