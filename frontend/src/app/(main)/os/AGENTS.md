# Instruções locais — Frontend de Ordem de Serviço

Estas regras complementam o `AGENTS.md` da raiz e se aplicam a
`frontend/src/app/(main)/os/**`.

- Antes de qualquer alteração, leia integralmente
  `docs/modulo-os-melhorias/DIAGNOSTICO-MODULO-OS.md`.
- Ao concluir um item do plano de ação, marque o checkbox correspondente no
  diagnóstico no mesmo commit.
- Não introduza dados mockados ou hardcoded. Se a API ainda não existir, exiba
  estado vazio ou erro honesto.
- Não crie labels, filtros ou transições com status novos sem alinhar a fonte de
  verdade `StatusOS` e o item P1-5 do diagnóstico.
- Preserve as fronteiras entre visão comercial, execução operacional e
  pós-cálculo/fechamento financeiro documentadas para o módulo.
