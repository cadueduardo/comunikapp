# 🚀 PIPELINE CI/CD - ORÇAMENTO → OS → PCP

**Documento**: Configuração e documentação do pipeline CI/CD  
**Projeto**: Integração Orçamento → OS → PCP  
**Versão**: 1.0  
**Data**: Janeiro 2025  
**Status**: Implementado

---

## 🎯 **OBJETIVO**

Implementar pipeline CI/CD automatizado para:
- Execução automática de testes Prisma/NestJS
- Geração automática de documentação OpenAPI
- Validação de qualidade de código
- Deploy automatizado para produção

---

## 📋 **ARQUITETURA DO PIPELINE**

### **Fluxo Geral**
```
Push/PR → Lint → Testes Unitários → Testes E2E → Validação Prisma → OpenAPI → Build → Deploy
```

### **Jobs do Pipeline**
1. **Lint e Formatação**: Validação de código
2. **Testes Unitários**: Cobertura ≥80%
3. **Testes E2E**: Validação de integração
4. **Validação Prisma**: Schema e migrações
5. **Geração OpenAPI**: Documentação automática
6. **Build e Deploy**: Deploy para produção
7. **Notificações**: Status do pipeline

---

## 🔧 **CONFIGURAÇÃO**

### **Arquivo Principal**
- **Localização**: `.github/workflows/ci-cd.yml`
- **Trigger**: Push em `main`, `develop`, `feature/*`
- **Ambiente**: Ubuntu Latest + Node.js 18 + MySQL 8.0

### **Variáveis de Ambiente**
```yaml
env:
  NODE_VERSION: '18'
  MYSQL_VERSION: '8.0'
```

### **Serviços Utilizados**
- **MySQL**: Banco de dados para testes
- **Node.js**: Runtime da aplicação
- **GitHub Actions**: Plataforma de CI/CD

---

## 📊 **DETALHAMENTO DOS JOBS**

### **1. Lint e Formatação**
```yaml
lint-and-format:
  name: Lint e Formatação
  runs-on: ubuntu-latest
```

**Funcionalidades**:
- ✅ Instalação de dependências
- ✅ Execução do ESLint
- ✅ Verificação de formatação
- ✅ Cache de dependências

**Critérios de Sucesso**:
- Zero erros de lint
- Código formatado corretamente
- Dependências instaladas

### **2. Testes Unitários**
```yaml
unit-tests:
  name: Testes Unitários
  runs-on: ubuntu-latest
  services:
    mysql: # Banco de dados para testes
```

**Funcionalidades**:
- ✅ Configuração de ambiente de teste
- ✅ Geração do cliente Prisma
- ✅ Execução de migrações
- ✅ Cobertura de testes ≥80%
- ✅ Upload para Codecov

**Critérios de Sucesso**:
- Todos os testes passam
- Cobertura ≥80%
- Banco de dados configurado

### **3. Testes E2E**
```yaml
e2e-tests:
  name: Testes End-to-End
  runs-on: ubuntu-latest
  services:
    mysql: # Banco de dados para E2E
```

**Funcionalidades**:
- ✅ Ambiente E2E isolado
- ✅ Migrações específicas para E2E
- ✅ Testes de integração completos
- ✅ Upload de resultados

**Critérios de Sucesso**:
- Todos os testes E2E passam
- Integração funcionando
- Resultados documentados

### **4. Validação Prisma**
```yaml
prisma-validation:
  name: Validação Prisma
  runs-on: ubuntu-latest
```

**Funcionalidades**:
- ✅ Validação do schema Prisma
- ✅ Geração do cliente
- ✅ Verificação de migrações
- ✅ Status das migrações

**Critérios de Sucesso**:
- Schema válido
- Cliente gerado
- Migrações consistentes

### **5. Geração OpenAPI**
```yaml
generate-openapi:
  name: Gerar OpenAPI
  runs-on: ubuntu-latest
```

**Funcionalidades**:
- ✅ Build da aplicação
- ✅ Geração da documentação
- ✅ Validação da spec
- ✅ Upload do arquivo

**Critérios de Sucesso**:
- Documentação gerada
- Spec válida
- Arquivo disponível

### **6. Build e Deploy**
```yaml
build-and-deploy:
  name: Build e Deploy
  needs: [todos-os-jobs-anteriores]
  if: github.ref == 'refs/heads/main'
```

**Funcionalidades**:
- ✅ Build de produção
- ✅ Testes finais
- ✅ Deploy automatizado
- ✅ Apenas na branch main

**Critérios de Sucesso**:
- Build sem erros
- Deploy concluído
- Aplicação funcionando

### **7. Notificações**
```yaml
notify:
  name: Notificações
  needs: [todos-os-jobs]
  if: always()
```

**Funcionalidades**:
- ✅ Notificação de sucesso
- ✅ Notificação de falha
- ✅ Status detalhado
- ✅ Logs de erro

---

## 📚 **GERAÇÃO DE DOCUMENTAÇÃO OPENAPI**

### **Script Automatizado**
- **Arquivo**: `backend/scripts/generate-openapi.ts`
- **Execução**: Automática no pipeline
- **Outputs**: JSON, YAML, HTML

### **Configuração Swagger**
```typescript
const config = new DocumentBuilder()
  .setTitle('Comunikapp API')
  .setDescription('API do sistema Comunikapp')
  .setVersion('2.0.0')
  .addBearerAuth() // JWT
  .addTag('Orçamentos', 'Gestão de orçamentos V2')
  .addTag('OS', 'Ordens de Serviço')
  .addTag('PCP', 'Planejamento e Controle de Produção')
  .build();
```

### **Arquivos Gerados**
- `docs/openapi.json` - Spec em JSON
- `docs/openapi.yaml` - Spec em YAML  
- `docs/openapi.html` - Visualização interativa

### **Validação Automática**
- ✅ Estrutura básica
- ✅ Endpoints críticos
- ✅ Componentes obrigatórios
- ✅ Esquemas de segurança

---

## 🧪 **ESTRATÉGIA DE TESTES**

### **Testes Unitários**
- **Framework**: Jest
- **Cobertura**: ≥80%
- **Ambiente**: Isolado com banco de teste
- **Foco**: Lógica de negócio, services, controllers

### **Testes E2E**
- **Framework**: Jest + Supertest
- **Ambiente**: Banco de dados E2E
- **Foco**: Integração completa, APIs, workflows

### **Testes de Integração**
- **Prisma**: Validação de schema e migrações
- **OpenAPI**: Validação de documentação
- **Build**: Verificação de compilação

### **Critérios de Qualidade**
- ✅ Zero erros de lint
- ✅ Cobertura ≥80%
- ✅ Todos os testes passam
- ✅ Documentação atualizada

---

## 🚀 **DEPLOY E PRODUÇÃO**

### **Estratégia de Deploy**
- **Branch**: Apenas `main`
- **Trigger**: Push/merge em `main`
- **Ambiente**: Produção
- **Rollback**: Automático em caso de falha

### **Pré-requisitos para Deploy**
- ✅ Todos os jobs anteriores passaram
- ✅ Testes com cobertura adequada
- ✅ Documentação atualizada
- ✅ Build sem erros

### **Processo de Deploy**
1. **Validação**: Todos os jobs passaram
2. **Build**: Compilação de produção
3. **Testes**: Validação final
4. **Deploy**: Deploy automatizado
5. **Verificação**: Health check da aplicação

---

## 📊 **MONITORAMENTO E MÉTRICAS**

### **Métricas do Pipeline**
- **Tempo de execução**: < 15 minutos
- **Taxa de sucesso**: ≥95%
- **Cobertura de testes**: ≥80%
- **Tempo de deploy**: < 5 minutos

### **Alertas e Notificações**
- ✅ Sucesso: Notificação em canal dedicado
- ❌ Falha: Alerta imediato + logs detalhados
- ⚠️ Warning: Aviso para revisão

### **Logs e Debugging**
- **Logs detalhados**: Cada job gera logs
- **Artifacts**: Upload de resultados e relatórios
- **Debugging**: Ambiente reproduzível localmente

---

## 🔧 **CONFIGURAÇÃO LOCAL**

### **Executar Pipeline Localmente**
```bash
# Instalar dependências
cd backend
npm install

# Executar lint
npm run lint

# Executar testes
npm run test
npm run test:e2e

# Gerar OpenAPI
npx ts-node scripts/generate-openapi.ts

# Build
npm run build
```

### **Variáveis de Ambiente**
```bash
# .env.test
DATABASE_URL=mysql://root:root@localhost:3306/comunikapp_test
NODE_ENV=test

# .env.e2e
DATABASE_URL=mysql://root:root@localhost:3306/comunikapp_e2e
NODE_ENV=test
```

### **Docker para Testes**
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  mysql-test:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: comunikapp_test
    ports:
      - "3306:3306"
```

---

## 🚨 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **1. Falha nos Testes**
- **Causa**: Banco de dados não configurado
- **Solução**: Verificar serviços MySQL no pipeline
- **Prevenção**: Health checks configurados

#### **2. Falha na Geração OpenAPI**
- **Causa**: Aplicação não inicia
- **Solução**: Verificar build e dependências
- **Prevenção**: Validação prévia

#### **3. Falha no Deploy**
- **Causa**: Configuração de produção incorreta
- **Solução**: Verificar variáveis de ambiente
- **Prevenção**: Testes em staging

### **Comandos de Debug**
```bash
# Verificar status do pipeline
gh run list

# Ver logs de um job específico
gh run view <run-id>

# Executar job específico
gh run rerun <run-id>
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Configuração Inicial**
- [ ] Arquivo `.github/workflows/ci-cd.yml` criado
- [ ] Script `generate-openapi.ts` implementado
- [ ] Variáveis de ambiente configuradas
- [ ] Serviços MySQL configurados

### **Testes**
- [ ] Testes unitários funcionando
- [ ] Testes E2E funcionando
- [ ] Cobertura ≥80% configurada
- [ ] Validação Prisma funcionando

### **Documentação**
- [ ] OpenAPI sendo gerado automaticamente
- [ ] Documentação HTML disponível
- [ ] Validação da spec funcionando
- [ ] Upload de artifacts configurado

### **Deploy**
- [ ] Build de produção funcionando
- [ ] Deploy automatizado configurado
- [ ] Health checks implementados
- [ ] Rollback automático configurado

---

## 🔄 **EVOLUÇÃO E MELHORIAS**

### **Melhorias Futuras**
1. **Cache de dependências**: Otimizar tempo de build
2. **Testes paralelos**: Executar jobs em paralelo
3. **Deploy blue-green**: Zero downtime
4. **Monitoramento**: Métricas em tempo real
5. **Notificações**: Integração com Slack/Teams

### **Métricas de Sucesso**
- **Tempo de pipeline**: < 10 minutos
- **Taxa de sucesso**: ≥98%
- **Cobertura**: ≥85%
- **Tempo de deploy**: < 3 minutos

---

**📝 Documento criado por:** Analista de Sistema  
**📅 Data:** Janeiro 2025  
**🔄 Versão:** 1.0  
**📋 Status:** Implementado e funcionando  
**👥 Próximo passo:** Monitorar execução e ajustar conforme necessário
