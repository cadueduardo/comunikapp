# Runbook — Staging Compras / Financeiro / Matriz

**Status:** pronto para execução operacional (não executa sozinho)  
**Data:** 2026-07-21  
**Branch típica:** `feat/mvp-compras-fase-0` (ou a que estiver mergeada no alvo)  
**Referências:**  
- `docs/database/deploy-seguro-migrations-legadas.md`  
- `docs/modulo de compras/fase-6-auditoria-owasp-producao.md`  
- `docs/modulo fornecedores/plano-acao-matriz-insumo-fornecedor.md`  
- Regra Cursor: deploy Nginx + CORS + PM2  

---

## 0. Pré-condições (parar se falhar)

| # | Checagem | Comando / evidência |
|---|---|---|
| 0.1 | Branch correta no alvo | `git rev-parse --abbrev-ref HEAD` e `git log -1 --oneline` |
| 0.2 | Working tree limpo no servidor (ou só artefatos de build) | `git status` |
| 0.3 | `NODE_ENV` / `DATABASE_URL` do **staging** (nunca prod por engano) | `pm2 env <id>` ou `.env` do host |
| 0.4 | Backup dir gravável | `DB_BACKUP_DIR` existe e é `700` |
| 0.5 | `mariadb-dump`/`mysqldump` + `gzip` instalados | `which mariadb-dump mysqldump gzip` |
| 0.6 | API staging sobe na porta esperada (ex.: 4000 local / proxy Nginx) | `ss -tlnp \| grep <porta>` |

**Proibido:** `prisma db push` em staging/produção.

---

## 1. Ordem canônica de deploy (banco)

Executar **nesta ordem**, um bloco por vez, aguardar saída antes do próximo.

### 1.1 Backup

```bash
cd /caminho/para/comunikapp/backend
npm run db:backup
```

Dry-run (só valida caminho/config, sem gravar dump útil para rollback):

```bash
node scripts/mysql-backup-before-deploy.js --dry-run
```

- [ ] Backup `.sql.gz` publicado e `gzip -t` ok  
- [ ] Caminho do arquivo anotado no ticket/chat  

### 1.2 Preflight Prisma

```bash
npm run db:deploy:preflight
```

Só com autorização explícita e após revisão do dry-run:

```bash
node scripts/prisma-deploy-preflight.js --apply
```

- [ ] Preflight exit 0  
- [ ] Sem surpresa de baseline legado  

### 1.3 Migrate deploy

```bash
npx prisma migrate deploy
npx prisma migrate status
```

- [ ] Status: todas as migrations `Applied` (incluindo Compras + fechamento financeiro OS + matriz se no escopo)  

### 1.4 Generate + build + restart

```bash
npx prisma generate
npm run build
# reinício conforme processo do host, exemplo PM2:
pm2 restart <nome-ou-id-backend>
pm2 save
```

- [ ] PM2 `online`  
- [ ] Health local: `curl -i http://127.0.0.1:<porta>/` (ou rota conhecida) → **não** 502  

---

## 2. CORS (obrigatório se API pública)

Substituir host real do staging:

```bash
curl -i -X OPTIONS https://api-staging.exemplo/auth/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"

curl -i -X POST https://api-staging.exemplo/auth/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Content-Type: application/json" \
  -d '{"email":"x","password":"y"}'
```

- [ ] Apenas **um** `Access-Control-Allow-Origin` na resposta pública  
- [ ] Se Nginx é dono do CORS: `proxy_hide_header` no upstream (sem duplicar)  

Após mudança Nginx:

```bash
nginx -t
systemctl reload nginx
```

---

## 3. Smoke estático (sem credenciais de usuário)

Rodar no checkout do código (CI ou máquina de deploy):

```bash
cd backend
node scripts/compras-financeiro-owasp-audit.mjs
node --test scripts/compras-financeiro-tenant-isolation.test.js
node --test scripts/compras-permissions-assert-qualquer.test.js
npm audit --audit-level=high
```

- [ ] OWASP exit 0  
- [ ] Isolamento 10/10  
- [ ] `npm audit` 0 high  

---

## 4. Smoke HTTP (precisa JWT / login staging)

Variáveis:

```bash
export BASE_URL=https://api-staging.exemplo   # ou http://127.0.0.1:4000
export ACCESS_TOKEN=<jwt>
# opcional:
export LOJA=<uuid-loja>
export COMPRAS_E2E_API_URL=$BASE_URL
export COMPRAS_E2E_EMAIL=<admin-piloto>
export COMPRAS_E2E_PASSWORD=<senha>
```

### 4.1 Carga leve das listagens

```bash
SMOKE_N=20 SMOKE_CONCURRENCY=5 \
  node scripts/compras-listagens-smoke-carga.mjs
```

- [ ] 0 erros HTTP 5xx  
- [ ] p95 anotado  

### 4.2 Fluxo E2E Compras → Contas → (pós-cálculo se coberto)

```bash
node scripts/compras-e2e-fluxo-completo.mjs
```

- [ ] Exit 0  
- [ ] Números SC/PC/conta/pagamento gerados anotados  

### 4.3 UI mínima (manual, 10–15 min)

| Tela | O que validar |
|---|---|
| `/compras` | Listagens SC/PC sem 403 para perfil piloto |
| Pedido | Material + serviço; substituir fornecedor |
| Recebimento / aceite | Parcial + confirmar |
| `/financeiro/contas-pagar` | Gerar da PC; pagamento; estorno |
| OS `?tab=financeiro` | Pós-cálculo, fechar/reabrir, histórico, trocas |

- [ ] Perfil **sem** permissão de Compras recebe 403 nas listagens (regressão do endurecimento A01)  
- [ ] ADMIN / FINANCEIRO / perfil com `compras.*` opera normalmente  

---

## 5. Matriz (se o deploy incluir schema + backfill)

Só após backup + migrate da matriz no **mesmo** ambiente.

```bash
# dry-run (padrão)
npm run db:insumo-fornecedor:dry-run
# backfill também começa em dry-run no script package.json
npm run db:insumo-fornecedor:backfill
```

Apply real: seguir confirmações dos scripts (`--confirmation=...`) documentadas no plano da matriz — **nunca** pular dry-run.

Categoria cross-loja (se ainda houver na cópia de prod):

```bash
node scripts/fix-insumo-categoria-cross-loja.js
# apply só com confirmação explícita do script
```

- [ ] Relatório dry-run arquivado  
- [ ] Apply autorizado por humano  
- [ ] Smoke UI insumo (matriz + custo/fornecedor somente leitura no update geral)  

---

## 6. Rollout por permissão (piloto)

Ordem sugerida:

1. Perfil piloto com subconjunto `compras.*` + financeiro necessário  
2. Time interno valida 1–2 pedidos reais de teste  
3. Ampliar perfis  
4. Só então comunicar uso amplo  

- [ ] Piloto liberado  
- [ ] Rollback documentado: remover permissões do perfil (migrations aditivas ficam)  

---

## 7. Monitoramento primeiras 24h

```bash
pm2 list
pm2 logs <backend> --lines 200
```

Observar: `401/403/409/429/500` em `/compras/*` e `/financeiro/*`; latência das listagens.

- [ ] Sem pico anômalo de 500  
- [ ] 429 só sob abuso (throttle sensível)  

---

## 8. Critério de “staging aprovado”

Marcar no RP (`RP-mvp-compras-suprimentos.md` Fase 6) quando **todos** abaixo forem verdadeiros:

- [ ] Backup + preflight + migrate + build + restart ok  
- [ ] CORS validado (1 header)  
- [ ] OWASP + isolamento + audit high ok  
- [ ] Smoke carga + E2E exit 0  
- [ ] UI piloto ok (incluindo 403 esperado sem permissão)  
- [ ] Matriz (se no escopo) dry-run + apply + smoke ok  
- [ ] Plano de rollback (permissões) combinado  

Até lá, manter:

- Fase 6 “Backup e staging” e “Rollout” como `[ ]` no RP  
- Critérios de aceite §15 como validação humana/E2E, não só código  

---

## 9. Contatos / artefatos a anexar no ticket

1. Path do `.sql.gz`  
2. `git log -1` do deploy  
3. Saída `prisma migrate status`  
4. Exit codes dos smokes  
5. Screenshots ou IDs dos documentos E2E  

---

## 10. Registro de execução — ambiente local (2026-07-21)

Gate **local** (não substitui staging/VPS). API: `http://127.0.0.1:4000`, DB `comunikapp@localhost:3306`.

| Passo | Resultado |
|---|---|
| OWASP estático | exit 0 (0 críticos) |
| Isolamento tenant | 10/10 |
| assertPodeQualquer | 3/3 |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| `prisma validate` | schema válido |
| `prisma migrate status` | 100 migrations, up to date |
| Backup dry-run | ok (`mysqldump` + `gzip` encontrados) |
| E2E Compras | **18/18** — SC-2026-002 · PC-2026-003 · conta PC-PC-2026-003 |
| Smoke carga listagens | OK — p95 ~33–59 ms (N=20, conc=5) |

Smoke carga: agora aceita fallback `JWT_SECRET` (mesmo padrão do E2E) quando `ACCESS_TOKEN` não é passado.

---

## 11. Registro de execução — VPS produção (2026-07-21)

Host: `admin@147.93.190.212` (`vmi3319136`). App: `/opt/comunikapp/app`. Runtime: PM2 (portas 4001/3001).

| Passo | Resultado |
|---|---|
| Backup pré-deploy | `/opt/comunikapp/app/backend/backups/database/comunikapp-20260721T190940Z.sql.gz` |
| Backup no migrate | `/srv/apps/comunikapp/shared/backups/database/comunikapp-20260721T191534Z.sql.gz` |
| Branch / commit | `feat/mvp-compras-fase-0` @ `03f009ea` |
| Migrations aplicadas | `20260721081827` … `20260721110100` (5 Compras/fechamento) — schema **100/100 up to date** |
| Deploy script | `deploy-vps-branch-atual.sh` exit 0 (~6 min) |
| PM2 | backend + frontend **online** (`pm2 save`) |
| Health local | backend `/` → **401** (esperado); frontend → **200**; `/compras/pedidos` sem JWT → **401** |
| CORS OPTIONS | `https://api.comunikapp.com.br/lojas/login` → **204** com headers Allow-* |

Ainda **pendente**:

- [ ] Rollout por perfil piloto (`compras.*`)  
- [ ] Smoke UI manual em produção / light-dark  
- [ ] Merge da branch em `main` (VPS está na feature branch de propósito)  
