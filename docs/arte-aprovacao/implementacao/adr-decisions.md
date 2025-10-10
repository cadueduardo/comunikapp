# 📋 Architecture Decision Records (ADR) - Módulo Arte & Aprovação

## ADR-001: Estrutura Modular do Sistema

**Data**: 09/10/2025  
**Status**: Aceito  
**Contexto**: Decisão sobre como estruturar o módulo Arte & Aprovação no sistema Comunikapp

### Problema
Como integrar o módulo Arte & Aprovação mantendo a arquitetura modular e plugável do sistema?

### Opções Consideradas
1. **Integração direta**: Adicionar funcionalidades diretamente no módulo OS existente
2. **Módulo separado**: Criar módulo completamente independente
3. **Híbrido**: Módulo independente com integração via interfaces

### Decisão
**Opção 3 - Híbrido**: Módulo independente com integração via interfaces

### Justificativa
- ✅ Mantém isolamento e plugabilidade
- ✅ Permite ativação/desativação sem afetar sistema principal
- ✅ Facilita manutenção e evolução independente
- ✅ Segue padrão arquitetural do projeto

### Consequências
- **Positivas**: Modularidade, isolamento, flexibilidade
- **Negativas**: Complexidade inicial de integração

---

## ADR-002: Estratégia de Storage de Arquivos

**Data**: 09/10/2025  
**Status**: Aceito  
**Contexto**: Decisão sobre onde e como armazenar arquivos de arte

### Problema
Como armazenar arquivos de arte de forma segura, escalável e acessível?

### Opções Consideradas
1. **Storage local**: Arquivos no servidor da aplicação
2. **Google Drive**: Integração com Google Drive
3. **AWS S3**: Cloud storage da Amazon
4. **Múltiplos providers**: Interface que suporta vários storages

### Decisão
**Opção 4 - Múltiplos providers**: Interface que suporta vários storages

### Justificativa
- ✅ Flexibilidade para diferentes necessidades
- ✅ Fallback em caso de indisponibilidade
- ✅ Escalabilidade conforme crescimento
- ✅ Conformidade com requisitos enterprise

### Implementação
```typescript
interface IArteStorageProvider {
  uploadFile(file: Express.Multer.File, path: string): Promise<StorageResult>;
  downloadFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<boolean>;
  generateThumbnail(path: string): Promise<string>;
  getPublicUrl(path: string): Promise<string>;
}
```

---

## ADR-003: Sistema de Aprovação Externa

**Data**: 09/10/2025  
**Status**: Aceito  
**Contexto**: Como permitir que clientes aprovem artes sem login no sistema

### Problema
Como criar um sistema de aprovação que clientes possam usar sem criar conta?

### Opções Consideradas
1. **Links temporários**: Tokens únicos com expiração
2. **Portal do cliente**: Área específica com login
3. **Email com aprovação**: Aprovação direta por email
4. **WhatsApp**: Aprovação via mensagem

### Decisão
**Opção 1 - Links temporários**: Tokens únicos com expiração

### Justificativa
- ✅ Simplicidade para o cliente
- ✅ Segurança via tokens únicos
- ✅ Controle de acesso e expiração
- ✅ Compatível com wireframe especificado

### Implementação
- Tokens UUID únicos
- Expiração configurável (padrão: 30 dias)
- Rate limiting por IP
- Logs de auditoria completos

---

## ADR-004: Estrutura do Banco de Dados

**Data**: 09/10/2025  
**Status**: Aceito  
**Contexto**: Como estruturar as tabelas para o módulo Arte & Aprovação

### Problema
Como modelar os dados para suportar versões, arquivos, comentários e aprovações?

### Opções Consideradas
1. **Tabela única**: Todos os dados em uma tabela
2. **Normalização completa**: Tabelas separadas para cada entidade
3. **Híbrido**: Algumas tabelas principais com campos JSON

### Decisão
**Opção 2 - Normalização completa**: Tabelas separadas para cada entidade

### Justificativa
- ✅ Integridade referencial
- ✅ Performance em consultas específicas
- ✅ Flexibilidade para evolução
- ✅ Padrão consistente com sistema existente

### Estrutura
- `ArteVersao`: Versões de arte
- `ArteArquivo`: Arquivos anexos
- `ArteComentario`: Comentários
- `ArteLinkAprovacao`: Links de aprovação

---

## ADR-005: Sistema de Permissões

**Data**: 09/10/2025  
**Status**: Aceito  
**Contexto**: Como controlar acesso às funcionalidades do módulo

### Problema
Como implementar permissões granulares para diferentes tipos de usuário?

### Opções Consideradas
1. **Roles fixos**: Designer, Cliente, Admin
2. **Permissões granulares**: Sistema de permissões por ação
3. **Híbrido**: Roles com permissões específicas

### Decisão
**Opção 3 - Híbrido**: Roles com permissões específicas

### Justificativa
- ✅ Flexibilidade para casos específicos
- ✅ Facilidade de configuração
- ✅ Escalabilidade para novos perfis
- ✅ Compatibilidade com sistema existente

### Implementação
```typescript
export enum ArtePermission {
  VIEW_ARTE = 'arte:view',
  CREATE_ARTE = 'arte:create',
  UPDATE_ARTE = 'arte:update',
  APPROVE_ARTE = 'arte:approve',
  // ...
}
```

---

## ADR-006: Estratégia de Notificações

**Data**: 09/10/2025  
**Status**: Aceito  
**Contexto**: Como notificar usuários sobre eventos do módulo

### Problema
Como manter usuários informados sobre aprovações, comentários e atualizações?

### Opções Consideradas
1. **Email apenas**: Notificações somente por email
2. **In-app apenas**: Notificações dentro do sistema
3. **Multi-canal**: Email, WhatsApp, in-app
4. **Configurável**: Usuário escolhe canais

### Decisão
**Opção 3 - Multi-canal**: Email, WhatsApp, in-app

### Justificativa
- ✅ Maior alcance e engajamento
- ✅ Diferentes preferências de usuário
- ✅ Redundância em caso de falha
- ✅ Alinhamento com requisitos do produto

### Canais
- **Email**: Para notificações formais
- **WhatsApp**: Para urgências e lembretes
- **In-app**: Para feedback imediato

---

## ADR-007: Versionamento de API

**Data**: 09/10/2025  
**Status**: Aceito  
**Contexto**: Como versionar a API do módulo Arte & Aprovação

### Problema
Como garantir compatibilidade e evolução da API?

### Opções Consideradas
1. **Sem versionamento**: API única sempre
2. **Versionamento por URL**: `/api/v1/arte-aprovacao`
3. **Versionamento por header**: Header `API-Version`
4. **Versionamento por módulo**: `/api/arte-aprovacao-v1`

### Decisão
**Opção 4 - Versionamento por módulo**: `/api/arte-aprovacao-v1`

### Justificativa
- ✅ Isolamento do módulo
- ✅ Facilita evolução independente
- ✅ Compatibilidade com sistema existente
- ✅ Clareza na documentação

### Implementação
- URLs: `/api/arte-aprovacao-v1/versoes`
- Documentação separada por versão
- Deprecation warnings para versões antigas

---

## ADR-008: Estratégia de Testes

**Data**: 09/10/2025  
**Status**: Aceito  
**Contexto**: Como garantir qualidade e confiabilidade do módulo

### Problema
Como implementar testes abrangentes para o módulo?

### Opções Consideradas
1. **Testes unitários apenas**: Foco em lógica isolada
2. **Testes E2E apenas**: Foco em fluxos completos
3. **Pirâmide de testes**: Unitários + Integração + E2E
4. **TDD**: Desenvolvimento guiado por testes

### Decisão
**Opção 3 - Pirâmide de testes**: Unitários + Integração + E2E

### Justificativa
- ✅ Cobertura abrangente
- ✅ Detecção precoce de bugs
- ✅ Confiança em refatorações
- ✅ Padrão do projeto

### Cobertura
- **Unitários**: ≥ 80% (services, utils)
- **Integração**: Controllers e APIs
- **E2E**: Fluxos críticos de usuário

---

## Resumo das Decisões

| ADR | Decisão | Impacto | Status |
|-----|---------|---------|--------|
| 001 | Módulo híbrido | Arquitetura | ✅ Aceito |
| 002 | Storage múltiplo | Escalabilidade | ✅ Aceito |
| 003 | Links temporários | UX Cliente | ✅ Aceito |
| 004 | DB normalizado | Performance | ✅ Aceito |
| 005 | Permissões híbridas | Segurança | ✅ Aceito |
| 006 | Multi-canal | Comunicação | ✅ Aceito |
| 007 | Versionamento módulo | API | ✅ Aceito |
| 008 | Pirâmide testes | Qualidade | ✅ Aceito |

**Próxima revisão**: Após implementação da Fase 1

