# Handoff para o próximo agente — Home Operacional + Evolução Operacional

> **Para quem é este documento:** outro agente de IA (ou desenvolvedor humano) que vai continuar de onde paramos. Leia este arquivo inteiro antes de tocar em qualquer código. Ele é a fonte de verdade do **estado atual** e dos **próximos passos**.

> **Idioma:** todo código novo, comentários e textos visíveis devem estar em pt-BR com acentuação correta. UTF-8 obrigatório.

> **Plano-mãe (visão e princípios):** [`docs/plano-acao-home-onboarding-dashboard-operacional.md`](./plano-acao-home-onboarding-dashboard-operacional.md). Esse plano não muda; este handoff complementa com decisões, estado e o que falta.

---

## 1. Estado atual em uma frase

Em 2026-05-26 (manhã), a **Fase 7 (DXF real / anexos) foi fechada** com as **Sub-fases 7.A, 7.B, 7.B+ e 7.B++ entregues**. (1) **7.A:** anexo único de imagem/DXF no topo do produto do Orçamento V2 (Ctrl+V, drag-and-drop, file picker), endpoint multi-tenant em `POST /orcamentos-v2/anexos-geometria`, e Leitura B em `arte_anexada`. (2) **7.B:** `DxfParserService` (`dxf-parser@1.1.2`) extrai `$PROJECTNAME`, unidade (`$INSUNITS`), bounding box, área (shoelace ou envolvente) e perímetro por camada (LINE/LWPOLYLINE/POLYLINE/CIRCLE/ARC/ELLIPSE). O card `DxfRevisaoCard` exibe os valores e exige clique em "Aplicar ao produto" — **parser nunca preenche sozinho**. (3) **7.B+:** `DxfSugestaoInsumoService` adiciona seção "Materiais sugeridos" no card via heurística por nome de camada (stop-list de operações + matching contra `Insumo.nome`/`TipoMaterial.nome`/`Categoria.nome` da loja), com botão "Atrelar" por sugestão. (4) **7.B++:** o parser passou a extrair também `descricao_projeto` (concatenação de `$TITLE/$SUBJECT/$KEYWORDS/$COMMENTS/$AUTHOR`) que preenche o campo "Descrição" do produto (se vazio) e alimenta o scoring de insumo com peso reduzido (0.5). E o card ganhou botão "Cadastrar novo" por camada → abre `NovoInsumoModal` compacto (8 campos obrigatórios + lógica de consumo) que, ao salvar, atrela o insumo recém-criado ao produto e recarrega as sugestões. Detalhes nas seções 4.15, 4.16, 4.17 e 4.18.

Antes disso, a **Fase 6 foi concluída** (sub-fases 6.A a 6.E entre 2026-05-25 e 2026-05-26): condição de pagamento estruturada no orçamento, cobrança criada automaticamente na aprovação (`CobrancasService`), bloco `ResumoFinanceiroSimples` na Home, tela `/financeiro/recebimentos` com auditoria/ações/CSV, cron diário recategoriza cobranças vencidas, 7º alerta operacional `trabalho_pronto_sem_recebimento` e colunas `a_receber`/`concluidos` no fluxo de trabalho. Comissões: `3e432e6`, `9436a15`, `afa2d68`, `30fbeba`, `75f9e0c`.

Antes ainda, foram entregues a **Fase 5** (`GET /home-operacional/alertas` com 6 detectores e `AlertasOperacionais` em `/dashboard`) e a **Fase 4** (`GET /home-operacional/fluxo` com cache TTL 60s e `FluxoTrabalho` em `/dashboard`).

Também ficaram em produção: a **UX de aprovação da OS direto no grid** (`/os`) com modal `AprovarOSModal` listando os critérios (`dados_completos`, `arte_anexada`, `estoque_ok`, `prazo_viavel`); **prazos por serviço** no mesmo modal (4.13) com prazo "mãe" para aplicar em todos de uma vez (4.14); **fix estrutural** do `OSPrazoService` que corrompia `OrdemServico.status` (4.11) + endpoint admin de recuperação; **auto-promoção** OS → PCP na aprovação técnica (4.10).

**Próximo passo:** Fase 7 fechada (7.A + 7.B + 7.B+ + 7.B++ entregues). O usuário aprovou criar uma fase dedicada à **profundidade no orçamento** como último item do handoff — afeta schema (`ProdutoOrcamento` + `ItemOS`), motor de cálculo (novo `tipo_calculo` ou modificador `usa_profundidade=true`), UI do `QuickGeometryInput` e templates. Está registrada como **Fase 11** em `docs/plano-acao-home-onboarding-dashboard-operacional.md` (foi numerada 11 porque 9 e 10 já estavam reservadas para outros temas no plano-mãe). O plano traz 3 decisões a confirmar antes de implementar (modelagem do motor, unidade da profundidade, escopo de "caixa fechada vs aberta"). Dívidas menores conhecidas: discretização de `SPLINE` no parser (4.16), cleanup de anexos órfãos (4.15), "Passo 2" de regras configuráveis de match de insumo (4.17), captura de `MTEXT/TEXT` para descrição (4.18) e criação inline de categoria/fornecedor no `NovoInsumoModal` (4.18). Nenhuma bloqueia uso de produção.

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

### 3.5.1 CRÍTICO: NUNCA usar `Set-Content`/`Out-File` do PowerShell 5.1 sem `-Encoding UTF8`

O encoding padrão do PowerShell 5.1 (Windows) para `Set-Content`, `Out-File` e `>` é **Default (ANSI/Windows-1252)** — NÃO é UTF-8. Isso corrompe silenciosamente qualquer arquivo contendo caracteres acentuados (`ç`, `ã`, `ú`, `é`, etc.), porque os bytes UTF-8 multi-byte são reinterpretados/sobrescritos como bytes single-byte Latin-1.

**Sintoma de corrupção:** ao rodar `npm run dev`, o Next.js (turbopack) cospe:

```text
Build Error
Reading source code for parsing failed
./src/app/.../page.tsx
- invalid utf-8 sequence of 1 bytes from index XXXX
```

E o request HTTP cai com `500` em qualquer rota dependente (inclusive `/favicon.ico`, `/api/lojas/me`, etc.) porque o servidor não consegue montar a árvore de rotas.

**Caso real (2026-05-25):** o commit `435cec7` (`refactor(layout): padding lateral centralizado...`) usou um script PowerShell com `Set-Content -NoNewline -Path $f -Value $new` para fazer substituições em massa em ~60 páginas. Resultado: o `ú` (`0xC3 0xBA` em UTF-8) virou `0xE1` (Latin-1) e o build quebrou em `os/page.tsx` no byte 1833. O fix foi `git revert HEAD` + reaplicar tudo via Node.js (`fs.writeFileSync(f, Buffer.from(novo, 'utf-8'))`), validando com `new TextDecoder('utf-8', { fatal: true })` antes/depois.

**Regras obrigatórias para substituições em massa:**

1. **Prefira `StrReplace` (tool)** ou edição direta arquivo a arquivo no IDE — preserva UTF-8 nativamente.
2. Se precisar de script em batch, **use Node.js**, NÃO PowerShell. Node lê/escreve UTF-8 por padrão e oferece `TextDecoder({fatal:true})` para validação.
3. Se for absolutamente necessário usar PowerShell, **sempre** especifique `-Encoding UTF8`:
   ```powershell
   Set-Content -Path $f -Value $novo -Encoding UTF8 -NoNewline
   # ou explicitamente sem BOM:
   [System.IO.File]::WriteAllText($f, $novo, [System.Text.UTF8Encoding]::new($false))
   ```
4. **Sempre valide** após uma edição em massa rodando algo como:
   ```bash
   node -e "const fs=require('fs');const cp=require('child_process');for(const f of cp.execSync('git diff --name-only HEAD').toString().split(/\\r?\\n/)){if(!f.endsWith('.tsx'))continue;try{new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(f));}catch(e){console.log('BAD',f)}}"
   ```

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

### 4.9 Fase 5 concluída — Alertas operacionais (2026-05-25, sessão da tarde 2)

**Escopo entregue:** `GET /home-operacional/alertas` + componente `AlertasOperacionais` no `/dashboard`. Reutiliza o `HomeCacheService` (TTL de 60s, bypass via `?refresh=1`). Resposta segue contrato da Fase 0 (`docs/fase-0-home-operacional/02-contratos-home-operacional.md` seção 6).

**6 detectores implementados** (cada um isolado em try/catch — uma falha não derruba os outros). Limiares hardcoded conforme decisão de produto desta sessão:

| Detector                              | Nível    | Origem      | Regra                                                                                       |
| ------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------- |
| `orcamento_parado_<id>`               | atencao  | orcamentos  | `orcamento.status ∈ {rascunho, em_analise}` AND `atualizado_em < hoje - 5 dias`             |
| `orcamento_aprovado_sem_os_<id>`      | atencao  | orcamentos  | `orcamento.status = 'aprovado'` AND `atualizado_em < hoje - 1 dia` AND não tem OS vinculada |
| `os_aguardando_aprovacao_tecnica_<id>`| atencao  | os          | `aprovacao_tecnica_status = 'PENDENTE'` AND `status ∉ STATUS_OS_IGNORAR_APROVACAO`          |
| `os_liberada_sem_workflow_<id>`       | critico  | pcp         | `status ∈ STATUS_OS_LIBERADA` AND `workflow_instancia IS NULL`                              |
| `estoque_abaixo_minimo_<id>`          | atencao  | estoque     | `insumo.ativo` AND `estoque_minimo > 0` AND `estoque_atual < estoque_minimo` (filtro em mem.) |
| `os_sem_materiais_<id>`               | critico  | estoque     | `status ∈ STATUS_OS_LIBERADA` AND `materiais_disponivel = false`                            |

**Conjuntos sincronizados em `backend/src/home-operacional/services/alertas-operacionais.service.ts`:**

```text
STATUS_OS_IGNORAR_APROVACAO = { FINALIZADA, CANCELADA, REJEITADA, APROVADA_TECNICA }
STATUS_OS_LIBERADA          = { APROVADA_TECNICA, LIBERADA_PARA_PCP, PRODUCAO, ACABAMENTO, AGUARDANDO_MATERIAL }
```

Cada detector limita o resultado entre 20 e 30 registros para a UI não inflar. A ordenação final é `critico > atencao > informativo`, e dentro do mesmo nível, mais recentes primeiro.

**Arquivos criados:**

- Backend: `interfaces/alerta.interface.ts`, `services/alertas-operacionais.service.ts` + integração no controller + módulo.
- Frontend: `lib/home-operacional-api.ts` (tipos `Alerta`, `AlertasResumo`, `fetchAlertas`), `hooks/use-home-operacional.ts` (`useAlertasOperacionais`), `components/home-operacional/AlertaCard.tsx`, `components/home-operacional/AlertasOperacionais.tsx`, integração em `app/(main)/dashboard/page.tsx`.

**Hierarquia visual no card:**

- `critico`: borda + fundo vermelhos suaves (`border-red-300 bg-red-50/70`), ícone `AlertCircle` vermelho, chip "Crítico" `bg-red-100`.
- `atencao`: borda + fundo âmbar suaves (`border-amber-300 bg-amber-50/70`), ícone `AlertTriangle` âmbar, chip "Atenção" `bg-amber-100`.
- `informativo`: borda neutra (`border-zinc-200 bg-zinc-50/70`), ícone `Info`, chip "Informativo" `bg-zinc-100`.

**Pendência conhecida (não-bloqueante):**

- O 7º alerta previsto pelo plano-mãe — `trabalho_pronto_sem_recebimento` — depende da Fase 6 (módulo financeiro / cobranças). Aparece hoje como nota discreta no rodapé do bloco no `/dashboard` ("O alerta 'trabalho pronto sem recebimento' será habilitado quando o módulo financeiro (Fase 6) for liberado.").

**Como invalidar o cache em outros módulos** (quando ações relevantes acontecem):

```ts
import { HomeCacheService } from '../home-operacional/services/home-cache.service';
// ...
constructor(private readonly homeCacheService: HomeCacheService) {}

// Em ações que alteram orçamentos, OS, estoque etc:
this.homeCacheService.invalidar(`alertas:${lojaId}`);
this.homeCacheService.invalidar(`fluxo:${lojaId}`);
```

**Critérios de aceite cumpridos:**

- Endpoint mapeado pelo Nest no startup (`Mapped {/home-operacional/alertas, GET}` no log).
- Front consome via `useAlertasOperacionais` com loading skeleton, erro com retry e refresh manual (`?refresh=1`).
- Ordenação por nível conforme contrato (vem ordenado do back).
- Estado vazio mostra mensagem amigável em vez de esconder o bloco (decisão UX desta sessão — divergente do plano-mãe que dizia "esconder se vazio"; mantemos o bloco visível para o usuário saber que o sistema está monitorando, em vez de parecer que algo quebrou).

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

### 4.10 Fix do Kanban PCP — aprovação técnica passa a liberar para o PCP (2026-05-25)

**Contexto:** Após as Fases 4–5 e a UX de aprovação no grid `/os` (4.8), foi descoberto que **OS aprovadas tecnicamente nunca apareciam no Kanban PCP**. Investigação revelou 4 bugs simultâneos:

1. **Filtro do `PCPKanbanService.obterKanbanGeral`** era restrito a `[LIBERADA_PARA_PCP, EM_WORKFLOW, FINALIZADA]`, enquanto a aprovação técnica deixava a OS em `APROVADA_TECNICA`.
2. **Não havia trigger automático** que criasse `WorkflowInstancia` na aprovação técnica.
3. **`KanbanMapper.mapearOSParaKanban` tratava `workflow_instancia` como array** (`?.[0]`), mas o schema declara relação 1-para-1 opcional. Consequência: setor, operador e progresso dos cards sempre vazios.
4. **`KanbanMapper.mapearStatusOS` devolvia status técnicos** (`LIBERADA_PARA_PCP`, `EM_WORKFLOW`, `FINALIZADA`) que não batiam com os buckets esperados pelo `KanbanBoard` do frontend (`FILA`, `PRODUCAO`, `CONCLUIDA`). Resultado: mesmo a OS chegando no kanban, ela caía em buckets inexistentes e não renderizava.

**Decisão de produto (aplicada nesta sessão):**

A aprovação técnica passa a **promover a OS direto para `LIBERADA_PARA_PCP`** no fluxo padrão (quando a OS estava em `AGUARDANDO_APROVACAO_TECNICA` ou `FILA`). O status `APROVADA_TECNICA` deixa de ser estado de repouso porque a etapa seguinte (liberar para PCP) era sempre manual e ninguém fazia, deixando a OS invisível ao kanban. **Aprovação técnica = liberação para PCP**.

**Mudanças backend (4 arquivos):**

- `backend/src/pcp/services/pcp-kanban.service.ts`:
  - `obterKanbanGeral`: filtro ampliado para `aprovacao_tecnica_status = 'APROVADA'` + `status ∈ {LIBERADA_PARA_PCP, EM_WORKFLOW, PRODUCAO, ACABAMENTO, AGUARDANDO_MATERIAL, FINALIZADA}`. Espelha o set já usado por `FluxoTrabalhoService.montarColunaProducao`, `kpi-dashboard.service` e `alertas-operacionais.service`.
- `backend/src/pcp/mappers/kanban.mapper.ts`:
  - `mapearOSParaKanban` e `calcularProgresso`: trocaram `os.workflow_instancia?.[0]` por `os.workflow_instancia` (relação 1-para-1 opcional).
  - `mapearStatusOS`: agora mapeia para `FILA | PRODUCAO | CONCLUIDA | REJEITADA` (buckets do `KanbanBoard`). Tabela:
    - `LIBERADA_PARA_PCP`, `AGUARDANDO_MATERIAL` → `FILA`
    - `EM_WORKFLOW`, `PRODUCAO`, `ACABAMENTO` → `PRODUCAO`
    - `FINALIZADA` → `CONCLUIDA`
    - `REJEITADA`, `CANCELADA` → `REJEITADA`
  - `calcularEstatisticas`: contadores ajustados para os novos buckets (antes contavam status técnicos que nunca apareciam após o mapeamento).
- `backend/src/os/services/os.service.ts`:
  - `aprovarOSTecnica`: no fluxo padrão, status novo passa a ser `LIBERADA_PARA_PCP` (era `APROVADA_TECNICA`). Motivo da modificação reflete o novo significado: "Aprovação técnica aprovada e OS liberada para PCP". Fluxo retroativo continua mantendo o status atual (sem alteração).
  - Novo helper público `promoverAprovacaoParaPCP(osId, lojaId, usuarioId)`: libera itens `PENDENTE` para `LIBERADO`, dispara `notificarOSLiberadaParaPCP`, tenta `workflowAssignmentService.atribuirWorkflow`. Cada passo em try/catch warn — falhas não revertem a aprovação. Reaproveitado pelo `AprovacaoTecnicaService` para evitar duplicação.
- `backend/src/os/services/aprovacao-tecnica.service.ts`:
  - `aprovarTecnica`: mesma promoção (`LIBERADA_PARA_PCP` no fluxo padrão) + chama `osService.promoverAprovacaoParaPCP`. `OSService` injetado via `forwardRef` para evitar ciclo de inicialização dentro do mesmo módulo.
  - `agendarInstalacao`: gating ampliado de `status === 'APROVADA_TECNICA'` para `status ∈ {APROVADA_TECNICA, LIBERADA_PARA_PCP, EM_WORKFLOW, PRODUCAO, ACABAMENTO, AGUARDANDO_MATERIAL}` AND `aprovacao_tecnica_status = 'APROVADA'`. APROVADA_TECNICA continua aceito para não quebrar OS legadas.

**Mudanças frontend (1 arquivo):**

- `frontend/src/components/ui/os/OSWorkflowActions.tsx`:
  - Novos cases para `LIBERADA_PARA_PCP` e `EM_WORKFLOW`: mensagem informativa + botão "Abrir Kanban PCP" (link para `/pcp/kanban`). Sem botões de transição direta — a partir daqui a operação é via Kanban.
  - `statusComAcoes` ampliado para incluir os dois novos estados.

**Comportamento esperado pós-mudança:**

| Antes | Depois |
| --- | --- |
| Usuário aprova OS → status fica `APROVADA_TECNICA` → OS não aparece no kanban | Usuário aprova OS → status vira `LIBERADA_PARA_PCP` (ou `EM_WORKFLOW` se houver categoria inteligente) → OS aparece imediatamente no kanban na coluna correta |
| Itens da OS ficam `status_liberacao_pcp = PENDENTE` (precisa liberar item por item) | Itens em `PENDENTE` viram `LIBERADO` automaticamente (decisão consolidada na aprovação) |
| `OSWorkflowActions.tsx` mostra botão "Iniciar Produção" → muda status sem passar pelo PCP | `OSWorkflowActions.tsx` mostra link para `/pcp/kanban` quando OS já está no PCP |

**Pontos de atenção / dívida técnica:**

- Se a OS já tinha sido vinculada a uma `WorkflowInstancia` manualmente antes da aprovação (caso raro), o `atribuirWorkflow` detecta a instância existente e adiciona itens novos no mesmo workflow — não duplica.
- Se não houver `WorkflowCategoria` cadastrada na loja, a OS fica em `LIBERADA_PARA_PCP` sem `WorkflowInstancia`. O kanban ainda mostra (filtro aceita esse status) mas o usuário precisa vincular workflow manualmente pelo modal "Vincular workflow" do PCP.
- O fluxo `LiberacaoPCPController.liberarParaPCP` continua existindo — agora é redundante para o caso padrão, mas continua sendo o canal para forçar workflow específico ou re-liberar OS legadas.
- Documentação canônica em `docs/fase-0-home-operacional/01-status-oficiais.md` ainda lista `APROVADA_TECNICA` como estado intermediário. Manter o documento, mas o fluxo real agora pula esse estado — atualizar quando for revisar os status oficiais (provavelmente junto com a Fase 6).
- Testes unitários existentes (`os-direta-interna.service.spec.ts`) usam `expect.objectContaining` apenas para `aprovacao_tecnica_status`, então continuam passando. Não foram adicionados testes novos para o helper `promoverAprovacaoParaPCP` — fica como TODO se a equipe quiser cobertura.

### 4.11 Bug histórico do `OSPrazoService` corrompendo o `status` operacional (2026-05-25, sessão noturna)

**Sintoma:** após o fix da seção 4.10, OS aprovadas pelo modal do grid continuavam sumindo do Kanban PCP em casos específicos. A OS#2026-007 apareceu com `status = AGUARDANDO_INICIO` e `aprovacao_tecnica_status = APROVADA` — combinação que o filtro do kanban não conhece.

**Diagnóstico:** o `OSPrazoService.definirPrazo` (`backend/src/os/services/os-prazo.service.ts`) gravava no campo `OrdemServico.status` valores que não pertencem ao enum operacional (`AGUARDANDO_INICIO`, `PRONTA_PRODUCAO`). São na verdade conceitos de "status de prazo" — calculados dinamicamente em `consultarStatusPrazo` a partir da `data_prazo`. O autor original misturou os dois conceitos. Resultado: toda vez que um usuário definia ou atualizava o prazo de uma OS, o `status` operacional era destruído.

Sequência típica do bug:

1. OS criada com `status = AGUARDANDO_APROVACAO_TECNICA`.
2. Usuário define prazo via `PrazoOSComponent` no detalhe da OS → status sobrescrito para `AGUARDANDO_INICIO` (prazo futuro) ou `PRONTA_PRODUCAO` (prazo hoje/retroativo).
3. Usuário aprova tecnicamente → como o status atual não está no fluxo padrão (`{AGUARDANDO_APROVACAO_TECNICA, FILA}`), a aprovação cai no caminho retroativo (mantém status atual) → não promove para `LIBERADA_PARA_PCP`.
4. Kanban filtra apenas status operacionais válidos → OS some.

**Confirmação isolada:** procurei `AGUARDANDO_INICIO`/`PRONTA_PRODUCAO`/`EM_PRODUCAO` em todo o backend. Só aparecem em `os-prazo.service.ts` (escrita) e no DTO de resposta `os-prazo.dto.ts` (`StatusPrazoResponse`). Nenhum outro código (PCP, kanban, alertas, home, fluxo de trabalho) usa esses valores para nada. Confirma que é um bug isolado.

**Correção estrutural aplicada:**

- `backend/src/os/services/os-prazo.service.ts`:
  - `definirPrazo` **parou** de gravar `status: novoStatus`. Atualiza apenas `data_prazo`, `atualizado_em`, `modificado_por`, `motivo_modificacao`.
  - O retorno continua incluindo `status` (com o valor calculado `AGUARDANDO_INICIO`/`PRONTA_PRODUCAO`) para preservar compatibilidade com `PrazoOSComponent` no front, mas agora é apenas projeção em memória, não persistido.
  - `consultarStatusPrazo` continua igual: já calculava dinamicamente a partir da `data_prazo`.

**Endpoint admin de recuperação:**

- `POST /os/admin/recuperar-status` (gated por `funcao === 'ADMINISTRADOR'` no controller, multi-tenant por `loja_id`).
- Body opcional:
  - `dry_run: boolean` — calcula o plano sem gravar.
  - `os_id: string` — opera apenas naquela OS (caso contrário varre todas as OS da loja com `status ∈ {AGUARDANDO_INICIO, PRONTA_PRODUCAO, EM_PRODUCAO}`).
- Regra de reconstrução, em ordem de prioridade:
  1. `aprovacao_tecnica_status = 'APROVADA'`  → `LIBERADA_PARA_PCP`
  2. `aprovacao_tecnica_status = 'REJEITADA'` → `REJEITADA`
  3. `tipo_os = 'COMERCIAL'` (pendente) → `AGUARDANDO_APROVACAO_TECNICA`
  4. `tipo_os = 'INTERNA'`   (pendente) → `AGUARDANDO_APROVACAO_ORCAMENTARIA`
  5. fallback → `FILA`
- Retorna `{ total_analisadas, total_corrigidas, dry_run, detalhes: [{ os_id, numero, status_anterior, status_novo, motivo, aplicado }] }`.
- Arquivos novos: `backend/src/os/services/os-admin.service.ts`, `backend/src/os/controllers/os-admin.controller.ts`. Registrados em `os.module.ts`.

**Correção pontual aplicada nesta sessão:**

- A OS#2026-007 (`numero = OS-2026-007`, `id = cmpl9vn7o000ow4age3rxv9kj`, `loja_id = tisruw9j7`) foi corrigida via script Node único (`backend/scripts/recuperar-os-2026-007.ts`, deletado após uso). Estado anterior: `status = AGUARDANDO_INICIO`. Estado novo: `status = LIBERADA_PARA_PCP`. Já aparece no Kanban PCP na coluna FILA.

**Pontos de atenção:**

- Se houver outras lojas com OS corrompidas, o administrador deve chamar `POST /os/admin/recuperar-status` (com `dry_run=true` primeiro para revisar). O endpoint é seguro: opera só na própria loja do usuário autenticado.
- O conceito de "status de prazo" (`AGUARDANDO_INICIO`/`PRONTA_PRODUCAO`) continua existindo e sendo devolvido pelo `consultarStatusPrazo` e pelo `definirPrazo`, mas agora apenas como informação calculada — nunca persistido. O frontend `PrazoOSComponent` continua funcionando sem alterações.
- O DTO `StatusPrazoResponse` ainda declara `EM_PRODUCAO` como possível valor de `status`, mas esse valor **nunca foi gravado por código** e o `consultarStatusPrazo` também nunca o retorna. Pode ser removido em uma limpeza futura.
- Não foi adicionada migração automatizada de schema — a recuperação fica sob demanda via endpoint. Se a quantidade de OS corrompidas for grande, considerar rodar uma vez `dry_run=true` para mapear o impacto.

### 4.12 Prazo obrigatório no modal de aprovação + auto-liberação de itens (2026-05-25, sessão tardia)

**Sintoma:** mesmo após o fix da seção 4.10 e a correção pontual da OS#2026-007, o usuário viu que:

1. Ao tentar atribuir um workflow no PCP para uma OS aprovada, os dois produtos apareciam com badge `PENDENTE` no modal "Atribuir workflow" — impossibilitando seleção.
2. Após editar as datas dos produtos no detalhe da OS (já aprovada e no PCP), os produtos continuavam travados — não eram liberados automaticamente.

**Diagnóstico:**

- A OS#2026-007 foi aprovada **antes** do helper `promoverAprovacaoParaPCP` existir (commit da 4.10). O script de recuperação (4.11) corrigiu o `status` operacional, mas não tocou nos `ItemOS` — eles continuaram `status_liberacao_pcp = 'PENDENTE'`.
- `OSProdutoPrazoService.definirPrazoProduto` por design só atualizava `data_prazo_produto`, `data_inicio_producao`, `prioridade_produto`, `ordem_producao`. Liberar para PCP exigia chamada separada (`liberarProdutoPCP`). UX confusa: o usuário esperava que alterar prazo refletisse no PCP automaticamente.
- A OS#2026-007 também não tinha prazo de produção definido no momento da aprovação (apenas `data_prazo`), porque o modal de aprovação não cobrava isso. Esse foi exatamente o cenário que provocou todos os problemas.

**Correções aplicadas:**

**Schema (`backend/prisma/schema.prisma`):**

- Adicionada coluna `data_inicio_prevista DateTime?` em `OrdemServico`. Representa a data planejada de início da produção (definida na aprovação técnica). Aplicada via `prisma db push`.

**Backend — fluxo de aprovação técnica:**

- `backend/src/os/dto/aprovacao-tecnica.dto.ts`:
  - `AprovarTecnicaDto` ganhou `data_inicio_prevista?: string` e `data_prazo?: string` (ambos `IsDateString` opcionais).
  - `AprovacaoTecnicaResponseDto` retorna `data_inicio_prevista` e `data_prazo` para o front pré-preencher os campos.

- `backend/src/os/services/aprovacao-tecnica.service.ts` (`aprovarTecnica`):
  - Em **fluxo padrão**, se `aprovado=true` e a OS ainda não tem `data_prazo` no banco, o `data_prazo` no payload é **obrigatório** → 400 caso contrário.
  - Em **fluxo retroativo**, os campos são opcionais (a OS já andou).
  - Valida ordenação temporal: `inicio <= fim` (considera valor recém-enviado OR valor já no banco).
  - Persiste as datas **antes** de invocar `promoverAprovacaoParaPCP` (que libera itens e tenta workflow). Garante que a OS já chega ao PCP com prazo definido.

- `backend/src/os/services/os.service.ts` (`aprovarOSTecnica`):
  - Mesma lógica, exposta também pelo `WorkflowComercialController.PATCH /os/:id/aprovar-tecnica` e `os-direta-interna.controller.ts`. Adicionados parâmetros `dataInicioPrevista?` e `dataPrazo?` (Date opcionais).
  - Controllers convertem strings ISO em Date antes de chamar o service; `undefined` mantém o valor atual no banco.

- `getStatusAprovacao` agora retorna `data_inicio_prevista` e `data_prazo` (usado pelo `AprovarOSModal` para pré-preencher).

**Backend — auto-liberação ao definir prazo do produto:**

- `backend/src/os/services/os-produto-prazo.service.ts` (`definirPrazoProduto`):
  - Quando `os.aprovacao_tecnica_status = 'APROVADA'` e o item ainda está `status_liberacao_pcp = 'PENDENTE'`, salvar o prazo libera **automaticamente** para o PCP (seta `LIBERADO`, `liberado_pcp_por`, `liberado_pcp_em`).
  - O response inclui `liberado_para_pcp: boolean` indicando se houve auto-liberação.
  - Para itens já `LIBERADO` ou OS ainda não aprovada, o comportamento antigo é mantido.

**Backend — endpoint admin reconcilia itens:**

- `backend/src/os/services/os-admin.service.ts` (`recuperarStatusOS`):
  - Além de corrigir o `status` operacional corrompido, agora também conta e libera `ItemOS` ainda `PENDENTE` em qualquer OS com `aprovacao_tecnica_status = 'APROVADA'` (independente de o status estar corrompido ou não).
  - Cada `DetalheRecuperacaoStatus` ganhou `itens_liberados: number`. O resumo final inclui `total_itens_liberados`.
  - Em modo `osId` específico, se o status atual NÃO está corrompido mas há itens pendentes, ainda assim a OS é processada (`aplicado=true` quando algo é alterado).
  - Liberador atribuído: `aprovacao_tecnica_por > criado_por > 'SISTEMA'` (mantém rastreabilidade).

**Frontend — modal de aprovação:**

- `frontend/src/components/ui/os/AprovarOSModal.tsx`:
  - Novo card "Plano de produção" com 2 inputs `type="date"`:
    - **Data de início** (pré-preenchida com a `data_inicio_prevista` atual da OS OU `new Date()`).
    - **Data de entrega** (pré-preenchida com `data_prazo` atual OU `new Date() + 7 dias`). **Obrigatória em fluxo padrão**.
  - Validação em tempo real: bloqueia o botão "Aprovar" se data fim vazia ou início > fim (apenas em fluxo padrão; retroativo permite aprovar sem informar).
  - Envia `data_inicio_prevista` e `data_prazo` no body da `PATCH /os/:id/aprovar-tecnica`. Strings vazias não são enviadas (deixa o backend manter o valor atual).
  - Função local `formatarDataInput` evita o bug clássico de fuso ao usar `toISOString()` em datas locais.

**Correção pontual aplicada nesta sessão:**

- Itens da OS#2026-007 (`cmpl9vl1v0000w4agx1t4lbu4` Lona com Ilhós, `cmpl9vl1v0009w4agvythaiot` Acrilico) liberados manualmente via script Node único (deletado após uso): `status_liberacao_pcp` mudou de `PENDENTE` para `LIBERADO`, com `liberado_pcp_por = aprovacao_tecnica_por` da OS. Agora aparecem como liberados no modal "Atribuir workflow" do PCP.

**Pontos de atenção:**

- O endpoint `POST /os/admin/recuperar-status` agora também reconcilia itens, então se o usuário quiser destravar todas as OS legadas de uma loja em uma operação só, basta chamar o endpoint sem `os_id`.
- O cenário do `definirPrazoProduto` agora libera o item automaticamente. Se a equipe quiser uma operação não destrutiva (definir prazo SEM liberar), pode-se adicionar um flag `liberar_automatico?: boolean` no DTO no futuro. Decisão atual (2026-05-25): UX simples > flexibilidade.
- O `prisma db push` foi usado em vez de `migrate dev`. Para deploy em produção, considerar transformar em migration formal antes do release.
- Frontend: os arquivos pré-existentes do projeto têm erros TS que **não** são causados por esta sessão. Não foi feita limpeza geral.

### 4.13 Correção do modelo: prazos por serviço (não pela OS inteira) (2026-05-25)

**Feedback do usuário (literal):** *"o prazo é por serviço na OS e não nela inteira... Eu posso liberar para a OS completa, mas posso colocar prazos diferentes para cada serviço nela"*.

Eu havia interpretado mal a seção 4.12: adicionei `data_inicio_prevista` no `OrdemServico` e construí o modal com 2 campos no nível da OS. O modelo correto é:

- `OrdemServico.data_prazo` = prazo guarda-chuva (data limite global).
- `ItemOS.data_inicio_producao` + `ItemOS.data_prazo_produto` = prazos por serviço (já existiam no schema).
- Cada serviço pode ter prazo diferente, todos `<= OrdemServico.data_prazo`.

**Mudanças aplicadas (revertendo/corrigindo a 4.12):**

**Schema (`backend/prisma/schema.prisma`):**

- Coluna `data_inicio_prevista` removida do `OrdemServico` (db push). Não chegou a ir para produção.

**Backend — DTO (`aprovacao-tecnica.dto.ts`):**

- `AprovarTecnicaDto` ganhou `prazos_itens?: PrazoItemAprovacaoDto[]`. Cada item carrega `item_id`, `data_inicio_producao?`, `data_prazo_produto?` (strings ISO).
- `AprovacaoTecnicaResponseDto` perdeu `data_inicio_prevista` e ganhou `itens?: ItemAprovacaoInfo[]` com os prazos atuais de cada `ItemOS`.

**Backend — `aprovacao-tecnica.service.ts`:**

- `aprovarTecnica` agora chama dois helpers privados antes do update:
  - `validarEPrepararPrazosItens(osId, prazos, exigirCompleto)`: garante que todos os `item_id` pertencem à OS, valida `inicio <= fim` por item, e em fluxo padrão exige `data_prazo_produto` em **todos** os itens (mensagem identifica o serviço faltante).
  - `calcularPrazoGuardaChuva(dataPrazoAtual, prazos)`: se a OS ainda não tem `data_prazo`, usa o maior `data_prazo_produto`. Se já tem e algum item excede, bloqueia com 400.
- Persistência dos prazos por item feita em batch com `Promise.all(prisma.itemOS.update(...))` após o `update` da OS.
- `getStatusAprovacao` agora carrega `os.itens` (select limitado) e devolve a lista no response.

**Backend — `os.service.ts`:**

- `aprovarOSTecnica` mudou a assinatura: removidos `dataInicioPrevista?` e `dataPrazo?`, adicionado `prazosItens?: Array<{ item_id, data_inicio_producao?, data_prazo_produto? }>`.
- Helpers privados duplicados (`validarEPrepararPrazosItens` + `calcularPrazoGuardaChuvaOS`) com a mesma lógica. (Decisão consciente: manter cada service autocontido para não introduzir dependência cruzada.)

**Backend — controllers (`workflow-comercial.controller.ts` e `os-direta-interna.controller.ts`):**

- Body agora declara `prazos_itens?: Array<{ item_id, data_inicio_producao?, data_prazo_produto? }>` (strings).
- Conversão para Date feita no controller; campos vazios → `undefined` (não atualizar).

**Frontend (`AprovarOSModal.tsx`):**

- Modal renderiza um card "Plano de produção por serviço" com **uma linha por `ItemOS`**, cada uma com inputs `type="date"` de início e fim.
- Pré-preenchimento por serviço:
  - Início: `data_inicio_producao` atual do item OU hoje.
  - Fim: `data_prazo_produto` atual do item OU `data_prazo` da OS OU hoje+7.
- Validação em tempo real (`useMemo`):
  - Em fluxo padrão, `data_fim` é obrigatória em todos os serviços.
  - `data_inicio <= data_fim` por item.
  - `data_fim` não pode exceder `data_prazo` da OS (input `max` + erro inline).
- Botão "Aprovar" desabilitado se algum item inválido (apenas em fluxo padrão).
- Payload enviado: `prazos_itens: [{ item_id, data_inicio_producao, data_prazo_produto }]`.
- `prazoOSLabel` mostrado no canto superior do card como info read-only (formato `pt-BR`).
- Modal alargado para `sm:max-w-2xl` e com scroll vertical (`max-h-[90vh] overflow-y-auto`) para OSs com muitos serviços.

**Pontos de atenção:**

- `OSPrazoService.definirPrazo` e `OSProdutoPrazoService.definirPrazoProduto` continuam funcionando para edições posteriores. A 4.12 já garantiu que alterar prazo do produto auto-libera para PCP se a OS estiver aprovada — esse comportamento permanece.
- A "data de início" da OS como um todo deixa de existir. Se algum relatório futuro precisar de "início consolidado", pode calcular `min(data_inicio_producao)` dos itens em tempo de leitura.
- Os helpers `validarEPrepararPrazosItens` ficaram duplicados em `AprovacaoTecnicaService` e `OSService`. Se a equipe quiser DRY, pode extrair para um util compartilhado — preferi manter explícito por enquanto.
- `prisma db push` foi usado para remover a coluna `data_inicio_prevista` adicionada na 4.12. Se a 4.12 já tinha ido para produção em algum ambiente, vai precisar de migration. **Não foi para produção neste branch.**

### 4.14 Prazo "mãe" no modal de aprovação + restauração de acentos UTF-8 (2026-05-26)

**Feedback do usuário (literal):** *"veja a imagem do modal, ficou ótimo o prazo para cada serviço, mas acho que deveria ter um prazo mãe para aprovar de uma vez só. Percebi que não está com acentuação no modal, eu solicitei explicitamente que é UTF-8 e que preciso dos acentos."*

Duas frentes de ajuste sobre a 4.13:

**Frontend (`AprovarOSModal.tsx`):**

- Quando a OS tem 2+ serviços, o modal mostra um novo bloco "Aplicar prazo a todos os serviços" entre o cabeçalho e a lista de itens.
- Esse bloco tem 2 inputs (Início, Entrega) + botão "Aplicar a todos". Pré-preenchido com `hoje` / `data_prazo` da OS (ou `hoje + 7`).
- Validações replicadas: `início <= entrega` e `entrega <= prazo limite da OS`.
- Comportamento conservador: se um dos lados estiver vazio, só o lado preenchido é replicado para os itens.
- Toda a UI/UX do modal teve seus textos visíveis revisados para UTF-8 com acentos corretos (títulos, descrições, labels, mensagens de erro, toasts).

**Backend (acentos):**

- Mensagens de `BadRequestException` em `AprovacaoTecnicaService` e `OSService` agora têm acentuação (campos como "Defina a data de entrega de cada serviço", "Data de início inválida", "não pertence a esta OS", "não pode ser posterior à data de entrega", "Algum serviço tem prazo maior...").
- Comentários JSDoc + warns dos helpers de promoção (`OSService.promoverAprovacaoParaPCP`) e da auditoria de `motivo_modificacao` em `OSAdminService` também ganharam acentos.

Commit: `5bfc40e`.

---

### 4.15 Início da Fase 7 — Sub-fase 7.A: Anexo de imagem/DXF no produto do orçamento (2026-05-26)

**Feedback do usuário (literal):**
- *"Quando trabalhar o anexar imagem no orçamento (subir o DXF ou o copia e cola), ele já deve ser entendido como a arte da OS"*
- *"o recurso de arrastar e soltar na área do upload também será bem válido"*
- *"A área de anexar ou colar, deve ser no topo do produto (imagem)"*
- *"Se no DXF já ter o nome do projeto, já extrai também o nome e preencha o campo Nome do Produto"*

**Diferenças em relação ao plano-mãe original da Fase 7:**

| Item | Plano-mãe original | Decisão de 2026-05-26 |
| --- | --- | --- |
| Métodos de entrada do anexo | apenas `onPaste` (Ctrl+V) e upload via file picker | **+ drag-and-drop** na mesma área |
| Posição do anexo no card de produto | não especificada | **TOPO do card**, antes do "Nome do Produto" |
| Relação `arquivo_geometria_url` ↔ critério `arte_anexada` | rejeitada pela Fase 0 (doc `05-persistencia-anexos.md`): nunca misturar `ArteArquivo` com geometria | **Leitura B aprovada pelo usuário**: a imagem/DXF do orçamento conta como arte da OS gerada (sem criar ArteVersao). O módulo `Arte & Aprovação` permanece para casos que precisam de revisão profissional |
| Extração do nome do projeto do DXF | não documentada | **Sugerir nome do produto somente se o campo estiver vazio** (nunca sobrescrever digitação do operador) |

**O que foi entregue na Sub-fase 7.A (este commit):**

**Backend:**

- `backend/src/config/multer-anexo-geometria.config.ts` (novo): `memoryStorage` + classificador `classificarAnexoGeometria(mime, nome)` que devolve `'IMAGEM' | 'DXF' | null`. Aceita PNG/JPG/JPEG/WEBP/GIF como imagem e o trio `application/dxf`/`application/x-dxf`/`image/x-dxf` + fallback por extensão `.dxf` (porque o mime do DXF varia entre exportadores, alguns enviam `application/octet-stream`).
- `backend/src/orcamentos-v2/services/anexo-geometria.service.ts` (novo): grava o arquivo em `<COMUNIKAPP_ANEXOS_DIR ou ./uploads/anexos>/geometria/<loja_id>/<token>.<ext>` e um `.json` ao lado com metadados (mime, tamanho, hash SHA-256, `loja_id`, `criado_por`, `criado_em`, `nome_original`). Multi-tenant garantido por: (a) gravação na pasta da loja, (b) validação do `loja_id` do JWT contra o metadado no GET. Devolve 403 explícito se o token existir em outra loja (detecta cross-tenant access tentado por enumeração de UUID).
- `backend/src/orcamentos-v2/controllers/anexo-geometria.controller.ts` (novo): 3 endpoints autenticados por JWT:
  - `POST /orcamentos-v2/anexos-geometria` — multipart `arquivo`, devolve `{ url, token, categoria, metadados }`.
  - `GET /orcamentos-v2/anexos-geometria/:token` — serve o arquivo (inline para imagem, attachment para DXF). Cache `private, max-age=300` (5 min).
  - `DELETE /orcamentos-v2/anexos-geometria/:token` — idempotente.
- `backend/src/os/services/aprovacao-tecnica.service.ts`: critério `arte_anexada` no `validarPreAprovacao` passou a contar TAMBÉM `ItemOS.arquivo_geometria_url` não-nulo (Leitura B). A mensagem do alerta foi ajustada para "Nenhuma arte ou imagem de geometria anexada a esta OS". `ArteVersao` continua sendo considerada — os dois sistemas convivem.
- `backend/src/orcamentos-v2/orcamentos-v2.module.ts`: registra o novo controller + service.

**Frontend:**

- `frontend/src/components/orcamentos-v2/AnexoGeometriaInput.tsx` (novo): componente único que aceita as três formas de entrada (Ctrl+V, drag-and-drop, clique → file picker). Renderiza:
  - estado vazio com instrução + ícones;
  - preview de imagem (carregado via fetch autenticado + `URL.createObjectURL` para respeitar JWT);
  - card de DXF (sem preview visual, apenas nome + botão remover);
  - estado de envio (spinner + texto "Enviando arquivo...").
  - Toasts para erros (formato inválido, excesso de tamanho — 5 MB imagem / 20 MB DXF).
  - Limpa o blob URL ao trocar o `value` para evitar memory leak.
  - Devolve a categoria no `onChange(url, categoria)` para o caller refletir em `geometria_origem`.
- `frontend/src/components/ui/orcamento/components/ProdutoSection.tsx`: integra o componente no topo do `CardContent` do produto, com 3 utilitários novos:
  - `atualizarAnexoGeometria(itemIndex, url, categoria)` — sincroniza `arquivo_geometria_url` e `geometria_origem` (`IMAGEM`/`DXF` quando há anexo; `MANUAL` quando removido).
  - `sugerirNomeProduto(itemIndex, sugestao)` — política "só preencher se vazio". A sugestão atual é o `nome_original` do arquivo enxuto (remove `.dxf`, troca `_` e `-` por espaço). Sub-fase 7.B vai substituir isso pelo `$PROJECTNAME` do header do DXF quando o parser real entrar.
  - `atualizarGeometria` foi ajustado para NÃO regredir `geometria_origem` para `MANUAL` se já estiver em `IMAGEM` ou `DXF` (impede que conferir uma medida apague a origem do anexo).

**Estratégia de upload escolhida (sem token temporário):**

O endpoint não exige `produto_id` na URL. Isso resolve o caso de orçamento novo (em que o produto ainda não tem `id`). O arquivo é gravado já com nome definitivo (`<token>.<ext>`) na pasta da loja, e a URL retornada (`/orcamentos-v2/anexos-geometria/<token>`) é a URL final — o `ProdutoOrcamento.arquivo_geometria_url` (campo já existente desde a Fase 2) recebe essa URL no submit do orçamento. **Não há fase de "promoção" de anexo temporário para definitivo.**

**Dívidas conhecidas registradas para a Sub-fase 7.B (DXF real, ainda pendente):**

- O parser DXF real ainda não foi implementado. Hoje o sistema apenas armazena o arquivo e marca `geometria_origem = 'DXF'`, mas não extrai perímetro/área/camadas. A sugestão de nome do produto usa o `nome_original` do arquivo, não o `$PROJECTNAME` do header.
- O cleanup de anexos órfãos (uploads que ficaram sem `ProdutoOrcamento` referenciando) não está implementado. Por enquanto fica como dívida; um cron diário pode ser adicionado depois.
- O endpoint `GET /orcamentos-v2/anexos-geometria/:token` exige JWT. Para baixar o DXF do PCP/produção precisa do mesmo token de sessão. Quando a feature de "OS pública" do PCP for repensada, talvez seja necessário um endpoint público autenticado por token de OS — não é caso hoje.

### 4.16 Sub-fase 7.B: Parser DXF real + card de revisão (2026-05-26 manhã)

**Contexto:** A Sub-fase 7.A entregou o upload e a sugestão de nome a partir do `nome_original` do arquivo. O usuário validou em produção que o DXF era anexado e o título sugerido, mas observou que as medidas (largura, altura, área, perímetro) não eram preenchidas — comportamento esperado para 7.A. O usuário confirmou: "Ainda irá aplicar a leitura das medidas? Se sim, pode continuar".

**O que foi entregue na Sub-fase 7.B (este commit):**

1. **Backend — `DxfParserService` (`backend/src/orcamentos-v2/services/dxf-parser.service.ts`)**: parser determinístico baseado em `dxf-parser@1.1.2`. Lê o HEADER (`$PROJECTNAME`, `$INSUNITS`), agrupa entidades por camada e calcula:
   - **Perímetro por camada**: soma exata de `LINE`, `LWPOLYLINE`, `POLYLINE`, `CIRCLE` (`2πr`), `ARC` (`r·Δθ`) e `ELLIPSE` (Ramanujan II).
   - **Bounding box global**: `maxX-minX` × `maxY-minY` (em mm, após conversão pela unidade de origem).
   - **Área**: prefere shoelace do maior polígono fechado (`LWPOLYLINE`/`POLYLINE` com `shape=true`). Senão, cai para `largura × altura` do bbox, marcado como `area_origem: 'BOUNDING_BOX'` e com alerta automático.
   - **Conversão de unidade**: `$INSUNITS` é mapeado para `mm/cm/m/pol/pe/desconhecida`. Os valores são convertidos para milímetros internamente. Se `$INSUNITS=0` (unitless), assume mm e adiciona alerta.
   - **Camada sugerida**: prioriza nome contendo "CORTE"/"CUT" (case-insensitive, ignora acentos); cai para a de maior perímetro.
   - **Robustez**: o service nunca lança — erros do parser viram entradas em `alertas`, garantindo que um DXF exótico não derruba o upload.
   - **Versionamento**: o JSON devolvido carrega `versao_parser: '7.B-1.0'` para que mudanças futuras de schema possam ser detectadas pelo frontend.
   - Validado contra `docs/exemplos-dxf/exemplo-retangulo-1200x800.dxf` (1200×800 mm, perímetro 4000 mm, projeto "Placa Fachada Padaria Bom Pao") e `docs/exemplos-dxf/exemplo-logo-corte-gravacao.dxf` (600×400 mm, perímetros separados de CORTE e GRAVACAO).
2. **Integração no `AnexoGeometriaService.salvar`**: quando categoria === 'DXF', invoca o parser e persiste `dxf_extraido` no JSON de metadados ao lado do arquivo. O response do upload (`POST /orcamentos-v2/anexos-geometria`) inclui `dxf_extraido` para que o frontend renderize o card de revisão imediatamente.
3. **Endpoint de releitura**: `GET /orcamentos-v2/anexos-geometria/:token/dxf-extraido` devolve `{ dxf_extraido: DxfExtraido | null }`. Usado pelo frontend ao recarregar um orçamento que já tinha DXF anexado (o card volta a aparecer sem necessidade de reupload).
4. **Frontend — `DxfRevisaoCard.tsx` (`frontend/src/components/orcamentos-v2/DxfRevisaoCard.tsx`)**: card "Valores detectados no DXF" exibido logo abaixo do `AnexoGeometriaInput` quando há `dxf_extraido` não nulo. Mostra largura/altura/área (com selo "polígono fechado" ou "aprox. envolvente"), lista de camadas selecionáveis (chip clicável para escolher qual usa para o perímetro) e alertas. Tem botões "Aplicar ao produto" (preenche largura/altura/área/perímetro + define `geometria_origem='DXF'` + força `unidade_geometria='mm'`) e "Ignorar" (esconde o card sem tocar no anexo).
5. **`AnexoGeometriaInput.tsx`**: ganhou prop `onDxfExtraido`. Repassa o `dxf_extraido` do response do upload, e ao recarregar um anexo DXF já gravado faz um `GET /dxf-extraido` em background para repor o card. A sugestão de nome do produto agora prefere `$PROJECTNAME` do DXF (mais descritivo) e só cai para `nome_original` quando o header não tem o campo — política "só preencher se vazio" mantida.
6. **`ProdutoSection.tsx`**: estado `dxfPorIndice` mantém o último `DxfExtraido` por índice de produto. Quando o operador clica em "Aplicar ao produto", o card é fechado e os valores entram no formulário; quando o operador remove o anexo ou troca para imagem, o card é limpo automaticamente.

**Política de produto formalizada:**

- O parser **nunca** preenche valores no formulário sozinho. Sempre exige clique explícito em "Aplicar ao produto" — o operador continua sendo o responsável final pelas medidas que vão para o orçamento.
- Área via bounding box é aceita como aproximação prática para os exemplos da comunicação visual (placa retangular). Quando o DXF tem polígono fechado, a área shoelace é preferida automaticamente e marcada como tal no card.
- Camada "CORTE" tem prioridade para perímetro (caso comum de plotter de recorte). O operador pode trocar livremente.

**Dívidas conhecidas para próximas iterações (NÃO bloqueiam Fase 7):**

- Curvas `SPLINE` ainda não têm comprimento calculado — quando um DXF traz contornos vetoriais com splines, elas são ignoradas (entram como entidades de outras camadas mas contribuem 0 ao perímetro). O alerta atual ("Nenhuma entidade 2D suportada") só aparece quando NENHUMA das entidades suportadas é encontrada. Se houver demanda real, posso adicionar discretização de spline depois.
- O cleanup de anexos órfãos (Sub-fase 7.A) continua pendente.
- Análise por IA de imagens coladas (OCR de cotas) continua deferida — usar DXF resolve o caso de medidas exatas; OCR só seria útil para imagens de cliente sem arquivo vetorial, e a UX hoje ainda permite digitação manual nessas situações.

### 4.17 Sub-fase 7.B+: Sugestão heurística de insumo por camada do DXF (2026-05-26 manhã)

**Contexto:** Logo após a entrega da 7.B, o usuário perguntou se o DXF normalmente indica o material e se daria para atrelar o insumo automaticamente. Resposta técnica: **o formato DXF não tem campo padronizado para material** — o que existe é uma convenção informal da indústria (operadores nomeiam camadas como `CORTE_ACM3MM`, `GRAVACAO_MDF15`, etc.). Para evitar atrelamento automático que pode errar silenciosamente, foi escolhido o "Passo 1" do plano: heurística por nome de camada que **sugere** insumos, exigindo clique do operador.

**O que foi entregue (este commit):**

1. **Backend — `DxfSugestaoInsumoService` (`backend/src/orcamentos-v2/services/dxf-sugestao-insumo.service.ts`)**: para cada camada do DXF, tokeniza o nome (remove acentos, separa por `[\s_\-./,]`), descarta tokens em uma stop-list de operações (`corte`, `gravacao`, `dobra`, `furo`, `vinco`, `contorno`, `lateral`, etc.) e compara com cada insumo ativo da loja. Score por insumo:
   - **+3×** quando um token da camada bate exato com token do `Insumo.nome`.
   - **+1×** quando há substring match (mín. 3 chars).
   - Mesma lógica com peso **2×** para `TipoMaterial.nome` e **1×** para `Categoria.nome`.
   - Top 3 sugestões por camada, ordenadas por score desc.
   - Cada sugestão devolve `insumo_id`, `insumo_nome`, `tipo_material_nome`, `categoria_nome`, `score`, `tokens_match` (auditoria/UI) e `motivo` (`NOME_INSUMO` | `TIPO_MATERIAL` | `CATEGORIA`).
2. **Não persistido nos metadados.** As sugestões são recalculadas a cada upload e a cada `GET /orcamentos-v2/anexos-geometria/:token/dxf-extraido`. Isso garante que cadastrar/desativar um insumo passa a refletir imediatamente, sem necessidade de reupload do DXF.
3. **Integração no upload e na releitura:** o response do `POST /orcamentos-v2/anexos-geometria` e do `GET /dxf-extraido` agora carrega `sugestoes_insumo: SugestoesPorCamada[]` ao lado de `dxf_extraido`. Falha do service nunca derruba o upload (try/catch devolve lista vazia + log).
4. **Frontend — extensão do `DxfRevisaoCard`**: nova seção "Materiais sugeridos (heurística por nome de camada)" abaixo dos alertas. Para cada camada com sugestões válidas, lista os top 3 insumos com:
   - Nome do insumo + tipo de material/categoria.
   - Tokens que casaram (transparência).
   - Botão "Atrelar" → vira "Atrelado" (com check) ao clicar; desabilitado em seguida para evitar duplicatas.
5. **`ProdutoSection.tsx`**: estado `sugestoesPorIndice` por produto. Ao clicar em "Atrelar", `atrelarInsumoAoProduto` adiciona o insumo ao array `materiais` do produto (usa a primeira posição vazia se existir, senão `push`), com `quantidade: '1'` como placeholder — o motor de cálculo recalcula a quantidade real a partir da área/perímetro no momento do orçamento (lógica de `tipo_calculo` por insumo).
6. **Sincronia com remoção do anexo:** quando o operador remove o DXF ou troca para imagem, `dxfPorIndice` e `sugestoesPorIndice` são zerados juntos.

**Política de produto formalizada:**

- O parser DXF **sugere** insumos, **nunca atrela sozinho**. O operador continua sendo o responsável pelo material que vai para o orçamento.
- A heurística trabalha sem nenhuma configuração — funciona a partir do catálogo de insumos já cadastrado da loja.
- Quando nenhuma sugestão é encontrada (catálogo vazio, nomes muito diferentes, só palavras de operação na camada), a seção "Materiais sugeridos" simplesmente não aparece — o card de revisão continua útil para as medidas.

**Decisão registrada para uma futura sub-fase (não implementada):**

- "Passo 2" do plano (regras configuráveis de match por loja, ex.: `se nome contém "X" → sugerir insumo Y`) ficou parado. O usuário avaliou que a heurística do Passo 1 é suficiente por enquanto e pediu para priorizar a próxima fase (profundidade no orçamento). Se a heurística começar a errar em casos reais, ativa-se o Passo 2 sem regressão (regras viram um boost adicional no score).

### 4.18 Sub-fase 7.B++: Descrição do DXF + cadastro inline de insumo (2026-05-26 manhã)

**Contexto:** Após a 7.B+, o usuário trouxe dois refinamentos para finalizar a Fase 7:
1. O orçamento tem campo `descricao` no produto — o DXF traz alguma descrição? Pode preencher e também alimentar a sugestão de insumo.
2. E quando o insumo da camada não está cadastrado? Modal de criação inline ("Não encontrei este insumo, deseja incluir?") para evitar trocar de tela no meio do orçamento.

Resposta técnica entregue:

- **DXF tem campos descritivos no HEADER** (`$TITLE`, `$SUBJECT`, `$KEYWORDS`, `$COMMENTS`, `$AUTHOR`), mas eles são opcionais e variam entre exportadores. `MTEXT`/`TEXT` do desenho **não** foram incluídos para evitar puxar cotas/notas de produção como descrição.
- **O modal de cadastro inline** foi implementado em formato **compacto** (apenas os 8 campos obrigatórios do `CreateInsumoDto` + lógica de consumo), com link para o cadastro completo em `/insumos/novo` quando o operador quer detalhar.

**O que foi entregue (este commit):**

1. **Backend — `DxfParserService` (`versao_parser: '7.B-1.1'`)**: novo método `extrairDescricaoProjeto` lê `$TITLE`, `$SUBJECT`, `$KEYWORDS`, `$COMMENTS`, `$AUTHOR` do header, descarta vazios, deduplica por valor case-insensitive e concatena com `" — "`. Devolvido como `descricao_projeto: string | null` em `DxfExtraido`. Quando o header não tem nenhum desses campos, vem `null` e a UI não sugere nada.
2. **Backend — `DxfSugestaoInsumoService`**: tokens da `descricao_projeto` entram no scoring de TODAS as camadas, com peso **0.5** (vs. 3 para nome de camada × `Insumo.nome`, 2 para `TipoMaterial.nome`, 1 para `Categoria.nome`). Assim, "ACM 3mm branco" na descrição reforça sugestões mesmo quando a camada tem nome genérico, sem dominar a evidência principal. O `motivo` da sugestão continua refletindo o campo do insumo que casou (descrição é só veículo).
3. **Frontend — `AnexoGeometriaInput`**: novo callback `onDescricaoSugerida`, disparado quando o backend devolve `dxf_extraido.descricao_projeto` não nulo. Mesma política do nome do produto: **só preenche se o campo "Descrição" estiver vazio** — nunca sobrescreve digitação.
4. **Frontend — `NovoInsumoModal.tsx`** (componente novo): modal compacto com os 8 campos obrigatórios do `CreateInsumoDto`:
   - Nome (pré-preenchido a partir da camada, já limpa de prefixos como `CORTE_`/`GRAVACAO_`/etc.)
   - Categoria + Fornecedor (selects carregados via `categoriasApi.getAll`/`fornecedoresApi.getAll`)
   - Custo unitário, Quantidade de compra, Fator de conversão
   - Unidade de compra, Unidade de uso, Lógica de consumo (área/perímetro/quantidade_fixa/custom)
   - Aviso explícito quando a loja não tem categoria E fornecedor cadastrados (botão fica desabilitado).
   - Link "Cadastro completo →" abre `/insumos/novo` em nova aba (footer).
5. **Frontend — extensão do `DxfRevisaoCard`**: nova prop `onCadastrarNovoInsumo`. Quando habilitada, o card mostra TODAS as camadas (mesmo sem sugestão) e cada bloco ganha um botão "Cadastrar novo" no canto. Para camada sem sugestão, mostra mensagem inline orientando a usar o botão.
6. **Frontend — `ProdutoSection`**: estado `novoInsumoModal` controla a abertura. Ao criar com sucesso, o insumo é atrelado ao produto imediatamente (usa o mesmo `atrelarInsumoAoProduto` das sugestões) **e** as sugestões são recarregadas via GET `/dxf-extraido` para que o insumo recém-criado apareça em outras camadas com palavras-chave compatíveis.

**Política de produto formalizada (mantida):**

- Descrição do DXF nunca sobrescreve o campo "Descrição" do produto se já estiver preenchido.
- Insumo recém-criado é atrelado ao produto automaticamente — porque o operador acabou de pedir o cadastro a partir daquela camada. O Atrelar/Atrelado dos demais insumos do catálogo continua exigindo clique.
- O modal compacto cobre o caso comum sem regredir o cadastro completo (categorias/fornecedores avançados, parâmetros de consumo, dimensões e estoque mínimo continuam disponíveis em `/insumos/novo`).

**Dívidas e refinamentos opcionais (não bloqueantes):**

- Texto de entidades `MTEXT`/`TEXT` continua não sendo capturado. Se houver demanda real (operadores que escrevem o material como texto no desenho), adiciona-se em campo separado para não poluir a descrição principal.
- O modal compacto não permite criar categoria ou fornecedor inline. Quando a loja é nova e ainda não tem cadastros básicos, é necessário ir em Configurações antes — o modal mostra aviso claro nesse caso. Inline-create-cascade ficou para evolução.

**Fase 7 oficialmente fechada.** Próximo movimento é a Fase 11 (profundidade no orçamento) — documentada em `plano-acao-home-onboarding-dashboard-operacional.md` aguardando confirmação das 3 decisões antes de codar.

**Última atualização:** 2026-05-26 (Sub-fase 7.B++: `descricao_projeto` do DXF preenche descrição do produto + alimenta scoring de insumo + `NovoInsumoModal` compacto para cadastro inline com atrelamento automático).
Branch `feature/home-operacional-dashboard`.
