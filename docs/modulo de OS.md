# Módulo de OS (Ordens de Serviço)

## 📋 Descrição do PBI

Registrar, organizar e acompanhar ordens de serviço, integrando todos os cadastros anteriores, permitindo rastreabilidade total da produção e prazos.

---

## 🔧 Campos e Componentes

| Campo | Tipo de Componente | Obrigatório | Validação | Descrição |
|-------|-------------------|-------------|-----------|-----------|
| **Número da OS** | Autonumeração | ✅ Sim | Único | Controle sequencial de produção |
| **Cliente** | Dropdown/Autocomplete | ✅ Sim | Cadastro prévio | Vínculo obrigatório |
| **Data de abertura** | Date picker | ✅ Sim | Data válida | Registro automático ou manual |
| **Produto/Serviço** | Dropdown/Text | ✅ Sim | Cadastro existente | Banner, lona, etc |
| **Quantidade** | Numérico | ✅ Sim | > 0 | Quantidade a ser produzida |
| **Parâmetros técnicos** | Multicampos | ✅ Sim | Compatíveis | Medidas, cores, tipo de insumo |
| **Insumos/materiais necessários** | Listagem automática | ✅ Sim | Cálculo automático | Integrado a motor de cálculo / estoque |
| **Materiais disponíveis?** | Sim/não automático | ✅ Sim | — | Bloqueia avanço sem insumos |
| **Status da OS** | Dropdown | ✅ Sim | Padrões (Fila, Prod., Acabamento, etc.) | Workflow personalizado |
| **Checklist de etapas** | Tabela/Listagem | ✅ Sim | Conforme workflow | Avanço controlado |
| **Responsável/setor** | Dropdown | ✅ Sim | Cadastro usuário | Operador/setor responsável |
| **Observações/Anexos** | Textarea/Upload | ❌ Não | Máx. 255 chars, arquivos permitidos | Layouts, provas, instruções |
| **Histórico de movimentação** | Listagem automática | ✅ Sim | — | Avanço por etapas, log completo |

---

## ✅ Critérios de Aceite

### 📝 Funcionalidades Básicas
- ✅ Criação e visualização completas da OS, com todos os campos obrigatórios
- ✅ Integração automática com orçamentos aprovados
- ✅ Avanço controlado pelas etapas do workflow

### 🔒 Controles e Validações
- ✅ Checagem de insumos/lotes e permissões
- ✅ Checklist obrigatório por etapa
- ✅ Bloqueia avanço sem materiais disponíveis

### 📊 Rastreabilidade e Auditoria
- ✅ Histórico completo: quem, quando, qual alteração/ação
- ✅ Upload e rastreio de arquivos/anexos técnicos
- ✅ Logs detalhados de movimentação

### 🔗 Integrações
- ✅ Articulação automática com estoque (baixa/reserva dos insumos)
- ✅ Integração com módulo de compras (alertas de falta)
- ✅ Notificações de status para responsável e cliente

---

## 🎯 Objetivos

- **Controle Total:** Rastreabilidade completa do processo produtivo
- **Integração:** Conectar orçamentos aprovados ao fluxo de produção
- **Eficiência:** Automação de baixas de estoque e alertas
- **Transparência:** Histórico detalhado para auditoria e gestão