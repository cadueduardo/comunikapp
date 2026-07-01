# Módulo Arte & Aprovação — documentação funcional

Pasta de especificação do novo módulo operacional **Arte & Aprovação**, desacoplado da aba dentro da OS e integrado ao Orçamento V2.

## Documentos

| Arquivo | Conteúdo |
|---------|----------|
| [01-especificacao-funcional.md](./01-especificacao-funcional.md) | Especificação completa: fila, OS, orçamento, custo automático, APIs e fases |
| [02-design-tecnico-fase1-backend.md](./02-design-tecnico-fase1-backend.md) | Design técnico Fase 1: migração Prisma, estrutura de pastas, endpoints, segurança |
| [03-arte-cliente-fila-preflight-e-storage-drive.md](./03-arte-cliente-fila-preflight-e-storage-drive.md) | Arte do cliente na fila (sem colunas novas), preflight, Google Drive da loja, acesso do gestor |
| [04-hub-conexoes-google-drive.md](./04-hub-conexoes-google-drive.md) | Hub de Conexões: `LojaConexao`, OAuth Google, upload stream para Drive |
| [05-configuracao-google-drive.md](./05-configuracao-google-drive.md) | **Passo a passo:** Google Cloud Console, `.env`, conectar loja, SMTP, troubleshooting |

## Status

- **Spec geral:** rascunho para validação (2026-06-26) — ver seção 12 do doc 01 para decisões em aberto
- **Arte do cliente + Drive:** aprovado para implementação (2026-06-30) — doc 03; **revisa** partes do doc 01 (seção 14 do doc 03)

## Relação com docs existentes

- Complementa (não substitui) `docs/arte-aprovacao/modulo-arte-aprovacao-completo.md` (foco técnico legado, aba na OS)
- Alinha com Leitura B da Fase 7.A (`docs/plano-acao-home-onboarding-dashboard-operacional.md`) — **revista** nesta spec: anexo do orçamento ≠ arte de produção por padrão
- Integra com Orçamento V2 (`AnexoGeometriaInput`, motor de cálculo, `servico_manual`, `funcao`)
