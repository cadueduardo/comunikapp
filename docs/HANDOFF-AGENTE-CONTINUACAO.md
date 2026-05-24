# Handoff para o próximo agente — Home Operacional + Evolução Operacional

> **Para quem é este documento:** outro agente de IA (ou desenvolvedor humano) que vai continuar de onde paramos. Leia este arquivo inteiro antes de tocar em qualquer código. Ele é a fonte de verdade do **estado atual** e dos **próximos passos**.

> **Idioma:** todo código novo, comentários e textos visíveis devem estar em pt-BR com acentuação correta. UTF-8 obrigatório.

> **Plano-mãe (visão e princípios):** [`docs/plano-acao-home-onboarding-dashboard-operacional.md`](./plano-acao-home-onboarding-dashboard-operacional.md). Esse plano não muda; este handoff complementa com decisões, estado e o que falta.

---

## 1. Estado atual em uma frase

Estamos no meio da **Fase 2 (orçamento V2)**. Backend e componentes standalone do frontend prontos e commitados. Falta a **integração dos componentes dentro do formulário grande de orçamento** (Sub-fase 2.F) e depois seguir para a **Fase 3 (correção da OS gerada por orçamento)**.

---

## 2. Branch, commits e ambiente

### Branch ativo

```text
feature/home-operacional-dashboard
```

Esta branch está **à frente do `main`**. Não fazer merge para `main` sem aprovação do dono do projeto.

### Histórico de commits relevante (do mais novo para o mais antigo)

| Commit  | Fase    | O que fez                                                                                          |
| ------- | ------- | -------------------------------------------------------------------------------------------------- |
| 169d909 | Fase 2 frontend (parte 1) | `QuickGeometryInput` + `SimuladorPrecificacao` + página `/orcamentos-v2/simulador` (andaime).      |
| 5417de4 | Fase 2 backend            | Geometria avançada em `ProdutoOrcamento`, `velocidade_ml_h` em `maquina`, módulo `estimativa-tempo`. |
| dcb9f98 | Fase 1 fix                | Esconder checklist quando todas as obrigatórias estão concluídas.                                  |
| 8537eba | Fase 1 frontend           | Dashboard com onboarding e banner de estado.                                                       |
| 71c4acf | Fase 1 backend            | Módulo `home-operacional` com onboarding, configuração recomendada e banner.                       |
| 66de457 | Fase 0                    | Decisões e contratos da Home operacional (10 documentos em `docs/fase-0-home-operacional/`).       |
| 0089746 | Plano                     | Plano de ação revisado com diretriz de dashboard com cards.                                        |

### Ambiente local

- **Backend:** NestJS 11 + Prisma 6.19.3 + MySQL 8 local em `mysql://root@localhost:3306/comunikapp` (sem senha; ver `backend/.env`).
- **Frontend:** Next.js 15 em `frontend/`.
- **Dev:** o usuário roda **um único** `npm run dev` na raiz que sobe backend + frontend juntos via `concurrently`.
- **Sistema operacional do desenvolvedor:** Windows 10 + PowerShell. Comandos shell precisam funcionar nele.

### Estado do banco local

- A tabela `_prisma_migrations` está **populada com baseline** desde 24/05/2026: todas as 42 migrations históricas + a nova `20260524150000_add_geometria_e_velocidade_ml` estão marcadas como `applied`.
- O banco já reflete o schema da Fase 2. `npx prisma migrate status` deve dizer **"Database schema is up to date"**.
- `npx prisma migrate diff --from-url "mysql://root@localhost:3306/comunikapp" --to-schema-datamodel prisma/schema.prisma` deve retornar **"No difference detected"**.

---

## 3. ARMADILHAS CONHECIDAS (leia ANTES de codar)

Estas situações já me custaram tempo. Não caia nelas.

### 3.1 Não rode `npx prisma migrate dev` neste projeto

O comando tenta criar um **shadow database** que aplica todas as migrations do zero. Falha porque a migration `20250101000000_add_profundidade_produto_orcamento` foi datada com janeiro de 2025 (data falsa), mas o `init` real é de julho de 2025. No shadow DB, o ALTER TABLE roda antes do CREATE TABLE e quebra.

**Para alterações novas de schema, use sempre este fluxo:**

```powershell
# 1. Edite backend/prisma/schema.prisma
# 2. Crie manualmente a migration SQL em backend/prisma/migrations/AAAAMMDDHHMMSS_nome_curto/migration.sql
# 3. Aplique no banco local:
cd backend
npx prisma migrate deploy           # aplica só as pendentes
npx prisma generate                 # regenera o cliente

# 4. Confirme que ficou alinhado:
npx prisma migrate status           # deve dizer "Database schema is up to date"
npx prisma migrate diff --from-url "mysql://root@localhost:3306/comunikapp" --to-schema-datamodel prisma/schema.prisma --exit-code
# (exit code 0 = sem diff; 2 = há diff)
```

Para gerar o ALTER TABLE corretamente sem rodar `migrate dev`, use:

```powershell
npx prisma migrate diff --from-url "mysql://root@localhost:3306/comunikapp" --to-schema-datamodel prisma/schema.prisma --script
```

E cole o SQL gerado num novo arquivo `migration.sql` dentro de uma pasta com timestamp futuro.

### 3.2 `prisma generate` falha enquanto `npm run dev` estiver rodando

O processo Node do NestJS segura o arquivo `node_modules/.prisma/client/query_engine-windows.dll.node`. Erro: `EPERM: operation not permitted, rename`.

**Solução:** pedir o usuário parar o `npm run dev` (Ctrl+C no terminal raiz), rodar `npx prisma generate`, depois pedir para reiniciar.

### 3.3 `tsconfig.json` do backend é permissivo

```json
"strictNullChecks": false,
"noImplicitAny": false
```

Isso significa que `tsc --noEmit` passa **mesmo quando o cliente Prisma não conhece um campo** que você está usando. Não confie só no tsc; teste o endpoint na prática depois de regenerar o cliente.

### 3.4 PowerShell + npm geram saída ruidosa

Comandos como `npx prisma ...` escrevem `Environment variables loaded from .env` no stderr, e o PowerShell trata como erro vermelho (mas o exit code é 0). Ignore o ruído visual e cheque o exit code real.

### 3.5 Encoding de mensagens de commit

`git commit -m "feat: descrição com acentos"` no PowerShell escapa os acentos para `\uXXXX`. Sempre faça:

```powershell
# 1. Escreva a mensagem em um arquivo temporário UTF-8:
Set-Content -Path .commit-msg-tmp.txt -Encoding UTF8 -Value "feat(escopo): mensagem com acentos`n`nCorpo opcional."
# 2. Commit usando o arquivo:
git commit -F .commit-msg-tmp.txt
Remove-Item .commit-msg-tmp.txt
```

Ou usar o método HEREDOC do `cat` do bash (não tem nativo no PowerShell). O arquivo tmp é o caminho mais seguro.

### 3.6 Nomes de tabelas MySQL (case-insensitive)

O `model ProdutoOrcamento` no Prisma gera tabela `ProdutoOrcamento` (mantém o case), mas o MySQL no Windows é case-insensitive por padrão. Em migrations SQL, use o case **exato** que o Prisma usa (verifique no resultado do `migrate diff --script`). Modelos sem `@@map` mantêm o nome em PascalCase; com `@@map("nome_snake")`, usam snake_case.

### 3.7 Não modificar `frontend/next.config.mjs` sem pedir

O arquivo está com mudança não-commitada (porta 4001→4000) que não foi feita por mim. Sempre que rodar `git status`, deixe esse arquivo **fora dos commits** a menos que o usuário peça explicitamente.

### 3.8 Não commitar `docs/proposta-ajuste-orcamento-os-pcp-cliente-comunicacao-visual.md`

Idem item anterior. Esse arquivo não-rastreado é do usuário. Não inclua nos commits.

---

## 4. O que já está pronto

### 4.1 Fase 0 — Decisões e contratos (concluída, commit `66de457`)

Pasta `docs/fase-0-home-operacional/` com 10 documentos:

| Arquivo                                  | Conteúdo                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `README.md`                              | Índice e convenções da Fase 0.                                                          |
| `01-status-oficiais.md`                  | Enums oficiais de Orçamento V2, OS e Cobrança + transições + eventos.                   |
| `02-contratos-home-operacional.md`       | JSONs de request/response de cada endpoint da Home operacional.                         |
| `03-onboarding-etapas.md`                | 10 step_ids oficiais + queries SQL de detecção automática + schema da tabela.           |
| `04-campos-geometria.md`                 | Novos campos em `ProdutoOrcamento` e `ItemOS` (geometria avançada).                     |
| `05-persistencia-anexos.md`              | Storage local em VPS com endpoint autenticado; migração futura para S3/MinIO.           |
| `06-conversao-m2-chapa-sobra.md`         | Regra de m² → chapa inteira → sobra + campos novos em `Insumo`.                         |
| `07-permissoes-home.md`                  | Permissões por bloco da Home + perfis sugeridos.                                        |
| `08-configuracao-recomendada-defaults.md`| Defaults de margem 45%, imposto 6%, condição 50/50, categorias/tipos/setores iniciais.  |
| `09-system-state-banner-catalogo.md`     | Catálogo inicial de mensagens do banner.                                                |

**Use estes documentos como referência canônica.** Eles foram aprovados pelo dono do projeto. Se você precisar mudar algo, atualize o documento e mencione o commit no plano-mãe.

### 4.2 Fase 1 — Home operacional mínima (concluída, commits `71c4acf`, `8537eba`, `dcb9f98`)

**Backend:**

- `backend/src/home-operacional/` (novo módulo):
  - `home-operacional.module.ts` — registra controller + services.
  - `home-operacional.controller.ts` — endpoints `GET /onboarding`, `PATCH /onboarding/:stepId`, `POST /onboarding/aplicar-configuracao-recomendada`, `GET /banner-estado`. Todos com `JwtAuthGuard`.
  - `services/onboarding.service.ts` — detecta etapas automaticamente via queries; persiste `ignorado` / `reativado`.
  - `services/configuracao-recomendada.service.ts` — aplica defaults da loja (margem, imposto, condição, categorias, tipos de material, setores, workflow, regras). **Nunca sobrescreve** o que o usuário já configurou, a menos que `sobrescrever_existentes: true`.
  - `services/system-state.service.ts` — agrega mensagens do banner.
  - `enums/`, `interfaces/`, `catalogos/`, `dto/` — apoio.
- `backend/prisma/schema.prisma` — modelo `OnboardingOperacional` + campos `condicao_pagamento_padrao_*` em `loja`.
- `backend/prisma/migrations/20260524110000_add_home_operacional/migration.sql` — cria tabela e colunas.

**Frontend:**

- `frontend/src/lib/home-operacional-api.ts` — cliente HTTP com tipos espelhados do backend.
- `frontend/src/hooks/use-home-operacional.ts` — hooks `useOnboarding`, `useBannerEstado`.
- `frontend/src/components/home-operacional/SystemStateBanner.tsx`
- `frontend/src/components/home-operacional/OnboardingChecklist.tsx`
- `frontend/src/components/home-operacional/AplicarConfiguracaoRecomendadaDialog.tsx`
- `frontend/src/app/(main)/dashboard/page.tsx` — usa os componentes.

**Comportamento atual:** ao logar e ir em `/dashboard`, o usuário vê o banner de estado (se houver), o checklist de onboarding, e a opção de aplicar a configuração recomendada. O checklist some quando todas as etapas **obrigatórias** estão concluídas.

### 4.3 Fase 2 — Orçamento V2 (parcialmente concluída, commits `5417de4`, `169d909`)

**Backend (pronto):**

- `backend/prisma/schema.prisma`:
  - `ProdutoOrcamento` ganhou `perimetro_produto`, `geometria_origem`, `arquivo_geometria_url`, `arquivo_geometria_metadados`.
  - `maquina` ganhou `velocidade_ml_h` (m/h para corte linear).
- `backend/prisma/migrations/20260524150000_add_geometria_e_velocidade_ml/migration.sql` — ALTER TABLEs.
- `backend/src/maquinas/dto/create-maquina.dto.ts` — aceita `velocidade_ml_h` opcional.
- `backend/src/estimativa-tempo/` (novo módulo):
  - `services/estimativa-tempo.service.ts` — `estimarMaquina(lojaId, { maquina_id, quantidade, area_m2?, perimetro_mm? })`. Lê velocidade conforme `modo_producao`, aplica setup e eficiência.
  - `services/compatibilidade-material-maquina.service.ts` — usa `RegraValidacao` com `categoria='compatibilidade_material_maquina'`. Retorna `compativel | alerta | bloqueado`.
  - `estimativa-tempo.controller.ts` — `POST /estimativa-tempo/maquina` e `POST /estimativa-tempo/compatibilidade-material-maquina`.
  - `estimativa-tempo.module.ts`.
- `backend/src/app.module.ts` — registra `EstimativaTempoModule`.

**Frontend (pronto, mas ainda standalone):**

- `frontend/src/lib/estimativa-tempo-api.ts` — cliente HTTP tipado.
- `frontend/src/components/orcamentos-v2/QuickGeometryInput.tsx` — controlled component, recebe `largura`/`altura`/`unidade` (mm | cm | m) e dispara `onChange(valor, calculada)` com `area_m2`, `perimetro_mm`, `largura_mm`, `altura_mm`.
- `frontend/src/components/orcamentos-v2/SimuladorPrecificacao.tsx` — standalone, usa as **mesmas fórmulas** do `PreviewCalculoV2` (`markup` vs `margem_por_dentro`).
- `frontend/src/app/(main)/orcamentos-v2/simulador/page.tsx` — **página de andaime** que junta os três para teste manual. **Esta página deve sumir** depois que a integração no formulário grande estiver pronta (Sub-fase 2.F).

**O que falta na Fase 2:** Sub-fase 2.F — integrar `QuickGeometryInput` e a estimativa de tempo dentro do formulário grande (`frontend/src/components/ui/orcamentos-v2/orcamento-v2-form.tsx`, ~1700 linhas), e decidir destino final do `SimuladorPrecificacao`.

---

## 5. Próximo passo: Sub-fase 2.F (detalhada)

> **Objetivo:** trazer o `QuickGeometryInput` e a estimativa de tempo de máquina para dentro do formulário real de orçamento (`/orcamentos-v2/novo` e `/orcamentos-v2/novo?id=...`). Ao final, o usuário não digita mais área manualmente — ele digita largura/altura/unidade e o sistema preenche área e perímetro. Quando ele adiciona uma máquina ao produto, ganha um botão "Estimar tempo" que preenche `horas_utilizadas`.

### 5.1 Mapa do formulário

- Página: `frontend/src/app/(main)/orcamentos-v2/novo/page.tsx` (carrega e transforma dados).
- Componente principal: `frontend/src/components/ui/orcamentos-v2/orcamento-v2-form.tsx` (1692 linhas).
- Schema Zod e tipos: `frontend/src/components/ui/orcamento/schemas/orcamento.schema.ts`.
- Seção do produto (onde os campos `largura_produto`, `altura_produto`, `unidade_medida_produto`, `area_produto` vivem): provavelmente em `frontend/src/components/ui/orcamento/components/ProdutoSection.tsx` (confirme via `Grep largura_produto frontend/src/components/ui/orcamento`).
- Preview: `frontend/src/components/ui/shared/sections/PreviewCalculoV2.tsx`.
- Cálculo client-side: `frontend/src/components/ui/shared/utils/preview-calculo.helpers.ts` (função `calcularProdutosPreview`).

### 5.2 Plano da Sub-fase 2.F em etapas

> Faça uma etapa por commit. Não tente tudo de uma vez.

#### Etapa 2.F.1 — Mapear o ProdutoSection

1. Abra `orcamento-v2-form.tsx` e descubra qual componente renderiza os campos largura/altura/unidade do produto (busque `largura_produto` no arquivo).
2. Identifique exatamente:
   - Como o `react-hook-form` controla esses campos (`name="itens_produto.{index}.largura_produto"` provavelmente).
   - Onde a área é calculada hoje (talvez em um `useEffect` que multiplica largura×altura).
3. **Não codifique ainda.** Apenas mapeie e me diga o que encontrou (ou anote num comentário no doc).

#### Etapa 2.F.2 — Adicionar `perimetro_produto` ao schema Zod e ao tipo do formulário

Em `orcamento.schema.ts`:

- Adicionar `perimetro_produto: z.string().optional()` ao schema do item.
- Adicionar `geometria_origem: z.enum(['MANUAL', 'IMAGEM', 'DXF']).optional()`.
- Adicionar `arquivo_geometria_url: z.string().optional()`.

Em `orcamento-v2-form.tsx`, atualizar os `defaultValues` e os mapeadores `onLoad`/`onSubmit` para incluir esses campos. Não esquecer dos lugares em `novo/page.tsx` que carregam o orçamento existente.

#### Etapa 2.F.3 — Substituir os 3 inputs (largura/altura/unidade) pelo `QuickGeometryInput`

Dentro do ProdutoSection:

1. Importar `QuickGeometryInput` de `@/components/orcamentos-v2/QuickGeometryInput`.
2. Usar `useController` ou `Controller` do react-hook-form para integrar com os campos `largura_produto`, `altura_produto`, `unidade_medida_produto`.
3. No callback `onChange(valor, calculada)`:
   - `setValue('itens_produto.{index}.largura_produto', valor.largura)`.
   - `setValue('itens_produto.{index}.altura_produto', valor.altura)`.
   - `setValue('itens_produto.{index}.unidade_medida_produto', valor.unidade)`.
   - `setValue('itens_produto.{index}.area_produto', String(calculada.area_m2))`.
   - `setValue('itens_produto.{index}.perimetro_produto', String(calculada.perimetro_mm))`.
   - `setValue('itens_produto.{index}.geometria_origem', 'MANUAL')`.

**Cuidado:** o campo `unidade_medida_produto` hoje aceita também valores como `'un'`, `'m²'`, `'kg'`, etc., não só `mm | cm | m`. O `QuickGeometryInput` só lida com `mm | cm | m`. Decisão pendente: criar campo separado `unidade_geometria` (`mm | cm | m`) e manter `unidade_medida_produto` para a unidade comercial do produto, **ou** restringir o uso do QuickGeometryInput apenas a produtos retangulares.

> **Recomendação:** criar um campo novo `unidade_geometria` (`mm | cm | m`) e deixar `unidade_medida_produto` para uso comercial. Adicionar `unidade_geometria` ao schema da migration futura. Por ora, no formulário, manter os dois separados.

#### Etapa 2.F.4 — Botão "Estimar tempo" na seção de máquinas do produto

Dentro do bloco que renderiza cada `ItemMaquina` do produto:

1. Adicionar um botão pequeno ao lado do input `horas_utilizadas`.
2. Ao clicar, chamar `postEstimarTempoMaquina({ maquina_id, quantidade, area_m2, perimetro_mm })` de `@/lib/estimativa-tempo-api`.
3. Se `estimativa_possivel === true`, preencher `horas_utilizadas` com o `tempo_horas` retornado e mostrar um `toast.success` com detalhamento.
4. Se `estimativa_possivel === false`, mostrar `toast.info` com a primeira mensagem do `detalhamento.mensagens` (ex.: "Máquina sem velocidade m²/h cadastrada. Informe o tempo manualmente.").
5. **Importante:** o usuário deve poder sobrescrever o valor estimado livremente. A estimativa é sugestão, não imposição.

#### Etapa 2.F.5 — Salvar os campos novos no backend

Hoje o backend já aceita `perimetro_produto`, `geometria_origem`, `arquivo_geometria_url`, `arquivo_geometria_metadados` no schema, mas o DTO de criação/edição de orçamento pode estar ignorando esses campos.

1. Localizar o DTO em `backend/src/orcamentos-v2/dto/` (provavelmente `create-orcamento-v2.dto.ts` ou `produto-orcamento.dto.ts`).
2. Adicionar os campos novos como opcionais.
3. Localizar onde `ProdutoOrcamento.create()` ou `update()` é chamado em `orcamentos-v2.service.ts` e garantir que os campos sejam persistidos.

#### Etapa 2.F.6 — Decidir destino final do `SimuladorPrecificacao`

Opções (perguntar ao usuário antes):

- **A.** Botão "Simular preço" dentro do formulário que abre o componente em modal pré-preenchido com o custo total atual.
- **B.** Item separado no menu lateral em "Ferramentas".
- **C.** Ambos.
- **D.** Manter só na página `/orcamentos-v2/simulador` e renomeá-la.

**Recomendação:** A + manter a página `/orcamentos-v2/simulador` como atalho ("Ferramentas > Simulador de precificação").

#### Etapa 2.F.7 — Limpar página de andaime se for o caso

Se a decisão da 2.F.6 for trocar a página por modal, remover `frontend/src/app/(main)/orcamentos-v2/simulador/page.tsx`.

### 5.3 Critérios de aceite da Sub-fase 2.F

- Usuário cria um orçamento novo, digita largura 1000 / altura 500 / unidade mm e vê área 0,5 m² e perímetro 3 m calculados na hora.
- Os campos `area_produto`, `perimetro_produto` e `geometria_origem='MANUAL'` chegam ao banco.
- Usuário adiciona uma máquina, clica "Estimar tempo" e vê o campo de horas preenchido.
- Usuário sobrescreve o valor estimado e o sistema aceita.
- Em modo edição, os valores carregam corretamente da base.

---

## 6. O que vem depois (Fases 3 a 9)

Cada fase abaixo está descrita no plano-mãe. Aqui só dou hints práticos.

### Fase 3 — Correção da OS gerada por orçamento

**Foco principal:** o bug histórico do `insumos_calculados` em `ItemOS` (JSON serializado de forma inconsistente entre quem grava e quem lê).

**Arquivos suspeitos para investigar:**

- `backend/src/os/services/` — quem cria a OS a partir do orçamento.
- `backend/src/pcp/` — quem consome `insumos_calculados`.
- `backend/src/estoque/` — idem.

**Estratégia:** padronizar para sempre `JSON.stringify` na gravação e `try { JSON.parse } catch` defensivo na leitura, com fallback `[]` ou objeto vazio. Centralizar num helper.

**Outros entregáveis da Fase 3:**

- Criar `ItemOS` por produto do orçamento (hoje a OS pode estar nascendo com 1 único item).
- Levar `largura`, `altura`, `area`, `perimetro`, `geometria_origem`, `arquivo_geometria_url` para `ItemOS` (campos novos a adicionar — ver `docs/fase-0-home-operacional/04-campos-geometria.md`).
- Criar ação "Aprovar orçamento e gerar OS" para usuário interno (atalho que dispara o mesmo evento que aprovação via link público).

### Fase 4 — Fluxo de trabalho na Home

- Criar `GET /home-operacional/fluxo` no `home-operacional.controller.ts` (já existe parcialmente, conferir).
- Implementar cache de 60s por `loja_id` (usar `cache-manager` ou similar do Nest).
- Frontend: criar `frontend/src/components/home-operacional/FluxoTrabalho.tsx` e `CardTrabalho.tsx`.
- Contrato JSON em `docs/fase-0-home-operacional/02-contratos-home-operacional.md`.

### Fase 5 — Alertas operacionais

- Criar `GET /home-operacional/alertas` (a estrutura já existe no `system-state.service.ts`).
- Frontend: `AlertasOperacionais.tsx` com hierarquia visual (crítico > atenção > informativo).

### Fase 6 — Financeiro mínimo

Esta fase é **grande**. Sugiro quebrar em sub-fases:

- 6.A: schema de `condicao_pagamento` e `previsao_recebimento` (campos em `orcamento` + tabela nova).
- 6.B: serviço que gera previsão quando orçamento é aprovado.
- 6.C: tela de Auditoria de Recebimentos.
- 6.D: bloco `ResumoFinanceiroSimples` na Home (só para perfis com permissão).
- 6.E: eventos financeiros automáticos pelo avanço do trabalho.

### Fase 7 — DXF real

Começar como anexo simples (sem parser). Parser só em fase posterior.

### Fase 8 — Ajustes mobile e navegação

- Sidebar mobile fechada por padrão.
- Sidebar desktop sem `hover` (substituir por clique).
- Trocar `<a href>` por `next/link` em toda a navegação interna.
- CRUDs em cards no mobile.

### Fase 9 — Polimento

Estados vazios, microcopy, loading/erro.

---

## 7. Convenções obrigatórias

### 7.1 Encoding e idioma

- **UTF-8** em todos os arquivos novos.
- **pt-BR** com acentuação correta em textos visíveis (labels, mensagens, toasts, documentação).
- Comentários em código podem ser pt-BR ou inglês, mas seja consistente dentro do mesmo arquivo.

### 7.2 Comentários

> Regra do projeto: **não criar comentários que apenas narram o código**. Comentários só para explicar **por que** ou **trade-offs** ou **constraints**, nunca **o que** o código está fazendo. O código deve ser legível por si só.

### 7.3 Commits

- Mensagens em pt-BR ou inglês, mas consistentes.
- Padrão: `tipo(escopo): descrição`. Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.
- Sempre fazer `git push` após o commit (regra do projeto).
- Usar arquivo temporário para mensagens com acentos (ver Armadilha 3.5).
- **Nunca** fazer commit do `frontend/next.config.mjs` modificado ou do `docs/proposta-ajuste-...md` não-rastreado (ver Armadilhas 3.7 e 3.8).

### 7.4 Multi-tenant

Toda query no backend deve filtrar por `loja_id`. Use o decorator `@CurrentLojaId()` de `backend/src/auth/decorators.ts` nos controllers.

### 7.5 Validação

- DTOs com `class-validator` (`@IsString`, `@IsNumber`, `@IsOptional`, etc.).
- DTOs **nunca** com `any`. Tipos explícitos sempre.

### 7.6 Frontend

- Componentes em `'use client'` quando precisarem de state.
- Use os componentes UI existentes em `frontend/src/components/ui/` (são shadcn-style).
- Estilização via Tailwind. Não criar CSS solto.

### 7.7 Quando perguntar vs quando agir

Pergunte antes de:

- Alterar schema de modelo já em uso.
- Mexer em ordem de status, transições ou eventos de domínio.
- Mudar UX visível (esconder/mostrar bloco).
- Tocar em `frontend/next.config.mjs` ou outros arquivos de config.
- Decidir destino de componentes (modal vs página vs sidebar).

Aja sem perguntar quando:

- For fix de bug óbvio.
- For refatoração local sem mudança de contrato.
- For atualizar texto/labels já decididos.
- For adicionar tipo TypeScript sem mudar runtime.

### 7.8 Antes de finalizar uma fase

Sempre rodar:

```powershell
# Backend:
cd backend
npx tsc --noEmit
npx prisma migrate status

# Frontend:
cd ../frontend
npm run lint
# Não rodar `next build` por padrão (demora muito); rodar só se duvida real de quebra.
```

E confirmar:

- Todos os arquivos UTF-8.
- Sem comentários narrativos.
- Sem `console.log` esquecidos no código de produção (em código de debug temporário, OK).
- Commits feitos e pushados.
- Plano-mãe atualizado com o status da fase.

---

## 8. Como debugar problemas comuns

### 8.1 Backend não inicia

```powershell
# Ver o erro real:
cd backend
npm run start:dev
# Geralmente é cliente Prisma desatualizado. Se for, parar dev, rodar:
npx prisma generate
# E reiniciar.
```

### 8.2 Erro 401 no frontend

Token JWT expirado. Pedir o usuário para fazer logout/login. Se persistir, conferir `frontend/src/lib/api.ts` (função `getAuthToken`) e o cookie/`localStorage` no DevTools.

### 8.3 Erro "Unknown field" no Prisma

O cliente está desatualizado. Parar `npm run dev`, rodar `npx prisma generate` em `backend/`, reiniciar.

### 8.4 WebSocket errors no console do browser

São **pré-existentes** e não fazem parte do escopo. Não tente arrumar sem o usuário pedir.

---

## 9. Decisões de produto já tomadas (não reabra sem permissão)

| Decisão                                                                                                                                           | Origem                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| A Home é dashboard com cards, não tela monolítica.                                                                                                | Plano-mãe + feedback do dono.                           |
| O fluxo de trabalho na Home é leitura+atalho, sem drag-and-drop.                                                                                  | Princípio 3 do plano.                                   |
| Onboarding é por loja, não por usuário.                                                                                                           | Doc 03 da Fase 0.                                       |
| Anexos de geometria ficam em storage local da VPS por enquanto (migração futura para S3/MinIO).                                                   | Doc 05 da Fase 0.                                       |
| Configuração recomendada usa margem 45%, imposto 6%, condição 50% entrada/50% entrega.                                                            | Doc 08 da Fase 0.                                       |
| Geometria avançada usa `MANUAL` na Fase 2; `IMAGEM` e `DXF` ficam para Fase 7.                                                                    | Doc 04 da Fase 0 + escopo da Fase 2.                    |
| Compatibilidade material × máquina reaproveita `RegraValidacao` com `categoria='compatibilidade_material_maquina'`, não cria modelo novo.         | Sub-fase 2.C concluída (commit `5417de4`).              |
| `velocidade_ml_h` é o campo padrão para corte linear (não `minutos_por_metro_corte` que o plano sugeria). Mantém consistência com `velocidade_m2_h`. | Decisão tomada na Sub-fase 2.A (commit `5417de4`).      |
| Apenas a tabela `_prisma_migrations` controla migrations a partir de 24/05/2026. Baseline aplicado, `db push` não deve mais ser usado em PROD.   | Operação de baseline em 24/05/2026.                      |

---

## 10. Comandos úteis (PowerShell)

```powershell
# Status do projeto:
git status
git log --oneline -10

# Backend:
cd backend
npm run start:dev              # backend + watch
npx prisma studio              # GUI do banco
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npx tsc --noEmit

# Frontend:
cd frontend
npm run dev                    # só frontend
npm run lint
npm run build                  # só se precisar validar build

# Raiz (dev integrado):
npm run dev                    # backend + frontend juntos

# Diff banco vs schema:
cd backend
npx prisma migrate diff --from-url "mysql://root@localhost:3306/comunikapp" --to-schema-datamodel prisma/schema.prisma --script
```

---

## 11. Como entregar bem para o próximo agente (você, no futuro)

Quando você concluir mais alguma fase:

1. Atualize este `HANDOFF-AGENTE-CONTINUACAO.md`:
   - Mova a fase concluída para a seção 4 (com lista de arquivos e o que faz).
   - Atualize a seção 1 (estado atual).
   - Atualize a seção 5 com o próximo passo bem detalhado.
2. Atualize o plano-mãe (`plano-acao-home-onboarding-dashboard-operacional.md`) só com um marcador discreto `**[CONCLUÍDO em <commit>]**` no início da fase.
3. Commit + push.

Não delete este arquivo. Ele é a memória viva do projeto entre sessões.

---

**Última atualização:** 2026-05-24. Branch `feature/home-operacional-dashboard` em `169d909`.
