# 📋 Checklist de Implementação - Módulo Arte & Aprovação

## 🎯 Status Geral

- **Branch**: `feature/modulo-arte-aprovacao` ✅
- **Documentação**: Transferida ✅
- **Estrutura**: Criada ✅

## 📊 Análise do Estado Atual

### ✅ **Já Implementado**
- Aba "Arte & Aprovação" existe no `OSTabs.tsx` (linha 98)
- Placeholder básico implementado (linha 328-342)
- Estrutura de navegação por abas funcional

### ❌ **Não Implementado**
- Nenhum componente específico do módulo
- Nenhuma entidade no banco de dados
- Nenhuma API backend
- Nenhuma funcionalidade real

---

## 🚀 **FASE 1: MVP - Anexo de Arte (2 semanas)**

### **Backend**
- [ ] **Schema Prisma**
  - [ ] Adicionar modelos: `ArteVersao`, `ArteArquivo`, `ArteComentario`, `ArteLinkAprovacao`
  - [ ] Adicionar enums: `ArteStatus`, `ComentarioTipo`
  - [ ] Adicionar relacionamentos no modelo `Usuario`
  - [ ] Executar migração: `npx prisma migrate dev --name add-arte-aprovacao-models`

- [ ] **Módulo NestJS**
  - [ ] Criar `backend/src/modules/arte-aprovacao/`
  - [ ] Implementar `arte-aprovacao.module.ts`
  - [ ] Implementar controllers básicos:
    - [ ] `arte-versao.controller.ts`
    - [ ] `arte-arquivo.controller.ts`
  - [ ] Implementar services básicos:
    - [ ] `arte-versao.service.ts`
    - [ ] `arte-arquivo.service.ts`
  - [ ] Implementar DTOs básicos:
    - [ ] `create-arte-versao.dto.ts`
    - [ ] `arte-response.dto.ts`

- [ ] **API Endpoints MVP**
  - [ ] `POST /api/arte-aprovacao/versoes` - Criar versão
  - [ ] `GET /api/arte-aprovacao/versoes/{osId}` - Listar versões da OS
  - [ ] `POST /api/arte-aprovacao/versoes/{id}/arquivos` - Upload de arquivo
  - [ ] `GET /api/arte-aprovacao/versoes/{id}/arquivos` - Listar arquivos

### **Frontend**
- [ ] **Estrutura de Componentes**
  - [ ] Criar `frontend/src/components/os/arte-aprovacao/`
  - [ ] Implementar `ArteAprovacaoTab.tsx` (substituir placeholder)
  - [ ] Implementar componentes básicos:
    - [ ] `ArteFileUpload.tsx`
    - [ ] `ArtePreviewModal.tsx`
    - [ ] `ArteVersionCard.tsx`

- [ ] **Integração com Aba**
  - [ ] Substituir placeholder no `OSTabs.tsx`
  - [ ] Implementar carregamento de versões existentes
  - [ ] Implementar upload básico de arquivo único

- [ ] **API Routes Next.js**
  - [ ] Criar `frontend/src/app/api/arte-aprovacao/versoes/route.ts`
  - [ ] Criar `frontend/src/app/api/arte-aprovacao/versoes/[id]/arquivos/route.ts`

### **Testes**
- [ ] **Testes Unitários**
  - [ ] `arte-versao.service.spec.ts`
  - [ ] `arte-arquivo.service.spec.ts`
  - [ ] `ArteAprovacaoTab.test.tsx`

- [ ] **Testes E2E**
  - [ ] Fluxo completo: criar versão → upload arquivo → visualizar

---

## 🚀 **FASE 2: Gestão de Versões (3 semanas)**

### **Backend**
- [ ] **Services Avançados**
  - [ ] `arte-comentario.service.ts`
  - [ ] `arte-aprovacao.service.ts`
  - [ ] `arte-notificacao.service.ts`

- [ ] **API Endpoints Avançados**
  - [ ] `GET /api/arte-aprovacao/versoes/{id}` - Detalhes da versão
  - [ ] `PUT /api/arte-aprovacao/versoes/{id}` - Atualizar versão
  - [ ] `POST /api/arte-aprovacao/versoes/{id}/comentarios` - Adicionar comentário
  - [ ] `GET /api/arte-aprovacao/versoes/{id}/comentarios` - Listar comentários
  - [ ] `POST /api/arte-aprovacao/versoes/{id}/comparar` - Comparar versões

### **Frontend**
- [ ] **Componentes Avançados**
  - [ ] `ArteVersionHistory.tsx`
  - [ ] `ArteServiceFilters.tsx`
  - [ ] `ArteCommentsPanel.tsx`
  - [ ] `ArteComparisonModal.tsx`

- [ ] **Funcionalidades**
  - [ ] Histórico completo de versões
  - [ ] Comparação lado a lado
  - [ ] Sistema de comentários
  - [ ] Filtros por serviço
  - [ ] Upload múltiplo de arquivos

### **Testes**
- [ ] **Cobertura ≥ 80%**
  - [ ] Todos os services
  - [ ] Todos os controllers
  - [ ] Componentes principais

---

## 🚀 **FASE 3: Aprovação Externa (2 semanas)**

### **Backend**
- [ ] **Controller Público**
  - [ ] `arte-publico.controller.ts`
  - [ ] Rotas públicas sem autenticação
  - [ ] Sistema de tokens únicos

- [ ] **API Endpoints Públicos**
  - [ ] `GET /api/public/arte/{token}` - Dados para aprovação
  - [ ] `POST /api/public/arte/{token}/approve` - Aprovar arte
  - [ ] `POST /api/public/arte/{token}/reject` - Rejeitar arte
  - [ ] `POST /api/public/arte/{token}/comment` - Comentário do cliente

### **Frontend**
- [ ] **Página Pública**
  - [ ] `ArtePublicApprovalPage.tsx`
  - [ ] `ArtePublicHeader.tsx`
  - [ ] `ArteServiceSelector.tsx`
  - [ ] `ArtePreviewArea.tsx`
  - [ ] `ArteApprovalActions.tsx`
  - [ ] `ArteCommentsSection.tsx`

- [ ] **Funcionalidades**
  - [ ] Geração de links públicos
  - [ ] Página de aprovação externa (conforme wireframe)
  - [ ] Sistema de declaração de aprovação
  - [ ] Notificações por email

### **Integração**
- [ ] **Google Drive**
  - [ ] `ArteStorageService.ts`
  - [ ] Upload automático para Google Drive
  - [ ] Geração de URLs públicas

---

## 🚀 **FASE 4: Funcionalidades Avançadas (3 semanas)**

### **Backend**
- [ ] **Notificações WhatsApp**
  - [ ] Integração com WhatsApp Business API
  - [ ] Templates de mensagem

- [ ] **Permissões Granulares**
  - [ ] `ArtePermissionGuard.ts`
  - [ ] Sistema de roles por usuário

- [ ] **Analytics e Relatórios**
  - [ ] Métricas de aprovação
  - [ ] Relatórios de tempo de resposta

### **Frontend**
- [ ] **Otimizações Mobile**
  - [ ] Responsividade completa
  - [ ] Touch gestures
  - [ ] Offline support

- [ ] **Integração PCP**
  - [ ] Botão "Enviar ao PCP"
  - [ ] Validações antes do envio

---

## 📊 **Critérios de Aceitação por Fase**

### **Fase 1 - MVP**
- ✅ Upload de arquivo único funciona
- ✅ Visualização básica da arte
- ✅ Status simples (PENDENTE/APROVADA)
- ✅ Integração com aba existente

### **Fase 2 - Versões**
- ✅ Múltiplas versões por OS
- ✅ Comparação de versões
- ✅ Sistema de comentários
- ✅ Histórico completo

### **Fase 3 - Aprovação Externa**
- ✅ Links públicos funcionais
- ✅ Página de aprovação (conforme wireframe)
- ✅ Aprovação com declaração
- ✅ Notificações por email

### **Fase 4 - Avançado**
- ✅ Notificações WhatsApp
- ✅ Permissões granulares
- ✅ Mobile otimizado
- ✅ Integração PCP

---

## 🔍 **Checklist de Qualidade**

### **Código**
- [ ] Cobertura de testes ≥ 80%
- [ ] Linting sem erros
- [ ] TypeScript sem erros
- [ ] Documentação atualizada

### **Segurança**
- [ ] Validação de arquivos
- [ ] Isolamento multi-tenant
- [ ] Rate limiting
- [ ] Auditoria completa

### **Performance**
- [ ] Lazy loading de imagens
- [ ] Compressão de arquivos
- [ ] Cache de thumbnails
- [ ] Otimização de queries

---

## 🚨 **Riscos e Mitigações**

### **Risco: Conflito com código existente**
- **Mitigação**: Implementar em branch isolado, testar integração

### **Risco: Performance com arquivos grandes**
- **Mitigação**: Implementar lazy loading e compressão

### **Risco: Segurança de links públicos**
- **Mitigação**: Tokens com expiração e rate limiting

### **Risco: Integração com Google Drive**
- **Mitigação**: Implementar fallback para storage local

---

## 📝 **Próximos Passos**

1. **✅ Concluído**: Análise e documentação
2. **🔄 Em Andamento**: Preparação da implementação
3. **⏳ Próximo**: Iniciar Fase 1 - MVP
4. **⏳ Futuro**: Fases 2, 3 e 4

**Data de Início**: 09/10/2025  
**Prazo Estimado**: 10 semanas (2+3+2+3)  
**Responsável**: Equipe de Desenvolvimento
