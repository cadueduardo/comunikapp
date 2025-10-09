# Descrição das Abas do Wireframe — Gestão de Arte e Aprovação (OS) — Comunikapp

Este documento descreve a estrutura e a função de cada aba apresentada no wireframe da **Ordem de Serviço (OS)** dentro do sistema **Comunikapp**, voltado à gestão de empresas de comunicação visual.

---

## 🧾 1. Aba **Resumo**

### Função Geral
A aba **Resumo** é o painel principal da OS, exibindo uma visão consolidada do projeto, status, serviços e estoque. Serve como ponto de partida para análise e acompanhamento da execução.

### Estrutura

**📍 Barra lateral esquerda (Snapshot fixo)**  
- Cliente, Projeto, Prazo, Prioridade.
- Status geral da OS (ex.: "Em análise de materiais e aguardando aprovação").
- Alerta de atenção: *"⚠️ O prazo de entrega não foi definido. Defina uma data para liberar a OS."*

**📄 Miolo (Conteúdo central)**  
- **Serviços nesta OS:** lista interativa de serviços vinculados (ex.: Fachada, Banner, Painel). Cada item aparece como *chip* com miniatura da arte (versão e status visual — verde, âmbar, vermelho).
- **Detalhamento Técnico:** resumo das especificações do serviço selecionado.
- **Status da Arte por Serviço:** bloco com miniaturas e indicadores de aprovação, revisão ou pendência.

**🧰 Lateral direita (Contextual)**  
- **Checklist de Estoque:** resumo rápido dos principais insumos e seu status de disponibilidade.

---

## 🎨 2. Aba **Arte & Aprovação**

### Função Geral
Centraliza todo o processo de criação, envio, feedback e aprovação das artes pelo cliente. É o coração do controle visual do projeto.

### Estrutura

**📍 Barra lateral esquerda (Snapshot fixo)**  
Mesma estrutura do Resumo, garantindo continuidade visual e contexto.

**🎨 Conteúdo central (Gestão de Versões)**  
- Lista de **serviços** no topo (chips com status de aprovação e miniaturas).  
- **Lista de versões**: cada card mostra:
  - Miniatura da arte (preview da versão).
  - Identificação (v1, v2, v3), autor, data e status (enviada, aprovada, interna).
  - Arquivos anexos (.PDF, .JPG, .AI etc.).
  - Ações rápidas: *Enviar p/ aprovação, Comparar versões, Duplicar, Substituir arquivos, Enviar ao PCP.*

**💬 Lateral direita (Contextual)**  
- **Aprovação do Cliente:** botões para copiar o link público, reenviar e-mail ou registrar aprovação manualmente.
- **Comentários:** exibe o histórico de comunicações entre cliente e designer.
- **Botão "Ver arte (link público)"** abre um modal simulando a página externa onde o cliente faz a aprovação.

**🪟 Modal de Prévia Pública**  
- Página estilo A4 simulando a visualização externa.
- Mostra serviços com status, preview das artes e botões para *aprovar* ou *solicitar alteração*.
- Campo de comentários e confirmação de aceite com registro de IP e data.

---

## 🧱 3. Aba **Materiais**

### Função Geral
Gerencia os materiais necessários para execução dos serviços e verifica disponibilidade em estoque.

### Estrutura

**📍 Barra lateral esquerda (Snapshot fixo)**  
Mesma estrutura das demais abas.

**📦 Conteúdo central**  
- Filtros por serviço (chips com identificadores das versões ou nomes dos serviços).
- **Lista de materiais por serviço:** cada linha mostra item, quantidade e status de disponibilidade.
- Exemplo: *"ACM Branco 4mm (2 chapas)" – Disponível*.

**🧰 Lateral direita**  
- Filtros gerais de disponibilidade (*Todos, Em falta, Disponíveis*).
- **Checklist geral de estoque:** resumo da situação total (ex.: "2 itens em falta").
- Botão *Gerar requisição* para solicitar compra ou reposição.

---

## 🤖 4. Aba **Análise Inteligente**

### Função Geral
Executa validações automáticas da OS antes de ser liberada para o PCP (Planejamento e Controle da Produção).

### Estrutura

**📍 Barra lateral esquerda (Snapshot fixo)**  
Inclui o mesmo alerta sobre prazo de entrega, reforçando a necessidade de definição antes do envio ao PCP.

**🧠 Conteúdo central**  
- Itens de verificação:
  - Validação de Arte (todos os serviços).
  - Validação de Estoque.
  - Validação de Dados Técnicos.
- Alerta com as **regras para liberação ao PCP:**
  1. Todas as artes devem estar aprovadas.
  2. O prazo de entrega deve estar definido.
- Botão *"Liberar para PCP"* (inativo até as condições serem atendidas).

**📜 Lateral direita**  
- Histórico de logs automáticos (envio, criação de versões, alterações de status etc.).

---

## ✅ Considerações Gerais

- A **barra lateral esquerda** (Snapshot da OS) permanece fixa em todas as abas, garantindo contexto e consistência.
- O **alerta de prazo** impede a liberação da OS até que seja definido, evitando erros de fluxo.
- O sistema permite integração com módulo de PCP, estoque e gestão de arte em nuvem.
- Todos os status visuais seguem o padrão:
  - 🟢 Verde = Aprovado
  - 🟠 Âmbar = Pendente
  - 🔴 Vermelho = Revisão solicitada

