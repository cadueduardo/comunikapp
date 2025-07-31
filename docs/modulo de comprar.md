# Módulo de Compras

## 📋 Descrição do PBI

Gerenciar todo o processo de requisição, aprovação, emissão e acompanhamento de pedidos de compra de insumos e materiais, com sugestão automática baseada em estoque/OS.

---

## 🔧 Campos e Componentes

| Campo | Tipo de Componente | Obrigatório | Validação | Descrição |
|-------|-------------------|-------------|-----------|-----------|
| **Número da requisição/compra** | Autonumeração | ✅ Sim | Único | Controle sequencial |
| **Produto/Insumo** | Dropdown/Search | ✅ Sim | Existente | Vínculo ao estoque/cadastro |
| **Quantidade solicitada** | Numérico | ✅ Sim | > 0 | Apenas inteiros ou casas decimais permitidas |
| **Unidade** | Dropdown | ✅ Sim | Compatível | Unidades cadastradas |
| **Fornecedor** | Dropdown/Autocomplete | ✅ Sim | Cadastro prévio obrigatório | Seleção ou sugestão |
| **Status do pedido** | Dropdown | ✅ Sim | Solicitação, Aprovado, Pendente, Cancelado, Recebido | Fluxo controlado |
| **Data prevista para entrega** | Date picker | ❌ Não | — | Controle de prazo |
| **Valor unitário/orçado** | Numérico (R$) | ❌ Não | ≥ 0 | Campo opcional até receber orçamento |
| **Observações** | Textarea | ❌ Não | Máx. 255 caracteres | Detalhes adicionais |
| **Histórico de alterações** | Listagem automática | ✅ Sim | — | Log do processo |

---

## ✅ Critérios de Aceite

### 📝 Geração de Requisições
- ✅ Geração manual ou automática de requisições baseadas em falta de estoque ou OS
- ✅ Sugestões inteligentes baseadas em histórico de consumo
- ✅ Integração direta com cadastro de fornecedores e produtos

### 🔐 Controle de Aprovação
- ✅ Aprovação e edição por níveis de permissão (compras, gestor, financeiro)
- ✅ Fluxo de aprovação configurável por valor/tipo de produto
- ✅ Logs detalhados e atualização do status do fluxo

### 📊 Acompanhamento e Controle
- ✅ Status detalhado: solicitado, aprovado, enviado, recebido
- ✅ Controle de prazos e datas de entrega
- ✅ Histórico completo de alterações e aprovações

### 🔗 Integrações Automáticas
- ✅ **Integração com Estoque:** Ao status "recebido", entrada automática dos itens
- ✅ **Notificações:** Alertas automáticos para pendências, atrasos e conclusão
- ✅ **OS:** Sugestões de compra baseadas em necessidades de produção

---

## 🎯 Objetivos

- **Automação:** Sugestões inteligentes baseadas em estoque mínimo e OS
- **Controle:** Fluxo de aprovação estruturado e auditável
- **Eficiência:** Redução de rupturas e otimização de compras
- **Transparência:** Rastreabilidade completa do processo de aquisição

---

## 🔄 Fluxo de Processo

### 1. **Solicitação**
- Criação manual ou automática
- Validação de necessidade
- Seleção de fornecedor

### 2. **Aprovação**
- Análise por níveis hierárquicos
- Validação de valores e prazos
- Autorização final

### 3. **Pedido**
- Envio para fornecedor
- Acompanhamento de prazo
- Controle de status

### 4. **Recebimento**
- Conferência de itens
- Entrada automática no estoque
- Fechamento do processo

---

## 🚨 Alertas e Notificações

- **📧 Pendências:** Notificação de itens aguardando aprovação
- **⏰ Atrasos:** Alertas de pedidos com prazo vencido
- **✅ Conclusão:** Confirmação de recebimento e entrada no estoque
- **🔔 Urgentes:** Priorização de itens críticos para produção