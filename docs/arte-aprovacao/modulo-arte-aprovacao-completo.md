# 🎨 Módulo Arte & Aprovação - Documentação Completa

## 📋 Visão Geral

O módulo **Arte & Aprovação** é um sistema completo para gestão de versões de arte, aprovação de clientes e controle de workflow de design. Este módulo é plugável, totalmente isolado, multi-tenant e pode ser ativado sob demanda via marketplace interno.

## 🎯 Objetivos do Módulo

### **MVP (Fase 1)**
- Anexar arte já aprovada do cliente (WhatsApp, email, upload manual)
- Visualização básica de arte anexada
- Status simples de aprovação

### **Módulo Completo (Fases 2-4)**
- Gestão completa de versões de arte
- Sistema de aprovação externa via link público
- Workflow de design com status e comentários
- Integração com Google Drive e outros storages
- Notificações automáticas
- Controle de permissões por nível de acesso

## 🏗️ Arquitetura do Módulo

### **Estrutura de Pastas (Frontend)**
```
frontend/src/components/os/arte-aprovacao/
├── ArteAprovacaoTab.tsx                    # Componente principal da aba
├── components/
│   ├── ArteServiceFilters.tsx              # Filtros por serviço (Fachada, Banner, etc.)
│   ├── ArteVersionHistory.tsx              # Lista de versões (v1, v2, v3)
│   ├── ArteVersionCard.tsx                 # Card individual de cada versão
│   ├── ArteClientApprovalPanel.tsx         # Painel de aprovação do cliente
│   ├── ArteCommentsPanel.tsx               # Painel de comentários
│   ├── ArteFileUpload.tsx                  # Upload de arquivos
│   ├── ArtePreviewModal.tsx                # Modal de preview da arte
│   ├── ArteComparisonModal.tsx             # Modal de comparação de versões
│   └── ArtePublicApprovalPage.tsx          # Página pública de aprovação
│       ├── components/
│       │   ├── ArtePublicHeader.tsx        # Header da página pública
│       │   ├── ArteServiceSelector.tsx     # Seletor de serviços
│       │   ├── ArtePreviewArea.tsx         # Área de preview da arte
│       │   ├── ArteApprovalActions.tsx     # Botões de aprovação/rejeição
│       │   └── ArteCommentsSection.tsx     # Seção de comentários
├── hooks/
│   ├── useArteVersions.ts                  # Hook para gerenciar versões
│   ├── useArteComments.ts                  # Hook para comentários
│   ├── useArteApproval.ts                  # Hook para aprovações
│   ├── useArteFileUpload.ts                # Hook para upload de arquivos
│   └── useArteNotifications.ts             # Hook para notificações
├── services/
│   ├── ArteService.ts                      # Service principal
│   ├── ArteFileService.ts                  # Service de arquivos
│   ├── ArteNotificationService.ts          # Service de notificações
│   └── ArteStorageService.ts               # Service de storage
├── types/
│   └── arte-types.ts                       # Tipos TypeScript específicos
└── utils/
    ├── arte-helpers.ts                     # Funções utilitárias
    └── arte-constants.ts                   # Constantes do módulo
```

### **Estrutura de Pastas (Backend)**
```
backend/src/modules/arte-aprovacao/
├── arte-aprovacao.module.ts                # Módulo principal
├── controllers/
│   ├── arte-versao.controller.ts           # Controller de versões
│   ├── arte-arquivo.controller.ts          # Controller de arquivos
│   ├── arte-comentario.controller.ts       # Controller de comentários
│   ├── arte-aprovacao.controller.ts        # Controller de aprovações
│   └── arte-publico.controller.ts          # Controller público (sem auth)
│       ├── routes/
│       │   ├── arte-public.routes.ts        # Rotas públicas
│       │   └── arte-download.routes.ts      # Rotas de download
├── services/
│   ├── arte-versao.service.ts              # Service de versões
│   ├── arte-arquivo.service.ts             # Service de arquivos
│   ├── arte-comentario.service.ts          # Service de comentários
│   ├── arte-aprovacao.service.ts           # Service de aprovações
│   ├── arte-notificacao.service.ts         # Service de notificações
│   └── arte-storage.service.ts             # Service de storage
├── entities/
│   ├── arte-versao.entity.ts               # Entidade de versão
│   ├── arte-arquivo.entity.ts              # Entidade de arquivo
│   ├── arte-comentario.entity.ts           # Entidade de comentário
│   └── arte-link-aprovacao.entity.ts       # Entidade de link de aprovação
├── dto/
│   ├── create-arte-versao.dto.ts           # DTOs de criação
│   ├── update-arte-versao.dto.ts           # DTOs de atualização
│   └── arte-response.dto.ts                # DTOs de resposta
├── guards/
│   ├── arte-permission.guard.ts            # Guard de permissões
│   └── arte-tenant.guard.ts                # Guard de tenant
└── interfaces/
    └── arte-storage.interface.ts           # Interface de storage
```

## 🗄️ Schema do Banco de Dados (Prisma)

### **Adicionar ao schema principal: `backend/prisma/schema.prisma`**
```prisma
// ==========================================
// MÓDULO ARTE & APROVAÇÃO
// ==========================================

model ArteVersao {
  id                String   @id @default(uuid())
  os_id             String
  servico_id        String?  // Referência ao serviço específico
  versao            String   // v1, v2, v3, etc.
  status            ArteStatus
  autor_id          String
  descricao         String?
  observacoes       String?
  data_criacao      DateTime @default(now())
  data_aprovacao    DateTime?
  aprovado_por      String?
  aprovado_por_cliente Boolean @default(false)
  loja_id           String   // Multi-tenant
  
  // Relacionamentos
  os                OrdemServico @relation(fields: [os_id], references: [id])
  autor             Usuario @relation("ArteAutor", fields: [autor_id], references: [id])
  aprovador         Usuario? @relation("ArteAprovador", fields: [aprovado_por], references: [id])
  arquivos          ArteArquivo[]
  comentarios       ArteComentario[]
  links_aprovacao   ArteLinkAprovacao[]
  
  @@map("arte_versoes")
  @@index([os_id, loja_id])
  @@index([status, loja_id])
}

model ArteArquivo {
  id                String   @id @default(uuid())
  versao_id         String
  nome_arquivo      String
  nome_original     String
  tipo_arquivo      String   // pdf, jpg, png, ai, etc.
  tamanho           BigInt
  url_arquivo       String
  url_thumbnail     String?  // Para preview
  storage_provider  String   // google_drive, aws_s3, local
  storage_path      String
  data_upload       DateTime @default(now())
  loja_id           String   // Multi-tenant
  
  // Relacionamentos
  versao            ArteVersao @relation(fields: [versao_id], references: [id])
  
  @@map("arte_arquivos")
  @@index([versao_id, loja_id])
}

model ArteComentario {
  id                String   @id @default(uuid())
  versao_id         String
  usuario_id        String
  comentario        String
  tipo              ComentarioTipo @default(INTERNO)
  data_comentario   DateTime @default(now())
  loja_id           String   // Multi-tenant
  
  // Relacionamentos
  versao            ArteVersao @relation(fields: [versao_id], references: [id])
  usuario           Usuario @relation(fields: [usuario_id], references: [id])
  
  @@map("arte_comentarios")
  @@index([versao_id, loja_id])
}

model ArteLinkAprovacao {
  id                String   @id @default(uuid())
  versao_id         String
  token_publico     String   @unique
  expira_em         DateTime
  aprovado          Boolean  @default(false)
  data_aprovacao    DateTime?
  ip_aprovacao      String?
  user_agent        String?
  comentario_cliente String?
  ativo             Boolean  @default(true)
  loja_id           String   // Multi-tenant
  
  // Relacionamentos
  versao            ArteVersao @relation(fields: [versao_id], references: [id])
  
  @@map("arte_links_aprovacao")
  @@index([token_publico])
  @@index([loja_id])
}

enum ArteStatus {
  RASCUNHO
  ENVIADA_CLIENTE
  APROVADA
  REVISAO_SOLICITADA
  BLOQUEADA
  ENVIADA_PCP
}

enum ComentarioTipo {
  INTERNO
  CLIENTE
  SISTEMA
}

// Adicionar ao modelo Usuario existente
model Usuario {
  // ... campos existentes ...
  
  // Relacionamentos Arte & Aprovação
  artes_autor       ArteVersao[] @relation("ArteAutor")
  artes_aprovador   ArteVersao[] @relation("ArteAprovador")
  comentarios_arte  ArteComentario[]
}
```

## 🔧 Configuração do Módulo

### **Arquivo: `backend/src/modules/arte-aprovacao/arte-aprovacao.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/prisma/prisma.module';
import { ArteVersaoController } from './controllers/arte-versao.controller';
import { ArteArquivoController } from './controllers/arte-arquivo.controller';
import { ArteComentarioController } from './controllers/arte-comentario.controller';
import { ArteAprovacaoController } from './controllers/arte-aprovacao.controller';
import { ArtePublicoController } from './controllers/arte-publico.controller';
import { ArteVersaoService } from './services/arte-versao.service';
import { ArteArquivoService } from './services/arte-arquivo.service';
import { ArteComentarioService } from './services/arte-comentario.service';
import { ArteAprovacaoService } from './services/arte-aprovacao.service';
import { ArteNotificationService } from './services/arte-notificacao.service';
import { ArteStorageService } from './services/arte-storage.service';
import { ArtePermissionGuard } from './guards/arte-permission.guard';
import { ArteTenantGuard } from './guards/arte-tenant.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    ArteVersaoController,
    ArteArquivoController,
    ArteComentarioController,
    ArteAprovacaoController,
    ArtePublicoController,
  ],
  providers: [
    ArteVersaoService,
    ArteArquivoService,
    ArteComentarioService,
    ArteAprovacaoService,
    ArteNotificationService,
    ArteStorageService,
    ArtePermissionGuard,
    ArteTenantGuard,
  ],
  exports: [
    ArteVersaoService,
    ArteArquivoService,
    ArteComentarioService,
    ArteAprovacaoService,
    ArteNotificationService,
    ArteStorageService,
  ],
})
export class ArteAprovacaoModule {}
```

## 🔐 Sistema de Permissões

### **Níveis de Acesso**
```typescript
export enum ArtePermission {
  // Visualização
  VIEW_ARTE = 'arte:view',
  VIEW_ARTE_PUBLIC = 'arte:view:public',
  
  // Criação e Edição
  CREATE_ARTE = 'arte:create',
  UPDATE_ARTE = 'arte:update',
  DELETE_ARTE = 'arte:delete',
  
  // Aprovação
  APPROVE_ARTE = 'arte:approve',
  REJECT_ARTE = 'arte:reject',
  
  // Arquivos
  UPLOAD_ARTE = 'arte:upload',
  DOWNLOAD_ARTE = 'arte:download',
  
  // Comentários
  COMMENT_ARTE = 'arte:comment',
  VIEW_COMMENTS = 'arte:comments:view',
  
  // Administração
  MANAGE_ARTE = 'arte:manage',
  EXPORT_ARTE = 'arte:export',
}

export enum ArteRole {
  DESIGNER = 'designer',
  CLIENTE = 'cliente',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}
```

### **Matriz de Permissões**
| Ação | Designer | Cliente | Admin | Viewer |
|------|----------|---------|-------|--------|
| Visualizar arte | ✅ | ✅ | ✅ | ✅ |
| Criar versão | ✅ | ❌ | ✅ | ❌ |
| Editar versão | ✅ | ❌ | ✅ | ❌ |
| Aprovar arte | ❌ | ✅ | ✅ | ❌ |
| Upload arquivo | ✅ | ❌ | ✅ | ❌ |
| Comentar | ✅ | ✅ | ✅ | ❌ |
| Gerenciar | ❌ | ❌ | ✅ | ❌ |

## 📁 Integração com Storage

### **Interface de Storage**
```typescript
export interface IArteStorageProvider {
  uploadFile(file: Express.Multer.File, path: string): Promise<StorageResult>;
  downloadFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<boolean>;
  generateThumbnail(path: string): Promise<string>;
  getPublicUrl(path: string): Promise<string>;
}

export interface StorageResult {
  url: string;
  path: string;
  thumbnailUrl?: string;
}
```

### **Google Drive Provider**
```typescript
export class GoogleDriveStorageProvider implements IArteStorageProvider {
  private drive: drive_v3.Drive;
  
  constructor() {
    this.drive = drive_v3({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      }),
    });
  }
  
  async uploadFile(file: Express.Multer.File, path: string): Promise<StorageResult> {
    // Implementação do upload para Google Drive
  }
  
  // ... outros métodos
}
```

### **Estrutura de Pastas no Storage**
```
/arte-aprovacao/
├── /{loja_id}/
│   ├── /{os_id}/
│   │   ├── /v1/
│   │   │   ├── arquivo_original.pdf
│   │   │   └── thumbnail.jpg
│   │   ├── /v2/
│   │   └── /v3/
│   └── /outras_os/
```

## 🌐 Página de Aprovação Pública

### **Interface de Aprovação Externa**
A página de aprovação pública permite que clientes visualizem e aprovem artes sem necessidade de login no sistema.

### **URL de Acesso**
```
https://app.comunikapp.com/arte/aprovacao/{token_publico}
```

### **Layout da Página (Conforme Wireframe)**
```typescript
// Componente: ArtePublicApprovalPage.tsx
export interface ArtePublicApprovalPageProps {
  token: string;
  versao: ArteVersao;
  arquivos: ArteArquivo[];
  servicos: ArteServico[];
}

// Estrutura da página:
// 1. Header com título "Comunikapp — Aprovação de Arte"
// 2. Informações da OS: "OS #01234 • Serviços"
// 3. Botões de download: "Baixar prova (PDF)" e "Baixar imagem (JPG)"
// 4. Filtros de serviços com status visual:
//    - Fachada Principal (v3) - Selecionado (roxo) com ponto verde
//    - Banner Interno (v1) - Cinza com ponto amarelo
//    - Painel Externo (v2) - Cinza com ponto vermelho
// 5. Área de preview central: "Pré-visualização da arte selecionada (PDF/JPG)"
// 6. Botões de ação:
//    - "Aprovar arte" (verde)
//    - "Solicitar alteração" (vermelho claro)
//    - Checkbox: "Declaro que revisei e aprovo a arte final"
// 7. Seção de comentários:
//    - Textarea: "Deixe seu comentário aqui (opcional)"
//    - Botão: "Enviar comentário"
```

### **Funcionalidades da Página Pública**
- **Visualização de arte** em alta qualidade
- **Download de arquivos** (PDF e JPG)
- **Navegação entre serviços** (Fachada, Banner, Painel)
- **Aprovação com declaração** de revisão
- **Solicitação de alterações** com comentários
- **Sistema de comentários** bidirecional
- **Responsividade** para mobile e desktop

### **Segurança da Página Pública**
- **Token único** com expiração configurável
- **Rate limiting** para evitar spam
- **Validação de IP** (opcional)
- **Logs de auditoria** completos
- **HTTPS obrigatório** para links públicos

### **Estados da Interface**
```typescript
export enum ArteApprovalState {
  LOADING = 'loading',
  VIEWING = 'viewing',
  APPROVING = 'approving',
  REJECTING = 'rejecting',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ERROR = 'error',
}

export interface ArteApprovalData {
  versao_id: string;
  servico_id: string;
  aprovado: boolean;
  comentario?: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}
```

### **API Endpoints Públicos**
```typescript
// GET /api/public/arte/{token}
// Retorna dados da versão para aprovação

// POST /api/public/arte/{token}/approve
// Aprova a arte com comentário opcional

// POST /api/public/arte/{token}/reject
// Rejeita a arte com comentário obrigatório

// POST /api/public/arte/{token}/comment
// Adiciona comentário do cliente

// GET /api/public/arte/{token}/download/{arquivo_id}
// Download de arquivo específico
```

### **Implementação da Página Pública (Frontend)**
```typescript
// Estrutura do componente principal
export function ArtePublicApprovalPage() {
  const [selectedService, setSelectedService] = useState<string>('fachada');
  const [approvalState, setApprovalState] = useState<ArteApprovalState>('viewing');
  const [comment, setComment] = useState<string>('');
  const [declarationChecked, setDeclarationChecked] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ArtePublicHeader 
        osNumber="01234"
        onDownloadPDF={() => {}}
        onDownloadJPG={() => {}}
      />
      
      {/* Seletor de Serviços */}
      <ArteServiceSelector
        services={services}
        selectedService={selectedService}
        onServiceChange={setSelectedService}
      />
      
      {/* Área de Preview */}
      <ArtePreviewArea
        arte={selectedArte}
        loading={approvalState === 'loading'}
      />
      
      {/* Ações de Aprovação */}
      <ArteApprovalActions
        onApprove={() => setApprovalState('approving')}
        onReject={() => setApprovalState('rejecting')}
        declarationChecked={declarationChecked}
        onDeclarationChange={setDeclarationChecked}
        disabled={!declarationChecked}
      />
      
      {/* Seção de Comentários */}
      <ArteCommentsSection
        comments={comments}
        newComment={comment}
        onCommentChange={setComment}
        onSendComment={() => {}}
      />
    </div>
  );
}
```

### **Componentes Específicos da Página Pública**

#### **ArteServiceSelector.tsx**
```typescript
// Filtros de serviços com status visual conforme wireframe
export function ArteServiceSelector({ services, selectedService, onServiceChange }) {
  return (
    <div className="flex space-x-4 p-4">
      {services.map(service => (
        <button
          key={service.id}
          onClick={() => onServiceChange(service.id)}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
            selectedService === service.id 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            service.status === 'aprovada' ? 'bg-green-400' :
            service.status === 'pendente' ? 'bg-yellow-400' :
            'bg-red-400'
          }`} />
          <span>{service.nome} ({service.versao})</span>
        </button>
      ))}
    </div>
  );
}
```

#### **ArteApprovalActions.tsx**
```typescript
// Botões de aprovação conforme wireframe
export function ArteApprovalActions({ onApprove, onReject, declarationChecked, onDeclarationChange, disabled }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Aprovar arte
        </button>
        <button
          onClick={onReject}
          className="bg-red-100 text-red-700 px-6 py-2 rounded-lg"
        >
          Solicitar alteração
        </button>
      </div>
      
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={declarationChecked}
          onChange={(e) => onDeclarationChange(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-700">
          Declaro que revisei e aprovo a arte final
        </span>
      </label>
    </div>
  );
}
```

## 📧 Sistema de Notificações

### **Tipos de Notificação**
```typescript
export enum ArteNotificationType {
  NOVA_VERSAO = 'nova_versao',
  APROVACAO_SOLICITADA = 'aprovacao_solicitada',
  ARTE_APROVADA = 'arte_aprovada',
  ARTE_REJEITADA = 'arte_rejeitada',
  COMENTARIO_ADICIONADO = 'comentario_adicionado',
  LINK_APROVACAO_EXPIRADO = 'link_aprovacao_expirado',
}

export interface ArteNotification {
  type: ArteNotificationType;
  os_id: string;
  versao_id: string;
  destinatarios: string[];
  dados: Record<string, any>;
}
```

### **Canais de Notificação**
- **Email**: Notificações por email com template personalizado
- **WhatsApp**: Integração com API do WhatsApp Business
- **Sistema**: Notificações in-app com toast/badge
- **Webhook**: Para integrações externas

## 📱 Responsividade e Mobile

### **Breakpoints**
```css
/* Mobile First */
@media (max-width: 768px) {
  .arte-version-card {
    flex-direction: column;
    padding: 1rem;
  }
  
  .arte-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .arte-filters {
    overflow-x: auto;
    white-space: nowrap;
  }
}

@media (min-width: 769px) {
  .arte-layout {
    display: grid;
    grid-template-columns: 20% 60% 20%;
    gap: 1.5rem;
  }
}
```

### **Componentes Mobile-Optimized**
- **Swipe gestures** para navegação entre versões
- **Touch-friendly** botões e controles
- **Lazy loading** para imagens e arquivos
- **Offline support** para visualização básica

## 🧪 Estratégia de Testes

### **Testes Unitários (≥80% cobertura)**
```typescript
describe('ArteVersaoService', () => {
  describe('createVersao', () => {
    it('should create a new version with correct data', async () => {
      // Test implementation
    });
    
    it('should validate user permissions', async () => {
      // Test implementation
    });
    
    it('should handle multi-tenant isolation', async () => {
      // Test implementation
    });
  });
});
```

### **Testes E2E**
```typescript
describe('Arte & Aprovação E2E', () => {
  it('should complete full approval workflow', async () => {
    // 1. Designer cria versão
    // 2. Envia para aprovação
    // 3. Cliente recebe notificação
    // 4. Cliente aprova via link público
    // 5. Sistema atualiza status
  });
});
```

## 🚀 Plano de Implementação

### **Fase 1: MVP - Anexo de Arte (2 semanas)**
- [ ] Estrutura básica do módulo
- [ ] Upload de arquivo único
- [ ] Visualização de arte anexada - em nova aba
- [ ] Status básico de aprovação
- [ ] Integração com aba existente

### **Fase 2: Gestão de Versões (3 semanas)**
- [ ] Sistema completo de versões
- [ ] Upload múltiplo de arquivos
- [ ] Histórico de versões
- [ ] Comparação de versões
- [ ] Status e workflow

### **Fase 3: Aprovação Externa (2 semanas)**
- [ ] Geração de links públicos
- [ ] Página de aprovação para cliente (conforme wireframe)
- [ ] Sistema de comentários
- [ ] Notificações por email
- [ ] Integração com Google Drive
- [ ] Interface de download de arquivos
- [ ] Sistema de declaração de aprovação

### **Fase 4: Funcionalidades Avançadas (3 semanas)**
- [ ] Notificações WhatsApp
- [ ] Permissões granulares
- [ ] Relatórios e analytics
- [ ] Integração com PCP
- [ ] Otimizações mobile

## 📊 Métricas e Monitoramento

### **KPIs do Módulo**
- Tempo médio de aprovação
- Taxa de aprovação na primeira versão
- Número de versões por OS
- Tempo de resposta do cliente
- Uso de storage por loja

### **Health Checks**
```typescript
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: await this.storageService.healthCheck(),
    database: await this.prisma.$queryRaw`SELECT 1`,
  };
}
```

## 🔒 Segurança e Compliance

### **Medidas de Segurança**
- **Isolamento multi-tenant** rigoroso
- **Validação de arquivos** (tipo, tamanho, malware)
- **Links de aprovação** com expiração e rate limiting
- **Auditoria completa** de todas as ações
- **Criptografia** de arquivos sensíveis

### **LGPD Compliance**
- **Consentimento** para processamento de dados
- **Anonimização** de dados pessoais
- **Retenção** de dados conforme política
- **Portabilidade** de dados do cliente

## 📚 Documentação da API

### **OpenAPI Specification**
```yaml
paths:
  /api/arte-aprovacao/versoes:
    post:
      summary: Criar nova versão de arte
      tags: [Arte & Aprovação]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateArteVersaoDto'
      responses:
        201:
          description: Versão criada com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ArteVersaoResponse'
```

## 🎯 Conclusão

Este módulo **Arte & Aprovação** foi projetado seguindo todas as premissas e melhores práticas do projeto:

- ✅ **Módulo plugável** e isolado
- ✅ **Multi-tenant** com dados separados por loja
- ✅ **Prisma ORM** com schemas separados
- ✅ **JWT Module** próprio para autenticação
- ✅ **Arquitetura limpa** com separação de responsabilidades
- ✅ **Testes abrangentes** com cobertura ≥80%
- ✅ **Mobile-first** e responsivo
- ✅ **Integração com storage** (Google Drive)
- ✅ **Sistema de notificações** completo
- ✅ **Permissões granulares** por nível de acesso
- ✅ **Documentação completa** da API

O módulo está pronto para implementação incremental, começando pelo MVP de anexo de arte e evoluindo para o sistema completo de gestão de versões e aprovação externa.
