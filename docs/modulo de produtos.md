# Módulo de Produtos/Templates

## 📋 Descrição do PBI

Criar um sistema de **templates de produtos** que permita cadastrar configurações padrão de produtos frequentemente orçados, reutilizando 100% da infraestrutura do módulo de orçamentos para agilizar drasticamente o processo de criação de orçamentos.

---

## 🎯 Objetivo Principal

**Acelerar a criação de orçamentos** através de templates pré-configurados, eliminando a necessidade de reconfigurar produtos similares repetidamente, mantendo total flexibilidade para customizações específicas.

---

## 🔧 Campos e Componentes

| Campo | Tipo de Componente | Obrigatório | Validação | Descrição |
|-------|-------------------|-------------|-----------|-----------|
| **Nome do Template** | Input text | ✅ Sim | Único por loja | "Banner 60x120cm - Cordão" |
| **Categoria** | Dropdown | ✅ Sim | Existente | Banners, Lonas, Adesivos, etc. |
| **Descrição** | Textarea | ❌ Não | Máx. 500 chars | Detalhes do template |
| **Nome do Serviço** | Input text | ✅ Sim | Mín. 3 chars | Nome do produto/serviço |
| **Descrição do Produto** | Textarea | ❌ Não | Máx. 1000 chars | Especificações técnicas |
| **Horas de Produção** | Numérico | ✅ Sim | > 0 | Tempo estimado de produção |
| **Dimensões Padrão** | Object | ❌ Não | — | Largura, altura, área, unidade |
| **Quantidade Padrão** | Numérico | ❌ Não | > 0 | Quantidade padrão do produto |
| **Status** | Dropdown | ✅ Sim | Ativo/Inativo | Controle de disponibilidade |
| **Insumos Padrão** | Listagem | ✅ Sim | Mín. 1 insumo | Materiais necessários |
| **Máquinas Padrão** | Listagem | ❌ Não | — | Equipamentos utilizados |
| **Funções Padrão** | Listagem | ❌ Não | — | Operações necessárias |

---

## 🔄 Fluxo de Funcionalidades

### 📝 **1. Criação de Templates**
- **Acesso:** `/produtos/novo`
- **Interface:** Mesmo formulário do orçamento
- **Configuração:** Produto, insumos, máquinas, funções
- **Salvamento:** "Salvar como Template" (em vez de enviar para cliente)
- **Resultado:** Template disponível para reutilização

### 🚀 **2. Uso em Orçamentos**
- **Opção 1:** Orçamento completo independente (atual)
- **Opção 2:** Carregar template + customização
- **Interface:** Botão "Carregar Produto" no formulário
- **Seleção:** Modal com filtros por categoria
- **Resultado:** Orçamento pré-configurado + flexibilidade

### 📊 **3. Gestão de Templates**
- **Listagem:** `/produtos` com filtros e busca
- **Edição:** `/produtos/[id]/editar`
- **Categorização:** Organização por tipo de produto
- **Status:** Controle de ativo/inativo

---

## ✅ Critérios de Aceite

### 📝 Funcionalidades Básicas
- ✅ **CRUD completo** de templates de produtos
- ✅ **Reutilização total** do motor de cálculo do orçamento
- ✅ **Interface consistente** com o módulo de orçamentos
- ✅ **Validações idênticas** às do orçamento

### 🔄 Integração com Orçamentos
- ✅ **Carregamento automático** de todos os dados do template
- ✅ **Edição livre** após carregamento do template
- ✅ **Preservação** de dados do cliente e condições comerciais
- ✅ **Cálculos automáticos** usando motor existente

### 🎯 Experiência do Usuário
- ✅ **Seleção intuitiva** de templates por categoria
- ✅ **Preview** do template antes do carregamento
- ✅ **Feedback visual** durante carregamento
- ✅ **Flexibilidade** para customizações específicas

### 🔒 Controles e Validações
- ✅ **Nome único** por loja para evitar duplicatas
- ✅ **Categorização obrigatória** para organização
- ✅ **Status ativo/inativo** para controle de disponibilidade
- ✅ **Validação de insumos** e configurações obrigatórias

---

## 🏗️ Estrutura Técnica

### 📊 **Modelo de Dados (Prisma)**
```sql
model TemplateProduto {
  id              String    @id @default(cuid())
  criado_em       DateTime  @default(now())
  atualizado_em   DateTime  @updatedAt
  
  // Dados básicos
  nome            String    // "Banner 60x120cm - Cordão"
  categoria       String    // "Banners", "Lonas", "Adesivos"
  descricao       String?   @db.Text
  
  // Configurações do produto (igual ao orçamento)
  nome_servico    String
  descricao_produto String? @db.Text
  horas_producao  Decimal   @db.Decimal(10, 2)
  
  // Dimensões padrão
  largura_produto     Decimal?  @db.Decimal(10, 2)
  altura_produto      Decimal?  @db.Decimal(10, 2)
  area_produto        Decimal?  @db.Decimal(10, 2)
  unidade_medida_produto String?
  quantidade_padrao   Decimal?  @db.Decimal(10, 2)
  
  // Status
  ativo             Boolean  @default(true)
  
  // Relacionamentos
  loja_id           String
  loja              Loja     @relation(fields: [loja_id], references: [id], onDelete: Cascade)
  
  // Itens do template (igual ao orçamento)
  itens             ItemTemplateProduto[]
  maquinas          MaquinaTemplateProduto[]
  funcoes           FuncaoTemplateProduto[]
  
  @@unique([loja_id, nome])
  @@index([loja_id])
  @@index([loja_id, categoria])
}
```

### 🔧 **Backend - Reutilização Inteligente**
```typescript
@Injectable()
export class TemplatesProdutoService {
  constructor(
    private readonly orcamentosService: OrcamentosService, // REUTILIZA
    private readonly prisma: PrismaService
  ) {}

  // REUTILIZA o motor de cálculo existente
  async calcularTemplate(dto: CalcularTemplateDto, lojaId: string) {
    return this.orcamentosService.calcularOrcamento(dto, lojaId);
  }
  
  // Salva como template em vez de orçamento
  async salvarTemplate(createTemplateDto: CreateTemplateDto, lojaId: string) {
    // Mesma lógica do orçamento, mas salva em TemplateProduto
  }
  
  // Carrega template para orçamento
  async carregarTemplateParaOrcamento(templateId: string, lojaId: string) {
    // Retorna dados formatados para o formulário de orçamento
  }
}
```

### 🎨 **Frontend - Interface Adaptada**
```typescript
// Mesmo componente OrcamentoForm, mas com props diferentes
interface TemplateFormProps {
  mode: 'novo' | 'editar';
  templateId?: string;
  onSalvarTemplate?: () => void;
}

// Botão "Salvar como Template" em vez de "Enviar para Cliente"
// Mesma interface, mesma validação, mesma experiência
```

---

## 🎯 Benefícios Esperados

### ⚡ **Produtividade**
- **Redução de 80-90%** do tempo de criação de orçamentos
- **Eliminação de erros** de configuração manual
- **Padronização** de produtos e especificações

### 🔄 **Eficiência**
- **Templates reutilizáveis** para produtos similares
- **Configurações consistentes** entre orçamentos
- **Cálculos automáticos** já pré-definidos

### 🛠️ **Manutenção**
- **Reutilização total** da infraestrutura existente
- **Atualizações automáticas** quando motor evolui
- **Bug fixes** aplicados automaticamente

### 📈 **Escalabilidade**
- **Templates crescem** com o negócio
- **Reutilização** de conhecimento
- **Onboarding** mais rápido de novos vendedores

---

## 🔗 Integrações

### 📦 **Módulo de Orçamentos**
- **Reutilização total** do motor de cálculo
- **Interface consistente** com formulário existente
- **Validações idênticas** às do orçamento

### 🏪 **Módulo de Insumos**
- **Integração direta** com cadastro de materiais
- **Cálculos automáticos** baseados em custos atuais
- **Validação de disponibilidade** de insumos

### ⚙️ **Configurações da Loja**
- **Aplicação automática** de margens e impostos
- **Configurações de custos** (mão de obra, máquinas)
- **Parâmetros de negócio** padronizados

---

## 🚀 Casos de Uso

### 📊 **Cenário 1: Banner Padrão**
1. **Template:** "Banner 60x120cm - Cordão"
2. **Carregamento:** Seleciona template no orçamento
3. **Resultado:** Todos os insumos e cálculos carregados automaticamente
4. **Customização:** Ajusta quantidade ou especificações específicas

### 🎯 **Cenário 2: Produto Similar**
1. **Template:** "Banner 60x120cm - Ilhós"
2. **Carregamento:** Base similar, acabamento diferente
3. **Edição:** Altera apenas o tipo de acabamento
4. **Economia:** 70% do tempo de configuração

### 📈 **Cenário 3: Produto Sazonal**
1. **Template:** "Lona Promocional - Verão"
2. **Carregamento:** Configurações sazonais pré-definidas
3. **Ajuste:** Modifica apenas cores e mensagens
4. **Agilidade:** Orçamento em segundos

---

## 🎯 Objetivos Estratégicos

- **Aceleração:** Redução drástica do tempo de orçamento
- **Padronização:** Configurações consistentes entre produtos
- **Reutilização:** Aproveitamento máximo da infraestrutura existente
- **Flexibilidade:** Manutenção da capacidade de customização
- **Escalabilidade:** Crescimento natural com o negócio

---

## 📋 TO-DO DETALHADO

### 🔧 **Fase 1: Backend - Models e Estrutura Base**

#### **📊 Sub-tarefa 1.1: Models Prisma**
- [x] **Backend:** Criar migration para `TemplateProduto`
- [x] **Backend:** Criar migration para `ItemTemplateProduto`
- [x] **Backend:** Criar migration para `MaquinaTemplateProduto`
- [x] **Backend:** Criar migration para `FuncaoTemplateProduto`
- [x] **Backend:** Atualizar schema.prisma com os novos models
- [x] **Backend:** Executar migration e verificar estrutura

#### **📝 Sub-tarefa 1.2: DTOs e Interfaces**
- [x] **Backend:** Criar `CreateProdutoDto` em `dto/create-produto.dto.ts`
- [x] **Backend:** Criar `UpdateProdutoDto` em `dto/update-produto.dto.ts`
- [x] **Backend:** Criar `CalcularProdutoDto` em `dto/calcular-produto.dto.ts`
- [x] **Backend:** Definir interfaces TypeScript para tipos de dados

#### **🔧 Sub-tarefa 1.3: Service Principal**
- [x] **Backend:** Criar `produtos.service.ts` com injeção de `OrcamentosService`
- [x] **Backend:** Implementar método `create()` com validações
- [x] **Backend:** Implementar método `findAll()` com filtros por loja
- [x] **Backend:** Implementar método `findOne()` com validações
- [x] **Backend:** Implementar método `update()` com validações
- [x] **Backend:** Implementar método `remove()` com proteções
- [x] **Backend:** Implementar método `calcularProduto()` reutilizando motor existente
- [x] **Backend:** Implementar método `carregarTemplateParaOrcamento()`

#### **🎛️ Sub-tarefa 1.4: Controller e Rotas**
- [x] **Backend:** Criar `produtos.controller.ts` com decorators JWT
- [x] **Backend:** Implementar endpoint `POST /produtos` (create)
- [x] **Backend:** Implementar endpoint `GET /produtos` (findAll)
- [x] **Backend:** Implementar endpoint `GET /produtos/:id` (findOne)
- [x] **Backend:** Implementar endpoint `PATCH /produtos/:id` (update)
- [x] **Backend:** Implementar endpoint `DELETE /produtos/:id` (remove)
- [x] **Backend:** Implementar endpoint `POST /produtos/calcular` (calcular)
- [x] **Backend:** Implementar endpoint `GET /produtos/:id/carregar-para-orcamento`

#### **📦 Sub-tarefa 1.5: Module e Configuração**
- [x] **Backend:** Criar `produtos.module.ts` com imports necessários
- [x] **Backend:** Configurar dependências (PrismaService, OrcamentosService)
- [x] **Backend:** Adicionar módulo ao `app.module.ts`
- [x] **Backend:** Testar endpoints com Postman/Insomnia

---

### 🎨 **Fase 2: Frontend - Estrutura Base**

#### **📁 Sub-tarefa 2.1: Estrutura de Pastas**
- [x] **Frontend:** Criar pasta `/produtos` em `app/(main)/`
- [x] **Frontend:** Criar `novo/page.tsx` (formulário de criação)
- [x] **Frontend:** Criar `[id]/editar/page.tsx` (formulário de edição)
- [x] **Frontend:** Criar `page.tsx` (listagem)
- [x] **Frontend:** Criar `columns.tsx` (definição de colunas)
- [x] **Frontend:** Criar `components/produto-card.tsx` (card responsivo)

#### **📊 Sub-tarefa 2.2: Página de Listagem**
- [x] **Frontend:** Implementar `ProdutosPage` seguindo padrão dos outros CRUDs
- [x] **Frontend:** Adicionar estado para dados, loading, viewMode
- [x] **Frontend:** Implementar `fetchProdutos()` com tratamento de erros
- [x] **Frontend:** Implementar `handleDelete()` com confirmação
- [x] **Frontend:** Adicionar switch grid/cards (desktop) e cards (mobile)
- [x] **Frontend:** Integrar com `useIsMobile` hook

#### **🎴 Sub-tarefa 2.3: Componente ProdutoCard**
- [x] **Frontend:** Criar interface `ProdutoCardProps`
- [x] **Frontend:** Implementar layout responsivo seguindo padrão `InsumoCard`
- [x] **Frontend:** Adicionar informações principais (nome, categoria, status)
- [x] **Frontend:** Implementar dropdown com ações (editar, excluir)
- [x] **Frontend:** Adicionar badges para status e categoria
- [x] **Frontend:** Implementar formatação de dados (preços, dimensões)

#### **📋 Sub-tarefa 2.4: Columns para DataTable**
- [x] **Frontend:** Definir interface `Produto` com todos os campos
- [x] **Frontend:** Implementar `createColumns()` seguindo padrão existente
- [x] **Frontend:** Adicionar colunas: Nome, Categoria, Status, Ações
- [x] **Frontend:** Implementar sorting e formatação de dados
- [x] **Frontend:** Adicionar dropdown de ações na tabela

---

### 🔄 **Fase 3: Formulário e Reutilização** ✅ **CONCLUÍDA**

#### **📝 Sub-tarefa 3.1: Reutilização do OrcamentoForm**
- [x] **Frontend:** Criar interface `ProdutoFormProps` com props específicas
- [x] **Frontend:** Adaptar `OrcamentoForm` para aceitar props de produto
- [x] **Frontend:** Modificar botões para "Salvar como Produto" em vez de "Enviar"
- [x] **Frontend:** Implementar validações específicas para produtos
- [x] **Frontend:** Adicionar campos específicos (categoria, status, etc.)

#### **🎯 Sub-tarefa 3.2: Página de Criação**
- [x] **Frontend:** Implementar `NovoProdutoPage` com ProdutoForm
- [x] **Frontend:** Configurar props para modo 'novo'
- [x] **Frontend:** Implementar `onSalvarProduto` callback
- [x] **Frontend:** Adicionar navegação após salvamento
- [x] **Frontend:** Implementar tratamento de erros

#### **✏️ Sub-tarefa 3.3: Página de Edição**
- [x] **Frontend:** Implementar `EditarProdutoPage` com ProdutoForm
- [x] **Frontend:** Configurar props para modo 'editar'
- [x] **Frontend:** Implementar carregamento de dados existentes
- [x] **Frontend:** Adicionar validação de ID e dados
- [x] **Frontend:** Implementar atualização com feedback

---

### 🔗 **Fase 4: Integração com Orçamentos** ✅ **CONCLUÍDA**

#### **🎪 Sub-tarefa 4.1: Modal de Seleção** ✅ **CONCLUÍDA**
- [x] **Frontend:** Criar componente `ProdutoSelectionModal`
- [x] **Frontend:** Implementar listagem de produtos por categoria
- [x] **Frontend:** Adicionar filtros e busca
- [x] **Frontend:** Implementar preview do produto selecionado
- [x] **Frontend:** Adicionar botão de carregamento

#### **📱 Sub-tarefa 4.0: Menu Lateral** ✅ **CONCLUÍDA**
- [x] **Frontend:** Adicionar link "Produtos" no menu lateral
- [x] **Frontend:** Importar ícone `IconPackage` do Tabler Icons
- [x] **Frontend:** Posicionar entre "Insumos" e "Configurações"

#### **🔧 Sub-tarefa 4.2: Integração no OrçamentoForm** ✅ **CONCLUÍDA**
- [x] **Frontend:** Adicionar botão "Carregar Produto" no OrçamentoForm
- [x] **Frontend:** Implementar estado para modal de produtos
- [x] **Frontend:** Implementar `handleCarregarProduto()` callback
- [x] **Frontend:** Adicionar carregamento automático de dados
- [x] **Frontend:** Preservar dados do cliente e condições comerciais

#### **🔄 Sub-tarefa 4.3: API de Carregamento** ✅ **CONCLUÍDA**
- [x] **Backend:** Implementar endpoint para carregar dados do produto
- [x] **Frontend:** Implementar chamada para carregar produto
- [x] **Frontend:** Mapear dados do produto para formulário de orçamento
- [x] **Frontend:** Implementar feedback visual durante carregamento

#### **🐛 Sub-tarefa 4.4: Debug e Correções** ✅ **CONCLUÍDA**
- [x] **Frontend:** Corrigir erro de token (access_token vs token)
- [x] **Frontend:** Adicionar logs de debug para troubleshooting
- [x] **Frontend:** Resolver erro "Erro ao buscar produtos" no modal
- [x] **Frontend:** Verificar autenticação e conectividade com backend
- [x] **Frontend:** Testar carregamento de produtos no modal
- [x] **Frontend:** Criar página de teste para debug da API
- [x] **Frontend:** Corrigir URL da API (remover dependência de variável de ambiente não definida)

---

### 🧪 **Fase 5: Testes e Validação**

#### **🔍 Sub-tarefa 5.1: Testes Backend**
- [ ] **Backend:** Testar criação de produtos com dados válidos
- [ ] **Backend:** Testar validações de campos obrigatórios
- [ ] **Backend:** Testar reutilização do motor de cálculo
- [ ] **Backend:** Testar carregamento de produto para orçamento
- [ ] **Backend:** Testar exclusão com proteções

#### **🎨 Sub-tarefa 5.2: Testes Frontend**
- [ ] **Frontend:** Testar listagem em modo grid e cards
- [ ] **Frontend:** Testar responsividade em mobile
- [ ] **Frontend:** Testar criação e edição de produtos
- [ ] **Frontend:** Testar carregamento de produto no orçamento
- [ ] **Frontend:** Testar validações e tratamento de erros

#### **🚀 Sub-tarefa 5.3: Testes de Integração**
- [ ] **Sistema:** Testar fluxo completo de criação → carregamento → orçamento
- [ ] **Sistema:** Validar reutilização do motor de cálculo
- [ ] **Sistema:** Testar performance com múltiplos produtos
- [ ] **Sistema:** Validar isolamento de dados por loja

---

### 📱 **Fase 6: Responsividade e UX**

#### **📱 Sub-tarefa 6.1: Mobile Optimization**
- [ ] **Frontend:** Otimizar cards para mobile
- [ ] **Frontend:** Implementar navegação touch-friendly
- [ ] **Frontend:** Adicionar gestos de swipe se necessário
- [ ] **Frontend:** Testar em diferentes tamanhos de tela

#### **🎯 Sub-tarefa 6.2: UX Improvements**
- [ ] **Frontend:** Adicionar loading states
- [ ] **Frontend:** Implementar feedback visual para ações
- [ ] **Frontend:** Adicionar tooltips e ajuda contextual
- [ ] **Frontend:** Otimizar fluxo de criação/edição

---

### 🔒 **Fase 7: Segurança e Validações**

#### **🛡️ Sub-tarefa 7.1: Validações Backend**
- [ ] **Backend:** Implementar validações de campos obrigatórios
- [ ] **Backend:** Validar unicidade de nome por loja
- [ ] **Backend:** Implementar proteções contra exclusão de produtos em uso
- [ ] **Backend:** Validar integridade de dados relacionados

#### **🔐 Sub-tarefa 7.2: Segurança Frontend**
- [ ] **Frontend:** Implementar validações de formulário
- [ ] **Frontend:** Adicionar sanitização de dados
- [ ] **Frontend:** Implementar tratamento robusto de erros
- [ ] **Frontend:** Validar permissões de usuário

---

### 📊 **Fase 8: Documentação e Finalização**

#### **📚 Sub-tarefa 8.1: Documentação**
- [ ] **Docs:** Atualizar documentação técnica
- [ ] **Docs:** Criar guia de uso para usuários
- [ ] **Docs:** Documentar APIs e endpoints
- [ ] **Docs:** Adicionar exemplos de uso

#### **🎉 Sub-tarefa 8.2: Finalização**
- [ ] **Sistema:** Teste final completo
- [ ] **Sistema:** Validação de performance
- [ ] **Sistema:** Verificação de responsividade
- [ ] **Sistema:** Preparação para deploy

---

## ✅ Conclusão

O módulo de **Produtos/Templates** representa uma evolução natural do sistema, aproveitando 100% da infraestrutura existente para criar uma funcionalidade que vai **revolucionar a produtividade** na criação de orçamentos, mantendo total flexibilidade e consistência com o sistema atual. 