import { NestFactory } from '@nestjs/core';
import { CatalogoSimpleModule } from './catalogo-simple.module';

async function bootstrap() {
  try {
    console.log('🚀 Iniciando módulo Catálogo de Insumos...');
    
    const app = await NestFactory.create(CatalogoSimpleModule);
    
    // Configurar CORS
    app.enableCors();
    
    const port = process.env.CATALOGO_INSUMOS_PORT || 3001;
    
    await app.listen(port);
    
    console.log('✅ Servidor iniciado com sucesso!');
    console.log(`📡 API rodando em: http://localhost:${port}`);
    console.log(`📖 Swagger UI: http://localhost:${port}/api-docs`);
    console.log('');
    console.log('📋 Endpoints disponíveis:');
    console.log('  GET    /health                    - Health check');
    console.log('  GET    /api/catalogo-insumos      - Listar insumos');
    console.log('  POST   /api/catalogo-insumos      - Criar insumo');
    console.log('  GET    /api/catalogo-insumos/:id  - Buscar por ID');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

bootstrap();
