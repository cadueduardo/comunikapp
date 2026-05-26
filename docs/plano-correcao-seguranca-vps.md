# Plano de correcao de seguranca para deploy na VPS

Criado em: 2026-05-26  
Escopo: pontos encontrados na revisao de seguranca do projeto Comunikapp antes do deploy na VPS Contabo.

## Resumo executivo

O projeto ja tem boas bases para producao: backend configurado para escutar em `127.0.0.1`, Nginx como reverse proxy, Helmet, rate limit, `.env` fora do Git e templates de ambiente sem segredos reais. Mesmo assim, ha alguns pontos que devem ser corrigidos antes de considerar o deploy seguro.

Prioridade antes de subir:

1. Corrigir isolamento multi-tenant do estoque.
2. Proteger downloads publicos de arte por token valido.
3. Remover `localhost` do CORS de producao.
4. Desabilitar Swagger/test/debug publicos na VPS.
5. Remover ou mascarar scripts que imprimem secrets.

Melhorias logo depois:

1. Migrar JWT do `localStorage` para cookie `HttpOnly`.
2. Trocar lista manual de rotas publicas por mecanismo centralizado.
3. Revisar logs para reduzir exposicao de tokens, headers e stack traces.
4. Padronizar uploads autenticados e limitar serving direto de `/uploads`.

## Fase 0 - Preparacao

Objetivo: garantir que as correcoes sejam feitas sem perder trabalho local.

Passos:

- Conferir alteracoes locais com `git status`.
- Criar branch dedicada, por exemplo `fix/seguranca-vps`.
- Confirmar que `backend/.env` e `backend/.env.backup` nao estao versionados.
- Na VPS, evitar backups de env dentro do diretorio publico do app. Se existir backup com segredo real, mover para local restrito e aplicar permissao `600`.

Validacao:

```bash
git status --short
git ls-files | rg '(^|/)\.env(\.|$)|\.env\.backup$'
```

Resultado esperado: apenas arquivos `.env.*.example` versionados.

## Fase 1 - Corrigir isolamento multi-tenant no estoque

Prioridade: critica  
Arquivo principal: `backend/src/estoque/middleware/tenant-isolation.middleware.ts`

Problema:

O middleware aceita `x-loja-id` e `x-user-roles` enviados pelo cliente em requisicoes normais. Como esses headers chegam do navegador, um usuario autenticado pode tentar acessar outra loja ou simular roles mais fortes.

Correcao proposta:

- Para requisicoes com JWT comum:
  - Usar sempre `payload.loja_id` como `lojaId`.
  - Usar sempre `payload.funcao` para mapear roles.
  - Ignorar `x-loja-id` e `x-user-roles`.
- Para comunicacao interna:
  - Permitir `x-loja-id` somente quando `x-internal-token` for valido.
  - Rejeitar token interno se `ESTOQUE_INTERNAL_API_TOKEN` estiver ausente, vazio ou fraco.
- Adicionar log de auditoria quando houver tentativa de header divergente:
  - `payload.loja_id !== req.headers['x-loja-id']`
  - `payload.funcao` divergente de `x-user-roles`

Testes recomendados:

- Requisicao com JWT de loja A e sem `x-loja-id`: deve usar loja A.
- Requisicao com JWT de loja A e `x-loja-id` de loja B: deve continuar usando loja A ou retornar 403.
- Requisicao com `x-internal-token` valido e `x-loja-id`: deve funcionar.
- Requisicao com `x-internal-token` invalido: deve retornar 401.

Comandos:

```bash
cd backend
npm test -- tenant-isolation.middleware
npm run build
```

## Fase 2 - Proteger downloads publicos de arte

Prioridade: alta  
Arquivos principais:

- `backend/src/modules/arte-aprovacao/controllers/arte-arquivo.controller.ts`
- `backend/src/modules/arte-aprovacao/services/arte-link-aprovacao.service.ts`
- `backend/src/common/middleware/jwt-global.middleware.ts`
- `deploy/nginx/comunikapp.com.br.conf`

Problema:

Existe download publico por `versaoId + filename`. Se a URL vazar, o arquivo pode ser acessado diretamente, sem validar se o link publico ainda existe, se expirou ou se pertence aquela versao.

Correcao proposta:

- Exigir token publico em downloads publicos de arte.
- Validar no backend:
  - token existe;
  - token nao expirou;
  - token pertence a mesma OS/versao/loja do arquivo;
  - arquivo pertence a versao solicitada;
  - arquivo nao foi deletado/inativado.
- Evitar depender de `/uploads/arte/...` para thumbnails publicos sensiveis.
- Trocar `url_thumbnail` publica por rota autenticada ou rota publica com token.
- Revisar Nginx para impedir exposicao ampla de `/uploads` quando o arquivo exigir controle de acesso.

Decisao tecnica sugerida:

- Para area logada: manter rota autenticada `GET /arte-aprovacao/versoes/:versaoId/arquivos/download/:filename`.
- Para cliente externo: criar rota do tipo `GET /arte-aprovacao/links/public/:token/arquivos/:arquivoId`.
- Fazer o service buscar o arquivo por `arquivoId`, validar token e somente entao servir o stream.

Testes recomendados:

- Download com token valido: 200.
- Download com token expirado: 403 ou 404.
- Download com token de outra OS: 403 ou 404.
- Download sem token: 401/403.
- Tentativa de path traversal no filename: 400.

## Fase 3 - Endurecer CORS de producao

Prioridade: alta  
Arquivo principal: `deploy/nginx/cors-map.conf`

Problema:

O CORS de producao permite `http://localhost:3000` e `http://127.0.0.1:3000`. Isso e util em desenvolvimento, mas nao deve ficar no Nginx da VPS.

Correcao proposta:

- Remover origens locais do arquivo de producao.
- Manter apenas:
  - `https://comunikapp.com.br`
  - `https://www.comunikapp.com.br`
- Se precisar testar local contra API de producao, criar arquivo separado nao versionado ou temporario na VPS.

Validacao:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -i -X OPTIONS https://api.comunikapp.com.br/lojas/login \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST'
curl -i -X OPTIONS https://api.comunikapp.com.br/lojas/login \
  -H 'Origin: https://comunikapp.com.br' \
  -H 'Access-Control-Request-Method: POST'
```

Resultado esperado:

- Para localhost: sem `Access-Control-Allow-Origin`.
- Para dominio oficial: `Access-Control-Allow-Origin: https://comunikapp.com.br`.

## Fase 4 - Swagger, rotas test/debug e 2FA publico

Prioridade: alta  
Arquivos principais:

- `backend/src/main.ts`
- `backend/src/common/middleware/jwt-global.middleware.ts`
- `deploy/nginx/comunikapp.com.br.conf`
- `deploy/nginx/api.comunikapp.com.br.conf`

Problemas:

- Swagger e sempre registrado em `api/docs` no backend.
- O bloqueio de `/api/docs` existe em `comunikapp.com.br.conf`, mas a API dedicada `api.comunikapp.com.br.conf` faz proxy de tudo.
- Rotas `test-*` e `debug/*` dependem de `NODE_ENV !== production`.
- `POST /lojas/login/2fa` esta marcado como `@Public()`, mas nao aparece na lista publica do middleware global.

Correcao proposta:

- Registrar Swagger somente se `ENABLE_SWAGGER=true`.
- Bloquear `/api/docs` tambem em `deploy/nginx/api.comunikapp.com.br.conf`.
- Garantir `NODE_ENV=production` no PM2/systemd da VPS.
- Adicionar `/lojas/login/2fa` e `/api/lojas/login/2fa` na lista publica do middleware global.
- Avaliar remover controllers `test-*` e `debug/*` do modulo em producao, nao apenas bloquear por middleware.

Validacao:

```bash
curl -i https://api.comunikapp.com.br/api/docs
curl -i https://api.comunikapp.com.br/test-validacoes/dashboard
curl -i https://api.comunikapp.com.br/debug/validacoes/os/algum-id
```

Resultado esperado: 404, 401 ou 403. Nunca 200 publico.

## Fase 5 - Remover scripts que imprimem secrets

Prioridade: media  
Arquivos principais:

- `backend/check-env.js`
- `backend/update-env.ps1`
- outros scripts antigos de diagnostico em `backend/`

Problema:

`backend/check-env.js` imprime `DATABASE_URL` e `JWT_SECRET`. Em VPS, isso pode vazar para terminal, historico, PM2 logs ou prints de suporte.

Correcao proposta:

- Remover o script se nao for mais usado.
- Ou mascarar valores:
  - `DATABASE_URL: configured`
  - `JWT_SECRET: configured length=...`
- Nunca imprimir o valor real de senha, token, secret ou URL com credencial.

Validacao:

```bash
rg -n "console\.log\('.*(JWT_SECRET|DATABASE_URL|MAIL_PASS|TOKEN|SECRET)" backend scripts
```

Resultado esperado: nenhum log de valor real.

## Fase 6 - Migrar token do localStorage para cookie HttpOnly

Prioridade: media  
Arquivos principais:

- `frontend/src/contexts/UserContext.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth.ts`
- `frontend/src/app/api/**/route.ts`
- endpoints de login no frontend/backend

Problema:

O token JWT fica no `localStorage`. Se algum XSS ocorrer, o token pode ser lido e reutilizado.

Correcao proposta:

- Ajustar login para gravar token em cookie `HttpOnly`, `Secure`, `SameSite=Lax` ou `Strict`.
- Usar API Routes do Next como camada server-side para anexar `Authorization` ao backend.
- Manter `localStorage` apenas para dados nao sensiveis, ou eliminar `loja_id`, `user_roles` e `user_id` quando forem derivaveis do endpoint `/lojas/me`.
- Revisar WebSockets, que hoje leem token do `localStorage`. Opcoes:
  - autenticar socket por cookie;
  - criar endpoint server-side que emite token curto para socket;
  - manter temporariamente localStorage ate concluir migracao.

Plano incremental:

1. Criar endpoint frontend `/api/auth/login` que chama backend e seta cookie.
2. Criar endpoint `/api/auth/logout` que limpa cookie.
3. Alterar `UserContext` para nao armazenar `access_token`.
4. Migrar chamadas de API criticas para proxy server-side.
5. Migrar WebSockets por ultimo.

## Fase 7 - Centralizar rotas publicas

Prioridade: media  
Arquivo principal: `backend/src/common/middleware/jwt-global.middleware.ts`

Problema:

O middleware usa lista textual de rotas publicas e regras por `includes`. Isso pode abrir rotas novas por acidente, especialmente quando uma URL contem `/publico`.

Correcao proposta:

- Preferir guard global com `APP_GUARD` e decorator `@Public()`.
- Se o middleware global continuar existindo, trocar regras amplas por match exato/regex controlada.
- Criar teste automatizado que valida a matriz de rotas publicas esperadas.

Rotas publicas esperadas hoje:

- Criacao/onboarding de loja.
- Login e login 2FA.
- Verificacao de email.
- Primeiro acesso/definir senha.
- Links publicos de aprovacao de arte.
- Orcamento publico e acao publica com codigo de aprovacao.
- Health check estritamente sem dados sensiveis.

## Fase 8 - Revisar logs e dados sensiveis

Prioridade: media  
Arquivos principais:

- `backend/src/common/middleware/jwt-global.middleware.ts`
- `backend/src/estoque/middleware/tenant-isolation.middleware.ts`
- controllers/services com `console.log`

Problema:

Ha logs de erro com stack trace e pontos que podem logar headers, payload JWT ou caminhos de arquivo. Em producao, logs devem ser uteis sem expor segredos.

Correcao proposta:

- Em producao, nao logar stack trace de erro JWT.
- Nunca logar headers completos.
- Nunca logar token parcial ou payload completo.
- Logar somente `userId`, `lojaId`, rota, metodo, correlationId e motivo resumido.
- Trocar `console.log` por `Logger` com niveis.

Validacao:

```bash
rg -n "JSON\.stringify\(req\.headers\)|Token recebido|Payload JWT|Stack trace|console\.log" backend/src
```

## Fase 9 - Checklist de deploy seguro na VPS

Antes do deploy:

- `backend.env` com permissao `600`.
- `JWT_SECRET` forte e novo.
- `TWO_FACTOR_ENCRYPTION_KEY` forte e separado do JWT, se possivel.
- `ESTOQUE_INTERNAL_API_TOKEN` forte e novo.
- `TURNSTILE_SECRET_KEY` configurado se CAPTCHA for usado.
- `NODE_ENV=production`.
- Backend e frontend escutando apenas em `127.0.0.1`.
- MySQL ouvindo apenas localmente ou protegido por firewall.
- UFW liberando apenas SSH, HTTP e HTTPS.
- Fail2ban ativo para SSH e Nginx.
- Swagger/test/debug bloqueados.
- CORS sem localhost.
- Backups de `.env` fora do diretorio do app e com permissao restrita.

Comandos uteis na VPS:

```bash
sudo ss -tulpn
sudo ufw status verbose
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo systemctl status comunikapp-backend --no-pager
sudo systemctl status comunikapp-frontend --no-pager
curl -i https://api.comunikapp.com.br/api/docs
curl -i https://api.comunikapp.com.br/lojas/health
```

## Ordem recomendada de execucao

1. Fase 1 - estoque multi-tenant.
2. Fase 2 - downloads publicos de arte.
3. Fase 3 - CORS.
4. Fase 4 - Swagger/test/debug e login 2FA.
5. Fase 5 - scripts/logs de secrets.
6. Deploy em ambiente de teste ou horario controlado.
7. Fases 6 a 8 como hardening incremental.

## Criterios de pronto para subir

- `npm run build` passa no backend e frontend.
- `npm audit --omit=dev` sem vulnerabilidades high/critical.
- Testes do middleware de estoque cobrem tentativa de trocar loja via header.
- Downloads publicos de arte exigem token valido.
- Swagger nao responde publicamente na API da VPS.
- CORS aceita somente os dominios oficiais.
- Nenhum script imprime secrets reais.
- `.env` real nao esta no Git e tem permissao restrita na VPS.
