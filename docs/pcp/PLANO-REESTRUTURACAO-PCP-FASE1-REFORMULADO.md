# 🚀 PLANO DE REESTRUTURAÇÃO DO MÓDULO PCP - FASE 1

## 📋 RESUMO EXECUTIVO

Com base na análise de reaproveitamento e qualidade de código, esta fase visa reestruturar o módulo PCP para torná-lo mais coeso, testável e alinhado às melhores práticas de arquitetura já utilizadas no projeto. A reestruturação buscará manter compatibilidade funcional com a versão atual, priorizando **qualidade de código, desacoplamento, e separação de responsabilidades**.

> **Importante:** O módulo PCP já está em funcionamento. Esta fase visa **reestruturação**, e não construção do zero.

---

## 📊 ESTADO ATUAL DO MÓDULO PCP

### ✅ Funcionalidades Existentes
- [x] Lista de OSs liberadas para PCP
- [x] Seleção de workflow para OSs
- [x] Início de workflow com instância
- [x] Visualização básica de status de produtos
- [x] Integração com sistema de autenticação
- [x] Endpoints básicos de debug

### ⚠️ Problemas Identificados
- [ ] Código acoplado entre camadas
- [ ] Falta de testes unitários
- [ ] Performance subótima em queries
- [ ] Interface não responsiva
- [ ] Falta de validações robustas
- [ ] Documentação de API incompleta

---

## ✅ CHECKLIST PRÉ-REFATORAÇÃO

### 🔒 Backup e Segurança
- [ ] Backup completo do banco de dados
- [ ] Backup do código atual (branch de segurança)
- [ ] Ambiente de teste isolado configurado
- [ ] Plano de rollback definido e testado

### 🔍 Validação Funcional
- [ ] Mapear todas as funcionalidades atuais
- [ ] Documentar fluxos existentes
- [ ] Identificar dependências críticas
- [ ] Testar cenários de uso real
- [ ] Benchmark de performance atual

---

## ⚠️ RISCOS E MITIGAÇÕES

### 🔧 Riscos Técnicos
- **Regressão funcional**: Testes extensivos antes/depois
- **Performance degradada**: Benchmarks e monitoramento
- **Integração quebrada**: Validação de APIs existentes
- **Perda de dados**: Backup e validação de integridade

### 💼 Riscos de Negócio
- **Interrupção de produção**: Deploy gradual e rollback rápido
- **Usuários confusos**: Documentação de mudanças e treinamento
- **Deadline comprometido**: Cronograma com buffer de segurança

---

## 🔒 REGRAS DE SEGURANÇA E LIMITES DE ALTERAÇÃO

⚠️ ATENÇÃO: ESTE MÓDULO POSSUI CÓDIGOS JÁ EM PRODUÇÃO.

**Objetivo: Reestruturar SOMENTE o escopo do módulo PCP com foco em legibilidade, testes e separação de domínios.**

NUNCA:
- altere a estrutura do Prisma (models, relações, migrations, seeds) sem validação explícita.
- modifique arquivos fora da pasta `/modules/pcp/`
- remova ou reescreva funções de outros domínios
- reescreva arquivos globais como `server.ts`, `schema.prisma`, `app.module.ts`

SOMENTE:
- edite componentes, serviços e endpoints **diretamente relacionados ao PCP**
- para interações com outros módulos, **apenas utilize leitura**, nunca escrita
- qualquer alteração no schema do Prisma **deve ser previamente comunicada**

---

## 🎯 OBJETIVOS DA FASE 1

1. Refatorar o domínio de **Setores Produtivos**
2. Reescrever o serviço de **Kanban do PCP**
3. Reestruturar a **interface do operador**
4. Manter integração com **Estoque, Notificações e Autenticação**
5. Adotar **melhores práticas de arquitetura e testes**
6. Garantir **comportamento funcional idêntico à versão anterior**

---

## 📅 CRONOGRAMA DETALHADO

### **DIA 1: Refatoração de Domínio**

#### Manhã (4h)
- [ ] Refatorar modelagem interna de `SetorProdutivo`
- [ ] Criar pastas e organização modular (Services, Controllers, DTOs, Entities)
- [ ] Criar testes unitários de serviço `SetorProdutivoService`

#### Tarde (4h)
- [ ] Aplicar validações nos DTOs
- [ ] Separar tipos e enums de domínio
- [ ] Testar integração com estoque (modo leitura)

### **DIA 2: Reescrita do Serviço de Kanban**

#### Manhã (4h)
- [ ] Reescrever `PCPKanbanService` com responsabilidade única
- [ ] Aplicar injeção de dependências correta
- [ ] Testes unitários com mocks para estoque/notificações

#### Tarde (4h)
- [ ] Criar `KanbanMapper` para estruturar dados por status/setor
- [ ] Validar performance de queries
- [ ] Documentar estrutura via Swagger

### **DIA 3: Interface do Operador e Frontend Kanban**

#### Manhã (4h)
- [ ] Reescrever `KanbanPCP.tsx` com estrutura modular
- [ ] Refatorar `SetorCard.tsx`, `StatusProdutoBadge.tsx`, etc.
- [ ] Garantir exibição fiel ao fluxo existente

#### Tarde (4h)
- [ ] Reescrever `pcp/meu-setor/page.tsx`
- [ ] Adicionar tratamento de loading/erros
- [ ] Testes de usabilidade (modo desenvolvedor)

### **DIA 4: Validação de Qualidade e Testes**

#### Manhã (4h)
- [ ] Testes unitários de todos os serviços refatorados
- [ ] Testes de integração entre camadas (service + controller)

#### Tarde (4h)
- [ ] Testes end-to-end simulando uso real
- [ ] Verificação de regressão funcional
- [ ] Validação de performance (< 2s no carregamento do Kanban)

---

## ✅ BOAS PRÁTICAS APLICADAS

Inclui os princípios descritos no documento “premissas melhores práticas.md”:

- **Arquitetura Hexagonal simplificada**
- **Separação clara entre camada de serviço, controller, DTO e mapper**
- **Testabilidade** como critério principal de reescrita
- **Segurança contextual** (guardas, validações, DTOs defensivos)
- **Respeito a boundaries de domínios** (sem acoplamento externo)
- **Organização modular clara (src/modules/pcp/)**

---

## 📊 MÉTRICAS DE SUCESSO

### Técnicas
- [ ] 90%+ de cobertura em testes unitários
- [ ] Zero regressões funcionais
- [ ] 100% de integração com serviços legados via leitura
- [ ] Tempo de renderização do Kanban < 2s

### Funcionais
- [ ] Operador visualiza a fila com exatidão
- [ ] Gerente visualiza o Kanban geral corretamente
- [ ] Integração com Estoque e Notificações ativa (modo leitura)

---

## 📈 PRÓXIMAS FASES

### Fase 2: Melhoria de Experiência e Automação
- Filtros e agrupamentos visuais no Kanban
- Relatórios por setor
- Otimizações de desempenho com caching local

### Fase 3: Acompanhamento e Previsão
- Previsão de entrega com base em filas
- Integração com IA de previsão (batch e realtime)
