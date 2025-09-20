# 📋 PLANO DE AÇÃO - MÓDULO DE OS (ORDENS DE SERVIÇO)

## 🔍 **ANÁLISE DE VIABILIDADE**

### ✅ **VIABILIDADE CONFIRMADA**

Baseado na análise completa do sistema atual, o módulo de OS é **TOTALMENTE VIÁVEL** e se integra perfeitamente com a arquitetura existente.

---

## 📊 **ANÁLISE DA ARQUITETURA ATUAL**

### **Módulos Existentes Compatíveis**
- ✅ **Orçamentos** - Sistema completo com aprovação implementado
- ✅ **Clientes** - CRUD completo com relacionamentos
- ✅ **Insumos** - Catálogo completo integrado ao motor de cálculo
- ✅ **Estoque** - Módulo modular com controle de lotes e movimentações
- ✅ **Produtos** - Templates de produtos já implementados
- ✅ **Usuários** - Sistema de perfis e permissões
- ✅ **Notificações** - Sistema completo com WebSocket
- ✅ **Motor de Cálculo V2** - Para cálculo automático de insumos

### **Integrações Naturais Identificadas**
1. **Orçamento → OS**: Orçamentos aprovados podem gerar OS automaticamente
2. **OS → Estoque**: Reserva/baixa automática de insumos conforme produção
3. **OS → Clientes**: Notificações de status para clientes
4. **OS → Usuários**: Controle de responsáveis por setor/etapa

---

## 🏗️ **ARQUITETURA DO MÓDULO OS**

### **Princípios Seguidos (Conforme Premissas)**
- ✅ **Módulo plugável e isolado**
- ✅ **Multi-tenant por lojaId**
- ✅ **JwtModule próprio** (conforme premissas de autenticação)
- ✅ **Arquivos limitados** (400 linhas service, 200 linhas controller)
- ✅ **Clean Architecture** com divisão por camadas

### **Estrutura Proposta**
```
backend/src/os/
├── controllers/
│   ├── os.controller.ts              # CRUD de OS (≤200 linhas)
│   ├── workflow.controller.ts        # Gestão de workflows (≤200 linhas)
│   └── checklist.controller.ts       # Checklists por etapa (≤200 linhas)
├── services/
│   ├── os.service.ts                 # Lógica principal (≤400 linhas)
│   ├── workflow.service.ts           # Workflows configuráveis (≤400 linhas)
│   ├── integracao-estoque.service.ts # Integração com estoque (≤400 linhas)
│   └── notificacoes-os.service.ts    # Notificações específicas (≤400 linhas)
├── dto/
├── guards/
├── middleware/
└── os.module.ts                      # Módulo com JwtModule próprio
```

---

## 📋 **ENTIDADES PRINCIPAIS**

### **1. OrdemServico (OS Principal)**
```prisma
model OrdemServico {
  id                 String    @id @default(cuid())
  numero             String    // Autonumeração
  loja_id            String
  cliente_id         String
  orcamento_id       String?   // Vínculo com orçamento aprovado
  data_abertura      DateTime  @default(now())
  data_prazo         DateTime?
  status             String    @default("FILA")
  responsavel_id     String?
  observacoes        String?   @db.Text
  criado_em          DateTime  @default(now())
  atualizado_em      DateTime  @updatedAt
  
  // Relacionamentos
  loja               loja      @relation(fields: [loja_id], references: [id])
  cliente            cliente   @relation(fields: [cliente_id], references: [id])
  orcamento          orcamento? @relation(fields: [orcamento_id], references: [id])
  itens              ItemOS[]
  movimentacoes      MovimentacaoOS[]
  checklists         ChecklistOS[]
  
  @@unique([loja_id, numero])
  @@index([loja_id, status])
}
```

### **2. ItemOS (Produtos/Serviços da OS)**
```prisma
model ItemOS {
  id                 String    @id @default(cuid())
  os_id              String
  produto_servico    String
  quantidade         Decimal   @db.Decimal(10, 2)
  parametros_tecnicos String?  @db.LongText // JSON
  insumos_calculados  String?  @db.LongText // JSON do motor de cálculo
  materiais_disponivel Boolean @default(false)
  
  os                 OrdemServico @relation(fields: [os_id], references: [id])
  
  @@index([os_id])
}
```

### **3. WorkflowOS (Workflows Configuráveis)**
```prisma
model WorkflowOS {
  id                 String    @id @default(cuid())
  loja_id            String
  nome               String
  etapas             String    @db.LongText // JSON das etapas
  ativo              Boolean   @default(true)
  
  loja               loja      @relation(fields: [loja_id], references: [id])
  
  @@unique([loja_id, nome])
}
```

### **4. MovimentacaoOS (Histórico Completo)**
```prisma
model MovimentacaoOS {
  id                 String    @id @default(cuid())
  os_id              String
  etapa_anterior     String?
  etapa_atual        String
  usuario_id         String
  data_movimentacao  DateTime  @default(now())
  observacoes        String?   @db.Text
  anexos             String?   @db.LongText // JSON de anexos
  
  os                 OrdemServico @relation(fields: [os_id], references: [id])
  
  @@index([os_id])
  @@index([data_movimentacao])
}
```

### **5. ChecklistOS (Controle por Etapas)**
```prisma
model ChecklistOS {
  id                 String    @id @default(cuid())
  os_id              String
  etapa              String
  item_checklist     String
  concluido          Boolean   @default(false)
  usuario_id         String?
  data_conclusao     DateTime?
  observacoes        String?
  
  os                 OrdemServico @relation(fields: [os_id], references: [id])
  
  @@index([os_id, etapa])
}
```

---

## 🔗 **INTEGRAÇÕES MAPEADAS**

### **1. Integração com Orçamentos**
- ✅ **Conversão automática**: Orçamento aprovado → OS
- ✅ **Dados herdados**: Cliente, produtos, insumos calculados
- ✅ **Vínculo mantido**: Rastreabilidade completa

### **2. Integração com Estoque**
- ✅ **Reserva automática**: Ao criar OS, reservar insumos
- ✅ **Baixa controlada**: Por etapa de produção
- ✅ **Validação disponibilidade**: Bloquear avanço sem material
- ✅ **API existente**: Módulo estoque já tem todas as funcionalidades

### **3. Integração com Notificações**
- ✅ **Sistema existente**: NotificacoesService já implementado
- ✅ **WebSocket ativo**: Notificações em tempo real
- ✅ **Tipos novos**: ETAPA_CONCLUIDA, MATERIAL_FALTANDO, OS_FINALIZADA

### **4. Integração com Motor de Cálculo**
- ✅ **Cálculo automático**: Insumos necessários por produto
- ✅ **API existente**: MotorCalculoV2Service já implementado
- ✅ **Parâmetros técnicos**: Medidas, cores, especificações

---

## 🎯 **FASES DE IMPLEMENTAÇÃO**

### **FASE 1: ESTRUTURA BASE (1-2 semanas)**
- [ ] Criar módulo OS isolado com JwtModule próprio
- [ ] Implementar schema Prisma das entidades principais
- [ ] Criar migrations modulares
- [ ] CRUD básico de OS com validações

### **FASE 2: WORKFLOWS CONFIGURÁVEIS (2-3 semanas)**
- [ ] Sistema de workflows por loja
- [ ] Etapas configuráveis (sequencial/paralelo)
- [ ] Checklists obrigatórios por etapa
- [ ] Controle de permissões por etapa

### **FASE 3: INTEGRAÇÕES (2-3 semanas)**
- [ ] Integração com orçamentos aprovados
- [ ] Integração com módulo estoque
- [ ] Sistema de notificações específicas
- [ ] Integração com motor de cálculo

### **FASE 4: RASTREABILIDADE (1-2 semanas)**
- [ ] Histórico completo de movimentações
- [ ] Sistema de anexos por etapa
- [ ] Logs detalhados de auditoria
- [ ] Relatórios de produtividade

### **FASE 5: FRONTEND & UX (2-3 semanas)**
- [ ] Interface CRUD seguindo padrão existente
- [ ] Dashboard de produção
- [ ] Kanban de OS por status
- [ ] Notificações visuais

---

## ✅ **CRITÉRIOS DE ACEITE MAPEADOS**

### **Funcionalidades Básicas**
- ✅ **Viável**: CRUD completo implementável
- ✅ **Viável**: Integração automática com orçamentos
- ✅ **Viável**: Workflows configuráveis por loja

### **Controles e Validações**
- ✅ **Viável**: Checagem de insumos via API estoque
- ✅ **Viável**: Sistema de permissões existente
- ✅ **Viável**: Checklists obrigatórios por etapa

### **Rastreabilidade e Auditoria**
- ✅ **Viável**: Histórico completo implementável
- ✅ **Viável**: Sistema de anexos existente
- ✅ **Viável**: Logs detalhados via MovimentacaoOS

### **Integrações**
- ✅ **Viável**: Estoque tem APIs para reserva/baixa
- ✅ **Viável**: Sistema de notificações completo
- ✅ **Viável**: WebSocket para tempo real

---

## 🚨 **CONSIDERAÇÕES IMPORTANTES**

### **Seguir Premissas Obrigatoriamente**
- ✅ **JwtModule próprio**: Evitar problemas de autenticação
- ✅ **Arquivos limitados**: Manter manutenibilidade
- ✅ **Multi-tenant**: Isolamento por lojaId
- ✅ **Prisma padrão**: Usar @prisma/client sem outputs customizados

### **Não Modificar Módulos Existentes**
- ✅ **Princípio fundamental**: Não alterar código que funciona
- ✅ **Apenas adicionar**: Novos relacionamentos no schema
- ✅ **Compatibilidade**: Manter 100% de compatibilidade

### **Testes Obrigatórios**
- ✅ **80% cobertura**: Conforme premissas
- ✅ **DoD por fase**: Testes antes de prosseguir
- ✅ **Validação completa**: Build, lints, funcionalidade

---

## 🎉 **CONCLUSÃO**

### **✅ MÓDULO DE OS É TOTALMENTE VIÁVEL**

O sistema atual possui **TODA a infraestrutura necessária** para implementar o módulo de OS:

1. **Arquitetura modular** já estabelecida
2. **Integrações naturais** com módulos existentes
3. **Padrões definidos** e funcionando
4. **Infraestrutura completa** (autenticação, notificações, WebSocket)
5. **Motor de cálculo** para automação de insumos
6. **Sistema de estoque** para controle de materiais

### **Próximos Passos Recomendados**
1. **Aprovação do plano** pela equipe
2. **Início da Fase 1** (estrutura base)
3. **Implementação incremental** seguindo as fases
4. **Testes contínuos** conforme premissas

O módulo de OS será uma **evolução natural** do sistema, aproveitando toda a base sólida já construída.

---

## 🎨 **ANÁLISE DOS COMPONENTES CRUD REUTILIZÁVEIS**

### ✅ **COMPONENTIZAÇÃO COMPLETA DISPONÍVEL**

O sistema possui uma **estrutura de componentes CRUD muito bem estabelecida** e totalmente reutilizável:

#### **🏗️ Componentes Base Identificados**

**1. Estrutura de Páginas CRUD:**
- ✅ `CrudPage.tsx` - Layout base para páginas CRUD
- ✅ `PageHeader.tsx` - Cabeçalho padronizado com título, botão voltar, ações
- ✅ `DataTable.tsx` - Tabela base com TanStack Table
- ✅ `ViewToggle.tsx` - Alternância entre tabela e cards

**2. Componentes de Interface:**
- ✅ **Cards especializados**: `cliente-card.tsx`, `insumo-card.tsx`, `orcamento-card.tsx`, `localizacao-card.tsx`
- ✅ **Formulários complexos**: `OrcamentoForm.tsx`, `ProdutoTemplateForm.tsx`
- ✅ **Seções modulares**: `MaterialSection.tsx`, `MaquinaSection.tsx`, `FuncaoSection.tsx`

**3. Padrão de Layout Estabelecido:**
- ✅ **Desktop**: Visualização padrão em tabela com opção para cards
- ✅ **Mobile**: Sempre cards por padrão (conforme premissas)
- ✅ **Responsividade**: Hook `useIsMobile()` para controle automático
- ✅ **Filtros**: Barra de busca padrão com Input + ícone Search

#### **🎯 Padrão CRUD Identificado (Baseado em Transferências)**

**Estrutura Padrão das Páginas:**
```tsx
// Header com título, botão voltar e ações
<PageHeader 
  title="Nome do Módulo"
  backHref="/modulo-pai"
  icon={<IconeDoModulo />}
  actions={<Button>Nova Ação</Button>}
/>

// KPIs/Métricas no topo (cards)
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>Métrica 1</Card>
  <Card>Métrica 2</Card>
  <Card>Métrica 3</Card>
</div>

// Toolbar com busca e ViewToggle
<div className="flex justify-between">
  <div className="flex items-center gap-2">
    <Search className="h-4 w-4" />
    <Input placeholder="Buscar..." />
  </div>
  {!isMobile && <ViewToggle />}
</div>

// Conteúdo alternado
{viewMode === 'table' ? <DataTable /> : <CardsGrid />}
```

#### **📋 Componentes Específicos para OS**

**Componentes que podem ser reutilizados diretamente:**
- ✅ `PageHeader` - Para cabeçalho das páginas
- ✅ `CrudPage` - Layout base
- ✅ `DataTable` - Tabelas de OS
- ✅ `ViewToggle` - Alternância tabela/cards
- ✅ `ConfirmDialog` - Confirmações de ações
- ✅ `Badge` - Status das OS
- ✅ `Card` - Cards de OS

**Novos componentes necessários (seguindo padrão existente):**
- 📝 `os-card.tsx` - Card específico para OS
- 📝 `workflow-section.tsx` - Seção de workflow configurável
- 📝 `checklist-section.tsx` - Seção de checklists por etapa
- 📝 `historico-os.tsx` - Histórico de movimentações

#### **🔧 Hooks e Utilitários Disponíveis**

**Hooks Reutilizáveis:**
- ✅ `useIsMobile()` - Detecção de dispositivo móvel
- ✅ `useOrcamentoData()` - Padrão para hooks de dados
- ✅ `useProdutoData()` - Padrão para carregamento de entidades

**Padrão para novo hook:**
```tsx
export function useOSData() {
  // Seguir padrão dos hooks existentes
  // Carregar clientes, workflows, responsáveis, etc.
}
```

#### **🎨 Sistema de Design Estabelecido**

**Cores e Badges (baseado em transferências):**
```tsx
const statusColors = {
  'FILA': 'bg-gray-100 text-gray-800',
  'PRODUCAO': 'bg-blue-100 text-blue-800', 
  'ACABAMENTO': 'bg-yellow-100 text-yellow-800',
  'FINALIZADA': 'bg-green-100 text-green-800',
  'CANCELADA': 'bg-red-100 text-red-800'
};
```

**Ícones Estabelecidos:**
- ✅ `Package` - Para itens/produtos
- ✅ `Calendar` - Para datas
- ✅ `MapPin` - Para localizações
- ✅ `User` - Para responsáveis
- ✅ `Clock` - Para prazos
- ✅ `CheckCircle` - Para etapas concluídas

### 🚀 **CONCLUSÃO - COMPONENTIZAÇÃO**

**✅ 100% REUTILIZÁVEL**: O sistema possui uma base de componentes **extremamente sólida** que permite implementar o módulo OS seguindo exatamente os mesmos padrões visuais e de UX dos módulos existentes.

**Vantagens identificadas:**
1. **Consistência visual** garantida
2. **Desenvolvimento acelerado** (componentes prontos)
3. **Manutenibilidade** (padrões estabelecidos)
4. **Responsividade** automática
5. **Acessibilidade** já implementada

**Próximo passo:** Implementar apenas os componentes específicos de OS (os-card, workflow-section, etc.) seguindo exatamente o padrão dos componentes existentes.

---

## 🔗 **ANÁLISE DE INTEGRAÇÃO COM ORÇAMENTOS V2**

### ⚠️ **STATUS ATUAL: ORÇAMENTOS V2 EM DESENVOLVIMENTO**

Baseado na análise do sistema atual, identifiquei a situação dos orçamentos V2:

#### **🏗️ Estrutura Atual Encontrada:**

**✅ BACKEND - Estrutura Parcial:**
- ❌ **OrcamentosV2Module**: Comentado/desabilitado no `app.module.ts`
- ✅ **Schema V2**: Existe `orcamentos-v2-schema.prisma` completo
- ✅ **Motor Cálculo V2**: `MotorCalculoV2Module` ativo e funcionando
- ✅ **Sistema de Eventos**: WebSocket implementado
- ✅ **Sistema de Notificações**: Completo e funcionando

**✅ FRONTEND - Implementado:**
- ✅ **Páginas V2**: `/orcamentos-v2/` funcionando
- ✅ **Formulários V2**: `OrcamentoV2Form` implementado
- ✅ **Componentes**: Cards, tabelas, ViewToggle
- ✅ **Preview Tempo Real**: WebSocket integrado

#### **🎯 Pontos de Integração Identificados:**

**1. Sistema de Aprovação (PRONTO):**
```typescript
// Em orcamentos.service.ts - método aprovarOrcamento()
async aprovarOrcamento(codigo: string) {
  // 1. Validar e aprovar orçamento
  const orcamentoAtualizado = await this.prisma.orcamento.update({
    where: { id: orcamento.id },
    data: { status_aprovacao: 'APROVADO' }
  });

  // 2. Criar notificação
  await this.notificacoesService.criarNotificacao(
    orcamento.loja_id,
    TipoNotificacao.ORCAMENTO_APROVADO,
    'Orçamento Aprovado',
    `O orçamento #${orcamento.numero} foi aprovado`,
    orcamento.id,
  );

  // ✅ AQUI: Ponto ideal para disparar criação de OS
  // TODO: Integrar com módulo OS quando implementado
}
```

**2. Schema V2 com Campos Extras (DISPONÍVEL):**
```prisma
model orcamento {
  // Campos V2 úteis para OS:
  responsavel_id         String?    // ✅ Responsável pela OS
  prioridade             String?    // ✅ Prioridade da OS
  data_aprovacao         DateTime?  // ✅ Data base para OS
  custos_calculados      String?    // ✅ Insumos calculados
  configuracao_calculo   String?    // ✅ Parâmetros técnicos
  
  // Relacionamentos V2:
  produtos               ProdutoOrcamento[] // ✅ Produtos detalhados
}
```

**3. Sistema de Notificações (PRONTO):**
```typescript
export enum TipoNotificacao {
  ORCAMENTO_APROVADO = 'ORCAMENTO_APROVADO',
  // ✅ Pode adicionar: OS_CRIADA, OS_ETAPA_CONCLUIDA, etc.
}
```

**4. WebSocket para Tempo Real (FUNCIONANDO):**
```typescript
// WebSocket já implementado para:
- Notificações em tempo real
- Preview de cálculos
- Chat de negociação
// ✅ Pode ser usado para status de OS em tempo real
```

### 🚀 **ESTRATÉGIA DE INTEGRAÇÃO RECOMENDADA:**

#### **FASE 1: Preparação (Quando Orçamentos V2 estiver pronto)**
- ✅ **Aguardar**: Conclusão do desenvolvimento dos Orçamentos V2
- ✅ **Hook de Integração**: Adicionar chamada para OS no `aprovarOrcamento()`
- ✅ **Novos Tipos**: Adicionar `TipoNotificacao.OS_CRIADA`

#### **FASE 2: Integração Automática**
```typescript
// No OrcamentosService.aprovarOrcamento()
async aprovarOrcamento(codigo: string) {
  // ... código existente ...
  
  // NOVA INTEGRAÇÃO COM OS
  try {
    await this.osService.criarOSDeOrcamento(orcamento.id);
    console.log('✅ OS criada automaticamente');
  } catch (error) {
    console.log('⚠️ Erro ao criar OS:', error);
  }
}
```

#### **FASE 3: Dados Herdados**
```typescript
// Dados que a OS herdará do orçamento V2:
interface DadosHerdadosOS {
  cliente_id: string;           // ✅ Cliente
  nome_servico: string;         // ✅ Produto/Serviço
  quantidade_produto: number;   // ✅ Quantidade
  custos_calculados: JSON;      // ✅ Insumos calculados
  configuracao_calculo: JSON;   // ✅ Parâmetros técnicos
  responsavel_id: string;       // ✅ Responsável inicial
  prioridade: string;           // ✅ Prioridade
}
```

### ✅ **CONCLUSÃO - INTEGRAÇÃO**

**🎯 PERFEITAMENTE VIÁVEL**: O sistema atual possui **TODA a infraestrutura necessária** para integração automática:

1. **✅ Sistema de aprovação funcionando**
2. **✅ Notificações em tempo real**  
3. **✅ WebSocket para updates**
4. **✅ Schema V2 com dados necessários**
5. **✅ Motor de cálculo para insumos**

**📋 PRÓXIMOS PASSOS:**
1. **Aguardar**: Conclusão dos Orçamentos V2
2. **Implementar**: Módulo OS seguindo as fases definidas
3. **Integrar**: Hook simples no `aprovarOrcamento()`
4. **Testar**: Fluxo completo Orçamento → OS

**🔄 A integração será NATURAL e AUTOMÁTICA** - quando um orçamento V2 for aprovado, uma OS será criada automaticamente com todos os dados necessários!

---

## 🚀 **O QUE JÁ PODE SER IMPLEMENTADO INDEPENDENTEMENTE**

### ✅ **IMPLEMENTAÇÃO IMEDIATA (SEM DEPENDÊNCIAS)**

Enquanto os Orçamentos V2 estão sendo finalizados, estes componentes podem ser implementados **AGORA**:

#### **🏗️ FASE 1A: ESTRUTURA BASE INDEPENDENTE**

**1. Schema Prisma das Entidades OS:**
```prisma
// ✅ PODE IMPLEMENTAR AGORA
model OrdemServico {
  id                 String    @id @default(cuid())
  numero             String    // Autonumeração
  loja_id            String
  cliente_id         String
  orcamento_id       String?   // ✅ Opcional por enquanto
  data_abertura      DateTime  @default(now())
  data_prazo         DateTime?
  status             String    @default("FILA")
  responsavel_id     String?
  observacoes        String?   @db.Text
  criado_em          DateTime  @default(now())
  atualizado_em      DateTime  @updatedAt
  
  // Relacionamentos que já existem
  loja               loja      @relation(fields: [loja_id], references: [id])
  cliente            cliente   @relation(fields: [cliente_id], references: [id])
  // orcamento será opcional até V2 estar pronto
  
  @@unique([loja_id, numero])
  @@index([loja_id, status])
  @@map("ordens_servico")
}

model WorkflowOS {
  id                 String    @id @default(cuid())
  loja_id            String
  nome               String
  etapas             String    @db.LongText // JSON
  ativo              Boolean   @default(true)
  criado_em          DateTime  @default(now())
  
  loja               loja      @relation(fields: [loja_id], references: [id])
  
  @@unique([loja_id, nome])
  @@map("workflow_os")
}

model MovimentacaoOS {
  id                 String    @id @default(cuid())
  os_id              String
  etapa_anterior     String?
  etapa_atual        String
  usuario_id         String
  data_movimentacao  DateTime  @default(now())
  observacoes        String?   @db.Text
  
  os                 OrdemServico @relation(fields: [os_id], references: [id])
  
  @@index([os_id])
  @@index([data_movimentacao])
  @@map("movimentacoes_os")
}
```

**2. Módulo Backend Isolado:**
```typescript
// ✅ PODE IMPLEMENTAR AGORA
// backend/src/os/os.module.ts
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [OSController, WorkflowController],
  providers: [OSService, WorkflowService],
  exports: [OSService],
})
export class OSModule {}
```

**3. Services Base:**
```typescript
// ✅ PODE IMPLEMENTAR AGORA
// backend/src/os/services/os.service.ts
@Injectable()
export class OSService {
  constructor(private readonly prisma: PrismaService) {}

  // CRUD básico de OS
  async create(createOSDto: CreateOSDto) { }
  async findAll(lojaId: string) { }
  async findOne(id: string) { }
  async update(id: string, updateOSDto: UpdateOSDto) { }
  async delete(id: string) { }
  
  // Métodos específicos
  async gerarNumeroOS(lojaId: string) { }
  async avancarEtapa(osId: string, novaEtapa: string) { }
  async adicionarMovimentacao(osId: string, dados: any) { }
}
```

#### **🎨 FASE 1B: COMPONENTES FRONTEND**

**4. Componentes UI Específicos:**
```tsx
// ✅ PODE IMPLEMENTAR AGORA
// frontend/src/components/ui/os-card.tsx
export function OSCard({ os }: { os: OrdemServico }) {
  // Seguir padrão dos outros cards existentes
}

// frontend/src/components/ui/workflow-section.tsx  
export function WorkflowSection({ osId }: { osId: string }) {
  // Seção para configurar workflows
}

// frontend/src/components/ui/historico-os.tsx
export function HistoricoOS({ osId }: { osId: string }) {
  // Histórico de movimentações
}
```

**5. Páginas CRUD Básicas:**
```tsx
// ✅ PODE IMPLEMENTAR AGORA
// frontend/src/app/(main)/os/page.tsx
export default function OSPage() {
  // Seguir padrão das páginas existentes
  // ViewToggle, DataTable, Cards, etc.
}

// frontend/src/app/(main)/os/novo/page.tsx
// frontend/src/app/(main)/os/[id]/editar/page.tsx
```

#### **⚙️ FASE 1C: FUNCIONALIDADES INDEPENDENTES**

**6. Sistema de Workflows:**
```typescript
// ✅ PODE IMPLEMENTAR AGORA
// backend/src/os/services/workflow.service.ts
@Injectable()
export class WorkflowService {
  // Criar workflows personalizados por loja
  async criarWorkflow(lojaId: string, dados: WorkflowData) { }
  
  // Definir etapas sequenciais ou paralelas
  async definirEtapas(workflowId: string, etapas: Etapa[]) { }
  
  // Validar transições de etapas
  async validarTransicao(etapaAtual: string, proximaEtapa: string) { }
}
```

**7. Sistema de Autonumeração:**
```typescript
// ✅ PODE IMPLEMENTAR AGORA
async gerarNumeroOS(lojaId: string): Promise<string> {
  const ultimaOS = await this.prisma.ordemServico.findFirst({
    where: { loja_id: lojaId },
    orderBy: { numero: 'desc' }
  });
  
  const proximoNumero = ultimaOS 
    ? parseInt(ultimaOS.numero) + 1 
    : 1;
    
  return proximoNumero.toString().padStart(6, '0');
}
```

**8. Sistema de Status e Badges:**
```typescript
// ✅ PODE IMPLEMENTAR AGORA
const statusColorsOS = {
  'FILA': 'bg-gray-100 text-gray-800',
  'PRODUCAO': 'bg-blue-100 text-blue-800',
  'ACABAMENTO': 'bg-yellow-100 text-yellow-800', 
  'FINALIZADA': 'bg-green-100 text-green-800',
  'CANCELADA': 'bg-red-100 text-red-800'
};
```

### ⏳ **IMPLEMENTAÇÃO POSTERIOR (COM DEPENDÊNCIAS)**

Estes componentes **aguardam** finalização dos Orçamentos V2:

#### **🔗 INTEGRAÇÕES (Aguardar V2)**
- ❌ Hook no `aprovarOrcamento()`
- ❌ Herança de dados do orçamento
- ❌ Integração com motor de cálculo V2
- ❌ Criação automática de OS

#### **📦 ESTOQUE (Pode implementar depois)**
- ❌ Reserva automática de insumos
- ❌ Baixa por etapa de produção
- ❌ Validação de disponibilidade

### 🎯 **ESTRATÉGIA RECOMENDADA**

**IMPLEMENTAR AGORA (Paralelamente aos Orçamentos V2):**

1. **✅ Schema Prisma** - Entidades base
2. **✅ Módulo Backend** - Estrutura isolada
3. **✅ CRUD Básico** - Services e Controllers
4. **✅ Páginas Frontend** - Seguindo padrão existente
5. **✅ Componentes UI** - Cards, formulários, etc.
6. **✅ Sistema de Workflows** - Configurável por loja
7. **✅ Autonumeração** - Sistema de números sequenciais

**INTEGRAR DEPOIS (Quando V2 estiver pronto):**
1. **🔗 Hook de aprovação** - Linha no `aprovarOrcamento()`
2. **📊 Herança de dados** - Copiar dados do orçamento
3. **📦 Integração estoque** - Reservas e baixas

### ✅ **VANTAGENS DESTA ABORDAGEM**

1. **🚀 Desenvolvimento paralelo** - Não bloqueia progresso
2. **🧪 Testes independentes** - Pode testar OS separadamente  
3. **🔧 Refinamento** - Ajustar UX antes da integração
4. **⚡ Entrega mais rápida** - Módulo funcional mais cedo
5. **🎯 Foco** - Você termina V2, depois integra

**💡 RESULTADO:** Quando os Orçamentos V2 estiverem prontos, bastará adicionar **UMA LINHA** no método de aprovação para ter integração completa!

---

## 🔗 **INTEGRAÇÃO ENTRE MÓDULOS - PONTOS CRÍTICOS**

### 📋 **VISÃO GERAL DAS INTEGRAÇÕES**

O módulo de OS será o **centro de integração** do sistema produtivo, conectando:
- **Orçamentos V2** → **OS** → **Estoque** → **Notificações** → **Usuários**

### 🎯 **MAPA DE INTEGRAÇÕES DETALHADO**

#### **1. 🔄 ORÇAMENTOS V2 → OS (INTEGRAÇÃO PRINCIPAL)**

**Ponto de Integração:**
```typescript
// backend/src/orcamentos/orcamentos.service.ts - linha ~1393
async aprovarOrcamento(codigo: string) {
  // ... código existente de aprovação ...

  // ✅ PONTO DE INTEGRAÇÃO COM OS
  try {
    // Verificar se deve criar OS automaticamente
    if (orcamento.tipo_orcamento === 'PRODUTO' && orcamento.status_aprovacao === 'APROVADO') {
      const osCreated = await this.osService.criarOSDeOrcamento({
        orcamentoId: orcamento.id,
        lojaId: orcamento.loja_id,
        clienteId: orcamento.cliente_id,
        dadosHerdados: {
          nome_servico: orcamento.nome_servico,
          quantidade_produto: orcamento.quantidade_produto,
          custos_calculados: JSON.parse(orcamento.custos_calculados || '{}'),
          configuracao_calculo: JSON.parse(orcamento.configuracao_calculo || '{}'),
          responsavel_id: orcamento.responsavel_id,
          prioridade: orcamento.prioridade || 'NORMAL',
          prazo_estimado: this.calcularPrazoProducao(orcamento.horas_producao),
          parametros_tecnicos: {
            largura: orcamento.largura_produto,
            altura: orcamento.altura_produto,
            area: orcamento.area_produto,
            unidade_medida: orcamento.unidade_medida_produto
          }
        }
      });

      // Notificar criação da OS
      await this.notificacoesService.criarNotificacao(
        orcamento.loja_id,
        TipoNotificacao.OS_CRIADA,
        'OS Criada Automaticamente',
        `OS #${osCreated.numero} foi criada a partir do orçamento #${orcamento.numero}`,
        osCreated.id
      );

      console.log(`✅ OS #${osCreated.numero} criada automaticamente`);
    }
  } catch (error) {
    console.error('⚠️ Erro ao criar OS automaticamente:', error);
    // NÃO falhar a aprovação por erro na criação da OS
  }
}
```

**Dados Herdados do Orçamento V2:**
```typescript
interface DadosHerdadosOrcamento {
  // Dados básicos
  cliente_id: string;
  nome_servico: string;
  descricao?: string;
  quantidade_produto: number;
  
  // Parâmetros técnicos
  largura_produto?: number;
  altura_produto?: number;
  area_produto?: number;
  unidade_medida_produto?: string;
  
  // Dados de produção
  horas_producao: number;
  custos_calculados: JSON;        // Insumos já calculados pelo motor V2
  configuracao_calculo: JSON;     // Parâmetros de cálculo
  
  // Gestão
  responsavel_id?: string;
  prioridade?: string;
  prazo_entrega?: string;
  observacoes_internas?: string;
  
  // Relacionamentos
  produtos: ProdutoOrcamento[];   // Produtos detalhados do V2
}
```

#### **2. 📦 OS → ESTOQUE (CONTROLE DE MATERIAIS)**

**Pontos de Integração:**

**A) Reserva Automática de Insumos:**
```typescript
// backend/src/os/services/os.service.ts
async criarOSDeOrcamento(dados: DadosHerdadosOrcamento) {
  // 1. Criar a OS
  const os = await this.prisma.ordemServico.create({ ... });

  // 2. Processar insumos calculados
  const insumosNecessarios = this.extrairInsumosDoCustoCalculado(dados.custos_calculados);

  // 3. Reservar insumos no estoque
  for (const insumo of insumosNecessarios) {
    try {
      await this.estoqueService.reservarInsumo({
        insumoId: insumo.id,
        quantidade: insumo.quantidade_necessaria,
        osId: os.id,
        lojaId: dados.lojaId,
        observacoes: `Reserva automática para OS #${os.numero}`
      });
    } catch (error) {
      // Marcar OS como "AGUARDANDO_MATERIAL" se não houver estoque
      await this.marcarOSComProblemaEstoque(os.id, insumo);
    }
  }

  return os;
}
```

**B) Validação de Disponibilidade:**
```typescript
async validarDisponibilidadeMateriais(osId: string): Promise<ValidacaoEstoque> {
  const os = await this.findOne(osId);
  const insumosNecessarios = await this.getInsumosNecessarios(osId);
  
  const validacao = await this.estoqueService.validarDisponibilidade({
    insumos: insumosNecessarios,
    lojaId: os.loja_id
  });

  if (!validacao.todosDisponiveis) {
    // Bloquear avanço da OS
    await this.adicionarMovimentacao(osId, {
      etapa_atual: 'AGUARDANDO_MATERIAL',
      observacoes: `Materiais indisponíveis: ${validacao.faltantes.join(', ')}`
    });
  }

  return validacao;
}
```

**C) Baixa por Etapas:**
```typescript
async avancarEtapaComBaixaEstoque(osId: string, novaEtapa: string) {
  // 1. Validar se pode avançar
  const podeAvancar = await this.validarTransicaoEtapa(osId, novaEtapa);
  if (!podeAvancar.pode) {
    throw new Error(podeAvancar.motivo);
  }

  // 2. Verificar se etapa requer baixa de estoque
  const etapasComBaixa = ['PRODUCAO', 'ACABAMENTO'];
  if (etapasComBaixa.includes(novaEtapa)) {
    const insumosEtapa = await this.getInsumosPorEtapa(osId, novaEtapa);
    
    for (const insumo of insumosEtapa) {
      await this.estoqueService.baixarInsumo({
        insumoId: insumo.id,
        quantidade: insumo.quantidade,
        osId: osId,
        etapa: novaEtapa,
        usuarioId: this.getCurrentUser().id
      });
    }
  }

  // 3. Avançar etapa
  await this.avancarEtapa(osId, novaEtapa);
}
```

#### **3. 🔔 OS → NOTIFICAÇÕES (COMUNICAÇÃO EM TEMPO REAL)**

**Novos Tipos de Notificação:**
```typescript
// backend/src/notificacoes/notificacoes.service.ts
export enum TipoNotificacao {
  // Existentes
  ORCAMENTO_APROVADO = 'ORCAMENTO_APROVADO',
  
  // Novos para OS
  OS_CRIADA = 'OS_CRIADA',
  OS_ETAPA_AVANCADA = 'OS_ETAPA_AVANCADA',
  OS_MATERIAL_FALTANDO = 'OS_MATERIAL_FALTANDO',
  OS_PRAZO_VENCENDO = 'OS_PRAZO_VENCENDO',
  OS_FINALIZADA = 'OS_FINALIZADA',
  OS_CANCELADA = 'OS_CANCELADA',
  OS_PROBLEMA_PRODUCAO = 'OS_PROBLEMA_PRODUCAO',
}
```

**Sistema de Notificações Automáticas:**
```typescript
// backend/src/os/services/notificacoes-os.service.ts
@Injectable()
export class NotificacoesOSService {
  
  async notificarCriacaoOS(os: OrdemServico) {
    // Notificar responsável
    if (os.responsavel_id) {
      await this.notificacoesService.criarNotificacao(
        os.loja_id,
        TipoNotificacao.OS_CRIADA,
        'Nova OS Atribuída',
        `OS #${os.numero} foi atribuída para você`,
        os.id,
        { responsavel_id: os.responsavel_id }
      );
    }

    // Notificar gestores
    await this.notificarGestores(os.loja_id, {
      tipo: TipoNotificacao.OS_CRIADA,
      titulo: 'Nova OS Criada',
      mensagem: `OS #${os.numero} foi criada automaticamente`,
      osId: os.id
    });
  }

  async notificarAvancamentoEtapa(osId: string, etapaAnterior: string, etapaAtual: string) {
    const os = await this.osService.findOne(osId);
    
    // WebSocket para tempo real
    this.websocketsService.emitToRoom(`loja_${os.loja_id}`, 'os_etapa_avancada', {
      osId: osId,
      numero: os.numero,
      etapaAnterior,
      etapaAtual,
      timestamp: new Date().toISOString()
    });

    // Notificação persistente
    await this.notificacoesService.criarNotificacao(
      os.loja_id,
      TipoNotificacao.OS_ETAPA_AVANCADA,
      'Etapa Avançada',
      `OS #${os.numero} avançou de ${etapaAnterior} para ${etapaAtual}`,
      osId
    );
  }
}
```

#### **4. 👥 OS → USUÁRIOS (CONTROLE DE ACESSO E RESPONSABILIDADES)**

**⚠️ ATENÇÃO: MÓDULO DE USUÁRIOS PARCIALMENTE IMPLEMENTADO**

Após análise detalhada, identifiquei que o módulo de usuários está **FUNCIONALMENTE COMPLETO** mas precisa de **AJUSTES ESPECÍFICOS** para integração com OS:

**✅ O QUE JÁ EXISTE:**
- ✅ **Backend completo**: CRUD de usuários e perfis funcionando
- ✅ **Schema Prisma robusto**: Sistema completo de perfis e permissões
- ✅ **Frontend implementado**: Páginas de gestão de usuários e perfis
- ✅ **Sistema de permissões**: `perfil_acesso`, `perfil_permissao`, `usuario_perfil`
- ✅ **Funções definidas**: `ADMINISTRADOR`, `FINANCEIRO`, `PRODUCAO`, `VENDAS`, `ESTOQUE`

**📋 AJUSTES NECESSÁRIOS PARA OS:**

**A) Adicionar Permissões Específicas para OS:**
```typescript
// Novas permissões que precisam ser adicionadas
const permissoesOS = [
  // Permissões básicas
  { modulo: 'OS', acao: 'VISUALIZAR' },
  { modulo: 'OS', acao: 'CRIAR' },
  { modulo: 'OS', acao: 'EDITAR' },
  { modulo: 'OS', acao: 'EXCLUIR' },
  
  // Permissões por etapa
  { modulo: 'OS', acao: 'AVANCAR_FILA' },
  { modulo: 'OS', acao: 'AVANCAR_PRODUCAO' },
  { modulo: 'OS', acao: 'AVANCAR_ACABAMENTO' },
  { modulo: 'OS', acao: 'FINALIZAR_OS' },
  { modulo: 'OS', acao: 'CANCELAR_OS' },
  
  // Permissões administrativas
  { modulo: 'OS', acao: 'GERENCIAR_WORKFLOWS' },
  { modulo: 'OS', acao: 'ATRIBUIR_RESPONSAVEL' },
  { modulo: 'OS', acao: 'VISUALIZAR_HISTORICO' },
];
```

**B) Perfis Padrão Recomendados para OS:**
```typescript
const perfisOS = {
  'OPERADOR_PRODUCAO': {
    nome: 'Operador de Produção',
    permissoes: [
      'OS.VISUALIZAR',
      'OS.AVANCAR_PRODUCAO',
      'OS.AVANCAR_ACABAMENTO'
    ]
  },
  'SUPERVISOR_PRODUCAO': {
    nome: 'Supervisor de Produção', 
    permissoes: [
      'OS.VISUALIZAR',
      'OS.CRIAR',
      'OS.EDITAR',
      'OS.AVANCAR_FILA',
      'OS.AVANCAR_PRODUCAO',
      'OS.AVANCAR_ACABAMENTO',
      'OS.FINALIZAR_OS',
      'OS.ATRIBUIR_RESPONSAVEL'
    ]
  },
  'GESTOR_PRODUCAO': {
    nome: 'Gestor de Produção',
    permissoes: [
      'OS.*', // Todas as permissões de OS
      'OS.GERENCIAR_WORKFLOWS',
      'OS.CANCELAR_OS'
    ]
  }
};
```

**Sistema de Permissões por Etapa:**
```typescript
// backend/src/os/guards/os-etapa.guard.ts
@Injectable()
export class OSEtapaGuard implements CanActivate {
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { osId, novaEtapa } = request.body;
    const usuario = request.user;

    // Verificar se usuário pode avançar esta etapa específica
    const permissao = await this.verificarPermissaoEtapa(
      usuario.id, 
      usuario.funcao, 
      osId, 
      novaEtapa
    );

    if (!permissao.permitido) {
      throw new ForbiddenException(permissao.motivo);
    }

    return true;
  }

  private async verificarPermissaoEtapa(userId: string, funcao: string, osId: string, etapa: string) {
    const regrasEtapa = {
      'FILA': ['ADMINISTRADOR', 'PRODUCAO'],
      'PRODUCAO': ['ADMINISTRADOR', 'PRODUCAO'],
      'ACABAMENTO': ['ADMINISTRADOR', 'PRODUCAO'],
      'FINALIZADA': ['ADMINISTRADOR', 'PRODUCAO'],
    };

    const podeAvancar = regrasEtapa[etapa]?.includes(funcao) || false;
    
    return {
      permitido: podeAvancar,
      motivo: podeAvancar ? null : `Usuário sem permissão para avançar etapa ${etapa}`
    };
  }
}
```

**Atribuição Automática de Responsáveis:**
```typescript
async atribuirResponsavelPorEtapa(osId: string, etapa: string) {
  const configuracaoLoja = await this.getConfiguracaoResponsaveis(osId);
  
  const responsavelEtapa = configuracaoLoja.responsaveis_por_etapa[etapa];
  if (responsavelEtapa) {
    await this.prisma.ordemServico.update({
      where: { id: osId },
      data: { responsavel_id: responsavelEtapa }
    });

    // Notificar novo responsável
    await this.notificacoesOSService.notificarNovoResponsavel(osId, responsavelEtapa);
  }
}
```

#### **5. 🔄 MOTOR DE CÁLCULO V2 → OS (RECÁLCULOS DINÂMICOS)**

**Recálculo de Insumos em Tempo Real:**
```typescript
async recalcularInsumosOS(osId: string, novosParametros: any) {
  const os = await this.findOne(osId);
  
  // Usar motor V2 para recalcular
  const novoCalculo = await this.motorCalculoV2Service.executarCalculo({
    lojaId: os.loja_id,
    produtos: [{
      nome: os.nome_servico,
      quantidade: os.quantidade,
      parametros: novosParametros
    }]
  });

  // Atualizar insumos da OS
  await this.atualizarInsumosCalculados(osId, novoCalculo);
  
  // Revalidar estoque
  await this.validarDisponibilidadeMateriais(osId);
}
```

### ⚠️ **PONTOS CRÍTICOS A CONSIDERAR**

#### **🔒 1. TRANSAÇÕES E CONSISTÊNCIA**
```typescript
// Usar transações para operações críticas
async criarOSComReservaEstoque(dados: any) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Criar OS
    const os = await tx.ordemServico.create({ ... });
    
    // 2. Reservar insumos
    await this.reservarInsumos(tx, os.id, dados.insumos);
    
    // 3. Criar movimentações
    await this.criarMovimentacaoInicial(tx, os.id);
    
    return os;
  });
}
```

#### **🔄 2. COMPENSAÇÃO DE FALHAS**
```typescript
// Implementar rollback em caso de falhas
async desfazerReservaEstoque(osId: string) {
  const reservas = await this.getReservasPorOS(osId);
  
  for (const reserva of reservas) {
    await this.estoqueService.cancelarReserva(reserva.id);
  }
  
  await this.adicionarMovimentacao(osId, {
    etapa_atual: 'CANCELADA',
    observacoes: 'Reservas de estoque canceladas automaticamente'
  });
}
```

#### **⏱️ 3. PERFORMANCE E CACHE**
```typescript
// Cache para dados frequentemente acessados
@Injectable()
export class OSCacheService {
  
  @Cacheable('workflows', 300) // 5 minutos
  async getWorkflowsPorLoja(lojaId: string) {
    return this.prisma.workflowOS.findMany({ 
      where: { loja_id: lojaId, ativo: true } 
    });
  }

  @Cacheable('insumos_os', 60) // 1 minuto
  async getInsumosCalculados(osId: string) {
    return this.calcularInsumosNecessarios(osId);
  }
}
```

#### **📊 4. MONITORAMENTO E OBSERVABILIDADE**
```typescript
// Logs estruturados para integração
async logIntegracao(evento: string, dados: any) {
  this.logger.log({
    evento,
    timestamp: new Date().toISOString(),
    modulo: 'OS',
    integracao: dados.modulo_origem,
    dados: {
      osId: dados.osId,
      orcamentoId: dados.orcamentoId,
      status: dados.status,
      detalhes: dados.detalhes
    }
  });
}
```

#### **🔐 5. SEGURANÇA ENTRE MÓDULOS**
```typescript
// Validar origem das chamadas entre módulos
@Injectable()
export class InterModuleAuthGuard implements CanActivate {
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const moduleToken = request.headers['x-module-token'];
    
    // Validar token específico para comunicação entre módulos
    return this.validateModuleToken(moduleToken);
  }
}
```

### 📋 **CHECKLIST DE INTEGRAÇÃO**

#### **✅ PRÉ-IMPLEMENTAÇÃO**
- [ ] Definir contratos de API entre módulos
- [ ] Estabelecer formato de dados padronizado
- [ ] Configurar sistema de tokens inter-módulos
- [ ] Definir estratégia de tratamento de erros
- [ ] Planejar rollback para falhas críticas

#### **✅ DURANTE IMPLEMENTAÇÃO**
- [ ] Implementar transações para operações críticas
- [ ] Adicionar logs estruturados em todos os pontos
- [ ] Criar testes de integração para cada fluxo
- [ ] Implementar circuit breakers para APIs externas
- [ ] Configurar monitoramento de performance

#### **✅ PÓS-IMPLEMENTAÇÃO**
- [ ] Monitorar logs de erro entre módulos
- [ ] Validar performance das integrações
- [ ] Testar cenários de falha e recuperação
- [ ] Documentar troubleshooting comum
- [ ] Criar dashboards de monitoramento

### 🎯 **RESULTADO ESPERADO**

Com todas essas integrações implementadas:

1. **🔄 Fluxo Automático**: Orçamento aprovado → OS criada → Estoque reservado → Responsável notificado
2. **📊 Visibilidade Total**: Dashboards em tempo real mostrando status de todas as OS
3. **⚡ Eficiência**: Redução de trabalho manual e erros humanos
4. **🔒 Confiabilidade**: Sistema robusto com fallbacks e recuperação automática
5. **📈 Escalabilidade**: Arquitetura preparada para crescimento do negócio

---

## 🌿 **ESTRATÉGIA DE BRANCHES E DESENVOLVIMENTO ISOLADO**

### 🎯 **ESTRUTURA RECOMENDADA DE BRANCHES**

Para desenvolver o módulo de OS de forma segura e isolada, sem interferir no desenvolvimento dos orçamentos V2:

```bash
# Estrutura de branches recomendada
main/master              # ← Branch principal (produção)
├── develop             # ← Branch de desenvolvimento principal
│   ├── feature/orcamentos-v2    # ← Seu trabalho atual
│   └── feature/modulo-os         # ← Novo branch para OS
└── hotfix/*            # ← Correções urgentes se necessário
```

### 🚀 **SETUP INICIAL DO BRANCH**

#### **1. Criar Branch a partir do Develop:**
```bash
# 1. Garantir que está no branch correto e atualizado
git checkout develop
git pull origin develop

# 2. Criar novo branch para módulo OS
git checkout -b feature/modulo-os

# 3. Push inicial do branch
git push -u origin feature/modulo-os
```

#### **2. Configurar Ambiente Isolado:**
```bash
# Opcional: Criar .env específico para desenvolvimento
cp .env .env.os-development

# Adicionar variáveis específicas se necessário
echo "# Configurações específicas para módulo OS" >> .env.os-development
echo "OS_MODULE_ENABLED=true" >> .env.os-development
echo "OS_DEBUG_MODE=true" >> .env.os-development
```

### 🔒 **ESTRATÉGIA DE DESENVOLVIMENTO SEGURO**

#### **A) IMPLEMENTAÇÃO MODULAR E ISOLADA**

**1. Backend - Módulo Totalmente Isolado:**
```bash
# Estrutura recomendada para o branch
backend/src/os/                    # ✅ Módulo isolado
├── controllers/
├── services/
├── dto/
├── guards/
├── middleware/
└── os.module.ts                   # ✅ Módulo independente

# NÃO MODIFICAR no branch OS:
backend/src/app.module.ts          # ❌ Deixar para o merge final
backend/src/orcamentos/            # ❌ Não tocar nos orçamentos
backend/prisma/schema.prisma       # ❌ Schema separado inicialmente
```

**2. Schema Prisma Separado:**
```bash
# Criar schema separado para desenvolvimento
backend/prisma/os-schema.prisma    # ✅ Schema isolado para OS
backend/prisma/migrations-os/      # ✅ Migrações separadas
```

**3. Frontend Isolado:**
```bash
# Frontend isolado
frontend/src/app/(main)/os/        # ✅ Páginas do módulo OS
frontend/src/components/ui/os-*    # ✅ Componentes específicos

# NÃO MODIFICAR:
frontend/src/app/(main)/layout.tsx # ❌ Menu lateral (merge final)
```

#### **B) CONFIGURAÇÃO DE DESENVOLVIMENTO**

**1. Package.json Scripts Específicos:**
```json
{
  "scripts": {
    "dev:os": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "build:os": "npm run build:backend && npm run build:frontend",
    "test:os": "npm run test -- --testPathPattern=os",
    "migrate:os": "npx prisma migrate dev --schema=./prisma/os-schema.prisma"
  }
}
```

**2. Docker Compose para Isolamento (Opcional):**
```yaml
# docker-compose.os.yml
version: '3.8'
services:
  mysql-os:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: comunikapp_os_dev
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3307:3306"  # Porta diferente para não conflitar
```

### 🔄 **WORKFLOW DE DESENVOLVIMENTO**

#### **FASE 1: Desenvolvimento Isolado**
```bash
# Durante desenvolvimento - commits frequentes
git add .
git commit -m "feat(os): implementar schema base das entidades OS"
git push origin feature/modulo-os

git commit -m "feat(os): adicionar CRUD básico de ordens de serviço"
git push origin feature/modulo-os

git commit -m "feat(os): implementar sistema de workflows configuráveis"
git push origin feature/modulo-os
```

#### **FASE 2: Testes de Integração Local**
```bash
# Antes do merge - testar integração localmente
git checkout feature/modulo-os
git merge develop                  # ← Trazer mudanças do develop
# Resolver conflitos se houver
npm run test:integration
npm run build
```

#### **FASE 3: Merge Controlado**
```bash
# 1. Pull Request para develop
# Criar PR: feature/modulo-os → develop

# 2. Review de código
# 3. Testes automatizados
# 4. Merge após aprovação
```

### ⚠️ **PONTOS CRÍTICOS DE SEGURANÇA**

#### **🔒 ARQUIVOS QUE NÃO DEVEM SER MODIFICADOS NO BRANCH OS:**

```bash
# Backend - NÃO MODIFICAR
backend/src/app.module.ts           # ❌ Registro de módulos
backend/src/orcamentos/             # ❌ Módulo de orçamentos  
backend/prisma/schema.prisma        # ❌ Schema principal
backend/package.json                # ❌ Dependências principais

# Frontend - NÃO MODIFICAR  
frontend/src/app/(main)/layout.tsx  # ❌ Menu lateral
frontend/src/app/(main)/orcamentos/ # ❌ Páginas de orçamentos
frontend/package.json               # ❌ Dependências principais
```

#### **✅ ARQUIVOS SEGUROS PARA MODIFICAR:**

```bash
# Backend - SEGURO
backend/src/os/**                   # ✅ Tudo dentro da pasta os/
backend/prisma/os-schema.prisma     # ✅ Schema separado
backend/src/common/guards/          # ✅ Guards compartilhados (cuidado)

# Frontend - SEGURO
frontend/src/app/(main)/os/**       # ✅ Páginas do módulo OS
frontend/src/components/ui/os-*     # ✅ Componentes específicos OS
frontend/src/components/crud/       # ✅ Componentes CRUD (já existem)
```

### 🧪 **ESTRATÉGIA DE TESTES**

#### **1. Testes Isolados:**
```bash
# Testes específicos do módulo OS
backend/src/os/__tests__/
frontend/src/app/(main)/os/__tests__/

# Scripts de teste isolados
npm run test:os:backend
npm run test:os:frontend
npm run test:os:integration
```

#### **2. Testes de Integração:**
```typescript
// backend/src/os/__tests__/integration/
describe('Módulo OS - Integração', () => {
  it('deve funcionar sem afetar outros módulos', () => {
    // Testes que garantem isolamento
  });
  
  it('deve integrar corretamente com módulos existentes', () => {
    // Testes de integração controlada
  });
});
```

### 🔄 **MERGE STRATEGY RECOMENDADA**

#### **QUANDO FAZER O MERGE:**

```bash
# ✅ CONDIÇÕES PARA MERGE:
1. Módulo OS 100% funcional isoladamente
2. Todos os testes passando
3. Zero conflitos com develop
4. Code review aprovado
5. Orçamentos V2 estável no develop

# 📋 CHECKLIST PRÉ-MERGE:
□ Testes unitários passando (OS)
□ Testes de integração passando  
□ Build sem erros
□ Documentação atualizada
□ Migrações de banco testadas
□ Rollback strategy definida
```

#### **PROCESSO DE MERGE:**

```bash
# 1. Preparar merge
git checkout feature/modulo-os
git rebase develop                  # ← Reorganizar commits
git push --force-with-lease origin feature/modulo-os

# 2. Criar Pull Request
# feature/modulo-os → develop

# 3. Após aprovação - merge
git checkout develop
git merge --no-ff feature/modulo-os
git push origin develop

# 4. Limpeza
git branch -d feature/modulo-os
git push origin --delete feature/modulo-os
```

### 🚨 **PLANO DE ROLLBACK**

```bash
# Em caso de problemas após merge
git checkout develop
git revert <commit-hash-do-merge>   # ← Reverter merge
git push origin develop

# Ou resetar para commit anterior
git reset --hard <commit-antes-do-merge>
git push --force origin develop     # ⚠️ Apenas em emergência
```

### 📋 **RESUMO DA ESTRATÉGIA**

**✅ VANTAGENS DESTA ABORDAGEM:**
1. **🔒 Isolamento total** - Zero interferência entre desenvolvimentos
2. **🧪 Testes seguros** - Cada módulo testado independentemente  
3. **🔄 Merge controlado** - Integração planejada e segura
4. **📈 Paralelismo** - Dois agentes trabalhando simultaneamente
5. **🚨 Rollback fácil** - Reversão rápida se necessário

**🎯 RESULTADO ESPERADO:**
- Você continua nos orçamentos V2 no seu branch
- Módulo OS desenvolvido completamente isolado
- Merge final quando ambos estiverem prontos
- Zero conflitos ou interferências entre desenvolvimentos

Esta é a estratégia mais segura e profissional para desenvolvimento de módulos em paralelo! 🚀

---

## 🔒 **DESENVOLVIMENTO COM ISOLAMENTO TOTAL - ZERO INTERFERÊNCIA**

### ⚠️ **REGRA ABSOLUTA: NÃO TOCAR EM NADA QUE JÁ FUNCIONA**

Baseado na orientação clara, o desenvolvimento seguirá **ISOLAMENTO TOTAL** com apenas modificações mínimas e essenciais:

### 🎯 **ESTRUTURA DE IMPLEMENTAÇÃO 100% ISOLADA**

#### **🏗️ BACKEND - MÓDULO COMPLETAMENTE ISOLADO**

**Estrutura que SERÁ criada (sem tocar no existente):**
```bash
backend/src/os/                           # ✅ NOVO - Módulo isolado
├── controllers/
│   ├── os.controller.ts                  # ✅ NOVO
│   ├── workflow.controller.ts            # ✅ NOVO
│   └── historico.controller.ts           # ✅ NOVO
├── services/
│   ├── os.service.ts                     # ✅ NOVO
│   ├── workflow.service.ts               # ✅ NOVO
│   └── notificacoes-os.service.ts        # ✅ NOVO
├── dto/
│   ├── create-os.dto.ts                  # ✅ NOVO
│   ├── update-os.dto.ts                  # ✅ NOVO
│   └── workflow.dto.ts                   # ✅ NOVO
├── guards/
│   └── os-permissions.guard.ts           # ✅ NOVO
├── middleware/
│   └── os-context.middleware.ts          # ✅ NOVO
├── interfaces/
│   └── os.interfaces.ts                  # ✅ NOVO
└── os.module.ts                          # ✅ NOVO - Módulo isolado
```

**Schema Prisma Separado:**
```bash
backend/prisma/os-schema.prisma           # ✅ NOVO - Schema isolado
backend/prisma/migrations-os/             # ✅ NOVO - Migrações separadas
```

#### **🎨 FRONTEND - PÁGINAS E COMPONENTES ISOLADOS**

**Estrutura que SERÁ criada:**
```bash
frontend/src/app/(main)/os/               # ✅ NOVO - Páginas do módulo
├── page.tsx                              # ✅ NOVO - Lista de OS
├── novo/
│   └── page.tsx                          # ✅ NOVO - Criar OS
├── [id]/
│   ├── page.tsx                          # ✅ NOVO - Visualizar OS
│   └── editar/
│       └── page.tsx                      # ✅ NOVO - Editar OS
├── columns.tsx                           # ✅ NOVO - Colunas da tabela
└── components/
    ├── os-card.tsx                       # ✅ NOVO - Card de OS
    ├── workflow-selector.tsx             # ✅ NOVO - Seletor de workflow
    └── historico-os.tsx                  # ✅ NOVO - Histórico

frontend/src/components/ui/               # ✅ NOVO - Componentes específicos
├── os-status-badge.tsx                   # ✅ NOVO
├── os-form.tsx                           # ✅ NOVO
└── workflow-stepper.tsx                  # ✅ NOVO
```

### 🔧 **ÚNICA MODIFICAÇÃO NECESSÁRIA NO FRONTEND**

**APENAS uma linha será adicionada ao menu (merge final):**
```typescript
// frontend/src/app/(main)/layout.tsx
// ÚNICA modificação necessária - adicionar item ao menu:
const links = [
  // ... links existentes ...
  {
    label: 'OS - Ordens de Serviço',     // ✅ ÚNICA linha nova
    href: '/os',                         // ✅ ÚNICA linha nova
    icon: <IconClipboardList className="..." />, // ✅ ÚNICA linha nova
  },
  // ... resto inalterado ...
];
```

### 🔒 **ARQUIVOS QUE NUNCA SERÃO TOCADOS**

#### **❌ BACKEND - PROIBIDO MODIFICAR:**
```bash
backend/src/app.module.ts                 # ❌ NUNCA - Registro apenas no merge
backend/src/orcamentos/                   # ❌ NUNCA - Módulo intocável
backend/src/clientes/                     # ❌ NUNCA - Módulo intocável
backend/src/estoque/                      # ❌ NUNCA - Módulo intocável
backend/src/notificacoes/                 # ❌ NUNCA - Módulo intocável
backend/src/auth/                         # ❌ NUNCA - Sistema de auth
backend/src/prisma/                       # ❌ NUNCA - Service principal
backend/prisma/schema.prisma              # ❌ NUNCA - Schema principal
backend/package.json                      # ❌ NUNCA - Dependências
```

#### **❌ FRONTEND - PROIBIDO MODIFICAR:**
```bash
frontend/src/app/(main)/orcamentos/       # ❌ NUNCA - Páginas de orçamentos
frontend/src/app/(main)/clientes/         # ❌ NUNCA - Páginas de clientes
frontend/src/app/(main)/estoque/          # ❌ NUNCA - Páginas de estoque
frontend/src/components/ui/orcamento*     # ❌ NUNCA - Componentes orçamentos
frontend/src/contexts/                    # ❌ NUNCA - Contextos existentes
frontend/package.json                     # ❌ NUNCA - Dependências
```

### 🧪 **ESTRATÉGIA DE TESTES DE ISOLAMENTO**

**Testes que garantem zero interferência:**
```typescript
// backend/src/os/__tests__/isolation.test.ts
describe('Módulo OS - Teste de Isolamento', () => {
  it('não deve afetar módulo de orçamentos', async () => {
    // Testar que orçamentos continuam funcionando
    const orcamentos = await orcamentosService.findAll();
    expect(orcamentos).toBeDefined();
  });

  it('não deve afetar módulo de clientes', async () => {
    // Testar que clientes continuam funcionando  
    const clientes = await clientesService.findAll();
    expect(clientes).toBeDefined();
  });

  it('não deve afetar módulo de estoque', async () => {
    // Testar que estoque continua funcionando
    const estoque = await estoqueService.findAll();
    expect(estoque).toBeDefined();
  });

  it('deve funcionar completamente isolado', async () => {
    // Testar CRUD de OS sem afetar outros módulos
    const os = await osService.create(mockOSData);
    expect(os).toBeDefined();
    
    // Verificar que outros módulos não foram afetados
    const orcamentosCount = await countOrcamentos();
    expect(orcamentosCount).toEqual(INITIAL_ORCAMENTOS_COUNT);
  });
});
```

### 🔄 **DESENVOLVIMENTO STEP-BY-STEP SEM INTERFERÊNCIA**

#### **FASE 1: Estrutura Base (100% Isolada)**
```bash
# 1. Criar branch isolado
git checkout -b feature/modulo-os

# 2. Criar apenas estrutura nova
mkdir -p backend/src/os/{controllers,services,dto,guards,middleware,interfaces}
mkdir -p frontend/src/app/(main)/os/{novo,[id]/editar,components}
mkdir -p frontend/src/components/ui/os

# 3. Implementar módulo isolado
# - Schema Prisma separado
# - Módulo NestJS independente
# - Páginas frontend isoladas

# 4. Testar isolamento
npm run test:isolation
```

#### **FASE 2: Funcionalidades Core (Isoladas)**
```bash
# Implementar CRUD básico sem tocar em nada existente
# - Controllers isolados
# - Services isolados  
# - DTOs próprios
# - Componentes próprios
```

#### **FASE 3: Testes de Não-Interferência**
```bash
# Garantir que nada foi quebrado
npm run test:existing-modules
npm run test:orcamentos  # Deve continuar funcionando
npm run test:clientes    # Deve continuar funcionando
npm run test:estoque     # Deve continuar funcionando
```

### 🚨 **CHECKLIST DE ISOLAMENTO TOTAL**

#### **✅ ANTES DE CADA COMMIT:**
```bash
□ Nenhum arquivo existente foi modificado
□ Apenas arquivos novos foram criados
□ Testes de isolamento passando
□ Módulos existentes não afetados
□ Build completo sem erros
□ Zero dependências novas no package.json
```

#### **✅ ESTRUTURA DE COMMITS:**
```bash
git commit -m "feat(os): criar estrutura base isolada do módulo"
git commit -m "feat(os): implementar schema Prisma separado"  
git commit -m "feat(os): adicionar CRUD básico isolado"
git commit -m "feat(os): criar páginas frontend isoladas"
git commit -m "test(os): adicionar testes de isolamento"
```

### 🎯 **INTEGRAÇÃO FINAL (APENAS NO MERGE)**

**Único momento de modificação de arquivos existentes:**
```typescript
// APENAS no momento do merge final:

// 1. backend/src/app.module.ts - adicionar import
import { OSModule } from './os/os.module';

// 2. backend/src/app.module.ts - adicionar ao imports
@Module({
  imports: [
    // ... existentes ...
    OSModule,  // ← ÚNICA linha nova
  ],
})

// 3. frontend/src/app/(main)/layout.tsx - adicionar ao menu
const links = [
  // ... existentes ...
  { label: 'OS', href: '/os', icon: <IconOS /> }, // ← ÚNICA linha nova
];
```

### 💡 **RESULTADO GARANTIDO**

**✅ ZERO INTERFERÊNCIA:**
- Orçamentos continuam funcionando 100%
- Clientes continuam funcionando 100%  
- Estoque continua funcionando 100%
- Todos os módulos existentes intocados
- Apenas módulo OS adicionado de forma isolada

**✅ SEGURANÇA TOTAL:**
- Rollback instantâneo se necessário
- Testes garantem não-interferência
- Desenvolvimento paralelo sem conflitos
- Merge controlado e seguro

Esta abordagem garante **ZERO risco** para funcionalidades existentes! 🔒

---

## 📏 **CONFORMIDADE COM PREMISSAS DE ESTRUTURA E TAMANHOS**

### ⚠️ **LIMITES OBRIGATÓRIOS CONFORME PREMISSAS**

Baseado no arquivo `premissas melhores praticas.md`, o módulo OS deve seguir **RIGOROSAMENTE** estas diretrizes:

#### **📐 LIMITES DE TAMANHO DE ARQUIVOS:**
```bash
# LIMITES OBRIGATÓRIOS:
Services:    ≤ 400 linhas máximo
Controllers: ≤ 200 linhas máximo
Utils:       Funções comuns em utils/ para evitar duplicação
```

#### **🏗️ ESTRUTURA DE CÓDIGO OBRIGATÓRIA:**
```bash
backend/src/os/
├── controllers/           # ≤ 200 linhas cada
│   ├── os.controller.ts          # ≤ 200 linhas
│   ├── workflow.controller.ts    # ≤ 200 linhas
│   └── historico.controller.ts   # ≤ 200 linhas
├── services/              # ≤ 400 linhas cada
│   ├── os.service.ts             # ≤ 400 linhas
│   ├── workflow.service.ts       # ≤ 400 linhas
│   ├── notificacoes-os.service.ts # ≤ 400 linhas
│   └── integracao.service.ts     # ≤ 400 linhas
├── utils/                 # Funções compartilhadas
│   ├── os.utils.ts               # Utilities específicas
│   ├── workflow.utils.ts         # Mapeamentos de workflow
│   └── validations.utils.ts      # Validações comuns
├── dto/                   # Data Transfer Objects
├── guards/                # Guards específicos
├── middleware/            # Middleware isolado
└── interfaces/            # Interfaces TypeScript
```

#### **🔧 ESTRATÉGIA DE DIVISÃO POR TAMANHO:**

**Se um service ultrapassar 400 linhas, dividir em:**
```typescript
// ❌ ERRADO: os.service.ts com 800 linhas
export class OSService {
  // 800 linhas de código
}

// ✅ CORRETO: Dividir em múltiplos services
// os.service.ts (≤ 400 linhas) - CRUD básico
export class OSService {
  async create() { }
  async findAll() { }
  async findOne() { }
  async update() { }
  async delete() { }
}

// os-workflow.service.ts (≤ 400 linhas) - Workflows
export class OSWorkflowService {
  async criarWorkflow() { }
  async avancarEtapa() { }
  async validarTransicao() { }
}

// os-integracao.service.ts (≤ 400 linhas) - Integrações
export class OSIntegracaoService {
  async integrarComEstoque() { }
  async criarDeOrcamento() { }
  async notificarUsuarios() { }
}
```

#### **🔍 FACADE PATTERN PARA COORDENAÇÃO:**
```typescript
// os-facade.service.ts (≤ 100 linhas) - Coordenador
@Injectable()
export class OSFacadeService {
  constructor(
    private readonly osService: OSService,
    private readonly workflowService: OSWorkflowService,
    private readonly integracaoService: OSIntegracaoService,
  ) {}

  async criarOSCompleta(dados: CreateOSDto) {
    // Coordenar chamadas entre services sem duplicar lógica
    const os = await this.osService.create(dados);
    await this.workflowService.iniciarWorkflow(os.id);
    await this.integracaoService.configurarIntegracoes(os.id);
    return os;
  }
}
```

### 🗄️ **PREMISSAS DE BANCO DE DADOS**

#### **✅ PRISMA - CONFIGURAÇÃO OBRIGATÓRIA:**
```typescript
// backend/prisma/os-schema.prisma
generator client {
  provider = "prisma-client-js"
  // ❌ NUNCA usar output customizado (conforme premissas)
  // output = "../src/generated/client"  # PROIBIDO
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

#### **🔒 MIDDLEWARE OBRIGATÓRIO:**
```typescript
// backend/src/os/middleware/os-tenant-isolation.middleware.ts
@Injectable()
export class OSTenantIsolationMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Garantir isolamento multi-tenant obrigatório
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new UnauthorizedException('Loja ID obrigatório');
    }
    req.lojaId = lojaId;
    next();
  }
}
```

#### **🛡️ JWT MODULE OBRIGATÓRIO:**
```typescript
// backend/src/os/os.module.ts
@Module({
  imports: [
    // ✅ JWT Module próprio (conforme premissas)
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    PrismaModule,
    ConfigModule,
  ],
  // ...
})
export class OSModule {}
```

### 🧪 **TESTES OBRIGATÓRIOS (80% COBERTURA)**

```bash
backend/src/os/__tests__/
├── unit/                  # Testes unitários
│   ├── os.service.spec.ts        # ≥ 80% cobertura
│   ├── workflow.service.spec.ts  # ≥ 80% cobertura
│   └── os.controller.spec.ts     # ≥ 80% cobertura
├── integration/           # Testes de integração
│   ├── os-crud.spec.ts           # Fluxos completos
│   └── os-workflow.spec.ts       # Workflows
└── isolation/             # Testes de isolamento
    └── module-isolation.spec.ts  # Garantir não-interferência
```

### 📋 **CHECKLIST DE CONFORMIDADE COM PREMISSAS**

#### **✅ ESTRUTURA DE CÓDIGO:**
```bash
□ Services ≤ 400 linhas cada
□ Controllers ≤ 200 linhas cada  
□ Utils separados para evitar duplicação
□ Clean Architecture respeitada
□ Divisão clara por camadas
```

#### **✅ BANCO DE DADOS:**
```bash
□ Prisma ORM com @prisma/client padrão
□ Schema separado para desenvolvimento
□ Migrações modulares versionadas
□ Multi-tenant por lojaId
□ Pool de conexão limitado
```

#### **✅ AUTENTICAÇÃO:**
```bash
□ JwtModule próprio no módulo
□ Middleware de isolamento tenant
□ Guards em todos endpoints protegidos
□ Validação rigorosa de dados
□ Logs completos de auditoria
```

#### **✅ QUALIDADE:**
```bash
□ Documentação OpenAPI completa
□ Testes ≥ 80% cobertura
□ Exemplos de payload documentados
□ Health checks implementados
□ Monitoramento configurado
```

#### **✅ PERFORMANCE:**
```bash
□ Queries otimizadas
□ Cache para dados pouco mutáveis
□ Timeout e fallback configurados
□ Retry em operações críticas
□ Carregamento rápido de dashboards
```

### 🚨 **REGRAS DE LINT OBRIGATÓRIAS**

```json
// .eslintrc.json - Adicionar regra max-lines
{
  "rules": {
    "max-lines": [
      "error", 
      {
        "max": 400,
        "skipBlankLines": true,
        "skipComments": true
      }
    ],
    "max-lines-per-function": ["error", 50]
  }
}
```

### 🔄 **DESENVOLVIMENTO INCREMENTAL**

#### **FASE 1: Estrutura Base (Conformidade)**
```bash
# Criar estrutura respeitando limites
touch backend/src/os/services/os.service.ts          # ≤ 400 linhas
touch backend/src/os/controllers/os.controller.ts    # ≤ 200 linhas
touch backend/src/os/utils/os.utils.ts               # Utilities

# Implementar com limites rígidos
npm run lint:max-lines  # Verificar limites
```

#### **FASE 2: Implementação com Divisão**
```bash
# Se service crescer > 400 linhas, dividir imediatamente
git commit -m "refactor(os): dividir service em múltiplos para respeitar limite de 400 linhas"
```

#### **FASE 3: Validação de Conformidade**
```bash
# Validar todas as premissas
npm run test:coverage     # ≥ 80%
npm run lint:max-lines    # ≤ limites
npm run test:isolation    # Zero interferência
```

### 💡 **RESULTADO GARANTIDO**

**✅ CONFORMIDADE TOTAL COM PREMISSAS:**
- Arquivos respeitam limites de tamanho
- Estrutura modular e isolada
- Multi-tenant por lojaId
- JWT Module próprio
- Testes ≥ 80% cobertura
- Clean Architecture
- Zero interferência com módulos existentes

**Esta estrutura garante conformidade 100% com as premissas estabelecidas!** 📏
