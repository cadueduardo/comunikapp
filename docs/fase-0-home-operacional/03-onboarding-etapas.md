# 03 — Etapas Oficiais do Onboarding Operacional

**Status do documento:** proposto

## Princípios

- Onboarding é **por loja**, não por usuário (decisão da Fase 0).
- O `step_id` é **estável**. Nunca renomear; se necessário, depreciar e criar novo.
- O estado de cada etapa é detectado automaticamente por consulta ao banco. O usuário só interage para `ignorar` ou `reativar`.
- O checklist tem ordem sugerida, mas não bloqueia o uso do sistema.
- Etapas podem ser **opcionais**. Etapas opcionais não entram no cálculo de progresso quando ignoradas.

## Catálogo de etapas (versão 1)

| ordem | step_id | titulo | obrigatoria | critério de conclusão | rota da ação |
| --- | --- | --- | --- | --- | --- |
| 1 | `dados_empresa` | Confirmar dados da empresa | sim | `loja.nome`, `loja.cnpj` ou `loja.cpf`, `loja.telefone` preenchidos | `/configuracoes/loja` |
| 2 | `primeiro_cliente` | Cadastrar primeiro cliente | sim | existe ≥ 1 `cliente` ativo na loja | `/clientes/novo` |
| 3 | `primeiro_material` | Cadastrar materiais principais | sim | existe ≥ 1 `Insumo` ativo na loja | `/insumos/novo` |
| 4 | `primeira_maquina` | Cadastrar máquinas ou processos | sim | existe ≥ 1 `maquina` ativa OR ≥ 1 `servico_manual` ativo | `/centros-de-trabalho/maquinas/novo` |
| 5 | `margem_imposto` | Configurar margem, impostos e comissão | sim | `loja.margem_lucro_padrao` e `loja.impostos_padrao` preenchidos | `/configuracoes/loja` |
| 6 | `condicao_pagamento` | Configurar condição de pagamento padrão | opcional | campo a ser criado: `loja.condicao_pagamento_padrao` preenchido | `/configuracoes/loja` |
| 7 | `primeiro_orcamento` | Criar primeiro orçamento | sim | existe ≥ 1 `orcamento` na loja | `/orcamentos-v2/novo` |
| 8 | `primeira_aprovacao` | Aprovar orçamento e gerar OS | sim | existe ≥ 1 `orcamento` com `status = aprovado` OR ≥ 1 `OrdemServico` criada | `/orcamentos-v2` |
| 9 | `primeira_producao` | Liberar OS para produção | opcional | existe ≥ 1 `OrdemServico` com `status ∈ {PRODUCAO, ACABAMENTO, FINALIZADA}` | `/os` |
| 10 | `primeiro_recebimento` | Registrar primeiro recebimento | opcional | existe ≥ 1 cobrança com `status ∈ {PARCIAL_PAGO, LIQUIDADO}` | `/financeiro/recebimentos` |

## Cálculo de progresso

```text
progresso_pct = round(100 * concluidas_obrigatorias / total_obrigatorias)
```

- `ignorado` em etapa **obrigatória** conta como pendente para fins de progresso, mas não aparece como alerta.
- `ignorado` em etapa **opcional** não conta no denominador.

## Detecção automática (regras de query)

| step_id | regra |
| --- | --- |
| `dados_empresa` | `loja.nome IS NOT NULL AND loja.telefone IS NOT NULL AND (loja.cnpj IS NOT NULL OR loja.cpf IS NOT NULL)` |
| `primeiro_cliente` | `SELECT 1 FROM cliente WHERE loja_id = ? AND status_cliente = 'ATIVO' LIMIT 1` |
| `primeiro_material` | `SELECT 1 FROM insumos WHERE loja_id = ? AND ativo = true LIMIT 1` |
| `primeira_maquina` | `(SELECT 1 FROM maquina WHERE loja_id = ? AND ativo = true) OR (SELECT 1 FROM servico_manual WHERE loja_id = ? AND ativo = true)` |
| `margem_imposto` | `loja.margem_lucro_padrao IS NOT NULL AND loja.impostos_padrao IS NOT NULL` |
| `condicao_pagamento` | `loja.condicao_pagamento_padrao IS NOT NULL` (campo novo, ver `08-configuracao-recomendada-defaults.md`) |
| `primeiro_orcamento` | `SELECT 1 FROM orcamento WHERE loja_id = ? LIMIT 1` |
| `primeira_aprovacao` | `SELECT 1 FROM orcamento WHERE loja_id = ? AND status = 'aprovado' LIMIT 1` |
| `primeira_producao` | `SELECT 1 FROM ordens_servico WHERE loja_id = ? AND status IN ('PRODUCAO','ACABAMENTO','FINALIZADA') LIMIT 1` |
| `primeiro_recebimento` | depende do módulo financeiro (Fase 6); até lá, sempre `pendente`. |

## Persistência

Tabela `onboarding_operacional`:

```text
id              cuid PK
loja_id         FK loja
step_id         VARCHAR(64)
status          ENUM('pendente','concluido','ignorado','atencao')
concluido_em    DATETIME NULL
ignorado_em     DATETIME NULL
atualizado_em   DATETIME
criado_em       DATETIME

UNIQUE(loja_id, step_id)
INDEX(loja_id)
```

- Quando a detecção automática retorna `true`, o serviço atualiza `status = 'concluido'` e preenche `concluido_em` (se ainda vazio).
- Quando o usuário escolhe `ignorar`, o serviço grava `status = 'ignorado'` com `ignorado_em`.
- Reativar uma etapa significa voltar a depender da detecção automática (limpa `ignorado_em`).

## Microcopy padrão

Texto curto, acionável, em pt-BR. Exemplos:

```text
dados_empresa
Título: Confirmar dados da empresa
Descrição: Preencha nome, documento e contato. Esses dados aparecem nos seus orçamentos.

primeiro_material
Título: Cadastrar materiais principais
Descrição: Sem material cadastrado, o orçamento não consegue calcular custo nem consumo.

margem_imposto
Título: Definir margem e impostos
Descrição: Sem isso, todo orçamento parte do zero. Você pode usar nossa configuração recomendada.
```

## Pontos de confirmação

1. A etapa `condicao_pagamento` exige campo novo na tabela `loja`. Confirmar que isso será criado já na Fase 1.
2. A etapa `primeiro_recebimento` depende da Fase 6. Aceitar que ela apareça como `pendente` até lá?
3. A ordem das etapas reflete o fluxo recomendado, mas o usuário pode pular qualquer uma. Confirmar?
