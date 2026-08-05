# Fase 6 — Pipeline, proposta, versão e negociação

**Status:** Em execução  
**Início:** `fb8dbcce`  
**Produção / Gate 0S:** não tocados

## Entrega 6.1 — máquina comercial

- fonte única das 23 transições em
  `backend/src/orcamentos-v2/domain/status-comercial.ts`;
- resolução estrita de aliases legados, sem degradar valor desconhecido para
  `rascunho`;
- `PUT /orcamentos-v2/:id/status` com DTO e `class-validator`;
- autorização específica por destino no service;
- motivo obrigatório para proposta perdida;
- aceite e pedido confirmado exclusivos do fluxo próprio;
- expiração e entrada em negociação exclusivas dos casos de uso próprios;
- envio exige versão congelada;
- transição protegida por CAS em `id + loja_id + status_comercial`;
- auditoria e `HistoricoOrcamento` gravados na mesma transação;
- compatibilidade mantida em `status` e `status_aprovacao`.

## Decisão de consistência documental

O diagrama da Fase 0 continha `aguardando_alcada → cancelada`, mas a tabela
numerada aprovada declarava 23 transições e não continha essa passagem. A
implementação segue a tabela normativa de 23 transições; o diagrama foi alinhado.

## Ainda aberto

- centralizar também aceite, negociação, expiração e handoff no mesmo caso de uso;
- congelamento e diff de versões;
- expiração em lote;
- superfície de pipeline/negociação;
- chat, não lidas e anexos privados;
- provas MySQL, E2E e regressão integral.

**FASE 6 não concluída.**
