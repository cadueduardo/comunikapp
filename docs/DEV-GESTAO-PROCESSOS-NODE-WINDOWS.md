# Gestão de processos Node no Windows (Cursor + Comunikapp)

O Cursor e os agentes tendem a disparar vários processos Node em paralelo (`nest --watch`, `next dev`, `jest`, `tsc`, `prisma`, scripts `ts-node`). No Windows isso consome RAM/CPU, trava o IDE e causa **EPERM** no Prisma (`query_engine-windows.dll.node` bloqueado).

Este documento define **rotina humana** e **regras para agentes**.

---

## 1. Sintomas comuns

| Sintoma | Causa provável |
|---------|----------------|
| Máquina lenta, fan alto | Dezenas de `node.exe` órfãos (jest/tsc/watch) |
| `EPERM` no `prisma generate` | Backend `nest --watch` segurando DLL do Prisma |
| `EADDRINUSE` porta 4000/3000 | Instância anterior do dev server ainda rodando |
| Jest “nunca termina” | `npm test` sem filtro = suite inteira + ts-jest pesado |
| Typecheck demora minutos | Múltiplos `tsc` concorrentes |

---

## 2. Rotina diária (desenvolvedor)

### Antes de começar

```powershell
# Na raiz do projeto
.\scripts\cleanup-node-dev.ps1
```

### Subir ambiente (uma única vez)

```powershell
# Terminal dedicado — não fechar enquanto desenvolve
npm run dev
```

Isso sobe **frontend (3000)** + **backend (4000)** via `concurrently`. Não abrir segundo `npm run dev`.

### Antes de `prisma generate` / `db:migrate`

1. Parar `npm run dev` (`Ctrl+C` no terminal).
2. Rodar comando Prisma.
3. Subir `npm run dev` de novo.

### Ao fim do dia ou quando travar

```powershell
.\scripts\cleanup-node-dev.ps1 -Force
```

---

## 3. Script de limpeza

**Arquivo:** `scripts/cleanup-node-dev.ps1`

| Modo | Comando | O que faz |
|------|---------|-----------|
| Seguro (padrão) | `.\scripts\cleanup-node-dev.ps1` | Lista processos Node do projeto; mata só os que batem com caminhos `comunikapp` |
| Forçado | `.\scripts\cleanup-node-dev.ps1 -Force` | Mata todos os `node.exe` (cuidado se outros projetos Node estiverem abertos) |
| Só listar | `.\scripts\cleanup-node-dev.ps1 -WhatIf` | Não mata; só exibe |

**Atalho npm (raiz):**

```powershell
npm run dev:clean
```

---

## 4. Regras para agentes Cursor (obrigatório)

Estas regras estão em `.cursor/rules/dev-node-process-guardrails.mdc`.

### NÃO fazer

- `npm test` ou `jest` **sem** caminho de arquivo específico.
- `jest --watch` em sessão de agente.
- Rodar `tsc`, `jest` e `npm run dev` **ao mesmo tempo**.
- `prisma generate` com backend dev rodando.
- Múltiplos `npx tsc` em sequência sem necessidade — preferir `read_lints` no IDE.
- Deixar comandos em background sem monitorar e sem `block_until_ms` adequado.

### Fazer

- Testes unitários:

```powershell
cd backend
npx jest src/caminho/arquivo.spec.ts --runInBand --forceExit --no-coverage
```

- Typecheck pontual (se necessário):

```powershell
cd backend
npx tsc -p tsconfig.build.json --noEmit
```

- Um comando por vez; aguardar `exit_code` antes do próximo.
- Se `jest`/`tsc` passar de 3 min sem saída: **parar** (`cleanup-node-dev.ps1`) e usar escopo menor.

### Limites Jest recomendados

Adicionar em sessões pesadas (opcional, `backend/package.json`):

```json
"test:one": "jest --runInBand --forceExit --no-coverage"
```

Uso: `npm run test:one -- src/instalacao/services/item-os-instalacao-criacao.service.spec.ts`

---

## 5. Portas padrão

| Serviço | Porta |
|---------|-------|
| Frontend Next.js | 3000 |
| Frontend teste | 3003 |
| Backend NestJS | 4000 |

Verificar quem usa a porta:

```powershell
netstat -ano | findstr :4000
netstat -ano | findstr :3000
```

Matar por PID (substituir `<PID>`):

```powershell
taskkill /PID <PID> /F
```

---

## 6. Cursor / IDE — dicas

1. **Desativar** extensões que disparam `tsc --watch` em todo o monorepo se não forem necessárias.
2. Fechar terminais integrados órfãos (aba Terminal → kill all).
3. Evitar pedir ao agente “rode todos os testes” — especificar arquivos.
4. Após sessões longas de agente: `npm run dev:clean` antes de retomar.
5. **Não** commitar `backend/dist/`, `*.log`, `tsconfig.build.tsbuildinfo` de build local.

---

## 7. Produção (VPS)

Em produção usa-se **PM2**, não `nest --watch`. Ver `.cursor/rules/deploy-cors-nginx-pm2-guardrails.mdc`.

---

## 8. Checklist rápido quando o sistema travar

1. `.\scripts\cleanup-node-dev.ps1`
2. Fechar abas de terminal no Cursor
3. `npm run dev` (um terminal só)
4. Se Prisma falhar: repetir cleanup → `cd backend` → `npx prisma generate`

---

**Última atualização:** 2026-07-01
