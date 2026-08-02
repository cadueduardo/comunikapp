# Gate 0S — Relatório sanitizado de npm audit (produção omit=dev)

**Data:** 2026-08-02  
**Escopo:** `npm audit --omit=dev` em `backend/` e `frontend/`  
**Contexto:** o deploy do commit `175f44f2…` foi interrompido corretamente por
`RUN_AUDIT=1` antes de build/backup/migration. Nenhuma migration, reinício PM2
ou alteração dos códigos legados foi feita nesta entrega.

> Gate 0S não concluído — Fase 1 não liberada.  
> O gate **não** dispensa vulnerabilidades alcançáveis no fluxo público.

## 1. Achados antes da correção (estado que bloqueou o deploy)

### Backend

| Pacote | Severidade | Advisory | Cadeia | Prod/dev | Instalado | Corrigido disponível | fixAvailable | Uso no ComunikApp | Entrada de usuário | Impacto | Decisão |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `sharp` | high | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) (CVE-2026-33327/33328/35590/35591) | direto | produção | `0.34.4` | `>=0.35.0` (recomendado `0.35.3`) | major | `ArteThumbnailService` processa buffers/arquivos de arte | sim — upload de imagem | DoS/corrupção de memória em loaders GIF/TIFF/VIPS | **Corrigir agora** → `0.35.3` |
| `brace-expansion` | high | [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | `exceljs→archiver→…→minimatch` e `googleapis→…→minimatch` | produção (transitivo) | `1.1.16` / `2.1.2` | `1.1.17` / `2.1.3+` | yes | exportação Excel / cliente Google | padrão de brace em glob — não há API pública que passe padrão arbitrário do cliente a `expand()` | DoS por expansão | **Corrigir agora** via overrides (cadeia de runtime) |
| `minimatch` | high | (via brace-expansion) | mesmas cadeias | produção (transitivo) | (depende) | sobe com override | yes | tooling de caminho em libs | indireto | propaga o DoS | coberto pelo override de `brace-expansion` |

### Frontend

| Pacote | Severidade | Advisory | Cadeia | Prod/dev | Instalado | Corrigido | fixAvailable | Uso | Entrada usuário | Impacto | Decisão |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `sharp` | high | GHSA-f88m-g3jw-g9cj | `next→sharp` | produção (transitivo) | `0.34.4` | `0.35.3` | yes | otimização de imagem do Next | possível via Image Optimization | mesmo advisory | **Corrigir agora** (override + Next) |
| `next` | high/moderate | GHSA-m99w / 89xv / p9j2 / … (<15.5.21) | direto | produção | `15.5.18` | `>=15.5.21` | yes | App Router / Server Actions | sim | DoS/SSRF em Server Actions e rewrites | **Corrigir agora** → `15.5.21+` |
| `brace-expansion` | high | GHSA-mh99 + GHSA-3jxr | `aceternity-ui→ts-morph→minimatch` | produção no lock (ts-morph não serve request) | `2.1.0` | `2.1.3+` | yes | dependência de UI kit (análise de código em build-time da lib) | não no caminho HTTP típico | DoS se `expand()` recebesse input hostil | **Corrigir agora** por override (baixo risco residual) |
| `axios` | high/moderate | vários GHSA (`>=1.18.0` corrige) | `aceternity-ui→posthog-node→axios` | produção (transitivo) | <1.18 | `1.18.0` | yes | telemetria do kit | indireto | DoS/proxy/auth gadgets | **Corrigir agora** por override |
| `js-yaml` | high | GHSA-52cp-r559-cp3m | transitivo | produção no lock | <4.3.0 | `4.3.0` | yes | parse YAML | depende da cadeia | DoS CPU | **Corrigir agora** por override |
| `linkify-it` | high | GHSA-v245-v573-v5vm | transitivo (TipTap/markdown) | produção | `<=5.0.1` | `5.0.2` | yes | linkificação de texto | texto de usuário em editores | DoS | **Corrigir agora** por override |
| `postcss` | high | GHSA-r28c-9q8g-f849 | Next/CSS | produção no lock | `<=8.5.17` | `8.5.18` | yes | CSS pipeline | source map URL | disclosure de `.map` | **Corrigir agora** por override |

## 2. Atenção especial — `sharp` (GHSA-f88m-g3jw-g9cj)

| Item | Evidência |
|---|---|
| Advisory | GHSA-f88m-g3jw-g9cj |
| Versão afetada | `< 0.35.0` (instalada `0.34.4`) |
| Formato/entrada | loaders **GIF, TIFF e VIPS**; PoCs de overflow em dimensões/metadados |
| Fluxo com arquivo não confiável | **Sim** — `ArteThumbnailService` recebe buffer/caminho de upload de arte |
| Correção compatível | `0.35.3` (Node `>=20.9.0`; API `sharp(buffer).resize().jpeg()` permanece) |
| Testes | `node backend/scripts/smoke-sharp-upload.mjs` (JPEG/PNG/thumbnail/metadata) |

Não foi aceita exceção temporária para `sharp`.

## 3. `brace-expansion` — cadeia real

- **Backend:** presente em dependências de **produção** (`exceljs`/`archiver`, `googleapis`). Mesmo sem endpoint que passe brace pattern do cliente, a lib está no runtime → **corrigida** com overrides `1.1.17` e `2.1.4`.
- **Frontend:** sob `ts-morph` (não processa request HTTP). Ainda assim corrigida por override `2.1.4` para zerar o finding em `--omit=dev`.

## 4. Após a correção

`npm audit --omit=dev` em backend e frontend: **0 vulnerabilidades**.  
Baseline `scripts/security/npm-audit-baseline.json`: **exceções vazias**.

`RUN_AUDIT` permanece `1`. Exceções futuras, se inevitáveis, são temporárias (com `expiresAt`) e geram tarefa separada com prazo — o Gate 0S não trata isso como dispensa de risco alcançável no fluxo público.

## 5. Deploy em produção

Não autorizado neste commit. O artefato anterior (`175f44f2…`) permanece o último checkout na VPS sem migration aplicada; a aplicação em execução não foi reiniciada nesta entrega.
