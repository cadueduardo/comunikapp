# 📋 Módulo OS (Ordens de Serviço)

## 🎯 Visão Geral

Módulo completamente isolado para gestão de Ordens de Serviço, seguindo todas as premissas do projeto:
- **Isolamento total** - Zero interferência com módulos existentes
- **Multi-tenant** - Dados separados por lojaId
- **Arquitetura modular** - Plugável via marketplace
- **Conformidade** - Services ≤ 400 linhas, Controllers ≤ 200 linhas

## 🏗️ Estrutura do Módulo

```
backend/src/os/
├── controllers/           # ≤ 200 linhas cada
│   ├── os.controller.ts          # CRUD de OS
│   ├── workflow.controller.ts    # Gestão de workflows
│   └── historico.controller.ts   # Histórico e relatórios
├── services/              # ≤ 400 linhas cada
│   ├── os.service.ts             # Lógica principal
│   ├── workflow.service.ts       # Workflows configuráveis
│   ├── notificacoes-os.service.ts # Notificações específicas
│   └── integracao.service.ts     # Integrações futuras
├── dto/                   # Validação de dados
│   ├── create-os.dto.ts
│   ├── update-os.dto.ts
│   └── workflow.dto.ts
├── guards/                # Segurança
│   └── os-permissions.guard.ts
├── middleware/            # Isolamento
│   └── os-tenant-isolation.middleware.ts
├── interfaces/            # Tipos TypeScript
│   └── os.interfaces.ts
├── utils/                 # Utilities compartilhadas
│   └── os.utils.ts
├── __tests__/             # Testes ≥ 80% cobertura
│   ├── os.service.spec.ts
│   └── module-isolation.spec.ts
└── os.module.ts           # Módulo principal
```

## 🚀 Funcionalidades Implementadas

### ✅ CRUD Completo
- **Criar OS** - Com validação completa
- **Listar OS** - Com paginação e filtros
- **Visualizar OS** - Detalhes completos
- **Atualizar OS** - Campos editáveis
- **Excluir OS** - Com validações de segurança

### ✅ Sistema de Workflows
- **Workflows configuráveis** por loja
- **Etapas sequenciais ou paralelas**
- **Validação de transições**
- **Workflow padrão** automático

### ✅ Controle de Etapas
- **Avanço controlado** por permissões
- **Histórico completo** de movimentações
- **Checklists obrigatórios** por etapa
- **Logs de auditoria** completos

### ✅ Segurança
- **Multi-tenant** por lojaId
- **JWT Module próprio**
- **Guards por etapa**
- **Middleware de isolamento**

## 🔧 Como Usar

### Endpoints Principais

```bash
# CRUD básico
GET    /os                    # Listar OS
POST   /os                    # Criar OS
GET    /os/:id                # Obter OS
PATCH  /os/:id                # Atualizar OS
DELETE /os/:id                # Excluir OS

# Funcionalidades específicas
GET    /os/estatisticas       # Estatísticas
GET    /os/status/:status     # Filtrar por status
PATCH  /os/:id/avancar-etapa  # Avançar etapa

# Workflows
GET    /os/workflows          # Listar workflows
POST   /os/workflows          # Criar workflow
POST   /os/workflows/padrao   # Criar workflow padrão
```

### Exemplo de Uso

```typescript
// Criar nova OS
const novaOS = {
  cliente_id: 'cliente-123',
  nome_servico: 'Banner 3x2m - Lona 440g',
  quantidade: 2,
  parametros_tecnicos: {
    largura: 3.0,
    altura: 2.0,
    area: 6.0,
    unidade_medida: 'm2'
  },
  data_prazo: '2025-10-15',
  responsavel_id: 'usuario-123'
};

// Avançar etapa
const avancarEtapa = {
  nova_etapa: 'PRODUCAO',
  observacoes: 'Iniciando processo de impressão'
};
```

## 🧪 Testes

```bash
# Executar testes do módulo
npm run test -- --testPathPattern=os

# Testes específicos
npm run test:os:unit         # Testes unitários
npm run test:os:integration  # Testes de integração
npm run test:os:isolation    # Testes de isolamento
```

## 🔗 Integrações Futuras

### Quando Orçamentos V2 estiver pronto:
- **Criação automática** de OS a partir de orçamento aprovado
- **Herança de dados** calculados pelo motor V2
- **Integração com estoque** para reserva/baixa de materiais

### Integrações planejadas:
- **Módulo de Estoque** - Controle de materiais
- **Sistema de Notificações** - Alertas em tempo real
- **Motor de Cálculo V2** - Recálculos dinâmicos

## 📋 Status do Desenvolvimento

- ✅ **Estrutura base** - Completa
- ✅ **CRUD básico** - Funcional
- ✅ **Sistema de workflows** - Implementado
- ✅ **Frontend completo** - Páginas e componentes
- ✅ **Testes básicos** - Isolamento validado
- ⏳ **Integração com V2** - Aguardando conclusão dos orçamentos
- ⏳ **Integração estoque** - Planejada
- ⏳ **Notificações** - Planejada

## 🚨 Importante

Este módulo está **COMPLETAMENTE ISOLADO** e não interfere em nenhuma funcionalidade existente. Pode ser desenvolvido e testado independentemente dos outros módulos.
