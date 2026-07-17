# Módulo de Estoque

## 📋 Descrição do PBI

Permitir o controle preciso, seguro e auditável de todo fluxo de materiais, insumos e produtos acabados, com integração total às operações de OS e Compras.

---

## 🔧 Campos e Componentes

| Campo | Tipo de Componente | Obrigatório | Validação | Descrição |
|-------|-------------------|-------------|-----------|-----------|
| **Código do insumo/produto** | Input text/Numérico | ✅ Sim | Único, não vazio | Identificação do item/insumo |
| **Nome do insumo/produto** | Input text | ✅ Sim | Mín. 3 caracteres | Nome completo |
| **Categoria** | Dropdown | ✅ Sim | Existente | Ex: lona, madeira, cordão |
| **Fornecedor** | Dropdown/Autocomplete | ❌ Não | Cadastro prévio (opcional) | Relacionamento externo |
| **Unidade de medida** | Dropdown | ✅ Sim | Existente/consistente | Ex: m², unidade, litro, metro |
| **Quantidade em estoque** | Numérico | ✅ Sim | ≥ 0 | Valor real e atual |
| **Estoque mínimo** | Numérico | ❌ Não | ≥ 0 | Para alertas de reposição |
| **Lote/Validade** | Text/Date | ❌ Não | Consistente | Controle de lotes e vencimentos |
| **Observações** | Textarea | ❌ Não | Máx. 255 caracteres | Informações adicionais |
| **Histórico de movimentação** | Tabela/Listagem | 🔄 Auto | — | Entradas/saídas, usuário, OS vinculada, data |

---

## ✅ Critérios de Aceite

### 📝 Funcionalidades Básicas
- ✅ Cadastro, edição, exclusão e consulta dos itens de estoque
- ✅ Validação de duplicidade de código/nome
- ✅ Não permitir estoque negativo

### 📊 Controle e Rastreabilidade
- ✅ Histórico detalhado de entradas e saídas
- ✅ Link para OS ou compras associadas
- ✅ Logs de auditoria (quem, quando, o que)

### 🚨 Alertas e Automação
- ✅ Alertas automáticos para itens abaixo do mínimo
- ✅ Permissão para entrada manual, ajuste ou regularização via API
- ✅ Integração automática com módulos de OS e Compras

### 🔒 Segurança e Auditoria
- ✅ Controle de acesso por perfil de usuário
- ✅ Log completo de todas as movimentações
- ✅ Rastreabilidade total das operações

---

## 🎯 Objetivos

- **Controle Preciso:** Gestão detalhada de todos os materiais e insumos
- **Integração Total:** Conexão automática com OS e Compras
- **Prevenção:** Alertas proativos para reposição de estoque
- **Auditoria:** Rastreabilidade completa para compliance e gestão

---

## 🔗 Integrações

### 📦 Módulo de OS
- Reserva automática de materiais ao iniciar produção
- Baixa automática no estoque ao concluir etapas

### 🛒 Módulo de Compras
- Sugestões automáticas de compra baseadas em estoque mínimo
- Entrada automática no estoque ao receber pedidos

### 📊 Relatórios
- Relatórios de movimentação por período
- Análise de giro de estoque
- Projeções de necessidades futuras