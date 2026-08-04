# Release imutável para o Gate 0S

**Gate 0S não concluído — Fase 1 não liberada.**  
Este documento descreve o modelo; **não autoriza** execução em produção.

## 1. Auditoria do PM2 (somente leitura — 2026-08-04)

| Item | Backend | Frontend |
|---|---|---|
| status | online | online |
| restarts | **0** | **0** |
| created_at (PM2) | 2026-07-30T15:20:13Z | 2026-07-30T15:20:13Z |
| processo (lstart) | Fri Jul 31 06:10:16 2026 | Fri Jul 31 06:10:16 2026 |
| exec cwd | `/opt/comunikapp/app/backend` | `/opt/comunikapp/app/frontend` |
| script | `/opt/comunikapp/app/backend/dist/main.js` | `.../node_modules/next/dist/bin/next` |
| args | — | `start -H 127.0.0.1 -p 3001` |
| node_modules em uso | cwd → `backend/node_modules` | cwd → `frontend/node_modules` |
| artefato compilado | `backend/dist/` (mtime **2026-07-30**) | `frontend/.next/` (BUILD_ID **2026-07-30**) |
| output standalone | n/a | **não** (Next `start` clássico) |
| versão carregada | Nest `0.0.1` / Node 22.22.2 | **next-server 15.5.18** |
| PM2_HOME efetivo | `/srv/apps/comunikapp/.pm2` | idem |
| bind | `127.0.0.1:4001` | `127.0.0.1:3001` |
| health (leitura) | `/lojas/health` → 401 | `/` → 200 |

**Reload/restart:** `pm2 startOrReload ecosystem.config.js --update-env` (script legado).
Nesta sessão **não** houve restart. `restarts=0` e os PIDs datam de 31/jul.

**Desde o `npm ci` da tentativa Gate 0S (2026-08-02 ~00:34 UTC):**
- `node_modules` BE/FE foram reescritos (mtime 02/08);
- **PM2 não reiniciou** depois disso;
- `dist` e `.next` **permanecem de 30/07** (build anterior);
- source em disco: `HEAD=175f44f2…` (`feat/modulo-vendas`);
- processo carrega o `dist`/Next mapeados na subida de 31/07 (versão em memória **15.5.18**).

**Divergência registrada (não misturar com promote):**

| Camada | Estado |
|---|---|
| source Git | `175f44f2c3f7f1f0c124e5371b7071b01250b078` |
| node_modules | regenerados em 02/08 para esse checkout (sharp disco `0.34.4`, next disco `15.5.18`) |
| dist / .next | build de **30/07** (commit anterior ao HEAD atual) |
| processo PM2 | artefatos de 30/07, sem reload após npm ci |

**Não reiniciar** a aplicação sobre essa mistura. Preservar os processos atuais até
promover uma release isolada.

Layout legado já existente (não é o modelo final):
`/srv/apps/comunikapp/releases/current` é um **diretório** com checkout antigo (~3 GiB),
não um symlink por SHA. `shared/{env,uploads,backups}` já existem. O promote novo usa
`/srv/apps/comunikapp/current` → `releases/<sha>` (symlink), sem escrever no tree
`/opt/comunikapp/app` ativo.

## 2. Desenho dos diretórios

```text
/srv/apps/comunikapp/
├── releases/<sha-completo>/     # imutável após extract
│   ├── backend/dist + prisma + node_modules (prod) + scripts de migrate/backup
│   ├── frontend/.next/standalone (+ .next/static + public)
│   ├── ecosystem.release.config.js
│   └── MANIFEST.json
├── current -> releases/<sha>/   # único ponteiro trocado (atômico)
├── shared/
│   ├── env/backend.env
│   ├── env/frontend.env
│   ├── uploads/
│   └── backups/
└── .pm2/                        # daemon real observado
```

A release ativa **não** recebe `npm ci`, `npm prune` nem build.

## 3. Manifesto e checksums

`MANIFEST.json` (dentro do tarball / release):

- `sha`, `shortSha`, `builtAt` (UTC)
- `nodeVersion`, `npmVersion`, `prismaVersion`
- `packages.next`, `packages.sharp`
- `audits.baseline` (caminho + resultado)
- `files[]`: `{ path, sha256 }`

Ao lado do tarball: `SHA256SUMS` (tarball + manifesto).  
`verify-release-artifact.sh` falha se checksum, SHA esperado, `dist/main.js` ou
`standalone/server.js` divergirem.

## 4. Pipeline

Job `release-artifact` (needs: `npm-audit-baseline`, `lint-and-format`, `unit-tests`,
`gate0s-mysql8`):

1. `npm ci` BE/FE no runner  
2. `prisma generate` + build BE + build FE (`output: 'standalone'`)  
3. `npm prune --omit=dev` no backend  
4. `pack-release-artifact.sh` → tarball + SUMS + MANIFEST  
5. `verify-release-artifact.sh`  
6. `actions/upload-artifact` nome `comunikapp-release-<sha>` (14 dias)

## 5. Script de promoção

```bash
# Baixar artefato do Actions para a VPS, depois:
bash scripts/release/promote-release.sh \
  --artifact /caminho/comunikapp-release-<sha>.tar.gz \
  --expected-sha <sha-completo-40> \
  --root /srv/apps/comunikapp
```

Ordem: verify → extract em `releases/<sha>` → links shared env/uploads →
`node --check` → backup → preflight + `prisma migrate deploy` →
`ln -sfn` + `mv -Tf` em `current` → `pm2 startOrReload` (PM2_HOME=/srv/apps/comunikapp/.pm2) →
health 4001/3001.

Flags: `--dry-run`, `--skip-migrate` (exceção explícita),
`--contingency-killswitch` (grava `ORCAMENTOS_ACEITE_PUBLICO_DESABILITADO=true` no
`shared/env/backend.env`).

**Aposentado para Gate 0S:** `deploy-vps-branch-atual.sh` com `npm ci`/build no tree ativo.

Antes do primeiro promote: sincronizar `shared/env/*.env` com os segredos atualmente
usados em `/opt/comunikapp/app/...` (sem versionar).

## 6. Plano de migration

1. Backup via `mysql-backup-before-deploy.js` (mesmo mecanismo do deploy antigo).  
2. `prisma-deploy-preflight.js --apply`.  
3. `prisma migrate deploy` (HS-04 + HS-05).  
4. Só então troca de `current` + reload PM2.  
Se a migration falhar: **manter schema expandido**, forward-fix; não dropar colunas;
não voltar a artefato pré-HS-04.

## 7. Rollback

- Preferir release **posterior ao HS-04** já validada (mesmo schema expandido).  
- Contingência: `--contingency-killswitch` no mesmo SHA (aceite público 503).  
- **Proibido** apontar `current` para código pré-HS-04.  
- Dump pré-deploy **não** é rollback rotineiro (só desastre + nova autorização +
  invalidação de códigos legados antes de reabrir público).

## 8. Alternativa: build na VPS (não preferida)

Só com janela de manutenção e autorização específica, em diretório **fora** de
`current` e do cwd ativo (`/tmp` ou `releases/.build-<sha>`), com `nice`/`ionice` e
limite de heap — depois o mesmo `verify` + `promote`.

Impacto estimado (VPS ~8 GiB RAM / 145 GiB disco; app ativa ~360 MiB heap somados):

| Recurso | Impacto esperado |
|---|---|
| CPU | build FE+BE: vários minutos em carga alta |
| Memória | 2–4 GiB adicionais durante `next build` / `nest build` |
| Disco | +1–3 GiB por release + tarball |
| I/O | intenso em `node_modules` e `.next` |

Mitigações (`nice`/`ionice`/`NODE_OPTIONS`) **não** substituem artefato imutável do CI.

## 9. Testes não produtivos

```bash
bash scripts/release/pack-release-artifact.test.sh
bash scripts/release/verify-release-artifact.test.sh
# dry-run (só verifica tarball; não altera VPS):
bash scripts/release/promote-release.sh --artifact TAR --expected-sha SHA --root /tmp/x --dry-run
```

## 10. Comando quando houver autorização (placeholder de SHA)

Substitua pelo SHA do commit que contiver este modelo **e** o artefato CI verde:

```bash
EXPECTED_COMMIT=<sha-40>
# baixar artifact Actions → /var/tmp/comunikapp-release-$EXPECTED_COMMIT.tar.gz
bash /caminho/do/repo/scripts/release/promote-release.sh \
  --artifact /var/tmp/comunikapp-release-$EXPECTED_COMMIT.tar.gz \
  --expected-sha $EXPECTED_COMMIT \
  --root /srv/apps/comunikapp
```
