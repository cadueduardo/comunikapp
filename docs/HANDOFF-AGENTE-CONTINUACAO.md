# Handoff para o próximo agente — Home Operacional + Evolução Operacional

> **Para quem é este documento:** outro agente de IA (ou desenvolvedor humano) que vai continuar de onde paramos. Leia este arquivo inteiro antes de tocar em qualquer código. Ele é a fonte de verdade do **estado atual** e dos **próximos passos**.

> **Idioma:** todo código novo, comentários e textos visíveis devem estar em pt-BR com acentuação correta. UTF-8 obrigatório.

> **Plano-mãe (visão e princípios):** [`docs/plano-acao-home-onboarding-dashboard-operacional.md`](./plano-acao-home-onboarding-dashboard-operacional.md). Esse plano não muda; este handoff complementa com decisões, estado e o que falta.

---

## 1. Estado atual em uma frase

Em 2026-05-25, a **Fase 4 foi concluída**: o endpoint `GET /home-operacional/fluxo` agrega orçamentos V2 / OS em 5 colunas funcionais (`orcamentos`, `aprovados`, `revisao_tecnica`, `producao`, `prontos`) e devolve `a_receber` / `concluidos` em estado `aguardando_modulo` até a Fase 6. `HomeCacheService` cuida do TTL de 60s por `loja_id` e expõe `invalidar(...)` para os módulos downstream. Frontend tem `FluxoTrabalho` + `CardTrabalho` integrados em `/dashboard`.

Também foi entregue a **UX de aprovação da OS direto no grid** (`/os`): nova coluna "Aprovação" com badge contextual (Aprovada / Rejeitada) ou botão "Aprovar OS" para `PENDENTE`; coluna "Ações" migrou para dropdown "..." (Visualizar / Editar / Imprimir / Excluir). O modal `AprovarOSModal` lista os critérios (`dados_completos`, `arte_anexada`, `estoque_ok`, `prazo_viavel`) e só bloqueia aprovação quando `dados_completos = false`. Arte ausente e estoque vão para `alertas` mas **não bloqueiam** — suportam OS recorrente que não passa pelo ciclo de arte.

Próximo passo é **Fase 5 (Alertas operacionais)** — endpoint `GET /home-operacional/alertas` + componente `AlertasOperacionais`. Em paralelo, é hora de validar pela UI (1) o fluxo "Aprovar e gerar OS" introduzido na Fase 3, (2) a Home com a nova Fase 4 e (3) a nova UX de aprovação no grid de OS.

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
| c3ca82c | Fase 3 fix                | `impressao-os.service` lê de `itens_os` (encerra Fase 3).                                          |
| 48fa389 | Fase 3 / Fixes            | Ação "Aprovar e gerar OS" + `buildApiUrl` server-side absoluto + `obterRegrasAtivas` sem null.     |
| 33c176d | Sub-fase 2.F + Fase 3     | Consolidação geometria estruturada + `ItemOS` por produto.                                         |
| 169d909 | Fase 2 frontend (parte 1) | `QuickGeometryInput` + `SimuladorPrecificacao` + página `/orcamentos-v2/simulador` (andaime).      |
| 5417de4 | Fase 2 backend            | Geometria avançada em `ProdutoOrcamento`, `velocidade_ml_h` em `maquina`, módulo `estimativa-tempo`. |
| dcb9f98 | Fase 1 fix                | Esconder checklist quando todas as obrigatórias estão concluídas.                                  |
| 8537eba | Fase 1 frontend           | Dashboard com onboarding e banner de estado.                                                       |
| 71c4acf | Fase 1 backend            | Módulo `home-operacional` com onboarding, configuração recomendada e banner.                       |
| 66de457 | Fase 0                    | Decisões e contratos da Home operacional (10 documentos em `docs/fase-0-home-operacional/`).       |
| 0089746 | Plano                     | Plano de ação revisado com diretriz de dashboard com cards.                                        |

> Próximo commit (Fase 4) será adicionado a esta tabela na próxima atualização do HANDOFF; o resumo executivo da Fase 4 está logo abaixo, na seção 1.

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

### 3.9 Route handlers Next.js precisam de URL absoluta no `fetch`

Em `frontend/src/app/api/**/route.ts` (server-side), `fetch` exige URL absoluta. Vários route handlers ainda usam `buildApiUrl('')` (de `frontend/src/lib/config.ts`), que resolve para `"/api"` quando `NEXT_PUBLIC_API_URL` não está definido (caso padrão do dev local). O resultado em runtime é:

```text
TypeError: Failed to parse URL from /api/<rota>?...
[cause]: TypeError: Invalid URL
code: 'ERR_INVALID_URL'
```

O handler captura no `catch` e devolve `500` ao browser, escondendo a causa raiz.

**Mitigação aplicada (2026-05-25):** o helper `buildApiUrl(...)` em `frontend/src/lib/config.ts` foi instrumentado para detectar o ambiente. Em **server-side** (`typeof window === 'undefined'`), quando a base é relativa (`/api`, o default), ele troca por `process.env.BACKEND_URL || 'http://localhost:4000'`. No **browser**, mantém o caminho relativo (preserva o rewrite do `next.config.mjs`). Em produção com `NEXT_PUBLIC_API_URL` absoluta, devolve o valor original sem alterações. Isso eliminou o bug em todos os route handlers de uma vez, sem precisar mexer arquivo por arquivo.

**Como ficou na prática:**

```ts
// frontend/src/lib/config.ts
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseUrl;
  const isRelative = baseUrl.startsWith('/');
  const isServer = typeof window === 'undefined';
  if (isServer && isRelative) {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return `${backendUrl}${endpoint}`;
  }
  return `${baseUrl}${endpoint}`;
};
```

O route handler `frontend/src/app/api/os/route.ts` (commit `44433ce`) já estava usando `BACKEND_URL` direto; manter assim — não regredir para `buildApiUrl('')`. Os 15 routes listados a seguir continuam usando `buildApiUrl(...)` e agora funcionam corretamente:

- `centros-de-trabalho/setores-produtivos/route.ts`
- `centros-de-trabalho/setores-produtivos/operador/[operadorId]/route.ts`
- `centros-de-trabalho/setores-produtivos/setor/[id]/route.ts`
- `pcp/kanban/status/[osId]/route.ts`
- `pcp/kanban/geral/route.ts`
- `pcp/kanban/concluir/[itemOsId]/route.ts`
- `pcp/kanban/iniciar/[itemOsId]/route.ts`
- `pcp/kanban/pausar/[itemOsId]/route.ts`
- `pcp/kanban/fila-setor/[setorId]/route.ts`
- `pcp/workflows/sugestao/[osId]/route.ts`
- `pcp/workflows/atribuir/route.ts`
- `pcp/workflow-templates/route.ts`
- `pcp/workflow-templates/[id]/route.ts`
- `orcamentos-v2/[id]/publico/route.ts`
- `orcamentos-v2/[id]/publico/acao/route.ts`

**Validação:** simulei a função nos 4 cenários (server-side dev, server-side com `BACKEND_URL` custom, server-side produção com `NEXT_PUBLIC_API_URL` absoluta, client-side com `window` definido) e todos resolvem para a URL esperada.

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

**O que falta na Fase 2:** Sub-fase 2.F — integrar `QuickGeometryInput` no formulário grande, adicionar botão "Estimar tempo" na `MaquinaSection`, adicionar campo `unidade_geometria` (novo), integrar `SimuladorPrecificacao` como modal dentro do formulário (mantendo a página `/orcamentos-v2/simulador` como ferramenta standalone).

---

### 4.4 Atualização de 2026-05-25 — Sub-fase 2.F e início da Fase 3

**Sub-fase 2.F aplicada no código local:**

- `unidade_geometria` foi adicionada em `ProdutoOrcamento` por migration manual (`20260524160000_add_unidade_geometria`).
- O formulário principal de Orçamentos V2 passou a separar unidade de geometria da unidade comercial.
- `QuickGeometryInput` foi integrado ao produto, com área e perímetro calculados.
- `MaterialSection` passou a calcular consumo por área/perímetro usando a geometria, não a unidade comercial.
- `MaquinaSection` passou a usar botão explícito **Estimar**, preservando edição manual das horas.
- `SimuladorPrecificacao` foi integrado como modal e a página standalone foi mantida.
- WebSocket local passou a cair para `http://localhost:4000` quando não houver env pública configurada.

**Fase 3 iniciada no código local:**

- `ItemOS` recebeu campos estruturados de geometria por migration manual (`20260525120000_add_geometria_item_os`).
- `OSService.create()` agora persiste `insumos_calculados` tanto quando recebe array quanto quando recebe string JSON.
- `OSService.criarOSDeOrcamento()` agora cria um `ItemOS` por produto do orçamento e copia largura, altura, área, perímetro, unidade, origem da geometria e referência do anexo.
- O retorno de OS passou a expor `itens_os` formatados com geometria e insumos do item.
- A migração tardia de produto em `os-produto-prazo.service.ts` também copia os novos campos para `ItemOS`.

**Validação feita:** `npx prisma migrate deploy`, `npx prisma generate`, `npx tsc --noEmit` no backend e `git diff --check`.

**Pendências imediatas:** validar na interface um orçamento aprovado gerando OS com múltiplos itens (botão renomeado para "Aprovar e gerar OS") e verificar a impressão da OS pelo template. A migração de `impressao-os.service.ts` para `os.itens` foi concluída e validada por script. Detalhes em 4.6.

### 4.7 Fase 4 — Home operacional com cards (concluída em 2026-05-25)

**Decisões de produto confirmadas:**

- Inicia já agora (sem esperar validação manual da Fase 3 pela UI; usuário valida em paralelo).
- 7 colunas conforme contrato em `docs/fase-0-home-operacional/02-contratos-home-operacional.md` seção 5. As 2 colunas que dependem de Cobrança (`a_receber`, `concluidos`) ficam **visíveis** com `status: 'aguardando_modulo'` + aviso "Aguardando módulo financeiro (Fase 6)." em vez de serem ocultadas.

**Backend (`backend/src/home-operacional/`):**

- `interfaces/fluxo.interface.ts`: tipos `ColunaFluxo`, `CardFluxo`, `AcaoCardFluxo`, `StatusColunaFluxo`, `FluxoResponseData`. Estado por coluna: `ativa` ou `aguardando_modulo`.
- `services/home-cache.service.ts`: cache em memória (Map) com TTL fixo de 60s e métodos `obter / gravar / invalidar / limparTudo`. Exportado pelo módulo para que `OSService`, `OrcamentosV2Service` e outros possam chamar `invalidar(\`fluxo:${lojaId}\`)` quando uma mudança de estado relevante acontecer. Por ora apenas o TTL natural é exercitado; a fiação por evento fica para os módulos consumidores decidirem quando vale a pena.
- `services/fluxo-trabalho.service.ts`: monta as 5 colunas ativas com `Promise.all` para paralelizar 10 queries (5 counts + 5 findMany com `take: 5`). Helpers privados para labels pt-BR (`labelStatusOrcamento`, `labelStatusOS`) e formatação numérica robusta a Decimal/string/number do Prisma.
- `home-operacional.controller.ts`: novo `GET /home-operacional/fluxo?refresh=1?`. Envelope `{ data, meta }` com `meta.cache_hit` refletindo se veio do cache.
- `home-operacional.module.ts`: registra os dois novos services e exporta `HomeCacheService`.

**Mapeamento coluna → query (concreto):**

| Coluna | Where principal | Notas |
| --- | --- | --- |
| `orcamentos` | `status ∈ {rascunho, em_analise}` | Mostra ação "Enviar" para rascunho. |
| `aprovados` | `status = aprovado AND id NOT IN (orcamento_ids com OS)` | Ação rápida "Gerar OS" aponta para `POST /orcamentos-v2/:id/fechar-pedido`. |
| `revisao_tecnica` | `aprovacao_tecnica_status = PENDENTE AND status NOT IN (CANCELADA, FINALIZADA)` | Independe do status principal da OS. |
| `producao` | `status ∈ {FILA, AGUARDANDO_MATERIAL, PRODUCAO, ACABAMENTO} AND aprovacao_tecnica_status = APROVADA` | Inclui `AGUARDANDO_MATERIAL` para não esconder OS bloqueadas por estoque (alertas vêm na Fase 5). |
| `prontos` | `status = FINALIZADA` | Quando Cobrança existir, restringir para `cobranca.status ∈ {PREVISTA_SALDO, PARCIAL_PAGO}`. |
| `a_receber` | — | `aguardando_modulo`. |
| `concluidos` | — | `aguardando_modulo`. |

**Frontend:**

- `frontend/src/lib/home-operacional-api.ts`: types espelhados do backend + função `fetchFluxo({ refresh })`.
- `frontend/src/hooks/use-home-operacional.ts`: hook `useFluxoTrabalho()` com `recarregar({ forcar })` para forçar `?refresh=1`.
- `frontend/src/components/home-operacional/CardTrabalho.tsx`: card individual; corpo clicável se houver ação `abrir`; rodapé com até N ações (`href` vira `Link`, `endpoint` faz chamada direta via `apiRequest` e dispara `onAcaoConcluida`).
- `frontend/src/components/home-operacional/FluxoTrabalho.tsx`: layout responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7`); cabeçalho com botão de "atualizar agora". Trata 3 estados por coluna: aguardando_modulo (com aviso), vazia ativa ("Nada por aqui ainda."), com cards.
- `frontend/src/app/(main)/dashboard/page.tsx`: render do `FluxoTrabalho` abaixo do `OnboardingChecklist`.

**Validação ponta a ponta (script de debug, deletado depois):**

- Loja real do banco: `tisruw9j7`.
- 1ª chamada: 26 ms para 5 colunas; 2ª (via `HomeCacheService.obter`): 0 ms.
- `invalidar(...)` → próxima leitura retorna `null`.
- Dados reais: 12 OS em `revisao_tecnica`, 1 OS em `prontos`, demais zeradas.

**Pendências pequenas (não bloqueantes):**

- Conectar `HomeCacheService.invalidar(\`fluxo:${lojaId}\`)` aos pontos relevantes: criação/aprovação/edição de orçamento, criação/avanço/finalização de OS, aprovação técnica. Recomendo fazer junto com a Fase 5, porque os mesmos eventos vão alimentar os alertas.
- O contrato original previa `GET /home-operacional/resumo` consolidando banner+onboarding+fluxo+alertas+financeiro em uma única chamada. Não implementei nesta fase — o front faz 3-4 chamadas paralelas (banner, onboarding, fluxo) e isso é aceitável. Reabrir só se a Home começar a sofrer com first paint lento.

### 4.8 Aprovação de OS no grid `/os` (sessão da tarde de 2026-05-25)

**Contexto:** após a Fase 4, o usuário levantou que não havia como aprovar tecnicamente uma OS direto pelo grid — só dentro do detalhe da OS (`OSWorkflowActions.tsx`). Também trouxe uma dúvida importante de produto: a aprovação técnica estava amarrada ao módulo de arte? E como ficaria o caso de **OS recorrente** (sem ciclo de arte)?

**Diagnóstico (sem alteração de schema):**

- Em código, **OS comercial sempre nasce em `AGUARDANDO_APROVACAO_TECNICA`** com `aprovacao_tecnica_status = PENDENTE` (`os.service.ts` linha ~254).
- O `liberarParaPCP` de `ArteVersao` (`modules/arte-aprovacao/services/arte-versao.service.ts`) é independente da OS — não toca `aprovacao_tecnica_status`.
- `validarArteAnexada(...)` em `os.service.ts` era um TODO sempre retornando `true`; o `validarPreAprovacao` em `aprovacao-tecnica.service.ts` também tinha `arte_anexada = true` hard-coded.
- **Bomba latente:** se alguém ativasse a checagem real sem critério, toda OS comercial (inclusive recorrente) ficaria bloqueada esperando arte.

**Decisão de produto (aplicada nesta sessão):**

- Política de bloqueio reduzida ao mínimo necessário para integridade técnica: **apenas `dados_completos = false` bloqueia a aprovação**. Estoque e arte viram **alertas no payload**, nunca bloqueio. Isso resolve o cenário de OS recorrente sem precisar de nova flag de schema (ex.: `requer_arte`) — a decisão fica explícita na UI com o aprovador assumindo a responsabilidade.
- UX híbrida no grid: **coluna dedicada "Aprovação"** + **dropdown "..." para ações secundárias**. Não criamos uma ação nova "aprovar OS" — reaproveitamos o endpoint existente `PATCH /os/:id/aprovar-tecnica` (rota do `WorkflowComercialController`).

**Backend (mudanças):**

- `backend/src/os/services/aprovacao-tecnica.service.ts`:
  - `validarPreAprovacao`: `estoque_ok` agora reflete `os.materiais_disponivel` e gera alerta quando false. `arte_anexada` consulta `prisma.arteVersao.count({ os_id, deletado: false }) > 0` e gera alerta quando zero.
  - `aprovarTecnica`: removidos os `throw` por `estoque_ok` e `arte_anexada`. Mantido apenas o `throw` por `dados_completos`. Mensagem do bloqueio inclui `validacoes.alertas` para feedback claro.
- `backend/src/os/services/os.service.ts` (`formatarOrdemServico`):
  - Passa a expor `tipo_os`, `origem_os`, `prioridade` no payload de listagem. Os campos `aprovacao_tecnica_*` já eram expostos.

**Frontend (mudanças):**

- `frontend/src/components/ui/os/AprovarOSModal.tsx` (novo): carrega `GET /os/:id/aprovacao-tecnica/status` quando abre, lista os 4 critérios com ícones (`CheckCircle2` / warning) + section colapsável com `validacoes.alertas`. Botão principal varia entre "Aprovar OS" (sem alertas) e "Aprovar mesmo assim" (com alertas). Desabilita quando `dados_completos = false`. Chama `PATCH /os/:id/aprovar-tecnica` com `{ aprovado: true, observacoes: 'Aprovada via grid de OS' }` e dispara `onAprovado` para refazer o fetch da grid.
- `frontend/src/app/(main)/os/columns.tsx`:
  - Interface `OrdemServico` estendida com `aprovacao_tecnica_status`, `aprovacao_tecnica_por`, `aprovacao_tecnica_em`, `aprovacao_tecnica_obs`, `tipo_os`.
  - Nova coluna **`aprovacao`** com lógica: `tipo_os = INTERNA` → "—"; `APROVADA` → badge verde com tooltip de aprovador/data; `REJEITADA` → badge vermelha com tooltip da obs; `PENDENTE`/`null` → botão "Aprovar OS".
  - Coluna **`actions`** trocou os 3 ícones por um **dropdown "..."** (`shadcn DropdownMenu`) com: Visualizar / Editar / Imprimir / Excluir. O confirm de exclusão agora é renderizado no mesmo componente (`Dialog` direto), porque o `ConfirmDialog` antigo não suportava `children`/`open interno`.
  - `createColumns` agora exige 2 callbacks: `onDelete(id)` e `onAprovar(os)`.
- `frontend/src/app/(main)/os/page.tsx`: estado novo `aprovarTarget` + `aprovarModalOpen`. Passa os 2 callbacks pro `createColumns` e renderiza o `<AprovarOSModal />` no final da árvore.

**Comportamento UX confirmado:**

| Estado da OS | Coluna "Aprovação" |
| --- | --- |
| `tipo_os = INTERNA` | "—" |
| `aprovacao_tecnica_status = APROVADA` | Badge verde "Aprovada" + tooltip |
| `aprovacao_tecnica_status = REJEITADA` | Badge vermelha "Rejeitada" + tooltip da obs |
| `aprovacao_tecnica_status = PENDENTE` ou nulo | Botão "Aprovar OS" → modal |

**Armadilhas evitadas:**

- O `ConfirmDialog` em `frontend/src/components/ui/confirm-dialog.tsx` **não suporta `children` como trigger nem gerencia `open` internamente** — o uso anterior em `columns.tsx` era inválido (o `<Button Trash2>` envolvido por ele provavelmente não renderizava). A nova UI usa `Dialog` direto, o que também conserta esse bug de exclusão silencioso.
- O `aprovacao-tecnica.service.ts` é o "caminho A" da aprovação (`POST /os/:id/aprovar-tecnica`, controller `AprovacaoTecnicaController`); existe também o "caminho B" via `WorkflowComercialController` e o "caminho C" via `OSDiretaInternaController` (ambos `PATCH /os/:id/aprovar-tecnica` → `OSService.aprovarOSTecnica`). O modal acaba caindo no caminho C (testado pelo log do dev em 2026-05-25). Os 3 caminhos compartilham regras parecidas mas têm permissões/auditoria ligeiramente diferentes — manter atenção se for unificar no futuro.
- Há **divergência conhecida do enum `StatusOS`** vs `schema.prisma`: o `backend/src/os/interfaces/os.interfaces.ts` declara 14 estados (incluindo `AGUARDANDO_APROVACAO_TECNICA`, `APROVADA_TECNICA`, `LIBERADA_PARA_PCP`), mas o `schema.prisma` e `docs/fase-0-home-operacional/01-status-oficiais.md` listam apenas 7. **A query da coluna "Produção" no `FluxoTrabalhoService` ignora os 4 estados intermediários do workflow comercial** — a Fase 4 do dashboard pode estar perdendo OS em `APROVADA_TECNICA` ou `LIBERADA_PARA_PCP`. Reavaliar no início da Fase 5 ou em uma rodada de cleanup dos status.

**Hotfix posterior (2026-05-25, ainda na mesma sessão):**

Logo após o primeiro commit, ao testar pela UI o "Aprovar mesmo assim", apareceram 2 problemas:

1. **Hydration error** `<div> cannot be a descendant of <p>`: era um `<p className="sr-only">` envolvendo um `Badge` no rodapé do `AprovarOSModal` — sobra do scaffolding. Removido.
2. **PATCH 400 Bad Request** `OS não está aguardando aprovação técnica`: a OS estava em `status = 'FILA'` (criada por caminho antigo `criarOSComercial`, linha 781 de `os.service.ts`) com `aprovacao_tecnica_status = 'PENDENTE'`. **Os 2 campos são independentes** e o `OSService.aprovarOSTecnica` só aceitava `AGUARDANDO_APROVACAO_TECNICA`, travando OS legadas que ficaram com `FILA + PENDENTE`. Decisão: o gating real da aprovação técnica deve ser o campo `aprovacao_tecnica_status`, não o status operacional.

**Hotfix 2 — aprovação retroativa de OS legadas (2026-05-25, sessão da tarde):**

Após o primeiro hotfix, o usuário ainda viu várias OS na grid com badge cinza "Pendente" e apenas 1 OS com botão "Aprovar OS". Investigação: a maioria das OS antigas tinha avançado no workflow operacional (`PRODUCAO`, `ACABAMENTO`, `AGUARDANDO_MATERIAL`, etc.) sem nunca ter passado pelo checkpoint formal de aprovação técnica, ficando com `aprovacao_tecnica_status = PENDENTE` eternamente. O filtro estreito `[FILA, AGUARDANDO_APROVACAO_TECNICA]` impedia o usuário de regularizar.

**Decisão de produto:** permitir aprovação retroativa. Quando uma OS já avançou no operacional mas nunca foi aprovada tecnicamente, o aprovador pode registrar a decisão **sem retroceder o status operacional**. Mudanças:

- `os.service.aprovarOSTecnica` e `aprovacao-tecnica.service.aprovarTecnica`:
  - Trocaram lista de status PERMITIDOS por lista de status BLOQUEADOS — apenas `[FINALIZADA, CANCELADA, REJEITADA, APROVADA_TECNICA]` impedem aprovação. Qualquer outro status (incluindo intermediários do workflow comercial) aceita.
  - Quando o status atual está no fluxo padrão (`AGUARDANDO_APROVACAO_TECNICA` ou `FILA`), aprovação avança para `APROVADA_TECNICA` normalmente.
  - Quando o status atual é outro (aprovação retroativa), `aprovacao_tecnica_status` muda para `APROVADA` mas o `status` operacional é MANTIDO. Motivo de modificação inclui o sufixo "(retroativa)".
  - Movimentação registra o status real anterior (não hardcoded `AGUARDANDO_APROVACAO_TECNICA`).
- `columns.tsx` (`AprovacaoCell`): mostra o botão "Aprovar OS" para qualquer status não-bloqueado. Tooltip dinâmico avisa quando a aprovação é retroativa.
- `AprovarOSModal.tsx`: nova prop `osStatus`. Quando recebe um status fora do fluxo padrão, exibe alerta visual azul "Aprovação retroativa - A OS está atualmente em XXXXX. A aprovação será registrada mas o status não será alterado." e altera o texto da `DialogDescription` para refletir o cenário. A `observacoes` enviada também é diferenciada com sufixo "(retroativa)" para auditoria.

**Conjuntos sincronizados frontend/backend:**

```text
STATUS_BLOQUEIA_APROVACAO = { FINALIZADA, CANCELADA, REJEITADA, APROVADA_TECNICA }
STATUS_FLUXO_PADRAO       = { AGUARDANDO_APROVACAO_TECNICA, FILA }
```

Se forem alterados, atualizar nos 4 lugares: `os.service.ts`, `aprovacao-tecnica.service.ts`, `columns.tsx`, `AprovarOSModal.tsx`.

### 4.5 Atualização de 2026-05-25 (sessão da tarde) — Fixes urgentes do "Fechar pedido"

Durante a tentativa de fechar um pedido via UI (`POST /orcamentos-v2/:id/fechar-pedido`), o backend devolvia `500` com a mensagem genérica `"Falha ao fechar pedido e gerar OS. O orçamento foi revertido."` — a exceção real ficava engolida no `try/catch` de `fecharPedidoInterno`. Reproduzindo o fluxo por script (`NestFactory.createApplicationContext` + `OrcamentosV2Service.fecharPedidoInterno`) e inspeção do banco, foram identificados e corrigidos **três bugs** introduzidos pela ampliação de `criarOSDeOrcamento` na Sub-fase 2.F / Fase 3:

1. **`data_prazo` recebia texto livre** (commit `021ec1d`)
   - `orcamento.prazo_entrega` é `String? @default("10 a 15 dias úteis")` (texto livre), mas o novo `criarOSDeOrcamento` passava esse valor direto para `OrdemServico.data_prazo` (DateTime). Resultado: Prisma rejeitava com `Invalid value for argument data_prazo: input contains invalid characters. Expected ISO-8601 DateTime.`
   - Fix em camadas: `OrcamentosV2Service.parsePrazoEntregaIso(...)` descarta texto não parseável; `OSService.normalizarDataPrazo(...)` no `create()` valida `new Date(...)` e grava `NULL` com warning quando inválido.

2. **`prioridade` herdada com valor fora do enum** (commit `1e7e422`)
   - `orcamento.prioridade` é `String?` livre (default `"NORMAL"`), mas existem registros antigos com `"media"`. A nova linha `prioridade: dadosOrcamento.prioridade ?? PrioridadeOS.NORMAL` propagava o valor sujo; `OSService.validarDadosBasicos` recusava com `BadRequestException: Prioridade inválida: media`.
   - Fix: `OSService.normalizarPrioridadeOS(...)` converte para UPPERCASE, mapeia `MEDIA | MEDIO | MEDIUM → NORMAL` e cai em `NORMAL` (com warning) para qualquer outro valor fora de `URGENTE | ALTA | NORMAL | BAIXA`. Aplicado **apenas no caminho `criarOSDeOrcamento`** (a validação principal continua intacta para o fluxo manual).

3. **Proxy `/api/os` chamava URL relativa** (commit `44433ce`)
   - `frontend/src/app/api/os/route.ts` usava `buildApiUrl('')` que resolvia para `"/api"`. Em server-side o `fetch('/api/os?...')` lança `ERR_INVALID_URL`. Trocado por `process.env.BACKEND_URL || 'http://localhost:4000'` (padrão das demais rotas). Vide armadilha 3.9 para a lista de outros 15 handlers com o mesmo bug latente.

**Validação:** o script de debug rodou o fluxo completo (`fecharPedidoInterno` → `criarOSAutomaticaParaOrcamento` → `OSService.criarOSDeOrcamento` → `prisma.itemOS.createMany`) contra um orçamento real (`cmpl6saaf0002w4qwpwhfn56g`, 2 produtos com geometria mm/cm) e retornou `success: true`, criando `OS-2026-006` com 2 `ItemOS` (geometria preservada, `insumos_calculados` consistentes). O estado de teste foi **revertido** no banco para o usuário poder testar pela UI.

**Pendências decorrentes desta sessão (todas tratadas em 2026-05-25, sessão posterior):**

- ~~Aplicar o mesmo fix de `BACKEND_URL` nos 15 route handlers listados na armadilha 3.9~~ — **Resolvido na origem.** O helper `buildApiUrl(...)` em `frontend/src/lib/config.ts` foi instrumentado para detectar server-side e cair em `process.env.BACKEND_URL` quando a base é relativa. Os 15 routes ficaram funcionais sem precisar mexer em cada arquivo. Ver armadilha 3.9 atualizada.
- ~~Confirmar com o dono do projeto se a **ação "Aprovar orçamento e gerar OS"** prevista na Fase 3 é a mesma coisa que o atual `fecharPedidoInterno`~~ — **Decisão tomada em 2026-05-25:** é a mesma. Mantemos o endpoint `/fechar-pedido` e o nome `fecharPedidoInterno` por compatibilidade, mas:
  - Labels da UI passaram de `"Fechar pedido"` → `"Aprovar e gerar OS"` (e `"Fechando..."` → `"Aprovando..."`).
  - Evento de auditoria interno passou de `PEDIDO_FECHADO_INTERNAMENTE` → `APROVADO_INTERNAMENTE_E_OS_GERADA`.
  - String de `origem` em `criarOSAutomaticaParaOrcamento` passou de `FECHAMENTO_RAPIDO` → `APROVACAO_INTERNA`.
  - O fluxo interno agora dispara `notificarAcaoCliente(orcamento, 'APROVAR')`, gerando o mesmo `TipoNotificacao.ORCAMENTO_APROVADO` que a aprovação via link público. A falha da notificação **não reverte** a aprovação (apenas warning no log) — a aprovação + criação de OS já estão registradas em log de auditoria com tipo dedicado.
- ~~Bug não-bloqueante em `RegrasValidacaoService.obterRegrasAtivas`~~ — **Corrigido em 2026-05-25.** O schema do `RegraValidacao` define `loja_id String` (não-anulável), então o `OR: [{ loja_id: lojaId }, { loja_id: null }]` era tipologicamente inválido — Prisma reclamava com "Argument loja_id is missing". O `loja_id: null` representava "regras globais", conceito que o schema atual não suporta. Simplifiquei para `where: { ativo: true, loja_id: lojaId }`. Se "regras globais" vierem a ser requisito, primeiro torne `loja_id` opcional no schema. Comentário JSDoc explicando o histórico está no método.

### 4.6 Análise de entregável 4 da Fase 3 (PCP/estoque lendo `itens_os`)

Mapeamento read-only feito em 2026-05-25 para identificar onde o backend ainda lê `orcamento.produtos` em contextos pós-OS (onde idealmente deveria consultar `itens_os`).

**Concluído em 2026-05-25 (sessão final):**

- ~~`backend/src/os/services/impressao-os.service.ts`~~ — **Migrado.** A função `gerarDadosImpressao` agora consome `os.itens` para `produtos` e `insumos`. Implementação:
  - Carrega `itens` no `findUnique` da OS (com `orderBy [ordem_producao, criado_em]`).
  - `montarProdutosImpressao(os)`: prioriza `os.itens`, mapeia cada item para `{ id, nome, quantidade, largura, altura, profundidade, area, perimetro, unidade_medida, observacoes }`. `profundidade` é recuperada do JSON `parametros_tecnicos` quando presente. Cai em `os.orcamento.produtos` se a OS não tiver itens (OS legacy criada antes de Fase 3).
  - `montarInsumosImpressao(os)`: itera `os.itens`, faz `JSON.parse` defensivo de `insumos_necessarios` (formato `InsumoCalculado`) e espelha `quantidade_necessaria → quantidade` para manter compatibilidade com `TransformacaoDadosHelper.extrairMateriaisPrincipais` e com o template HTML. Fallback nos insumos do orçamento se não houver itens válidos.
  - `parseInsumosNecessarios` e `parseParametrosTecnicos`: helpers `private` aceitando string/array/object/null sem lançar erro.
  - **Dívida técnica documentada (não-bloqueante para Fase 4):** `ItemOS` ainda não persiste máquinas e serviços manuais. Esses dois domínios continuam vindo de `os.orcamento.produtos.flatMap(...)`. Se o orçamento for editado depois de gerar a OS, máquinas/serviços manuais na impressão podem ficar desincronizados. Tratamento estrutural exige migration aditiva em `ItemOS` (`maquinas_necessarias`, `servicos_manuais_necessarios` JSON) + ajuste de `montarItensOSDoOrcamento` — deixar para quando a Fase 4 (PCP) precisar dessa informação por item.
  - Validado por script ponta a ponta em OS real (OS-2026-007 com 2 itens, 4 insumos via JSON `insumos_necessarios`).

**Aceitável (consumidores legítimos de `orcamento.produtos`):**

- Todo `backend/src/orcamentos-v2/...` — ainda é o domínio do orçamento, lê `produtos` corretamente.
- `backend/src/os/services/os.service.ts` linhas 1297, 2500-2503, 2880-2888 — esses métodos são parte do **flow de criação da OS** (`criarOSDeOrcamento`, `montarItensOSDoOrcamento`, `extrairMateriaisDoOrcamento`); precisam ler do orçamento para popular `itens_os` na primeira vez.
- `backend/src/os/services/os-produto-prazo.service.ts` — serviço de migração tardia (legacy) de `ProdutoOrcamento` para `ItemOS`.
- `backend/src/modules/arte-aprovacao/services/arte-mensagem.service.ts:564` — migração de comentários antigos.
- `backend/src/configuracoes/controllers/campos-validacao.controller.ts` e `test-campos-validacao.controller.ts` — listam strings de campos disponíveis para regras de validação (não consomem dados de fato).

**A revisar com baixa prioridade:**

- `backend/src/orcamentos-v2/services/validacao-estoque.service.ts` — itera `orcamento.produtos` para validar reservas. Hoje é chamado pré-OS (validação do orçamento); se vier a ser invocado pós-OS, deve mudar para `itens_os`.
- `backend/src/orcamentos-v2/services/notificacao-v2.service.ts:787` — gating de notificação. Verificar se a lógica esperada é "tem produtos no orçamento" ou "tem itens na OS".

## 5. Próximo passo: concluir Fase 3 e validar OS/PCP

> **Objetivo:** trazer o `QuickGeometryInput` e a estimativa de tempo de máquina para dentro do formulário real de orçamento (`/orcamentos-v2/novo` e `/orcamentos-v2/novo?id=...`). Ao final, o usuário não digita mais área manualmente — ele digita largura/altura/unidade de geometria e o sistema preenche área e perímetro. Quando ele adiciona uma máquina ao produto, ganha um botão "Estimar tempo" que preenche `horas_utilizadas`. Adicionalmente, ele tem um botão "Simular preço" que abre o `SimuladorPrecificacao` em modal.

### 5.1 Mapa do formulário (confirmado em 2026-05-24)

- Página: `frontend/src/app/(main)/orcamentos-v2/novo/page.tsx` (carrega e transforma dados).
- Componente principal: `frontend/src/components/ui/orcamentos-v2/orcamento-v2-form.tsx` (1692 linhas).
- Schema Zod e tipos: `frontend/src/components/ui/orcamento/schemas/orcamento.schema.ts`.
- **Seção do produto (largura/altura/unidade/área):** `frontend/src/components/ui/orcamento/components/ProdutoSection.tsx`. Hoje calcula área via função local `calcularAreaAutomatica`.
- **Seção das máquinas:** `frontend/src/components/ui/orcamento/components/MaquinaSection.tsx`. Já calcula automaticamente para `M2_H`. Tem stub para `ML_H` "como implementação pendente" — é exatamente aí que o `postEstimarTempoMaquina` entra para passar a calcular corte linear.
- Preview: `frontend/src/components/ui/shared/sections/PreviewCalculoV2.tsx`.
- Cálculo client-side: `frontend/src/components/ui/shared/utils/preview-calculo.helpers.ts` (função `calcularProdutosPreview`).

> **Verificar antes de codar:** abrir `ProdutoSection.tsx` e ler `calcularAreaAutomatica` para confirmar em **qual unidade** a função interpreta `largura` e `altura` hoje. Hipótese atual: mm. Isso define o fallback do frontend para registros antigos sem `unidade_geometria`.

### 5.2 Decisões já tomadas (NÃO reabrir)

1. **`unidade_geometria` é campo separado**, dedicado à geometria (`mm | cm | m`). NÃO reaproveitar `unidade_medida_produto`, que continua sendo a **unidade comercial** do produto (`un`, `kg`, `m²`, etc.).
2. **`unidade_geometria` é persistido no banco** (não só estado do formulário). Auditoria e propagação para `ItemOS` na Fase 3 dependem disso.
3. **Default histórico:** registros antigos têm `unidade_geometria = NULL` no banco. Frontend interpreta `NULL` como `'mm'` e exibe aviso discreto "unidade não confirmada — assumindo mm" no QuickGeometryInput quando estiver editando um orçamento antigo. Ao salvar, grava a unidade real escolhida. **Sem backfill no banco**.
4. **`SimuladorPrecificacao`** → modal acionado por botão "Simular preço" dentro do formulário (pré-preenchido com o custo total atual do produto/orçamento) **+ manter** a página `/orcamentos-v2/simulador` renomeada como "Ferramentas > Simulador de precificação".
5. **Geometria atual é só `MANUAL`.** Anexos (`IMAGEM`, `DXF`) ficam para a Fase 7.

### 5.3 Plano da Sub-fase 2.F em etapas

> Faça uma etapa por commit. Não tente tudo de uma vez. Cada etapa marcada com `[BACKEND]`, `[FRONTEND]` ou `[FULLSTACK]`.

#### Etapa 2.F.1 — `[BACKEND]` Migration aditiva para `unidade_geometria`

1. Editar `backend/prisma/schema.prisma`, adicionando ao model `ProdutoOrcamento`:

   ```prisma
   // Unidade original informada na geometria (mm | cm | m). NULL em registros
   // anteriores à Fase 2.F. Frontend interpreta NULL como 'mm' (default
   // histórico do projeto). Ver docs/HANDOFF-AGENTE-CONTINUACAO.md seção 5.2.
   unidade_geometria String? @db.VarChar(4)
   ```

2. Criar `backend/prisma/migrations/AAAAMMDDHHMMSS_add_unidade_geometria/migration.sql`:

   ```sql
   ALTER TABLE `ProdutoOrcamento` ADD COLUMN `unidade_geometria` VARCHAR(4) NULL;
   ```

   Use um timestamp **futuro** ao `20260524150000` (próxima sequência: `20260524160000` ou maior).

3. **NÃO** rodar `npx prisma migrate dev` (ver Armadilha 3.1). Use o fluxo seguro:

   ```powershell
   # Pedir usuário parar npm run dev primeiro
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   npx prisma migrate status   # deve dizer "up to date"
   ```

4. Confirmar diff zero:

   ```powershell
   npx prisma migrate diff --from-url "mysql://root@localhost:3306/comunikapp" --to-schema-datamodel prisma/schema.prisma --exit-code
   ```

#### Etapa 2.F.2 — `[BACKEND]` DTO + persistência dos campos novos no orçamento

Os campos `perimetro_produto`, `geometria_origem`, `arquivo_geometria_url`, `arquivo_geometria_metadados` (já na Fase 2.A) e `unidade_geometria` (Fase 2.F.1) ainda **não chegam no `ProdutoOrcamento.create()`**. Hoje o DTO de criação/edição os ignora.

1. Localizar o DTO em `backend/src/orcamentos-v2/dto/`. Provavelmente é o DTO do item de produto dentro de `create-orcamento-v2.dto.ts` ou um arquivo separado `produto-orcamento.dto.ts`. Use `Grep largura_produto backend/src/orcamentos-v2/dto`.
2. Adicionar os 5 campos novos como opcionais:

   ```ts
   @IsOptional() @IsNumberString() perimetro_produto?: string;
   @IsOptional() @IsIn(['MANUAL', 'IMAGEM', 'DXF']) geometria_origem?: 'MANUAL' | 'IMAGEM' | 'DXF';
   @IsOptional() @IsString() arquivo_geometria_url?: string;
   @IsOptional() @IsString() arquivo_geometria_metadados?: string;
   @IsOptional() @IsIn(['mm', 'cm', 'm']) unidade_geometria?: 'mm' | 'cm' | 'm';
   ```

3. Localizar `ProdutoOrcamento.create()` e `ProdutoOrcamento.update()` em `backend/src/orcamentos-v2/services/orcamentos-v2.service.ts` (e `transformacao-v2.service.ts` se aplicável) e incluir os campos no objeto `data`.

#### Etapa 2.F.3 — `[FRONTEND]` Schema Zod + tipo do formulário

Em `frontend/src/components/ui/orcamento/schemas/orcamento.schema.ts`, adicionar ao schema do item de produto:

```ts
perimetro_produto: z.string().optional(),
geometria_origem: z.enum(['MANUAL', 'IMAGEM', 'DXF']).optional(),
arquivo_geometria_url: z.string().optional(),
unidade_geometria: z.enum(['mm', 'cm', 'm']).optional(),
```

Em `orcamento-v2-form.tsx` e em `novo/page.tsx`, atualizar:
- `defaultValues` (tanto novo quanto reset).
- Mapeador `onLoad` que transforma `orcamentoData.produtos` em `formData.itens_produto`.
- Mapeador `onSubmit` que monta o payload para o backend.

#### Etapa 2.F.4 — `[FRONTEND]` Integrar `QuickGeometryInput` no `ProdutoSection`

1. Importar:
   ```ts
   import { QuickGeometryInput, GeometriaValor, GeometriaCalculada } from '@/components/orcamentos-v2/QuickGeometryInput';
   ```
2. Remover (ou esconder, conforme decisão visual) os 3 inputs separados de largura, altura e unidade de geometria. **Manter** o campo de `unidade_medida_produto` (unidade comercial).
3. Para cada item de produto, construir o `valor` a partir do react-hook-form:
   ```ts
   const valor: GeometriaValor = {
     largura: watch(`itens_produto.${index}.largura_produto`) || '',
     altura: watch(`itens_produto.${index}.altura_produto`) || '',
     unidade: (watch(`itens_produto.${index}.unidade_geometria`) as 'mm'|'cm'|'m') || 'mm',
   };
   ```
4. No callback `onChange(valor, calc)`:
   ```ts
   setValue(`itens_produto.${index}.largura_produto`, valor.largura);
   setValue(`itens_produto.${index}.altura_produto`, valor.altura);
   setValue(`itens_produto.${index}.unidade_geometria`, valor.unidade);
   setValue(`itens_produto.${index}.area_produto`, String(calc.area_m2));
   setValue(`itens_produto.${index}.perimetro_produto`, String(calc.perimetro_mm));
   setValue(`itens_produto.${index}.geometria_origem`, 'MANUAL');
   ```
5. Substituir a chamada interna a `calcularAreaAutomatica` pela área já calculada pelo `QuickGeometryInput` (evitar dupla fonte de verdade).
6. Em modo edição, se `unidade_geometria` vier `undefined` da API, exibir mensagem discreta abaixo do componente: "Unidade não confirmada para este orçamento — assumindo mm. Confirme abaixo." (texto curto, sem alarme visual forte).

#### Etapa 2.F.5 — `[FRONTEND]` Botão "Estimar tempo" na `MaquinaSection`

Localizar o bloco que renderiza cada `ItemMaquina` do produto. Hoje já há cálculo automático para `M2_H` e um stub para `ML_H` "como implementação pendente". Substituir o stub:

1. Adicionar botão pequeno (ícone + texto curto, ex.: `<Clock />` "Estimar") ao lado do input `horas_utilizadas`.
2. Habilitar o botão **apenas** se o produto já tem `area_produto > 0` (para M2_H) ou `perimetro_produto > 0` (para ML_H).
3. Ao clicar:
   ```ts
   import { postEstimarTempoMaquina } from '@/lib/estimativa-tempo-api';

   const resultado = await postEstimarTempoMaquina({
     maquina_id,
     quantidade: Number(watch(`itens_produto.${index}.quantidade_produto`) || 1),
     area_m2: Number(watch(`itens_produto.${index}.area_produto`)) || undefined,
     perimetro_mm: Number(watch(`itens_produto.${index}.perimetro_produto`)) || undefined,
   });
   ```
4. Se `resultado.estimativa_possivel === true`:
   - `setValue(...horas_utilizadas, String(resultado.tempo_horas))`.
   - `toast.success(\`Tempo estimado: \${resultado.tempo_horas}h (modo \${resultado.detalhamento.modo_producao})\`)`.
5. Se `false`:
   - `toast.info(resultado.detalhamento.mensagens[0] || 'Estimativa não disponível para esta máquina')`.
6. **Importante:** o valor estimado é só sugestão. O input continua editável pelo usuário.

#### Etapa 2.F.6 — `[FRONTEND]` `SimuladorPrecificacao` como modal no formulário

1. Adicionar botão "Simular preço" na barra de ações do formulário (perto do botão "Salvar").
2. Ao clicar, abrir um `Dialog` (`@/components/ui/dialog`) contendo o `<SimuladorPrecificacao />`.
3. Passar como props os defaults pré-calculados do estado atual do formulário:
   ```tsx
   <SimuladorPrecificacao
     custoInicial={preview.custoTotalProducao}
     margemInicial={Number(watch('margem_lucro_customizada'))}
     impostosInicial={Number(watch('impostos_customizados'))}
     comissaoInicial={Number(watch('comissao_percentual'))}
     tipoInicial={(watch('tipo_margem_lucro') as 'markup' | 'margem_por_dentro') || 'margem_por_dentro'}
   />
   ```
4. **NÃO** sincronizar de volta automaticamente. O simulador é só "calculadora de cenário". Se o usuário gostar do resultado, ele ajusta os campos no formulário manualmente.

#### Etapa 2.F.7 — `[FRONTEND]` Renomear página standalone para "Ferramentas"

1. **Não remover** `/orcamentos-v2/simulador/page.tsx`.
2. Trocar o título da página de "Simulador de orçamento (Fase 2)" para "Simulador de precificação". Remover o subtítulo "(Fase 2)".
3. Opcional (se houver tempo): adicionar item no menu lateral em uma seção "Ferramentas" apontando para essa rota. Caso a sidebar não tenha essa seção, deixar para a Fase 8 (que já vai mexer em navegação).

### 5.4 Critérios de aceite da Sub-fase 2.F

- Migration `add_unidade_geometria` aplicada com sucesso, sem warnings, e `migrate status` reportando "up to date".
- Cliente Prisma regenerado e tsc do backend passando.
- Usuário cria um orçamento novo, digita largura 1000 / altura 500 / unidade mm e vê área 0,5 m² e perímetro 3 m calculados na hora.
- Os campos `area_produto`, `perimetro_produto`, `unidade_geometria='mm'` e `geometria_origem='MANUAL'` chegam ao banco.
- Em modo edição de orçamento antigo (criado antes da migration), o sistema exibe aviso discreto sobre unidade não confirmada e funciona normalmente assumindo mm.
- Usuário adiciona uma máquina, clica "Estimar tempo" e vê o campo de horas preenchido para M2_H **e** ML_H.
- Usuário sobrescreve o valor estimado e o sistema aceita.
- Botão "Simular preço" abre modal pré-preenchido. Fechar o modal não muda nada no formulário.
- Página `/orcamentos-v2/simulador` continua funcionando, apenas com título renomeado.
- `unidade_medida_produto` (unidade comercial) **continua intocado** para produtos vendidos por `un`, `kg`, etc.

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
| `unidade_geometria` é campo separado em `ProdutoOrcamento` (`mm | cm | m`), NÃO reaproveita `unidade_medida_produto` (que continua sendo unidade comercial: `un`, `kg`, `m²`, etc.). | Decisão de produto em 2026-05-24, antes da Sub-fase 2.F. |
| `unidade_geometria` é persistido no banco para auditoria e propagação futura para `ItemOS` (Fase 3). Não fica só no estado do formulário.        | Decisão de produto em 2026-05-24.                        |
| Registros antigos têm `unidade_geometria = NULL`. **Sem backfill** no banco. Frontend interpreta `NULL` como `'mm'` e exibe aviso "unidade não confirmada — assumindo mm" no QuickGeometryInput. | Decisão de produto em 2026-05-24.                        |
| `SimuladorPrecificacao` vira **modal acionado por botão "Simular preço"** dentro do formulário de orçamento. A página `/orcamentos-v2/simulador` é mantida e renomeada para "Simulador de precificação" como ferramenta standalone (futura entrada em "Ferramentas" no menu, possivelmente na Fase 8). | Decisão de produto em 2026-05-24.                        |
| Geometria avançada na Fase 2 é só `MANUAL`. Anexos de `IMAGEM` e `DXF` ficam para a Fase 7.                                                       | Plano-mãe + escopo combinado.                            |

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

**Última atualização:** 2026-05-24 (handoff revisado com decisões de produto da Sub-fase 2.F: `unidade_geometria` separado, default histórico `mm` sem backfill, `SimuladorPrecificacao` como modal + página standalone, mapeamento confirmado de `ProdutoSection.tsx` e `MaquinaSection.tsx`).
Branch `feature/home-operacional-dashboard`.
