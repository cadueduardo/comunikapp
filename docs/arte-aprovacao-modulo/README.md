# Módulo Arte & Aprovação — documentação funcional

Pasta de especificação do novo módulo operacional **Arte & Aprovação**, desacoplado da aba dentro da OS e integrado ao Orçamento V2.

## Documentos

| Arquivo | Conteúdo |
|---------|----------|
| [01-especificacao-funcional.md](./01-especificacao-funcional.md) | Especificação completa: fila, OS, orçamento, custo automático, APIs e fases |
| [02-design-tecnico-fase1-backend.md](./02-design-tecnico-fase1-backend.md) | Design técnico Fase 1: migração Prisma, estrutura de pastas, endpoints, segurança |

## Status

- **Versão:** rascunho para validação (2026-06-26)
- **Decisões em aberto:** ver seção 12 do documento principal

## Relação com docs existentes

- Complementa (não substitui) `docs/arte-aprovacao/modulo-arte-aprovacao-completo.md` (foco técnico legado, aba na OS)
- Alinha com Leitura B da Fase 7.A (`docs/plano-acao-home-onboarding-dashboard-operacional.md`) — **revista** nesta spec: anexo do orçamento ≠ arte de produção por padrão
- Integra com Orçamento V2 (`AnexoGeometriaInput`, motor de cálculo, `servico_manual`, `funcao`)
