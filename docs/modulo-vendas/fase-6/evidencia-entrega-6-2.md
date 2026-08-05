# Evidência — Entrega 6.2

**Escopo:** writer comercial único, aceite, handoff e proteção DV-02

**Produção / Gate 0S:** não tocados

**Status da Fase 6:** em execução

## Provas de implementação

1. A busca `rg "status_comercial" backend/src -g "*.ts" -g "!*.spec.ts"`
   encontra escrita de destino somente em
   `services/transicao-comercial.service.ts`; as demais ocorrências são leitura,
   filtro, projeção ou mapeamento de contrato.
2. O writer condiciona a mutação a `id`, `loja_id` e estado de origem, deriva os
   dois campos legados e grava `OrcamentoLog` e `HistoricoOrcamento` na mesma
   transação.
3. O repositório `repositories/orcamentos-v2.repository.ts` não possuía nenhum
   consumidor e foi removido porque continha um segundo caminho de escrita sem
   o contrato da DV-14.
4. Ações públicas fora de `enviada`/`em_negociacao` retornam erro público estável,
   sem revelar o estado interno.
5. O aceite só casa com versão enviada e não expirada. A criação da OS e a
   promoção a `pedido_confirmado` foram separadas: somente falha anterior à OS
   pode compensar e reativar o código.
6. Edição de `pedido_confirmado` é bloqueada antes de mutação; edição material
   de `aceita` exige `vendas.proposta.marcar_perdida` antes de gravar.

## Validações executadas

| Validação | Resultado |
|---|---:|
| Máquina DV-14 + writer central | 36 testes passando |
| Aceite público/interno + versão DV-02/DV-15 | 36 testes passando |
| `nest build` | aprovado |
| Varredura de writers | somente o serviço canônico escreve |

Casos cobertos: transição válida/inválida, CAS perdido, auditoria atômica,
isolamento por loja, compensação, reconciliação condicionada à OS do tenant,
duplo aceite, expiração, estado público incompatível, falha antes/depois da OS,
imutabilidade do pedido e permissão prévia para invalidar aceite.

## Itens que permanecem abertos

- job indexado de expiração em lote;
- tela de pipeline e negociação;
- diff e navegação visual entre versões;
- chat, não lidas e anexos privados;
- provas MySQL 8 e E2E da Fase 6.

**FASE 6 não concluída.**
