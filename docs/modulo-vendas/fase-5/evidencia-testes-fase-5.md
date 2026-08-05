# Evidência de testes — Fase 5 (continuidade pós-`7ace2dc6`)

**SHA inicial desta rodada:** `7ace2dc6`
**Status do gate:** Em validação — Fase 5 não concluída

## MySQL 8 scratch (obrigatório do gate) — executado

Ver `evidencia-mysql-m5.md` (detalhe completo).

Resumo:

| Prova | Resultado |
|---|---|
| Aplicar M5.5 `20260805120800` | OK — coluna/índice/FK `SET NULL` |
| Drift schema×banco pós-M5.5 | OK — empty migration |
| Integração create+releitura `contato_id` | OK |
| Nega contato outro cliente / outra loja | OK |
| Aceita contato nulo | OK |
| SET NULL ao deletar contato | OK |
| Seed 2× idempotente | OK (`idempotente: true`) |
| Sem concessões indevidas (Financeiro) | OK |

## Backend unitário / mocks (já existentes)

Mantidos como regressão; **não** fecham o gate sozinhos.

## Frontend

Scripts estáticos (`test:vendas-nav`, `test:vendas-atendimento`) **não** foram
usados nesta rodada como prova E2E (code review).

### Jornada no navegador — validação manual reproduzível

**Estado nesta sessão:** frontend `:3000` e backend `:4000` estavam **fora do ar**.
Não houve automação Playwright/Cypress nem sessão autenticada no scratch.

Checklist manual (executar com app local apontando ao ambiente de teste autorizado,
nunca produção):

1. Persona **vendedor com `ATIVIDADE_GERENCIAR` e sem `CLIENTE_CRIAR`**
   - Abrir `/vendas/atendimento`
   - Confirmar modo "Cliente existente" disponível
   - Confirmar botão "Criar prospect" **desabilitado** / bloqueado
   - Buscar cliente da carteira (≥2 chars): loading → resultados ou vazio
   - Selecionar cliente + contato opcional → registrar com "Abrir orçamento"
   - Confirmar URL `/orcamentos-v2/novo?clienteId=…&contatoId=…`
   - Confirmar formulário herda cliente/contato; ao salvar, `contato_id` no banco

2. Persona **sem `ATIVIDADE_GERENCIAR`**
   - Abrir `/vendas/atendimento` → estado "Sem acesso ao atendimento"

3. Persona **com `CLIENTE_CRIAR`**
   - Alternar para prospect, preencher e registrar

4. Estados de UI
   - Loading na busca
   - Erro de rede/API (toast)
   - Ausência de resultados (lista vazia sem seleção)

Registrar prints/data/horário na reexecução e só então fechar o gate.

## Gate

**FASE 5 permanece Em validação** até a jornada manual acima ser executada e
anexada. MySQL M5.5 + seed 2× desta rodada estão comprovados.
