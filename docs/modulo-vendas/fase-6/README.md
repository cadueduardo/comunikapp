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

## Entrega 6.2 — writer comercial único

- `TransicaoComercialService` é o único componente que grava
  `status_comercial`, `status` legado e `status_aprovacao`;
- toda transição usa CAS por `id + loja_id + status_comercial` e grava auditoria
  e timeline na mesma transação;
- aceite interno/público, rejeição, negociação, alteração genérica, handoff e
  reconciliação de OS passaram pelo writer canônico;
- o repositório V2 sem consumidores, que mantinha um segundo writer sem as
  garantias da DV-14, foi removido;
- aceite exige versão enviada vigente e proposta não expirada;
- falha ao criar a OS compensa o aceite; depois que a OS existe, falha de
  promoção nunca reativa o token e exige reconciliação;
- pedido confirmado é imutável pela edição de proposta; alteração material em
  proposta aceita exige permissão de perda antes de qualquer mutação;
- o snapshot material agora mescla corretamente atualizações parciais ao estado
  anterior antes do hash DV-02/DV-15.

Evidência reproduzível: `evidencia-entrega-6-2.md`.

## Ainda aberto

- implementar o job de expiração em lote pelo writer canônico;
- congelamento e diff de versões;
- superfície de pipeline/negociação;
- chat, não lidas e anexos privados;
- provas MySQL, E2E e regressão integral.

**FASE 6 não concluída.**

Continuidade multiagente e prompt de handoff:
`HANDOFF-ANTIGRAVITY.md`.
