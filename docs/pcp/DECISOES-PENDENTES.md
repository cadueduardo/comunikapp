# ❓ DECISÕES PENDENTES - MÓDULO PCP

**Data:** 21/10/2025  
**Status:** Aguardando Definições

---

## 🏷️ **1. NOMENCLATURAS**

### **Conceito: Área Física de Trabalho**

**Opções:**
- A) "Setores Produtivos"
- B) "Centros de Trabalho"
- C) "Departamentos de Produção"
- D) "Áreas de Produção"

**Contexto:** É o agrupamento de máquinas + funções + operadores.

**Recomendação:** "Setores Produtivos" (mais comum na indústria)

---

### **Conceito: Tela do Operador**

**Opções:**
- A) "Meu Setor"
- B) "Minha Fila"
- C) "Minha Área de Trabalho"
- D) "Produção do Setor"

**Contexto:** Tela onde operador vê produtos para trabalhar.

**Recomendação:** "Meu Setor" ou "Fila do Setor [Nome]"

---

### **Conceito: Status de Produção do Produto**

**Opções atuais no schema:**
```
PENDENTE        ← Aguardando liberação PCP
LIBERADO        ← Liberado, pode ir para setor
AGUARDANDO      ← Na fila do setor
EM_ANDAMENTO    ← Operador está trabalhando
PAUSADO         ← Pausado (problema)
CONCLUIDO       ← Finalizado
```

**Perguntas:**
- Manter "PENDENTE" e "LIBERADO" separados?
- Ou unificar em "AGUARDANDO"?

**Recomendação:**
```
AGUARDANDO_LIBERACAO  ← Antes de liberar para PCP
AGUARDANDO_INICIO     ← Na fila do setor, esperando
EM_ANDAMENTO          ← Sendo produzido
PAUSADO               ← Problema/falta material
CONCLUIDO             ← Finalizado no setor
```

---

## 🔐 **2. PERMISSÕES E ACESSO**

### **Detecção de Setor do Operador**

**Opção A: Auto-Detect (Recomendado)**
```
Sistema detecta automaticamente:
├─ Usuário: João Silva
├─ Busca: SetorProdutivo onde João está em operadores_ids
├─ Resultado: Setor "Impressão Digital"
└─ Mostra: Fila deste setor automaticamente

Se usuário está em MÚLTIPLOS setores:
└─ Mostra dropdown para escolher
```

**Opção B: Seleção Manual**
```
Tela sempre tem dropdown:
[Setor: Impressão Digital ▼]

Usuário escolhe manualmente onde vai trabalhar.
```

**Opção C: Híbrido**
```
Auto-detect se está em 1 setor apenas.
Dropdown se está em múltiplos setores.
```

**Recomendação:** Opção C (Híbrido)

---

### **Permissões de Ação**

**Quem pode fazer o quê?**

| Ação | Operador | Responsável Setor | Gestor PCP | Admin |
|------|----------|-------------------|------------|-------|
| Ver fila do setor | ✅ Seu setor | ✅ Seu setor | ✅ Todos | ✅ Todos |
| Iniciar produto | ✅ Seu setor | ✅ Seu setor | ❌ | ❌ |
| Pausar produto | ✅ Se iniciou | ✅ Qualquer | ✅ Qualquer | ✅ |
| Concluir produto | ✅ Se iniciou | ✅ Qualquer | ✅ Qualquer | ✅ |
| Mover entre setores | ❌ | ⚠️ Excepcional | ✅ | ✅ |
| Ver Kanban Geral | ❌ | ✅ | ✅ | ✅ |
| Editar Setores | ❌ | ❌ | ❌ | ✅ |
| Editar Workflows | ❌ | ❌ | ⚠️ Sugerir | ✅ |

**Decisão Necessária:** Validar esta tabela de permissões.

---

## 🖥️ **3. EXPERIÊNCIA DO USUÁRIO**

### **Tela Inicial para Cada Perfil**

**Operador (ex: João - Impressão)**
```
Login → Redireciona para:
  /pcp/setores/impressao
  
Mostra imediatamente:
  └─ Fila do setor dele
```

**Responsável de Setor (ex: Ana - CNC)**
```
Login → Redireciona para:
  /pcp/setores/cnc
  OU
  /pcp/kanban (com foco no setor dele)
```

**Gestor PCP**
```
Login → Redireciona para:
  /pcp (Dashboard geral)
```

**Admin**
```
Login → Redireciona para:
  /dashboard (geral do sistema)
```

**Decisão Necessária:** Confirmar lógica de redirecionamento por perfil.

---

### **Navegação Rápida**

**Breadcrumb sugerido:**
```
PCP > Setores > Impressão Digital > Fila

PCP > Kanban Gerencial > Filtro: Impressão

Configurações > Produção > Setores Produtivos
```

**Menu Lateral:**
```
Mostrar atalho "Meu Setor" no menu?
Ou apenas em /pcp?
```

---

## 📊 **4. VISUALIZAÇÕES**

### **Kanban Gerencial - Layout**

**Opção A: Colunas Horizontais (atual)**
```
[Impressão] [CNC] [Acabamento] [Expedição]
```
- Boa para poucos setores (3-5)
- Cabe na tela sem scroll horizontal

**Opção B: Abas por Setor**
```
Tabs: [Impressão] [CNC] [Acabamento] [Expedição]
Mostra 1 setor por vez em detalhe
```
- Boa para muitos setores (6+)
- Mais espaço vertical

**Opção C: Filtro + Visão Compacta**
```
Filtro: [Setor: Todos ▼]
Mostra cards agrupados verticalmente
```
- Boa para telas pequenas
- Mobile-friendly

**Decisão Necessária:** Qual layout para o Kanban?

**Recomendação:** Começar com A, adicionar B/C depois.

---

### **Cards no Kanban - Informações**

**O que mostrar em cada card?**

**Essencial:**
- ✅ Nome do produto
- ✅ Número da OS
- ✅ Status (Aguardando, Ativo, Pausado)
- ✅ Tempo no setor

**Adicional:**
- ⚠️ Cliente (ocupa espaço)
- ⚠️ Prazo (se próximo)
- ⚠️ Prioridade (se alta/crítica)
- ⚠️ Operador (se em andamento)

**Decisão Necessária:** Definir o que é mais importante.

**Recomendação:**
```
Card Compacto (Kanban):
  Banner 3x2m - OS #12345
  🟢 Ativo • João • 1h30

Card Expandido (Click):
  Mostra todos detalhes
```

---

## ⚙️ **5. REGRAS DE NEGÓCIO**

### **Pausa de Produtos**

**Cenário 1: Pausa Individual**
```
Operador está imprimindo 5 banners.
1 banner teve problema (bolha na lona).
Operador pausa APENAS este banner.
```

**Cenário 2: Pausa em Lote**
```
Operador está imprimindo 5 banners.
Impressora para (acabou tinta).
Operador pausa TODOS os 5 banners.
Motivo: "Falta tinta ciano"
```

**Implementação:**
```
Tela: Meu Setor > Em Andamento

[Checkbox] Banner 1
[Checkbox] Banner 2  ✓ Selecionado
[Checkbox] Banner 3  ✓ Selecionado
[Checkbox] Banner 4
[Checkbox] Banner 5

[Pausar Selecionados]
↓
Modal: Motivo da pausa
  [Falta material ▼]
  [Problema técnico]
  [Aguardando aprovação]
  [Outro: ___]
```

**Decisão Necessária:** Validar se fluxo está correto.

---

### **Avanço Automático de Etapas**

**Quando operador clica "Concluir":**

```
Sistema:
1. Busca workflow do produto
2. Verifica etapa atual (ex: Impressão = ordem 1)
3. Busca próxima etapa (Acabamento = ordem 2)
4. Atualiza produto:
   ├─ workflow_etapa_ordem = 2
   ├─ workflow_setor_atual = "setor_acabamento"
   ├─ status_producao = "AGUARDANDO"
   └─ operador_atual = null
5. Produto aparece na fila do Acabamento
6. (Opcional) Notifica setor Acabamento
```

**Decisão Necessária:** Notificar próximo setor?

---

### **Última Etapa**

**O que acontece quando conclui a última etapa?**

**Opção A: Status do Produto**
```
Produto.status_producao = "CONCLUIDO"
Produto sai do Kanban (vai para histórico)
```

**Opção B: Status da OS**
```
Sistema verifica:
├─ Se TODOS produtos da OS estão CONCLUIDOS
└─ Então: OS.status = "CONCLUIDA"
```

**Recomendação:** Ambos! 
- Produto vai para CONCLUIDO
- OS só muda status quando TODOS produtos concluídos

---

## 🔢 **6. DADOS E NUMERAÇÃO**

### **Premissa do Sistema (Existente):**

> OS-AAAA-NNN é o código único de rastreamento (gerado pelo DocumentCodeService).
> PROIBIDO criar campo "TRK-OS".

**Aplicação no PCP:**

```
✅ USAR: os.numero (gerado pelo DocumentCodeService)
❌ NÃO criar: setor.codigo_rastreamento
❌ NÃO criar: workflow.numero_controle

Rastreamento:
  OS #OS-2025-001
  └─ Produto: Banner (item_id: xxx)
     └─ Setor atual: Impressão
        └─ Histórico completo via logs
```

**Decisão:** Confirmar que não precisa de numeração adicional.

---

## 📱 **7. INTEGRAÇÕES**

### **Com Módulos Existentes**

**Estoque:**
- Ao iniciar produção, pode reservar material?
- Ao concluir, dar baixa automática?

**Notificações:**
- Notificar quando produto chega no setor?
- Notificar quando produto está parado há muito tempo?

**Validações:**
- Validar material disponível antes de liberar?
- Bloquear início se falta material?

**Decisão Necessária:** Quais integrações implementar na Fase 1?

**Recomendação:** Deixar integrações para depois. Foco em fluxo básico primeiro.

---

## 🎨 **8. DESIGN E UX**

### **Cores dos Setores**

Sugestão de paleta:
```
🔵 Azul    - Impressão Digital
🟣 Roxo    - CNC/Laser
🟢 Verde   - Acabamento
🟠 Laranja - Expedição
🔴 Vermelho - Urgente/Crítico (prioridade)
🟡 Amarelo - Pausa/Atenção
```

**Decisão:** Confirmar paleta ou deixar configurável?

---

### **Ícones dos Setores**

Sugestão (Tabler Icons):
```
printer     - Impressão
tool        - CNC/Usinagem
scissors    - Acabamento/Corte
package     - Expedição
paint       - Pintura
droplet     - Envelopamento
building    - Montagem/Instalação
```

**Decisão:** Confirmar ou adicionar outros?

---

## 📅 **9. CRONOGRAMA**

### **Início da Implementação**

**Quando começar?**
- Imediato (após validar decisões)
- Após revisar plano com equipe
- Após priorizar outras tarefas

**Dedicação:**
- Full-time (9 dias corridos)
- Part-time (3-4 semanas)
- Sprints semanais (2-3 meses)

**Decisão Necessária:** Prioridade e alocação de tempo.

---

## ✅ **CHECKLIST PARA COMEÇAR**

Antes de iniciar implementação, validar:

- [ ] Nomenclatura: "Setores Produtivos" está OK?
- [ ] Organização: Workflows em Configurações está OK?
- [ ] Setores agrupam máquinas/funções existentes? OK?
- [ ] Produto vincula workflow direto (sem categoria)? OK?
- [ ] Layout Kanban: Colunas horizontais? OK?
- [ ] Permissões: Tabela de permissões está correta?
- [ ] Notificações: Implementar na Fase 1 ou depois?
- [ ] Cronograma: Quando iniciar?

---

## 📝 **COMO VALIDAR**

### **Reunião de Alinhamento (Sugerido)**

**Participantes:**
- Gestores (validar fluxo operacional)
- Operadores (validar tela do setor)
- Admin (validar configurações)

**Agenda:**
1. Apresentar fluxo completo (15min)
2. Demonstrar mockups das telas (10min)
3. Coletar feedback (15min)
4. Ajustar plano (10min)
5. Aprovar início da implementação

**OU via Documento:**
- Compartilhar este documento
- Aguardar feedback
- Ajustar conforme necessário

---

## 🚀 **APÓS VALIDAÇÃO**

Quando todas decisões forem tomadas:

1. ✅ Atualizar documentos com decisões finais
2. ✅ Criar branch: `feature/pcp-setores-produtivos`
3. ✅ Iniciar Fase 1: Schema Prisma
4. ✅ Desenvolvimento iterativo
5. ✅ Testes com dados reais
6. ✅ Ajustes baseados em uso real

---

**Aguardando suas respostas para finalizar o plano!** 🎯

