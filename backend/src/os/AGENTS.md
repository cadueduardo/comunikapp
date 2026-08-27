# Instruções locais — Backend de Ordem de Serviço

Estas regras complementam o `AGENTS.md` da raiz e se aplicam a
`backend/src/os/**`.

- Antes de qualquer alteração, leia integralmente
  `docs/modulo-os-melhorias/DIAGNOSTICO-MODULO-OS.md`.
- Ao concluir um item do plano de ação, marque o checkbox correspondente no
  diagnóstico no mesmo commit.
- Não introduza dados mockados ou hardcoded. Se uma integração ainda não existir,
  retorne estado vazio ou erro público estável e honesto.
- A fonte de verdade atual dos status é o enum TypeScript `StatusOS` em
  `backend/src/os/interfaces/os.interfaces.ts`; o enum Prisma homônimo está
  divergente/órfão conforme o diagnóstico.
- Não crie novos status sem tratar a unificação prevista no item P1-5 do
  diagnóstico.
- Toda consulta ou mutação de OS por ID deve aplicar o `loja_id` derivado da
  identidade autenticada.
