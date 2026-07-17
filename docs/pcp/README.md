# Documentação do módulo PCP

Este arquivo é apenas um índice rápido.

## Referencia canonica (obrigatoria)

- Documento oficial: `docs/pcp/PCP-PROGRESSIVO-COMUNIKAPP.md`
- Toda decisão de produto, status de entrega, backlog, critérios de qualidade e checklist deve ser registrada no documento canônico.

## Regra de governança da documentação

- Evitar duplicidade de status em múltiplos arquivos.
- Em caso de divergência entre documentos, prevalece sempre o documento canônico.
- Novas entregas do PCP devem atualizar primeiro o documento canônico.

## Convencoes obrigatorias

- Texto e arquivos sempre em UTF-8.
- Segurança como primeira camada em qualquer desenvolvimento:
  - validar `loja_id` no backend;
  - validar permissão por perfil antes de operações críticas;
  - aplicar whitelist/mapeamento de status recebidos do frontend;
  - nunca confiar em escopo/autorização vindo do cliente.
