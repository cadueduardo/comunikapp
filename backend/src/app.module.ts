import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LojasModule } from './lojas/lojas.module';
import { ClientesModule } from './clientes/clientes.module';
import { CategoriasModule } from './categorias/categorias.module';
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { InsumosModule } from './insumos/insumos.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { MaquinasModule } from './maquinas/maquinas.module';
import { FuncoesModule } from './funcoes/funcoes.module';
import { CustosIndiretosModule } from './custos-indiretos/custos-indiretos.module';
import { TiposMaterialModule } from './tipos-material/tipos-material.module';
import { ProdutosModule } from './produtos/produtos.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { MensagensNegociacaoModule } from './mensagens-negociacao/mensagens-negociacao.module';
import { MailModule } from './mail/mail.module';
import { EstoqueModule } from './estoque/estoque.module';
import { UsuariosModule } from './usuarios/usuarios.module';

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
    OrcamentosModule,
    NotificacoesModule,
    MaquinasModule,
    FuncoesModule,
    CustosIndiretosModule,
    TiposMaterialModule,
    ProdutosModule,
    WebsocketsModule,
    MensagensNegociacaoModule,
    MailModule,
    EstoqueModule,
    UsuariosModule,
  ],
})
export class AppModule {}
