# Melhorias do Módulo Ordem de Serviço (OS)

Esta pasta é o **local de consulta obrigatório** para qualquer trabalho no
módulo de Ordem de Serviço (`backend/src/os` e `frontend/src/app/(main)/os`).

## Conteúdo

| Documento | O que contém |
|---|---|
| `DIAGNOSTICO-MODULO-OS.md` | Diagnóstico completo de 29/07/2026: dados mockados/hardcoded, fluxos incompletos, problemas estruturais, gaps vs. mercado e plano de ação priorizado (P0/P1/P2) com checkboxes de progresso. **P0 concluído** em 29/07/2026. |

## Diretrizes para agentes

1. **Antes de alterar qualquer coisa no módulo OS**, leia
   `DIAGNOSTICO-MODULO-OS.md` para não reintroduzir os problemas mapeados nem
   duplicar trabalho já planejado.
2. **Ao concluir um item do plano de ação**, marque o checkbox correspondente
   no `DIAGNOSTICO-MODULO-OS.md` no mesmo commit da mudança.
3. **Nunca adicione dados mockados/hardcoded** em telas ou services do módulo
   OS — os itens P0 do diagnóstico existem justamente para remover os que já
   existem. Se uma API ainda não existe, exiba estado vazio/erro honesto, não
   dado inventado.
4. **Status da OS:** a fonte de verdade atual é o enum TypeScript
   `StatusOS` em `backend/src/os/interfaces/os.interfaces.ts` (16 valores).
   O enum Prisma `StatusOS` (7 valores) está órfão e a coluna
   `OrdemServico.status` é `String`. Não crie novos valores de status sem
   atualizar o item de unificação (P1-5) do diagnóstico.
5. Mudanças de banco relacionadas à OS seguem também
   `docs/database/boas-praticas-schema-prisma.md`.

## Origem

O diagnóstico foi gerado por análise completa de código (backend, frontend,
schema Prisma e docs) em 29/07/2026. Existe uma versão interativa em canvas do
Cursor (fora do repositório, em
`~/.cursor/projects/c-Projects-comunikapp/canvases/diagnostico-modulo-os.canvas.tsx`),
mas a versão canônica e versionada é a desta pasta.
