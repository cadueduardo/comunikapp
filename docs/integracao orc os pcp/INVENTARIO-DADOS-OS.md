# 📊 INVENTÁRIO DE DADOS - OS E ORÇAMENTOS

**Documento**: Inventário completo de dados existentes  
**Projeto**: Integração Orçamento → OS → PCP  
**Versão**: 1.0  
**Data**: Janeiro 2025  
**Status**: Análise concluída

---

## 🎯 **OBJETIVO**

Mapear dados existentes de OS e orçamentos para:
- Identificar lacunas de dados
- Planejar migração segura para numeração OS-AAAA-NNN
- Definir scripts de migração com rollback
- Estabelecer baseline para desenvolvimento

---

## 📋 **METODOLOGIA DE ANÁLISE**

### **Script de Análise**
- **Arquivo**: `backend/scripts/analisar-dados-os-existente.ts`
- **Execução**: `npx ts-node scripts/analisar-dados-os-existente.ts`
- **Amostra**: Máximo 50 registros de cada tipo (OS e Orçamentos)
- **Critérios**: Registros mais recentes primeiro

### **Critérios de Avaliação**
1. **Campos obrigatórios**: Verificação de campos vazios/nulos
2. **Relacionamentos**: Validação de vínculos obrigatórios
3. **Dados inválidos**: Verificação de valores inconsistentes
4. **JSON malformado**: Validação de campos JSON
5. **Numeração**: Análise de padrões de numeração

---

## 📈 **RESULTADOS DA ANÁLISE**

### **Resumo Executivo**
- **Total de OS**: [A ser preenchido após execução]
- **Total de Orçamentos**: [A ser preenchido após execução]
- **Amostra analisada**: 50 OS + 50 Orçamentos
- **Lacunas identificadas**: [A ser preenchido após execução]

### **Padrões de Numeração Identificados**

#### **OS (Ordens de Serviço)**
| Padrão | Exemplo | Status | Ação Necessária |
|--------|---------|--------|-----------------|
| `NUMERICO_SIMPLES` | `12345` | ❌ Inconsistente | Migrar para `OS-2024-001234` |
| `OS-NUMERO` | `OS-12345` | ⚠️ Parcial | Migrar para `OS-2024-001234` |
| `OS-AAAA-NNN` | `OS-2024-001234` | ✅ Correto | Manter |
| `OUTRO` | `OS-ABC-123` | ❌ Inconsistente | Migrar para `OS-2024-001234` |

#### **Orçamentos**
| Padrão | Exemplo | Status | Ação Necessária |
|--------|---------|--------|-----------------|
| `NUMERICO_SIMPLES` | `67890` | ❌ Inconsistente | Migrar para `ORC-2024-001234` |
| `ORC-NUMERO` | `ORC-67890` | ⚠️ Parcial | Migrar para `ORC-2024-001234` |
| `ORC-AAAA-NNN` | `ORC-2024-001234` | ✅ Correto | Manter |
| `OUTRO` | `ORC-XYZ-456` | ❌ Inconsistente | Migrar para `ORC-2024-001234` |

---

## 🔍 **LACUNAS IDENTIFICADAS**

### **Campos Vazios/Nulos**
- [ ] **OS**: Campo 'numero' vazio ou nulo
- [ ] **OS**: Campo 'nome_servico' vazio ou nulo
- [ ] **Orçamento**: Campo 'numero' vazio ou nulo
- [ ] **Orçamento**: Campo 'nome_servico' vazio ou nulo

### **Relacionamentos Faltantes**
- [ ] **OS**: Sem cliente associado
- [ ] **OS**: Sem orçamento associado (OS direta)
- [ ] **Orçamento**: Sem cliente associado

### **Dados Inválidos**
- [ ] **OS**: Campo 'quantidade' inválido (≤ 0)
- [ ] **Orçamento**: Campo 'custo_total' inválido (≤ 0)
- [ ] **Orçamento**: Campo 'preco_final' inválido (≤ 0)

### **JSON Malformado**
- [ ] **OS**: Campo 'parametros_tecnicos' com JSON inválido
- [ ] **OS**: Campo 'insumos_calculados' com JSON inválido

### **Estrutura de Dados**
- [ ] **OS**: Sem itens associados
- [ ] **Orçamento**: Sem itens associados

---

## 💡 **RECOMENDAÇÕES**

### **Imediatas (Antes da Migração)**
1. **Implementar validação obrigatória** para campos críticos
2. **Revisar registros** sem relacionamentos obrigatórios
3. **Corrigir dados inválidos** identificados
4. **Validar e corrigir** campos JSON malformados

### **Para Migração**
1. **Criar scripts de migração** com validação e rollback
2. **Implementar backup completo** antes da migração
3. **Testar migração** em ambiente de homologação primeiro
4. **Padronizar numeração** para formato OS-AAAA-NNN

### **Pós-Migração**
1. **Implementar validações** para evitar regressão
2. **Monitorar qualidade** dos dados
3. **Documentar padrões** estabelecidos
4. **Treinar usuários** nos novos formatos

---

## 🛠️ **SCRIPTS DE MIGRAÇÃO**

### **Script Principal**
- **Arquivo**: `backend/scripts/migrar-numeracao-os-aaaa-nnn.ts`
- **Execução**: `npx ts-node scripts/migrar-numeracao-os-aaaa-nnn.ts`
- **Funcionalidades**:
  - Validação de pré-requisitos
  - Backup automático dos dados
  - Migração de numeração
  - Validação pós-migração
  - Rollback automático em caso de erro

### **Características de Segurança**
- ✅ **Backup automático** antes da migração
- ✅ **Validação de pré-requisitos** obrigatória
- ✅ **Rollback automático** em caso de erro
- ✅ **Validação pós-migração** para garantir integridade
- ✅ **Logs detalhados** de todas as operações

### **Processo de Migração**
1. **Validar pré-requisitos**
   - DocumentCodeService configurado
   - Dados existentes para migração
   - Permissões de banco adequadas

2. **Criar backup**
   - Backup de todos os números atuais
   - Mapeamento de relacionamentos
   - Timestamp da operação

3. **Migrar numeração**
   - OS: Formato atual → `OS-AAAA-NNN`
   - Orçamentos: Formato atual → `ORC-AAAA-NNN`
   - Atualizar sequences do DocumentCodeService

4. **Validar migração**
   - Verificar formato de todos os registros
   - Validar integridade dos relacionamentos
   - Confirmar funcionamento do DocumentCodeService

5. **Rollback (se necessário)**
   - Restaurar números originais
   - Reverter sequences
   - Log de erro detalhado

---

## 📊 **PLANO DE EXECUÇÃO**

### **Fase 1: Preparação (1 semana)**
- [ ] Executar script de análise
- [ ] Revisar lacunas identificadas
- [ ] Corrigir dados críticos
- [ ] Preparar ambiente de homologação

### **Fase 2: Teste em Homologação (1 semana)**
- [ ] Executar migração em homologação
- [ ] Validar resultados
- [ ] Testar rollback
- [ ] Ajustar scripts se necessário

### **Fase 3: Migração Produção (1 dia)**
- [ ] Backup completo da produção
- [ ] Executar migração
- [ ] Validar resultados
- [ ] Confirmar funcionamento

### **Fase 4: Validação Pós-Migração (1 semana)**
- [ ] Monitorar funcionamento
- [ ] Validar relatórios
- [ ] Treinar usuários
- [ ] Documentar lições aprendidas

---

## 🚨 **RISCOS E MITIGAÇÕES**

### **Riscos Identificados**
1. **Perda de dados durante migração**
   - **Mitigação**: Backup automático + rollback
   - **Probabilidade**: Baixa
   - **Impacto**: Alto

2. **Falha na validação de pré-requisitos**
   - **Mitigação**: Validação rigorosa + testes
   - **Probabilidade**: Média
   - **Impacto**: Médio

3. **Inconsistência de dados pós-migração**
   - **Mitigação**: Validação pós-migração + monitoramento
   - **Probabilidade**: Baixa
   - **Impacto**: Médio

### **Plano de Contingência**
- **Se migração falhar**: Rollback automático + análise de logs
- **Se dados ficarem inconsistentes**: Restauração do backup + re-migração
- **Se sistema ficar instável**: Rollback completo + investigação

---

## 📋 **CHECKLIST DE MIGRAÇÃO**

### **Pré-Migração**
- [ ] Backup completo da base de dados
- [ ] Scripts testados em homologação
- [ ] Equipe treinada no processo
- [ ] Plano de rollback aprovado
- [ ] Janela de manutenção agendada

### **Durante Migração**
- [ ] Executar validação de pré-requisitos
- [ ] Criar backup automático
- [ ] Executar migração
- [ ] Validar resultados
- [ ] Confirmar funcionamento

### **Pós-Migração**
- [ ] Validar todos os registros
- [ ] Testar funcionalidades críticas
- [ ] Verificar relatórios
- [ ] Monitorar por 24h
- [ ] Documentar resultados

---

## 📞 **SUPORTE E ESCALAÇÃO**

### **Níveis de Suporte**
- **Nível 1**: Desenvolvedor responsável
- **Nível 2**: Líder técnico
- **Nível 3**: Arquiteto de sistema
- **Nível 4**: Diretoria técnica

### **Canais de Comunicação**
- **Slack/Teams**: Comunicação imediata
- **Email**: Comunicação formal
- **Telefone**: Emergências críticas

---

**📝 Documento criado por:** Analista de Sistema  
**📅 Data:** Janeiro 2025  
**🔄 Versão:** 1.0  
**📋 Status:** Aguardando execução dos scripts de análise  
**👥 Próximo passo:** Executar script de análise e preencher resultados
