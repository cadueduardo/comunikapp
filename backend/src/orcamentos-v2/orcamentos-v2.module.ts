import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { MailModule } from '../mail/mail.module';
import { DocumentosModule } from '../documentos/documentos.module';
import { MotorCalculoV2Module } from '../motor-calculo-v2/motor-calculo-v2.module';
import { OSModule } from '../os/os.module';
import { FinanceiroModule } from '../financeiro/financeiro.module';
import { HomeOperacionalModule } from '../home-operacional/home-operacional.module';
import { getRequiredJwtSecret } from '../auth/jwt-secret';

// Controllers
import { OrcamentosV2Controller } from './controllers/orcamentos-v2.controller';
import { CalculoV2Controller } from './controllers/calculo-v2.controller';
import { ChatV2Controller } from './controllers/chat-v2.controller';
import { LinksV2Controller } from './controllers/links-v2.controller';
import { ImpressaoV2Controller } from './controllers/impressao-v2.controller';
import { ProdutoDetalhesController } from './controllers/produto-detalhes.controller';

// Services
import { OrcamentosV2Service } from './services/orcamentos-v2.service';
import { IntegracaoMotorService } from './services/integracao-motor.service';
import { ValidacaoV2Service } from './services/validacao-v2.service';
import { TransformacaoV2Service } from './services/transformacao-v2.service';
import { NotificacaoV2Service } from './services/notificacao-v2.service';
import { ChatV2Service } from './services/chat-v2.service';
import { LinksV2Service } from './services/links-v2.service';
import { ImpressaoV2Service } from './services/impressao-v2.service';
import { ValidacaoEstoqueService } from './services/validacao-estoque.service';
import { InsumosAutocompleteService } from './services/insumos-autocomplete.service';

// Repositories
import { OrcamentosV2Repository } from './repositories/orcamentos-v2.repository';
import { ProdutosV2Repository } from './repositories/produtos-v2.repository';

@Module({
  imports: [
    PrismaModule,
    NotificacoesModule,
    MailModule,
    DocumentosModule,
    MotorCalculoV2Module, // Integracao com motor ja funcionando
    OSModule,
    FinanceiroModule, // Fase 6 - Cobranca/Recebimento (CobrancasService + CobrancaVencimentoService)
    HomeOperacionalModule, // Fase 6 - Invalidar cache da home apos aprovacao
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: getRequiredJwtSecret(configService),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [
    OrcamentosV2Controller,
    CalculoV2Controller,
    ChatV2Controller,
    LinksV2Controller,
    ImpressaoV2Controller,
    ProdutoDetalhesController,
  ],
  providers: [
    // Services principais
    OrcamentosV2Service,
    IntegracaoMotorService,
    ValidacaoV2Service,
    TransformacaoV2Service,
    NotificacaoV2Service,

    // Services especializados
    ChatV2Service,
    LinksV2Service,
    ImpressaoV2Service,
    ValidacaoEstoqueService,
    InsumosAutocompleteService,

    // Repositories
    OrcamentosV2Repository,
    ProdutosV2Repository,
  ],
  exports: [
    OrcamentosV2Service,
    IntegracaoMotorService,
    ValidacaoV2Service,
    TransformacaoV2Service,
    NotificacaoV2Service,
    ChatV2Service,
    LinksV2Service,
    ImpressaoV2Service,
    ValidacaoEstoqueService,
    InsumosAutocompleteService,
  ],
})
export class OrcamentosV2Module {}
