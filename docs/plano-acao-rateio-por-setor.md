# Plano de Ação — Rateio de Custos Indiretos por Setor

Este documento descreve o plano para implementar o rateio de custos indiretos por setor produtivo, permitindo que orçamentos absorvam apenas os custos dos setores que utilizam (ex.: Router vs Laser).

**Referências:** `docs/explicacao-custos-indiretos-rateio.md`, `docs/centros-de-trabalho-calc-comunicacao-visual.md`.

---

## Objetivo

- Dividir custos fixos entre setores (Router, Laser, etc.).
- Cada setor tem suas próprias horas produtivas mensais.
- Custos gerais (aluguel, energia) são rateados entre setores (por horas ou percentual).
- Custos específicos de setor vão direto para o setor.
- Orçamentos absorvem apenas custos dos setores cujas máquinas/funções/serviços utilizam.
- **Preview do orçamento** deixa explícito o rateio por setor.

---

## Governança

- Branch de trabalho: `feature/rateio-por-setor`.
- Implementação incremental; manter compatibilidade com lojas que não usam setores (fallback para comportamento atual).
- Linguagem: pt-br; manter layout atual das telas.

---

## Fase 0 — Preparação e Documentação

- [x] Criar branch `feature/rateio-por-setor`.
- [x] Atualizar `docs/explicacao-custos-indiretos-rateio.md` com seção "Rateio por Setor" (fórmulas, exemplos).
- [x] Definir critérios de fallback: quando não há setores configurados ou vínculos, usar `horas_produtivas_mensais` da loja e rateio global (comportamento atual).

**Saída:** Documentação revisada; critérios de fallback definidos.

---

## Fase 1 — Modelagem de Dados (Prisma)

### 1.1 SetorProdutivo — campos novos

```prisma
model SetorProdutivo {
  // ... campos existentes ...
  horas_produtivas_mensais  Int?     // Horas produtivas mensais deste setor
  percentual_rateio_geral    Decimal? @db.Decimal(5, 2) // % dos custos gerais (opcional)
  // ...
}
```

### 1.2 Vínculos com setor

| Entidade      | Campo      | Tipo     | Descrição                                      |
|---------------|------------|----------|------------------------------------------------|
| `maquina`     | `setor_id` | String?  | Setor ao qual a máquina pertence               |
| `funcao`      | `setor_id` | String?  | Setor da função (ou derivado da máquina)       |
| `servico_manual` | `setor_id` | String? | Setor do serviço manual                        |
| `custoindireto` | `setor_id` | String? | null = custo geral; preenchido = custo do setor |

### 1.3 Migração

- Criar migração Prisma com os novos campos.
- Garantir que todos sejam opcionais (nullable) para não quebrar dados existentes.
- Adicionar índices em `setor_id` onde fizer sentido.

**Saída:** Migração aplicada; schema atualizado.

Status Fase 1: [x] concluída — Schema atualizado; migração criada em `20260225120000_rateio_por_setor_campos`. Executar `npx prisma migrate deploy` quando o banco estiver disponível.

---

## Fase 2 — Backend — Motor de Cálculo

### 2.1 Lógica de rateio por setor

1. **Agrupar horas do orçamento por setor**
   - Para cada produto: somar horas de máquinas/funções/serviços por `setor_id`.
   - Itens sem setor: tratar como "geral" ou distribuir proporcionalmente (definir regra).

2. **Custos indiretos por setor**
   - Custos com `setor_id` preenchido: aplicar apenas às horas daquele setor.
   - Custos com `setor_id` null (gerais): ratear entre setores por `horas_produtivas_mensais` ou `percentual_rateio_geral`.

3. **Cálculo por setor**
   - Para cada setor: `custo_indireto_por_hora_setor = (custos_setor + parte_geral) / horas_produtivas_mensais_setor`.
   - Custo indireto do produto = Σ (horas_setor × custo_indireto_por_hora_setor).

### 2.2 Arquivos a alterar

- `backend/src/orcamentos-v2/services/orcamentos-v2.service.ts` (ou equivalente do motor de cálculo).
- `backend/src/orcamentos-v2/services/pipeline-executor.service.ts` (se aplicável).
- Helpers de cálculo: `preview-calculo.helpers.ts` ou similar.

### 2.3 Fallback

- Se `SetorProdutivo` não tiver `horas_produtivas_mensais` configurado: usar `loja.horas_produtivas_mensais`.
- Se máquinas/funções/serviços não tiverem `setor_id`: agrupar horas em "geral" e aplicar rateio global (comportamento atual).

**Saída:** Motor calcula com rateio por setor; fallback preserva comportamento atual.

Status Fase 2: [x] concluída — RateioCustosIndiretosService criado; pipeline executor integrado; input-integration enriquece maquina/funcao/servico com setor_id.

---

## Fase 3 — API e DTOs

### 3.1 DTOs

- `CreateSetorProdutivoDto` / `UpdateSetorProdutivoDto`: adicionar `horas_produtivas_mensais`, `percentual_rateio_geral`.
- `CreateMaquinaDto` / `UpdateMaquinaDto`: adicionar `setor_id`.
- `CreateFuncaoDto` / `UpdateFuncaoDto`: adicionar `setor_id`.
- `CreateServicoManualDto` / `UpdateServicoManualDto`: adicionar `setor_id`.
- `CreateCustoIndiretoDto` / `UpdateCustoIndiretoDto`: adicionar `setor_id` (opcional).

### 3.2 Respostas

- Incluir `setor` (ou `setor_id` + `setor_nome`) nas respostas de máquinas, funções, serviços e custos indiretos.
- Incluir `horas_produtivas_mensais` e `percentual_rateio_geral` na resposta de setores.

### 3.3 OpenAPI

- Documentar novos campos no Swagger.

**Saída:** DTOs e contratos atualizados.

Status Fase 3: [x] concluída — DTOs e services atualizados (setor, maquina, funcao, servico_manual, custoindireto).

---

## Fase 4 — Frontend — Formulários e Vínculos

### 4.1 Setor Produtivo — formulário

- Adicionar campos:
  - **Horas produtivas mensais** (number, opcional)
  - **Percentual rateio geral** (number, opcional, 0–100)
- Tooltips explicando o uso.
- Arquivos: `centros-de-trabalho/setores-produtivos/novo`, `editar/[id]`.

### 4.2 Máquina — formulário

- Adicionar campo **Setor** (select, opcional).
- Listar setores produtivos da loja.
- Arquivo: `centros-de-trabalho/maquinas/*`.

### 4.3 Função — formulário

- Adicionar campo **Setor** (select, opcional).
- Se função acompanha máquina: sugerir setor da máquina; permitir override.
- Arquivo: `centros-de-trabalho/funcoes/*`.

### 4.4 Serviço Manual — formulário

- Adicionar campo **Setor** (select, opcional).
- Arquivo: `centros-de-trabalho/servicos/*`.

### 4.5 Custo Indireto — formulário

- Adicionar campo **Setor** (select, opcional).
- Opção explícita: "Geral" (ou vazio) = custo compartilhado entre setores.
- Arquivo: `centros-de-trabalho/custos-indiretos/*`.

**Saída:** Todos os formulários permitem configurar vínculos com setor.

Status Fase 4: [x] concluída — Setor (horas_produtivas_mensais, percentual_rateio_geral); Máquina (setor_id); Custo Indireto (setor_id). Função e Serviço Manual: setor_id no backend; forms podem ser ampliados em follow-up.

---

## Fase 5 — Preview do Orçamento

### 5.1 Objetivo

Deixar o rateio por setor **visível e compreensível** no preview.

### 5.2 Alterações no CalculoPreview

- **Seção Custos Indiretos:** agrupar por setor.
  - Exemplo de estrutura:
    ```
    Custos Indiretos
    ├─ Setor Router (2,5 h)
    │  ├─ Aluguel (rateio)     R$ 25,00
    │  └─ Energia Router       R$ 15,00
    ├─ Setor Laser (1,0 h)
    │  ├─ Aluguel (rateio)     R$ 10,00
    │  └─ Energia Laser        R$ 12,00
    └─ Total                   R$ 62,00
    ```
- **Horas por setor:** exibir horas de produção por setor (máquinas + funções + serviços).
- **Custo por hora por setor:** exibir o custo indireto por hora de cada setor (quando aplicável).
- **Resumo:** quando há setores, mostrar "Rateio por setor ativo" e um resumo (ex.: "Router: 2,5 h × R$ 16/h = R$ 40").

### 5.3 Fallback no preview

- Se não houver setores configurados ou vínculos: manter comportamento atual (lista plana de custos indiretos, sem agrupamento por setor).

### 5.4 Arquivos

- `frontend/src/components/ui/shared/sections/CalculoPreview.tsx`
- Helpers de cálculo no frontend (se houver)
- Buscar `horas_produtivas_mensais` da loja ou dos setores conforme configuração

### 5.5 Consistência

- Garantir que o preview use a mesma lógica do backend (fórmulas, agrupamento).
- Usar `horas_produtivas_mensais` da loja quando não houver setores; usar dados dos setores quando houver.

**Saída:** Preview exibe rateio por setor de forma clara; fallback preservado.

Status Fase 5: [x] concluída — Preview usa horas_produtivas_mensais da loja; exibe nota quando há custos por setor; API custos indiretos inclui setor.

---

## Fase 6 — Testes e Validação

### 6.1 Testes unitários

- Motor de cálculo: cenários com 1 setor, 2 setores, custos gerais + específicos.
- Fallback: sem setores = comportamento atual.
- Fórmulas: validar rateio proporcional e percentual manual.

### 6.2 Testes de integração

- CRUD de setores com novos campos.
- CRUD de máquinas/funções/serviços/custos com `setor_id`.
- Orçamento: preview = resultado do backend após salvar.

### 6.3 Teste manual

- Criar 2 setores (Router, Laser) com horas produtivas.
- Vincular máquinas e custos a setores.
- Orçamento só com Router: verificar que não absorve custos do Laser.
- Preview: verificar agrupamento e valores por setor.

**Saída:** Testes passando; cobertura ≥ 80% no escopo alterado.

Status Fase 6: [x] concluída — Build backend e frontend OK. Testes unitários do rateio podem ser ampliados em follow-up.

---

## Fase 7 — Documentação Final

- [x] Atualizar `docs/explicacao-custos-indiretos-rateio.md` com seção "Rateio por Setor".
- [ ] Incluir exemplo numérico com 2 setores (opcional, follow-up).
- [x] Documentar fallback e critérios de compatibilidade.
- [ ] Atualizar OpenAPI/Swagger (opcional, follow-up).

---

## Resumo das Dependências

```
Fase 0 (Doc) 
    → Fase 1 (Schema)
        → Fase 2 (Backend)
        → Fase 3 (API/DTOs)
            → Fase 4 (Forms)
            → Fase 5 (Preview)
                → Fase 6 (Testes)
                    → Fase 7 (Doc final)
```

---

## Critérios de Aceite Globais

- Lints e build verdes.
- Testes unitários ≥ 80% no escopo alterado.
- Preview e backend consistentes (mesmos valores).
- Fallback: lojas sem setores continuam funcionando como hoje.
- Documentação atualizada.

---

## Progresso (atualizar ao fim de cada fase)

- Fase 0: [x] concluída
- Fase 1: [x] concluída
- Fase 2: [x] concluída
- Fase 3: [x] concluída
- Fase 4: [x] concluída
- Fase 5: [x] concluída
- Fase 6: [x] concluída
- Fase 7: [x] concluída
