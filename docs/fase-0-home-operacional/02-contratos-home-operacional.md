# 02 — Contratos JSON dos Endpoints da Home

**Status do documento:** proposto

## Convenções gerais

- Base path no backend: `/home-operacional` (módulo NestJS `home-operacional`).
- Todos os endpoints exigem JWT válido. O `loja_id` é extraído do token; **nunca aceitar `loja_id` no body ou query**.
- Datas em ISO 8601 (`2026-05-24T13:00:00.000Z`).
- Valores monetários em `number` com até 2 casas decimais (R$).
- Percentuais em `number` (ex.: `45.0` para 45%).
- Toda resposta segue o envelope:

```json
{
  "data": { ... },
  "meta": { "geradoEm": "2026-05-24T13:00:00.000Z", "cacheHit": false }
}
```

- Erros seguem o padrão padrão do NestJS (`statusCode`, `message`, `error`).

## 1. `GET /home-operacional/resumo`

Retorna o pacote consolidado da Home em uma única chamada (otimizado para o primeiro carregamento).

### Query

| campo | tipo | obrigatório | descrição |
| --- | --- | --- | --- |
| `refresh` | boolean | não | força bypass do cache |

### Response

```json
{
  "data": {
    "banner": { "mensagens": [ /* ver endpoint banner-estado */ ] },
    "onboarding": { /* ver endpoint onboarding */ },
    "fluxo": { /* ver endpoint fluxo */ },
    "alertas": { /* ver endpoint alertas */ },
    "resumo_financeiro": {
      "habilitado": true,
      "total_orcado_mes": 12450.0,
      "total_aprovado_mes": 9300.0,
      "valor_em_producao": 5400.0,
      "valor_pronto_para_receber": 1800.0,
      "valor_recebido_mes": 7500.0
    }
  },
  "meta": { "geradoEm": "...", "cacheHit": true }
}
```

- Se o perfil do usuário não tiver permissão financeira, `resumo_financeiro.habilitado = false` e os números não vêm.

## 2. `GET /home-operacional/onboarding`

### Response

```json
{
  "data": {
    "progresso_pct": 30,
    "etapas": [
      {
        "step_id": "dados_empresa",
        "titulo": "Confirmar dados da empresa",
        "descricao_curta": "Nome, CNPJ, contato e logo.",
        "acao_label": "Abrir configurações",
        "acao_href": "/configuracoes/loja",
        "status": "concluido",
        "concluido_em": "2026-05-20T10:00:00.000Z",
        "ignorado_em": null
      },
      {
        "step_id": "primeiro_cliente",
        "titulo": "Cadastrar primeiro cliente",
        "descricao_curta": "Quem vai comprar do seu negócio.",
        "acao_label": "Cadastrar cliente",
        "acao_href": "/clientes/novo",
        "status": "pendente",
        "concluido_em": null,
        "ignorado_em": null
      }
    ]
  }
}
```

- `status` ∈ `pendente | concluido | ignorado | atencao`.
- A lista completa de `step_id` está em `03-onboarding-etapas.md`.

## 3. `PATCH /home-operacional/onboarding/:stepId`

### Body

```json
{ "acao": "ignorar" }
```

ou

```json
{ "acao": "reativar" }
```

### Response

Mesmo formato do `GET /onboarding`, retornando o estado atualizado.

## 4. `POST /home-operacional/onboarding/aplicar-configuracao-recomendada`

### Body

```json
{
  "confirmar": true,
  "sobrescrever_existentes": false
}
```

### Response

```json
{
  "data": {
    "aplicado": {
      "margem_lucro_padrao": 45.0,
      "impostos_padrao": 6.0,
      "tipo_margem_lucro": "markup",
      "horas_produtivas_mensais": 352,
      "categorias_criadas": ["Acrílico", "ACM", "PVC"],
      "processos_criados": ["Corte", "Acabamento", "Montagem"]
    },
    "ignorado": {
      "motivo": "campos já preenchidos pelo usuário",
      "campos": ["impostos_padrao"]
    },
    "etapas_marcadas_concluidas": ["dados_empresa", "margem_imposto", "processos_basicos"]
  }
}
```

- Se `sobrescrever_existentes = false`, **nunca** altera campos já preenchidos.
- A operação é idempotente.

## 5. `GET /home-operacional/fluxo`

### Response

```json
{
  "data": {
    "colunas": [
      {
        "id": "orcamentos",
        "label": "Orçamentos",
        "total": 5,
        "cards": [
          {
            "id": "orc_123",
            "tipo": "orcamento",
            "titulo": "Orçamento #1024",
            "subtitulo": "João Comunicação Visual",
            "status_label": "Em análise",
            "valor": 2850.0,
            "atualizado_em": "2026-05-23T14:00:00.000Z",
            "acoes": [
              { "id": "abrir", "label": "Abrir", "href": "/orcamentos-v2/orc_123" },
              { "id": "enviar", "label": "Enviar", "endpoint": "POST /orcamentos-v2/orc_123/enviar" }
            ]
          }
        ]
      },
      { "id": "aprovados", "label": "Aprovados", "total": 2, "cards": [ /* ... */ ] },
      { "id": "revisao_tecnica", "label": "Revisão técnica", "total": 1, "cards": [ /* ... */ ] },
      { "id": "producao", "label": "Produção", "total": 3, "cards": [ /* ... */ ] },
      { "id": "prontos", "label": "Prontos", "total": 1, "cards": [ /* ... */ ] },
      { "id": "a_receber", "label": "A receber", "total": 4, "cards": [ /* ... */ ] },
      { "id": "concluidos", "label": "Concluídos", "total": 12, "cards": [ /* ... */ ] }
    ]
  }
}
```

- Cada coluna retorna **no máximo 5 cards mais recentes**; o total geral vem em `total`.
- `tipo` ∈ `orcamento | os | item_os | cobranca`.
- `acoes` é uma lista heterogênea: pode ter `href` (navegação) ou `endpoint` (ação direta).
- O bloco é **somente leitura + atalho**. Não há `dragHandle`.

### Mapeamento de coluna → status

| coluna | fonte | filtro |
| --- | --- | --- |
| `orcamentos` | Orçamentos V2 | `status ∈ {rascunho, em_analise}` |
| `aprovados` | Orçamentos V2 | `status = aprovado` AND `não tem OS` |
| `revisao_tecnica` | OS | `aprovacao_tecnica_status = PENDENTE` |
| `producao` | OS / ItemOS | `status ∈ {PRODUCAO, ACABAMENTO}` |
| `prontos` | OS | `status = FINALIZADA` AND `cobranca.status ∈ {PREVISTA_SALDO, PARCIAL_PAGO}` |
| `a_receber` | Cobrança | `status ∈ {PREVISTA_ENTRADA, PREVISTA_SALDO, PARCIAL_PAGO, VENCIDO}` |
| `concluidos` | OS + Cobrança | `os.status = FINALIZADA` AND `cobranca.status = LIQUIDADO` |

## 6. `GET /home-operacional/alertas`

### Response

```json
{
  "data": {
    "total": 4,
    "por_nivel": { "critico": 1, "atencao": 2, "informativo": 1 },
    "alertas": [
      {
        "id": "estoque_insuficiente_os_88",
        "nivel": "critico",
        "titulo": "Material insuficiente para OS #88",
        "descricao": "Acrílico 4mm: 0,5 m² disponível, 1,8 m² necessário",
        "origem": "estoque",
        "criado_em": "2026-05-24T09:00:00.000Z",
        "acao": { "label": "Ver OS", "href": "/os/os_88" }
      },
      {
        "id": "orcamento_parado_orc_120",
        "nivel": "atencao",
        "titulo": "Orçamento parado há 8 dias",
        "descricao": "Cliente: Maria Visual — não houve resposta",
        "origem": "orcamentos-v2",
        "criado_em": "2026-05-16T14:00:00.000Z",
        "acao": { "label": "Reabrir conversa", "href": "/orcamentos-v2/orc_120" }
      }
    ]
  }
}
```

- `nivel` ∈ `critico | atencao | informativo`. Ordenação por nível obrigatória.
- O front filtra alertas sensíveis conforme permissão do usuário.

## 7. `GET /home-operacional/banner-estado`

### Response

```json
{
  "data": {
    "mensagens": [
      {
        "id": "trial_expirando",
        "nivel": "atencao",
        "titulo": "Seu período de avaliação termina em 5 dias",
        "descricao": "Ative seu plano para continuar usando todos os recursos.",
        "acao": { "label": "Ativar plano", "href": "/configuracoes/assinatura" },
        "dismissable": false
      },
      {
        "id": "configuracao_incompleta",
        "nivel": "informativo",
        "titulo": "Configuração mínima incompleta",
        "descricao": "Cadastre pelo menos 1 material para começar a orçar.",
        "acao": { "label": "Aplicar configuração recomendada", "endpoint": "POST /home-operacional/onboarding/aplicar-configuracao-recomendada" },
        "dismissable": true
      }
    ]
  }
}
```

- Catálogo completo de mensagens em `09-system-state-banner-catalogo.md`.
- Quando `dismissable = true`, o front pode marcar como visto em `localStorage` por usuário (não persiste no servidor).

## Cache

- Endpoint `/home-operacional/resumo` e `/home-operacional/fluxo` têm cache de **60 segundos** por `loja_id`.
- Cache invalidado por evento (ver `01-status-oficiais.md`).
- Forçar refresh com `?refresh=1`.

## Pontos de confirmação

1. Aceitar que o agregador retorne **no máximo 5 cards por coluna** (com `total` real) é suficiente para a primeira versão?
2. Endpoint `/resumo` cobre o caso de uso principal (1 request por carregamento), ou prefere chamadas separadas para cada bloco?
3. Adicionar paginação por coluna na Home (ex.: "ver todos os 17 orçamentos") será via link para o módulo, não dentro da Home?
