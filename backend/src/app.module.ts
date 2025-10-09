import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LojasModule } from './lojas/lojas.module';
import { ClientesModule } from './clientes/clientes.module';
import { CategoriasModule } from './categorias/categorias.module';
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { InsumosModule } from './insumos/insumos.module';
// import { OrcamentosModule } from './orcamentos/orcamentos.module'; // LEGADO - mantido como referência
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { FuncoesModule } from './funcoes/funcoes.module';
import { CustosIndiretosModule } from './custos-indiretos/custos-indiretos.module';
import { TiposMaterialModule } from './tipos-material/tipos-material.module';
import { ProdutosModule } from './produtos/produtos.module';
import { MaquinasModule } from './maquinas/maquinas.module';
import { MailModule } from './mail/mail.module';
import { EstoqueModule } from './estoque/estoque.module';
import { MensagensNegociacaoModule } from './mensagens-negociacao/mensagens-negociacao.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { ServicosManuaisModule } from './servicos-manuais/servicos-manuais.module';
import { OrcamentosV2Module } from './orcamentos-v2/orcamentos-v2.module'; // V2 ATIVO - substitui o legado
// import { OrcamentosV2SimpleModule } from './orcamentos-v2-simple/orcamentos-v2-simple.module'; // Removido - V2 completo ativo
import { MotorCalculoV2Module } from './motor-calculo-v2/motor-calculo-v2.module';
import { OSModule } from './os/os.module';
import { PCPModule } from './pcp/pcp.module';
import { ArteAprovacaoModule } from './modules/arte-aprovacao/arte-aprovacao.module';
import { JwtGlobalMiddleware } from './common/middleware/jwt-global.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    LojasModule,
    ClientesModule,
    CategoriasModule,
    FornecedoresModule,
    InsumosModule,
    // OrcamentosModule, // LEGADO - desabilitado
    NotificacoesModule,
    EstoqueModule,
    TiposMaterialModule,
    ProdutosModule,
    MaquinasModule,
    FuncoesModule,
    CustosIndiretosModule,
    MailModule,
    MensagensNegociacaoModule,
    UsuariosModule,
    WebsocketsModule,
    ServicosManuaisModule,
    OrcamentosV2Module, // V2 ATIVO - substitui o legado
    // OrcamentosV2SimpleModule, // Removido - V2 completo ativo
    MotorCalculoV2Module,
    OSModule, // Módulo de Ordens de Serviço
    PCPModule, // Módulo de PCP (Planejamento e Controle de Produção)
    ArteAprovacaoModule, // Módulo de Arte & Aprovação
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplica o middleware JWT globalmente para todas as rotas
    consumer
      .apply(JwtGlobalMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
