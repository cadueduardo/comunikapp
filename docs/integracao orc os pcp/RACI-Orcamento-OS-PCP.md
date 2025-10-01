# 📋 MATRIZ RACI - PROJETO ORÇAMENTO → OS → PCP

**Documento**: Matriz de Responsabilidades, Responsabilidade, Consulta e Informação  
**Projeto**: Integração Orçamento → Ordem de Serviço → PCP  
**Versão**: 1.0  
**Data**: Janeiro 2025  
**Status**: Aprovado para implementação

---

## 🎯 **OBJETIVO DO PROJETO**

Evoluir o fluxo **Orçamento → Ordem de Serviço → PCP** em 4 fases incrementais, habilitando:
- Rastreabilidade ponta a ponta com numeração OS-AAAA-NNN
- Suporte completo a OS comercial (derivada de orçamento) e OS interna (direta)
- Workflows diferenciados e sistema de aprovação por alçada
- Integração com PCP para controle operacional avançado

---

## 👥 **STAKEHOLDERS IDENTIFICADOS**

### **Área Comercial**
- **Vendedores**: Criação de orçamentos, aprovação de clientes
- **Gerentes Comerciais**: Aprovação de margens, acompanhamento de vendas
- **Backoffice**: Processamento de OS, agendamento de instalação

### **Área Produção**
- **Coordenadores de Produção**: Aprovação técnica, validação de viabilidade
- **Operadores**: Execução de workflows, apontamentos de produção
- **Supervisores**: Controle de qualidade, conferência final

### **Área Administrativa**
- **Gestores**: Aprovação de alçadas para OS interna, controle de centro de custo
- **Financeiro**: Controle de custos, apropriação de gastos internos
- **TI/Desenvolvimento**: Implementação técnica, manutenção do sistema

---

## 📊 **MATRIZ RACI DETALHADA**

### **FASE 0 - PREPARAÇÃO E GOVERNANÇA (2 semanas)**

| Atividade | Comercial | Produção | Administrativo | TI/Dev | Observações |
|-----------|-----------|----------|----------------|---------|-------------|
| **Criar documento RACI** | C | I | I | **R** | TI lidera criação |
| **Conduzir kickoff** | **R** | **R** | **R** | **R** | Todos participam |
| **Definir calendário** | **R** | C | **R** | C | Comercial + Admin lideram |
| **Aprovar baseline** | **R** | **R** | **R** | **R** | Consenso obrigatório |

### **FASE 1 - FUNDAMENTOS DE OS (6-8 semanas)**

| Atividade | Comercial | Produção | Administrativo | TI/Dev | Observações |
|-----------|-----------|----------|----------------|---------|-------------|
| **Numeração OS-AAAA-NNN** | I | I | I | **R** | TI implementa |
| **Criação automática OS** | **R** | C | I | **R** | Comercial valida fluxo |
| **Validações de estoque** | C | **R** | I | **R** | Produção define regras |
| **Schema ampliado** | I | C | I | **R** | TI implementa |
| **OS comercial vs interna** | **R** | C | **R** | **R** | Comercial + Admin |
| **Estrutura completa dados** | I | **R** | I | **R** | Produção valida necessidades |
| **Template impressão** | C | **R** | I | **R** | Produção define layout |

### **FASE 2 - MVP PCP E WORKFLOWS (5-6 semanas)**

| Atividade | Comercial | Produção | Administrativo | TI/Dev | Observações |
|-----------|-----------|----------|----------------|---------|-------------|
| **Aprovação técnica** | C | **R** | I | **R** | Produção lidera processo |
| **Workflows diferenciados** | **R** | **R** | **R** | **R** | Todos definem regras |
| **Sistema de alçadas** | I | I | **R** | **R** | Admin define valores |
| **Interface Kanban** | C | **R** | I | **R** | Produção valida UX |
| **Agendamento instalação** | **R** | C | I | **R** | Comercial coordena |
| **Logs movimentação** | I | **R** | I | **R** | Produção define eventos |

### **FASE 3 - AUTOMAÇÃO AVANÇADA (6-8 semanas)**

| Atividade | Comercial | Produção | Administrativo | TI/Dev | Observações |
|-----------|-----------|----------|----------------|---------|-------------|
| **Planejamento capacidade** | I | **R** | I | **R** | Produção define algoritmos |
| **Dependências paralelas** | C | **R** | I | **R** | Produção mapeia fluxos |
| **Relatórios analytics** | **R** | **R** | **R** | **R** | Todos consomem dados |
| **Integração compras** | I | **R** | **R** | **R** | Produção + Admin |

### **FASE 4 - GO-LIVE E MELHORIA (4 semanas)**

| Atividade | Comercial | Produção | Administrativo | TI/Dev | Observações |
|-----------|-----------|----------|----------------|---------|-------------|
| **Piloto controlado** | **R** | **R** | **R** | **R** | Todos participam |
| **Treinamentos** | **R** | **R** | **R** | **R** | Cada área treina sua |
| **Suporte pós-go-live** | **R** | **R** | **R** | **R** | Suporte conjunto |
| **Roadmap evolução** | **R** | **R** | **R** | **R** | Planejamento conjunto |

---

## 📅 **CALENDÁRIO DE ENTREGAS**

### **Cronograma Geral (20 semanas)**

```
Semana 1-2:   Fase 0 - Preparação e Governança
Semana 3-10:  Fase 1 - Fundamentos de OS
Semana 11-16: Fase 2 - MVP PCP e Workflows  
Semana 17-24: Fase 3 - Automação Avançada
Semana 25-28: Fase 4 - Go-live e Melhoria
```

### **Marcos Críticos**

| Marco | Data | Responsável | Critério de Sucesso |
|-------|------|-------------|-------------------|
| **Kickoff Completo** | Semana 1 | TI/Dev | RACI aprovado por todas as áreas |
| **Baseline Técnico** | Semana 2 | TI/Dev | Inventário de dados + CI/CD funcionando |
| **OS-AAAA-NNN** | Semana 4 | TI/Dev | Numeração implementada e testada |
| **OS Comercial/Interna** | Semana 6 | Comercial + Admin | Ambos os tipos funcionando |
| **Aprovação Técnica** | Semana 8 | Produção | Workflow de aprovação operacional |
| **PCP MVP** | Semana 12 | Produção | Kanban funcionando com workflows |
| **Piloto Produção** | Semana 20 | Todos | Uma loja operando com sistema completo |
| **Go-live Completo** | Semana 24 | Todos | Todas as lojas migradas |

---

## 📞 **PLANO DE COMUNICAÇÃO**

### **Frequência de Reuniões**

| Tipo | Frequência | Participantes | Duração | Objetivo |
|------|------------|---------------|---------|----------|
| **Daily Standup** | Diário | TI/Dev | 15 min | Status técnico |
| **Weekly Sync** | Semanal | Líderes de área | 30 min | Alinhamento geral |
| **Sprint Review** | A cada 2 semanas | Todos | 1h | Demonstração + feedback |
| **Steering Committee** | Mensal | Gestores | 1h | Decisões estratégicas |

### **Canais de Comunicação**

| Canal | Uso | Responsável | Escalação |
|-------|-----|-------------|-----------|
| **Slack/Teams** | Comunicação diária | TI/Dev | Gerentes de área |
| **Email** | Comunicação formal | Admin | Diretoria |
| **Confluence/Notion** | Documentação | TI/Dev | Todos |
| **Jira/Azure DevOps** | Acompanhamento técnico | TI/Dev | Product Owner |

### **Matriz de Escalação**

| Nível | Problema | Responsável | Tempo Resposta |
|-------|----------|-------------|----------------|
| **Nível 1** | Bug técnico simples | TI/Dev | 4 horas |
| **Nível 2** | Impacto em uma área | Gerente área | 8 horas |
| **Nível 3** | Impacto em múltiplas áreas | Gestores | 24 horas |
| **Nível 4** | Bloqueio crítico do projeto | Diretoria | 48 horas |

---

## 🎯 **INDICADORES DE SUCESSO POR ÁREA**

### **Área Comercial**
- ✅ Tempo médio Orçamento → OS ≤ 5 minutos
- ✅ Taxa de aprovação técnica ≥ 80%
- ✅ Redução de retrabalho ≥ 60%
- ✅ Adoção de OS interna ≥ 70% dos departamentos

### **Área Produção**
- ✅ Taxa de apontamentos realizados ≥ 85%
- ✅ SLAs de entrega atendidos ≥ 95%
- ✅ Precisão agendamento instalação ≥ 90%
- ✅ Adoção impressão OS ≥ 90%

### **Área Administrativa**
- ✅ Aprovação OS interna ≤ 2h (até R$ 2000)
- ✅ Aprovação OS interna ≤ 24h (acima R$ 2000)
- ✅ Controle centro custo ≥ 95% precisão
- ✅ Redução custos operacionais ≥ 15%

### **Área TI/Desenvolvimento**
- ✅ Cobertura testes ≥ 80%
- ✅ Tempo resposta APIs ≤ 200ms
- ✅ Uptime sistema ≥ 99.5%
- ✅ Zero bugs críticos em produção

---

## 📋 **TEMPLATE DE KICKOFF MEETING**

### **Agenda Padrão (2 horas)**

#### **1. Abertura (15 min)**
- Apresentação do projeto e objetivos
- Apresentação dos participantes
- Definição de regras da reunião

#### **2. Contexto e Justificativa (20 min)**
- Situação atual vs situação desejada
- Benefícios esperados por área
- Riscos e mitigações

#### **3. Escopo e Fases (30 min)**
- Apresentação das 4 fases
- Entregas por fase
- Marcos críticos

#### **4. Governança (20 min)**
- Apresentação da matriz RACI
- Definição de responsabilidades
- Plano de comunicação

#### **5. Próximos Passos (15 min)**
- Cronograma detalhado
- Primeiras atividades
- Próxima reunião

#### **6. Q&A e Fechamento (20 min)**
- Dúvidas e esclarecimentos
- Compromissos assumidos
- Ações de follow-up

### **Checklist Pré-Reunião**
- [ ] Sala reservada ou link Teams/Zoom
- [ ] Apresentação preparada
- [ ] RACI impresso para todos
- [ ] Cronograma detalhado
- [ ] Lista de participantes confirmada

### **Checklist Pós-Reunião**
- [ ] Ata da reunião distribuída
- [ ] RACI aprovado por todas as áreas
- [ ] Cronograma ajustado conforme feedback
- [ ] Próxima reunião agendada
- [ ] Ações de follow-up definidas

---

## ✅ **DEFINIÇÃO DE PRONTO (DoD) - FASE 0**

### **Critérios de Conclusão**
- [ ] Documento RACI aprovado por todas as áreas
- [ ] Kickoff realizado com participação de todos os stakeholders
- [ ] Cronograma de entregas definido e aprovado
- [ ] Plano de comunicação estabelecido
- [ ] Indicadores de sucesso definidos por área
- [ ] Próxima reunião agendada

### **Entregáveis**
- [ ] Documento RACI final (este documento)
- [ ] Ata do kickoff meeting
- [ ] Cronograma detalhado aprovado
- [ ] Plano de comunicação ativo
- [ ] Baseline de indicadores estabelecido

---

**📝 Documento criado por:** Analista de Sistema / Product Owner  
**📅 Data:** Janeiro 2025  
**🔄 Versão:** 1.0  
**📋 Status:** Aprovado para kickoff  
**👥 Próximo passo:** Agendar e conduzir kickoff meeting com todas as áreas
