# Módulo de Usuários - PBI Completo

## 📋 Descrição do PBI

Implementar módulo de usuários com autenticação segura, controle de permissões granulares e integração com funções produtivas, seguindo arquitetura modular e arquivos organizados (máximo 1000 linhas).

---

## 🏗️ Arquitetura Modular

### **Estrutura de Diretórios:**
```
backend/src/usuarios/
├── controllers/
│   ├── usuarios.controller.ts
│   ├── autenticacao.controller.ts
│   └── permissoes.controller.ts
├── services/
│   ├── usuarios.service.ts
│   ├── autenticacao.service.ts
│   ├── permissoes.service.ts
│   └── auditoria.service.ts
├── dto/
│   ├── create-usuario.dto.ts
│   ├── update-usuario.dto.ts
│   ├── login.dto.ts
│   └── alterar-senha.dto.ts
├── guards/
│   ├── auth.guard.ts
│   ├── permissoes.guard.ts
│   └── loja.guard.ts
├── decorators/
│   ├── usuario-atual.decorator.ts
│   └── permissoes.decorator.ts
├── interfaces/
│   ├── usuario.interface.ts
│   ├── sessao.interface.ts
│   └── permissao.interface.ts
└── usuarios.module.ts
```

---

## 🔧 Campos e Componentes

### **Dados Básicos:**
| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|-------------|-----------|-----------|
| **Nome completo** | Input text | ✅ Sim | Mín. 3 caracteres | Nome completo do usuário |
| **Email** | Input email | ✅ Sim | Formato válido, único por loja | Email de acesso |
| **CPF** | Input text | ✅ Sim | Formato válido, único por loja | Documento de identificação |
| **Telefone** | Input text | ❌ Não | Formato válido | Contato do usuário |
| **Login/Username** | Input text | ✅ Sim | Único por loja | Nome de usuário |
| **Senha** | Input password | ✅ Sim | Mín. 8 caracteres | Senha criptografada |
| **Perfil de acesso** | Dropdown | ✅ Sim | Existente | Admin, Gerente, Operador, Apontador |
| **Setor/Departamento** | Dropdown | ✅ Sim | Existente | Produção, Acabamento, Arte, etc. |
| **Status** | Dropdown | ✅ Sim | Ativo/Inativo | Controle de acesso |

### **Integrações:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **Função principal** | Dropdown | ✅ Sim | Vínculo ao CRUD de Funções |
| **Funções secundárias** | Multi-select | ❌ Não | Outras funções que pode executar |
| **Permissões customizadas** | Multi-select | ❌ Não | Permissões específicas além do perfil |

### **Controle de Acesso:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **Primeiro acesso** | Checkbox | ✅ Sim | Força troca de senha |
| **Último acesso** | Timestamp | 🔄 Auto | Data/hora do último login |
| **Tentativas de login** | Numérico | 🔄 Auto | Controle de bloqueio |
| **Bloqueado até** | Timestamp | 🔄 Auto | Bloqueio por tentativas |
| **Data de admissão** | Date picker | ❌ Não | Para controle de experiência |
| **Observações** | Textarea | ❌ Não | Máx. 500 caracteres |

---

## 🔗 Integrações

### **Com Módulo de Funções (Existente):**
```typescript
// Relacionamento bidirecional
interface Usuario {
  funcao_principal_id: string;
  funcoes_secundarias_ids: string[];
  // ... outros campos
}

interface Funcao {
  usuarios: Usuario[]; // Usuários que podem executar
  // ... campos existentes
}
```

### **Com Autenticação Atual:**
```typescript
// Manter compatibilidade com admin da loja
interface Sessao {
  usuario_id?: string; // Novo campo
  loja_id: string;     // Campo existente
  tipo: 'admin' | 'usuario';
  perfil: string;
  permissoes: Permissao[];
}
```

### **Com Módulos Futuros:**
- **PCP:** Responsável por etapas do workflow
- **Estoque:** Usuário que fez movimentação
- **Compras:** Usuário que aprovou pedido

---

## ✅ Critérios de Aceite

### **Funcionalidades Básicas:**
- ✅ CRUD completo de usuários (máximo 500 linhas por arquivo)
- ✅ Validação de email, CPF e login únicos por loja
- ✅ Criptografia de senhas com bcrypt
- ✅ Controle de status (ativo/inativo)

### **Autenticação e Segurança:**
- ✅ Login independente para cada usuário
- ✅ Sessão JWT com dados do usuário + loja
- ✅ Middleware de autenticação modular
- ✅ Bloqueio por tentativas de login (5 tentativas)
- ✅ Força troca de senha no primeiro acesso

### **Controle de Permissões:**
- ✅ Perfis predefinidos (Admin, Gerente, Operador, Apontador)
- ✅ Permissões granulares por módulo e ação
- ✅ Herança de permissões da função
- ✅ Permissões customizadas por usuário
- ✅ Guard de permissões reutilizável

### **Integrações:**
- ✅ Vínculo obrigatório com pelo menos uma Função
- ✅ Compatibilidade com autenticação atual da loja
- ✅ Logs de auditoria de todas as operações
- ✅ Preparação para integração com módulos futuros

### **Arquitetura e Manutenibilidade:**
- ✅ Arquivos organizados por responsabilidade
- ✅ Máximo 1000 linhas por arquivo
- ✅ Interfaces bem definidas
- ✅ Serviços modulares e reutilizáveis
- ✅ Guards e decorators padronizados

---

## 🎯 Objetivos

- **Modularidade:** Sistema apartado e fácil de manter
- **Segurança:** Autenticação robusta e controle de acesso
- **Flexibilidade:** Suporte a diferentes perfis e permissões
- **Integração:** Conexão com Funções e módulos futuros
- **Auditoria:** Rastreabilidade completa de operações

---

## 🔄 Fluxo de Implementação

### **Fase 1: Estrutura Base (Semana 1)**
1. **Criar estrutura de diretórios**
2. **Implementar entidades e DTOs**
3. **Criar serviços básicos**
4. **Implementar controllers**

### **Fase 2: Autenticação (Semana 2)**
1. **Middleware de autenticação**
2. **Sistema de login/logout**
3. **Controle de sessão**
4. **Segurança e bloqueios**

### **Fase 3: Permissões (Semana 3)**
1. **Sistema de perfis**
2. **Permissões granulares**
3. **Guards e decorators**
4. **Integração com funções**

### **Fase 4: Auditoria e Integração (Semana 4)**
1. **Sistema de logs**
2. **Relatórios de auditoria**
3. **Integração com módulos existentes**
4. **Testes e documentação**

---

## 📊 Estrutura Técnica

### **Interfaces Principais:**
```typescript
// interfaces/usuario.interface.ts
interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  login: string;
  senha_hash: string;
  perfil: 'admin' | 'gerente' | 'operador' | 'apontador';
  setor: string;
  funcao_principal_id: string;
  funcoes_secundarias_ids: string[];
  status: 'ativo' | 'inativo';
  primeiro_acesso: boolean;
  tentativas_login: number;
  bloqueado_ate?: Date;
  data_admissao?: Date;
  observacoes?: string;
  loja_id: string;
  criado_em: Date;
  atualizado_em: Date;
}

// interfaces/sessao.interface.ts
interface Sessao {
  usuario_id: string;
  loja_id: string;
  tipo: 'admin' | 'usuario';
  perfil: string;
  permissoes: Permissao[];
  expiracao: Date;
}

// interfaces/permissao.interface.ts
interface Permissao {
  modulo: 'orcamentos' | 'produtos' | 'estoque' | 'compras' | 'pcp';
  acao: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'aprovar';
  permitido: boolean;
}
```

### **Estrutura de Arquivos:**
```
backend/src/usuarios/
├── controllers/ (3 arquivos, ~300 linhas cada)
├── services/ (4 arquivos, ~400 linhas cada)
├── dto/ (4 arquivos, ~100 linhas cada)
├── guards/ (3 arquivos, ~200 linhas cada)
├── decorators/ (2 arquivos, ~150 linhas cada)
├── interfaces/ (3 arquivos, ~100 linhas cada)
└── usuarios.module.ts (~200 linhas)
```

**Total estimado: ~3.000 linhas distribuídas em 20 arquivos organizados**

---

## 🚨 Alertas e Notificações

- **🔔 Primeiro acesso:** Força troca de senha
- **⏰ Bloqueio:** Alerta após 3 tentativas de login
- **✅ Login bem-sucedido:** Registra último acesso
- **🚨 Tentativas excessivas:** Bloqueia conta temporariamente

---

## 📋 Checklist de Implementação

### **Estrutura:**
- [ ] Criar diretórios organizados
- [ ] Definir interfaces principais
- [ ] Implementar DTOs de validação
- [ ] Criar entidades do banco

### **Autenticação:**
- [ ] Middleware de autenticação
- [ ] Sistema de login/logout
- [ ] Controle de sessão JWT
- [ ] Segurança e bloqueios

### **Permissões:**
- [ ] Sistema de perfis
- [ ] Permissões granulares
- [ ] Guards e decorators
- [ ] Integração com funções

### **Auditoria:**
- [ ] Sistema de logs
- [ ] Relatórios de auditoria
- [ ] Integração com módulos existentes
- [ ] Testes e documentação 