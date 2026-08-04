# mensagens-negociacao — DESCONTINUADO (Fase 1 / DV-15)

**Contrato canônico de chat comercial:** `MensagemChat` via
`orcamentos-v2` (`ChatV2Service` / rotas `/orcamentos-v2/.../chat/...` e
equivalentes).

Este módulo (`mensagemnegociacao` + controller
`orcamentos/:orcamentoId/mensagens`) permanece no repositório apenas para
leitura/compatibilidade transitória. **Não** deve receber novos writers nem
reabertura de `@Public()`.

Escrita neste controller responde `410 Gone` com mensagem estável apontando
para o chat canônico. Remoção de tabela/endpoints fica para migration futura
após `SELECT COUNT(*)` em produção.
