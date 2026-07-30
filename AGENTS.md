# Instruções permanentes do repositório ComunikApp

Estas regras se aplicam a qualquer agente, em qualquer diretório deste
repositório. Antes de alterar código, leia também a documentação funcional da
feature e, para mudanças de banco, leia obrigatoriamente
`docs/database/boas-praticas-schema-prisma.md`.

## Módulo Ordem de Serviço (OS)

- Antes de qualquer trabalho em `backend/src/os` ou
  `frontend/src/app/(main)/os`, leia obrigatoriamente
  `docs/modulo-os-melhorias/DIAGNOSTICO-MODULO-OS.md` (diagnóstico de dados
  mockados, fluxos incompletos e plano de ação P0/P1/P2).
- Ao concluir um item do plano de ação, marque o checkbox correspondente no
  diagnóstico no mesmo commit da mudança.
- Não introduza dados mockados/hardcoded em telas ou services do módulo OS.
  Se a API ainda não existe, exiba estado vazio/erro honesto, nunca dado
  inventado.
- A fonte de verdade dos status da OS é o enum TypeScript `StatusOS` em
  `backend/src/os/interfaces/os.interfaces.ts`; o enum Prisma homônimo está
  órfão. Não crie novos valores de status sem tratar a unificação (item P1-5
  do diagnóstico).

## Segurança e multi-tenancy

- Trate OWASP Top 10 como requisito mínimo: negar por padrão, validar toda
  entrada, aplicar menor privilégio e não expor detalhes internos em erros.
- Nunca use um JWT de usuário de loja para autorizar a área administrativa da
  plataforma.
- Nunca confie em `loja_id`, slug, hostname, role ou permissão enviados pelo
  cliente como prova de autorização.
- Toda consulta a recurso pertencente a uma loja deve incluir o `loja_id`
  derivado da identidade autenticada, inclusive buscas e mutações por ID.
- Segredos, tokens, senhas, códigos de aprovação e dados sensíveis não podem
  aparecer em respostas, logs, telemetria ou auditoria.
- Toda mutação sensível deve ter autorização no backend, validação tipada,
  auditoria sanitizada e proteção contra repetição/duplo processamento.
- Sessões devem ser revogáveis; bloqueio/inativação deve ser validado também nas
  requisições já autenticadas, não apenas no login.

## Banco de dados e Prisma

- Use apenas o schema canônico `backend/prisma/schema.prisma`.
- Migrations são aditivas, revisadas e nunca editadas depois de aplicadas.
- Toda tabela pertencente a uma loja precisa de `loja_id`; toda foreign key
  precisa de índice começando pelo campo adequado.
- Use `Json` nativo para dados estruturados e política `onDelete` explícita.
- Não crie tabelas ou campos especulativos sem uso na mesma entrega.
- Não gere IDs manualmente quando o Prisma já possui default seguro.
- Respeite integralmente
  `docs/database/boas-praticas-schema-prisma.md`.

## Backend

- Todo `@Body()` usa DTO tipado e `class-validator`; nunca use `any` para
  contornar a `ValidationPipe`.
- Separe módulos, guards, services e contratos por domínio. Não duplique regras
  de autorização ou validação entre controllers.
- Use transações nas mutações que alteram estado e auditoria conjuntamente.
- Operações disparáveis mais de uma vez devem ser idempotentes. Deduplicação de
  processamento, eventos e destinatários é obrigatória quando evita efeitos
  duplicados.
- Erros públicos devem ser estáveis, em português correto e sem stack trace,
  segredo ou confirmação indevida da existência de uma conta.

## Frontend e experiência

- Reutilize componentes globais existentes. Se um componente novo puder ser
  reutilizado, crie-o em `frontend/src/components`, não dentro de uma página.
- Não duplique componentes, máscaras, formatadores, clientes HTTP ou padrões de
  formulário.
- CRUDs devem seguir o padrão visual e comportamental dos CRUDs consolidados do
  ComunikApp, usando o módulo de fornecedores como principal referência.
  Qualquer listagem CRUD nova — inclusive na Gestão (`/gestao`) — deve obedecer
  ao template abaixo; não inventar tabela simples sem cards nem cards sem
  alternativa tabular no desktop.
- Campos monetários usam os componentes, máscaras e formatadores globais de
  moeda BRL já existentes. Não implemente uma segunda máscara local.
- Não use CSS inline. Use classes/tokens globais compatíveis com dark mode e
  light mode.
- Toda tela deve ser responsiva e utilizável em desktop e mobile, com estados de
  carregamento, vazio, erro, sucesso e confirmação.
- Acessibilidade, foco, labels, contraste e navegação por teclado fazem parte da
  definição de pronto.

### Template obrigatório de CRUD (listagem)

Referência canônica: `frontend/src/app/(main)/fornecedores/`.

Estrutura mínima de uma listagem:

1. **Cabeçalho** com título, subtítulo curto e ações primárias (ex.: Novo).
2. **Alternância Tabela / Cards** no desktop (`useIsMobile` + toggle). No
   mobile, forçar sempre a visão em cards; ocultar o toggle.
3. **Tabela (desktop)** via `DataTable` (`@/components/data-table/data-table`) e
   `columns.tsx` com `@tanstack/react-table`, ordenação nos campos relevantes e
   menu de ações (`DropdownMenu` + `MoreHorizontal`).
4. **Cards (mobile ou modo Cards)** em grid
   `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`, com componente de
   card dedicado em `frontend/src/components` (ex.: `FornecedorCard`,
   `AdminStoreCard`). O card deve expor as mesmas ações da tabela.
5. **Estados** explícitos de carregamento, vazio (com CTA quando fizer sentido)
   e erro.
6. **Confirmações** destrutivas ou sensíveis com `ConfirmDialog` / diálogo
   dedicado; nunca só `window.confirm`.
7. **Classes de tema** (`border-border`, `bg-card`, `text-foreground`,
   `text-muted-foreground`); não fixar cores só de light mode.
8. **Paginação**: se a API já pagina no servidor, desligar a paginação local do
   `DataTable` (`enablePagination={false}`) e manter os controles do servidor;
   se a lista couber no cliente, usar a paginação do `DataTable`.

Não aceitar como pronto um CRUD que:

- mostre apenas tabela no desktop sem cards no mobile;
- mostre apenas cards empilhados no desktop sem opção de tabela;
- duplique markup de ações entre tabela e card sem o padrão de menu;
- use CSS inline ou estilos incompatíveis com dark/light mode.

## Código e conteúdo

- Todo arquivo textual deve permanecer em UTF-8.
- Textos destinados ao usuário devem usar português do Brasil com acentuação
  correta.
- Preserve alterações locais não relacionadas e não faça refactors expansivos
  sem necessidade para a entrega.
- Antes de concluir, execute testes proporcionais ao risco, validação Prisma,
  typecheck/build e `git diff --check`.

