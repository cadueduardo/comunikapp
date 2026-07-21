# Fase 6 — Auditoria OWASP e preparação para produção

**Status:** parcial — controles mapeados; gaps documentados; scripts automatizados disponíveis  
**Revisão:** 2026-07-21  
**Escopo:** MVP Compras/Suprimentos + Financeiro (contas a pagar, pós-cálculo, fechamento OS)  
**Referências:** `RP-mvp-compras-suprimentos.md` §11, `feature-financeiro-previsto-real.md` §11

---

## 1. Resumo executivo

A fatia de produção entrega **evidências no código**, **checagens estáticas** e **checklists operacionais** sem exigir deploy em staging real.

| Artefato | Caminho |
|---|---|
| Script auditoria OWASP | `backend/scripts/compras-financeiro-owasp-audit.mjs` |
| Testes isolamento tenant | `backend/scripts/compras-financeiro-tenant-isolation.test.js` |
| Smoke carga listagens | `backend/scripts/compras-listagens-smoke-carga.mjs` |
| Smoke E2E fluxo completo | `backend/scripts/compras-e2e-fluxo-completo.mjs` |
| Backup pré-deploy | `backend/scripts/mysql-backup-before-deploy.js` |

---

## 2. Tabela OWASP Top 10 (A01–A10)

Legenda de status: **OK** = controle presente e verificável; **PARCIAL** = controle existe mas incompleto; **GAP** = ausente ou risco relevante.

| ID | Controle esperado (RP) | Evidência no código | Status | Ação se GAP/PARCIAL |
|---|---|---|---|---|
| **A01** Broken Access Control | JWT em toda rota; permissão por comando; `loja_id` do token; queries tenant-scoped; testes IDOR | Controllers: `@UseGuards(JwtAuthGuard)` + `@GetLoja()` / `@CurrentLojaId()` em `compras/controllers/*.controller.ts`, `financeiro/**/**.controller.ts`. Services filtram `loja_id` (ex.: `pedidos.service.ts` `findOne`, `pos-calculo.service.ts` `obterPorOs`, `contas-pagar.service.ts` `findOne`). Permissões finas via `ComprasPermissionsService.assertPode`, `ContasPagarPermissionsService`, `PosCalculoPermissionsService`. Teste: `compras-financeiro-tenant-isolation.test.js` | **PARCIAL** | Leituras (`findAll`, `list`, `historico`) não exigem permissão granular — qualquer usuário autenticado da loja acessa. **Ação:** restringir listagens sensíveis com `compras.auditoria.visualizar` ou perfil equivalente antes do rollout amplo. |
| **A02** Cryptographic Failures | TLS; sem segredo em log/repo; storage privado | TLS via Nginx/proxy em produção (ver `deploy-cors-nginx-pm2-guardrails`). JWT em `JWT_SECRET` (.env, não versionado). Sem campos bancários completos nos DTOs de pagamento MVP. | **OK** | Manter `.env` fora do git; revisar logs antes do deploy. |
| **A03** Injection | DTO whitelist; Prisma parametrizado; raw SQL parametrizado | `main.ts`: `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`). DTOs em `compras/dto/`, `financeiro/**/dto/` com `class-validator`. Sem `$queryRawUnsafe` nos módulos (script confirma). | **OK** | Manter proibição de raw SQL concatenado; allowlist em filtros de ordenação quando adicionados. |
| **A04** Insecure Design | Máquina de estados; idempotência; snapshots; transações | Policies em `compras-estados-policy` (testes em `compras-estados-policy.test.js`). Chaves idempotentes em contas/pagamentos. Histórico imutável (`compras-historico.service.ts`). Fechamento OS com transição auditável. | **OK** | Expandir testes e2e antes de rollout 100%. |
| **A05** Security Misconfiguration | CORS/headers; Swagger protegido; limites body | `main.ts`: `helmet`, CORS allowlist, Swagger só com `ENABLE_SWAGGER=true`. Rate limit global em produção (1000 req/15 min). Uploads estáticos com `dotfiles: deny`. | **PARCIAL** | Rate limit não é específico para export CSV / pagamento. **Ação:** throttling dedicado em `POST .../pagamentos`, `GET .../export.csv` (follow-up). |
| **A06** Vulnerable Components | lockfile; auditoria dependências | `backend/package-lock.json` versionado. Rodar `npm audit` no CI/deploy. | **PARCIAL** | Automatizar `npm audit --audit-level=high` no pipeline de deploy. |
| **A07** Authentication Failures | JwtAuthGuard; rate limit ações sensíveis | `JwtAuthGuard` em todos os controllers do escopo. Rate limit global prod em `main.ts`. Permissões validadas nos services de mutação. | **PARCIAL** | Sem reautenticação para estorno/pagamento alto valor (futuro). Sem rate limit por rota sensível. |
| **A08** Data Integrity Failures | histórico imutável; backend fonte de totais | Totais recalculados no backend (`pedido-totais.util.ts`). Estornos preservam histórico. Fechamento OS grava snapshot/histórico. | **OK** | — |
| **A09** Logging Failures | auditoria transições; sem token/senha em log | `ComprasHistoricoService` registra transições. `FinanceiroController` captura IP/UA em recebimentos. Logs prod reduzidos (`error,warn,log`). | **PARCIAL** | Correlation ID não padronizado nos módulos novos. **Ação:** propagar `x-request-id` em middleware (follow-up). |
| **A10** SSRF | não baixar URL do client; storage direto | MVP Compras/Financeiro **não** implementa download por URL externa. Sem `fetch(dto.url)` nos módulos. Export CSV gerado server-side. | **OK** | Ao adicionar anexos/comprovantes, usar upload direto + storage privado (nunca URL arbitrária). |

---

## 3. Isolamento tenant (IDOR)

### Regra

Toda consulta ou mutação por ID deve usar `loja_id` proveniente do JWT (`@GetLoja()` / `@CurrentLojaId()`), **nunca** confiar em `loja_id` vindo do body/query sem validação cruzada.

### Evidências representativas

| Caso | Arquivo | Padrão |
|---|---|---|
| Pedido por ID | `backend/src/compras/services/pedidos.service.ts` | `findFirst({ where: { id, loja_id: lojaAtual.id } })` → `NotFoundException` |
| Update tenant-safe | `backend/src/compras/services/pedido-matriz.util.ts` | `updateMany({ where: { id, loja_id } })` + `count !== 1` → NotFound |
| Pós-cálculo OS | `backend/src/financeiro/pos-calculo/services/pos-calculo.service.ts` | `ordemServico.findFirst({ id: osId, loja_id })` + `assertPodeVisualizar` |
| Fechamento OS | `backend/src/financeiro/pos-calculo/services/fechamento-financeiro-os.service.ts` | `assertOsDaLoja` + upsert `loja_id_os_id` composto |
| Conta a pagar | `backend/src/financeiro/contas-pagar/services/contas-pagar.service.ts` | `findFirst({ id, loja_id })` |

### Teste automatizado

```bash
cd backend
node --test scripts/compras-financeiro-tenant-isolation.test.js
```

---

## 4. DTOs e injection

- **Pipe global:** `backend/src/main.ts` — `ValidationPipe` com `whitelist: true`, `forbidNonWhitelisted: true`.
- **DTOs Compras:** `backend/src/compras/dto/*.dto.ts` — decorators `class-validator` (`@IsString`, `@IsNotEmpty`, `@IsEnum`, etc.). `UpdatePedidoDto` / `UpdateSolicitacaoDto` usam `PartialType(Create*Dto)` — herdam validação do create (script estático pode listá-los como aviso).
- **DTOs Financeiro:** `backend/src/financeiro/contas-pagar/dto/`, `backend/src/financeiro/pos-calculo/dto/`, `backend/src/financeiro/dto/`.
- **SQL:** Prisma ORM exclusivo nos módulos; script bloqueia `$queryRawUnsafe` e concatenação em template literals.

---

## 5. Rate limit

| Camada | Implementação | Observação |
|---|---|---|
| Global (prod) | `express-rate-limit` em `main.ts` — 1000 req / 15 min | Protege superfície geral |
| Por rota sensível | — | **GAP documentado** — export CSV, pagamento, aprovação sem limite dedicado |
| Follow-up | Throttler Nest ou rate limit Nginx por path | Priorizar `POST /financeiro/contas-pagar/:id/pagamentos`, `GET /financeiro/cobrancas/export.csv` |

---

## 6. Anexos e SSRF

- MVP Compras **não** expõe upload/download de anexos de pedido.
- Financeiro gera CSV server-side (`FinanceiroController.exportarCobrancasCsv`) — sem fetch externo.
- Script OWASP varre padrões `fetch(dto.*)` / `axios` com URL do client — nenhum hit no escopo atual.

**Ao evoluir:** comprovantes via multipart → storage privado por `loja_id`; URLs assinadas temporárias; nunca `fetch(urlDoCliente)`.

---

## 7. Logs sem segredo

- Não logar `Authorization`, `JWT_SECRET`, senhas ou dados bancários integrais.
- Histórico de compras grava metadados de transição (`compras-historico.service.ts`), não payloads completos de pagamento.
- Recebimentos financeiros registram IP/UA para auditoria (`financeiro.controller.ts`), não token.

---

## 8. Dependências

```bash
cd backend
npm audit
npm audit --audit-level=high
```

Lockfile: `backend/package-lock.json`. Atualizações devem passar por testes dos scripts da Fase 6 antes do deploy.

---

## 9. Controllers inventariados (auth)

Todos possuem `@UseGuards(JwtAuthGuard)` em nível de classe:

| Controller | Prefixo |
|---|---|
| `SolicitacoesController` | `compras/solicitacoes` |
| `PedidosController` | `compras/pedidos` |
| `PedidoRecebimentosController` | `compras/pedidos/:pedidoId/recebimentos` |
| `RecebimentosController` | `compras/recebimentos` |
| `PedidoAceitesServicoController` | `compras/pedidos/:pedidoId/aceites-servico` |
| `AceitesServicoController` | `compras/aceites-servico` |
| `ContasPagarController` | `financeiro/contas-pagar` |
| `PagamentosFornecedorController` | `financeiro/pagamentos` |
| `PosCalculoController` | `financeiro/os` |
| `FinanceiroController` | `financeiro` (cobranças/recebimentos — escopo adjacente) |

Permissões de mutação: validadas nos services (`assertPode`, `assertPodeVisualizar`, `assertPodeFechar`).

---

## 10. Checklist operacional (produção)

### 10.1 Backup

```bash
cd backend
npm run db:backup
# ou dry-run:
node scripts/mysql-backup-before-deploy.js --dry-run
```

Variáveis: `DATABASE_URL`, opcional `DB_BACKUP_DIR`, `DB_BACKUP_RETENTION_DAYS` (default 14).

### 10.2 Staging

- [ ] Aplicar migrations aditivas em staging (`npm run db:deploy:preflight` antes).
- [ ] Validar CORS com `Origin` real (ver regra deploy Nginx).
- [ ] Executar smoke E2E: `node scripts/compras-e2e-fluxo-completo.mjs` com `COMPRAS_E2E_API_URL` apontando para staging.
- [ ] Executar auditoria OWASP: `node scripts/compras-financeiro-owasp-audit.mjs` (exit 0).

### 10.3 Smoke pós-deploy

| Passo | Comando / verificação |
|---|---|
| Health API | `curl -i http://127.0.0.1:4000/` ou endpoint conhecido |
| Auth + listagem | `node scripts/compras-listagens-smoke-carga.mjs` com `BASE_URL` + `ACCESS_TOKEN` |
| Fluxo completo | `node scripts/compras-e2e-fluxo-completo.mjs` |
| Isolamento | `node --test scripts/compras-financeiro-tenant-isolation.test.js` |
| OWASP estático | `node scripts/compras-financeiro-owasp-audit.mjs` |

### 10.4 Monitoramento

**VPS / PM2 (produção):**

```bash
pm2 list
pm2 env <id>
pm2 logs comunikapp-backend --lines 100
ss -tlnp | grep 4000
```

**Nginx após alteração:**

```bash
nginx -t
systemctl reload nginx
```

**CORS (obrigatório após deploy API):**

```bash
curl -i -X OPTIONS https://api.exemplo.com/auth/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Access-Control-Request-Method: POST"
```

Alertas sugeridos: taxa de `401/403/409/500` elevada em `/compras/*` e `/financeiro/*`; latência p95 das listagens (script smoke-carga).

### 10.5 Rollout

- [ ] Liberar permissões `compras.*` por perfil piloto antes de `ADMINISTRADOR` geral.
- [ ] Monitorar primeiras 24h com smoke carga periódico.
- [ ] Plano de rollback: desabilitar permissões; migrations são aditivas (sem drop destrutivo no MVP).

---

## 11. Como rodar os scripts

```bash
cd backend

# Auditoria OWASP estática (exit 1 se gap crítico)
node scripts/compras-financeiro-owasp-audit.mjs

# Testes isolamento tenant
node --test scripts/compras-financeiro-tenant-isolation.test.js

# Smoke carga listagens (dry-run sem credenciais)
node scripts/compras-listagens-smoke-carga.mjs

# Smoke carga com API local
BASE_URL=http://127.0.0.1:4000 ACCESS_TOKEN=<jwt> node scripts/compras-listagens-smoke-carga.mjs

# E2E fluxo completo (requer API + DB)
node scripts/compras-e2e-fluxo-completo.mjs
```

---

## 12. Gaps conhecidos (resumo)

1. **A01 PARCIAL** — listagens/leituras sem permissão fina por ação.
2. **A05/A07 PARCIAL** — rate limit global, sem throttling por rota sensível.
3. **A09 PARCIAL** — correlation ID não padronizado.
4. **A06 PARCIAL** — `npm audit` não automatizado no pipeline desta fatia.
5. **Operacional** — backup/staging/rollout dependem de execução manual (fora do escopo desta entrega).

### Snapshot `npm audit` (backend, 2026-07-21)

Rodado com `npm audit --audit-level=high --omit=dev`. Achados high relevantes (não aplicados nesta fatia — exigir revisão controlada):

| Pacote | Nota |
|---|---|
| `axios` | várias advisories high; `npm audit fix` disponível |
| `body-parser` | DoS com `limit` inválido |
| `brace-expansion` | DoS |
| `js-yaml` (via `@nestjs/swagger`) | DoS por merge-key |

**Ação pré-staging:** revisar e aplicar `npm audit fix` (ou bumps pinados) em branch dedicada, com smoke E2E antes de merge.

Estes gaps **não bloqueiam** o script OWASP (exit 0) desde que todos os controllers mantenham JWT guard.
