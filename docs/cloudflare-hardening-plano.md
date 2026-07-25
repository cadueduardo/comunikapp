# Plano de hardening com Cloudflare (plano Free)

**Criado em:** 2026-07-25
**Escopo:** colocar `comunikapp.com.br` e `api.comunikapp.com.br` atrás do proxy da Cloudflare, ocultando o IP de origem da VPS, sem quebrar login, rate limit, fail2ban, CORS e WebSocket.
**Status:** plano aprovado para execução — nenhuma configuração alterada ainda.

## Decisões já tomadas

| Decisão | Valor definido |
|---|---|
| Entregável deste ciclo | Plano documentado, sem alterar `deploy/` |
| Rotas acima de 100s | Não existem (timeout 524 da Cloudflare não é bloqueador) |
| Trocar IP da VPS | Não será feito agora |
| Proteção do SSH | Em aberto — comparação na seção 8 |

## 1. Premissa central: o proxy sozinho não esconde o IP

Ativar o proxy ("nuvem laranja") remove o IP de origem das respostas de DNS. Ele **não** remove o IP de:

- **histórico de DNS** — serviços como SecurityTrails e DNS History já registraram o IP atual desde que o domínio existe. Ativar Cloudflare agora não apaga registros passados;
- **varredura de internet** — Shodan e Censys indexam o certificado TLS apresentado na porta 443 do IP. Como a VPS serve o certificado Let's Encrypt de `comunikapp.com.br`, é possível casar IP e domínio por varredura direta;
- **Certificate Transparency** — os certificados emitidos já expõem os nomes `comunikapp.com.br`, `www.` e `api.`. Isso não revela o IP, mas facilita enumerar subdomínios que possam estar fora do proxy;
- **qualquer registro DNS não proxiado** apontando para a mesma VPS.

**Conclusão:** o IP só fica efetivamente oculto quando o firewall da VPS aceitar 80/443 **apenas** das faixas da Cloudflare (Fase 6). Antes disso, o ganho é WAF, DDoS e cache — não ocultação.

Como o IP atual não será trocado, aceite explicitamente este risco residual: **o IP de origem já está publicado em bases históricas e continuará descobrível por quem procurar**. O bloqueio de firewall torna esse conhecimento inútil (conexões diretas passam a ser recusadas), mas não o apaga. Se em algum momento a troca de IP virar viável, ela fecha essa última lacuna.

### Vetor que já está coberto

O envio de e-mail sai por relay SMTP externo (`SMTP_HOST` / `MAIL_HOST` em `backend/src/mail/mail.service.ts`), e não por MTA local. Portanto os cabeçalhos dos e-mails transacionais **não** expõem o IP da VPS. Nenhuma ação necessária.

## 2. Estado atual relevante

| Componente | Situação hoje |
|---|---|
| Frontend Next.js | `127.0.0.1:3001`, proxiado por `deploy/nginx/comunikapp.com.br.conf` |
| Backend NestJS | `127.0.0.1:4001`, proxiado por `deploy/nginx/api.comunikapp.com.br.conf` |
| Responsável por CORS | Nginx (`CORS_VIA_PROXY=true`), com `proxy_hide_header` como guardrail |
| TLS | Let's Encrypt via Certbot, certificado SAN em `/etc/letsencrypt/live/comunikapp.com.br/` |
| HSTS | Comentado (linha 60 de `api.comunikapp.com.br.conf`) |
| Rate limit de login (Nginx) | `limit_req_zone $binary_remote_addr` — 5 req/min |
| Rate limit global (backend) | `express-rate-limit` com `trust proxy: 1` |
| Lockout / CAPTCHA de login | Em memória, chave `email + ip` (`lojas.service.ts`) |
| fail2ban | Jails de SSH e Nginx, banimento via `iptables` |
| Upload máximo | 25 MB na API, 10 MB no site |
| WebSocket | Socket.IO em `/socket.io/` (módulo Arte & Aprovação) |

## 3. O que quebra ao ativar o proxy (e a correção)

Todo o controle de abuso do projeto é baseado no IP do cliente. Com a Cloudflare na frente, o Nginx passa a ver o IP da borda da Cloudflare no lugar do IP do usuário. Consequências, em ordem de gravidade:

### 3.1 Rate limit de login vira negação de serviço própria

```6:6:deploy/nginx/comunikapp.com.br.conf
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
```

Todos os usuários passariam a compartilhar poucos IPs de borda. O efeito prático é **5 tentativas de login por minuto para a base inteira**, somadas. Login inutilizável em horário de pico.

### 3.2 fail2ban passa a banir a Cloudflare

Os jails `nginx-bad-request` e `nginx-botsearch` detectam pelo IP registrado no log de acesso. Sem correção, o IP registrado é o da borda da Cloudflare, e o banimento por `iptables` derruba o site **para todos os usuários** simultaneamente.

### 3.3 Lockout e CAPTCHA de login misturam usuários

A chave de tentativas é `email + ip`:

```62:64:backend/src/lojas/lojas.service.ts
  private getLoginAttemptKey(email: string, ip: string) {
    return `${email.trim().toLowerCase()}|${ip}`;
  }
```

Com o IP colapsado em poucos valores, o limiar de CAPTCHA (`loginCaptchaThreshold = 5`) e o de lockout (`lockoutThreshold = 8`) podem ser atingidos por tráfego legítimo agregado.

### 3.4 Turnstile recebe IP errado

`validateTurnstileToken` envia `remoteip` para a API de verificação. Um IP incorreto degrada a decisão do Turnstile.

### 3.5 Logs de auditoria perdem valor forense

As linhas `login_failed ... ip=` e `login_blocked ... ip=` passam a registrar a borda da Cloudflare, inutilizando investigação de incidente.

### Correção única para 3.1 a 3.5

Habilitar o módulo `realip` no Nginx, declarando as faixas da Cloudflare como proxies confiáveis e lendo o IP real do cabeçalho `CF-Connecting-IP`. Com isso, `$remote_addr` volta a ser o IP real do cliente e **tudo que depende dele é corrigido de uma vez**: `limit_req_zone`, log de acesso (portanto fail2ban), e o valor propagado ao backend.

Ponto importante: como o `realip` reescreve `$remote_addr`, o formato de log padrão (`combined`) já passa a registrar o IP real. **Nenhum filtro de fail2ban precisa ser reescrito.**

## 4. Achado de segurança pré-existente: `X-Forwarded-For` confiável demais

Este problema **já existe hoje**, independente da Cloudflare, e deve ser corrigido no mesmo ciclo.

O controller lê o primeiro elemento do cabeçalho `X-Forwarded-For`:

```47:52:backend/src/lojas/lojas.controller.ts
    const clientIp = req.headers['x-forwarded-for']
      ?.toString()
      .split(',')[0]
      ?.trim();
    const userAgent = req.headers['user-agent']?.toString() || 'unknown';
    return this.lojasService.login(loginDto, clientIp || req.ip, userAgent);
```

E o Nginx **acrescenta** ao cabeçalho recebido, em vez de substituí-lo:

```24:24:deploy/nginx/comunikapp.com.br.conf
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

Ou seja: um cliente que envie `X-Forwarded-For: 1.2.3.4` produz `1.2.3.4, <ip_real>`, e o backend adota `1.2.3.4` como IP do cliente.

**Impacto:** o lockout progressivo e o limiar de CAPTCHA do login podem ser contornados rotacionando um cabeçalho falso. O `remoteip` enviado ao Turnstile também é controlado pelo atacante.

**Correção proposta:** após o `realip` estar ativo, o Nginx deve **sobrescrever** o cabeçalho com o IP real resolvido, em vez de anexar:

```
proxy_set_header X-Forwarded-For $remote_addr;
```

Isso torna o `.split(',')[0]` do controller determinístico e confiável, e mantém `trust proxy: 1` correto no backend. A alternativa (corrigir a leitura no backend para pegar o elemento mais à direita) é mais frágil e depende do número de hops.

## 5. Consequência arquitetural: fail2ban HTTP perde efeito após o bloqueio

Depois da Fase 6, todo tráfego HTTP chega das faixas da Cloudflare. O fail2ban continuará **detectando** corretamente (graças ao `realip`), mas o banimento por `iptables` do IP do atacante **não terá efeito**, porque os pacotes chegam com IP de origem da Cloudflare.

Os jails HTTP precisam de uma decisão:

| Opção | Como funciona | Avaliação |
|---|---|---|
| Bloquear na borda | Ação do fail2ban que chama a API da Cloudflare para banir o IP | Mais eficaz; exige token de API com escopo restrito guardado na VPS |
| Delegar à Cloudflare | Usar WAF Managed Ruleset + a regra de rate limiting do Free | Menos granular, mas sem segredo novo na VPS |
| Manter só SSH | Jails HTTP viram apenas detecção/alerta | Simples; perde a resposta automática |

O jail `sshd` **continua totalmente eficaz**, porque a conexão SSH é direta e não passa pelo proxy.

Recomendação: começar pela opção "Delegar à Cloudflare" (nada novo para guardar na VPS) e reavaliar depois de observar os Security Events por algumas semanas.

## 6. Configuração no painel da Cloudflare

| Item | Valor exigido | Motivo |
|---|---|---|
| SSL/TLS | **Full (Strict)** | Qualquer outro modo é inseguro. `Flexible` cria loop de redirect, porque o Nginx já força 80 → 443 |
| Registros a proxiar | `comunikapp.com.br`, `www`, `api` | Qualquer registro cinza apontando para a VPS entrega o IP |
| Cache | Regra de **bypass** para `api.comunikapp.com.br` e para `/api/*` no domínio principal | Impede cache de resposta autenticada e de header CORS que varia por `Origin` |
| Bot Fight Mode | **Desligado no início** | Pode desafiar tráfego legítimo não-navegador (webhooks, integrações) |
| Always Use HTTPS | Opcional | O Nginx já redireciona; ativar é redundante, não conflitante |
| Regra de rate limiting (1 disponível) | Aplicar no endpoint de login | É o alvo de força bruta mais óbvio |
| WAF Managed Ruleset | Ativar o conjunto gratuito | Cobertura básica sem custo |

### Limites do plano Free a considerar

| Recurso | Limite no Free |
|---|---|
| Regras de rate limiting | 1 |
| Regras WAF customizadas | 5 |
| WAF Managed Rules | Apenas o ruleset gratuito |
| Corpo máximo de request | 100 MB (folga confortável frente aos 25 MB atuais) |
| Timeout de proxy | 100 s (erro 524) — sem impacto, conforme decisão registrada |
| Security Events | Somente logs amostrados |
| Cloudflare Access (Zero Trust) | Até 50 usuários |

A regra de rate limiting é única. Quando o módulo de gestão administrativa existir, será necessário decidir entre proteger o login da loja ou o login administrativo — ou cobrir ambos por uma expressão de caminho, respeitando que no Free a expressão aceita apenas `Path` e `Verified Bot`.

### Certificados

O Certbot com desafio HTTP-01 continua funcionando através do proxy, desde que `/.well-known/acme-challenge/` não seja bloqueado nem desafiado pela Cloudflare. Alternativas mais robustas, se a renovação der problema:

1. **Cloudflare Origin CA** — certificado de validade longa emitido pela Cloudflare, válido só entre borda e origem. Compatível com Full (Strict).
2. **DNS-01** via API da Cloudflare — não depende de porta 80 aberta.

Nenhuma das duas é necessária agora; registrar como plano B.

## 7. Ordem de execução

Cada fase tem validação própria. Não avançar sem a validação da fase anterior passar. Conforme a regra do projeto, enviar comandos em blocos curtos e conferir a saída de cada um.

### Fase 0 — Inventário de DNS

Levantar **todos** os registros da zona e classificar cada um: proxiado, DNS-only intencional, ou apontando para a VPS por engano. Qualquer `A`/`AAAA` cinza para o IP da origem anula todo o esforço.

Atenção especial a nomes comuns de vazamento: `mail`, `smtp`, `direct`, `ftp`, `cpanel`, `staging`, `dev`, `vpn`.

### Fase 1 — `realip` no Nginx (antes de proxiar)

Esta fase é segura e idempotente: sem a Cloudflare na frente, nenhum request chega das faixas declaradas, então nada muda de comportamento.

1. Confirmar que o módulo está compilado:

```bash
nginx -V 2>&1 | grep -o with-http_realip_module
```

2. Criar um arquivo dedicado (ex.: `/etc/nginx/conf.d/cloudflare-realip.conf`) com um `set_real_ip_from` para cada faixa oficial, mais `real_ip_header CF-Connecting-IP;`.

As faixas devem ser obtidas das fontes oficiais e **mudam com o tempo**:

- https://www.cloudflare.com/ips-v4
- https://www.cloudflare.com/ips-v6

Definir junto um procedimento de atualização periódica dessa lista (revisão trimestral ou script de refresh). Lista desatualizada faz o Nginx voltar a registrar o IP da borda, reintroduzindo silenciosamente os problemas da seção 3.

3. Sobrescrever o `X-Forwarded-For` em todos os blocos `location` que fazem `proxy_pass`, conforme a seção 4.

**Validação:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Acessar o site de fora e confirmar que o IP registrado em `/var/log/nginx/access.log` continua sendo o IP real do cliente.

### Fase 2 — Backend e fail2ban

1. Revisar `trust proxy` em `backend/src/main.ts`. Com o `X-Forwarded-For` sobrescrito pelo Nginx, `trust proxy: 1` permanece correto.
2. Confirmar que os filtros de fail2ban seguem casando com o formato de log (esperado: sim, sem alteração).
3. Registrar a decisão da seção 5 sobre os jails HTTP.

**Validação:**

```bash
pm2 list
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### Fase 3 — Ativar o proxy

Executar fora do horário de pico, um registro por vez, começando pelo site e deixando `api` para depois de validar o site.

Definir SSL/TLS como **Full (Strict)** **antes** de ativar a nuvem laranja.

**Validação:**

```bash
curl -I https://comunikapp.com.br
```

Esperado: resposta 200 e presença de cabeçalhos da Cloudflare (`cf-ray`, `server: cloudflare`).

### Fase 4 — Validação obrigatória de CORS e aplicação

Checklist da regra `deploy-cors-nginx-pm2-guardrails.mdc`, sem atalhos:

```bash
curl -i -X OPTIONS https://api.comunikapp.com.br/lojas/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Access-Control-Request-Method: POST"
```

```bash
curl -i -X POST https://api.comunikapp.com.br/lojas/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Content-Type: application/json" \
  -d '{}'
```

```bash
curl -s -I -X OPTIONS https://api.comunikapp.com.br/lojas/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Access-Control-Request-Method: POST" \
  | grep -ic 'access-control-allow-origin'
```

O último comando precisa retornar exatamente `1`. Mais de um valor indica que a Cloudflare está reemitindo ou cacheando o header — nesse caso, revisar a regra de bypass de cache.

```bash
curl -i http://127.0.0.1:4001/api/docs
```

Backend local deve responder algo de aplicação (200/401/404), **nunca** 502.

Além dos comandos, validar manualmente:

- login completo, incluindo 2FA;
- que o rate limit de login dispara para um cliente isolado e **não** para usuários distintos;
- WebSocket do módulo Arte & Aprovação (aprovação em tempo real);
- upload de arquivo próximo ao limite de 25 MB;
- que `/api/docs`, `/test-`, `/debug` e `/uploads/arte/` continuam retornando 404.

### Fase 5 — Observação

Manter o proxy ativo com o firewall ainda aberto por alguns dias. Acompanhar Security Events, logs do Nginx e reclamações de login. É a janela de rollback barato.

### Fase 6 — Fechar o firewall (é aqui que o IP passa a ser irrelevante)

Somente depois da Fase 5 estar estável.

1. Restringir 80 e 443 no UFW para aceitar apenas as faixas da Cloudflare (IPv4 e IPv6).
2. Adicionar um `server` padrão no Nginx que responda `444` a requisições sem `server_name` conhecido, para não entregar o certificado a quem varre por IP.
3. Resolver o acesso SSH **antes** de aplicar, conforme seção 8.

**Ordem segura:** aplicar as regras de liberação da Cloudflare **primeiro**, e só então remover a liberação genérica. Nunca o inverso.

**Validação:** de uma máquina fora da Cloudflare, conectar direto ao IP e confirmar recusa:

```bash
curl -I --max-time 10 https://<IP_DA_VPS> --insecure
```

Esperado: timeout ou conexão recusada.

### Fase 7 — HSTS e Cloudflare Access (opcional)

Com Full (Strict) estável, avaliar:

- descomentar o HSTS em `api.comunikapp.com.br.conf` (atenção: `includeSubDomains` é difícil de reverter, pois fica no cache dos navegadores);
- colocar **Cloudflare Access** na frente de `/gestao` quando o módulo de gestão administrativa existir. Até 50 usuários no Free, exigindo identidade antes de o request chegar à aplicação. Combina com o RP em `docs/gestao-comunikapp/` (2FA obrigatório, sessão curta, admin isolado), mas é **defesa em profundidade** — não substitui `admin_user` nem o RBAC próprio.

## 8. SSH após o bloqueio: comparação das opções

A porta 22 não passa pelo proxy HTTP. Fechar 80/443 para a Cloudflare não protege o SSH, e o SSH exposto continua sendo um caminho para descobrir e atacar a origem.

| Critério | Cloudflare Tunnel / Zero Trust | Allowlist de IP no UFW | Manter 22 aberto com fail2ban |
|---|---|---|---|
| Porta 22 visível na internet | Não | Sim, para o IP liberado | Sim, para todos |
| Aparece em varredura (Shodan) | Não | Sim | Sim |
| Risco de perder acesso | Médio (depende do serviço do túnel) | **Alto** — IP residencial muda sem aviso | Baixo |
| Complexidade de setup | Alta (daemon + Zero Trust + política) | Baixa | Nenhuma |
| Dependência externa | Cloudflare no caminho do acesso administrativo | Nenhuma | Nenhuma |
| Custo | Grátis até 50 usuários | Grátis | Grátis |
| Auditoria de acesso | Log por identidade no Zero Trust | Nenhuma | Log do sistema |

Observação sobre a opção de allowlist: o `ignoreip` do fail2ban já carrega um IP residencial com aviso explícito de que muda:

```16:19:deploy/fail2ban/jail.local
# - 187.101.173.3: IP de admin/dev em 2026-05-13. RESIDENCIAL PODE MUDAR;
#   atualizar aqui (e reload do fail2ban) sempre que o provedor renovar o IP.
# -----------------------------------------------------------------------------
ignoreip = 127.0.0.1/8 ::1 187.101.173.3
```

Usar esse mesmo IP como **única** porta de entrada do SSH transforma uma renovação de IP do provedor em perda de acesso à VPS.

### Recomendação

**Cloudflare Tunnel**, com duas condições obrigatórias:

1. manter o acesso ao console/VNC da Contabo testado e documentado como via de recuperação;
2. só fechar a porta 22 no UFW **depois** de autenticar com sucesso pelo túnel em uma sessão separada, mantendo a sessão antiga aberta.

Se a complexidade não for desejada agora, o caminho intermediário aceitável é: manter 22 aberto com fail2ban (que segue eficaz para SSH, porque a conexão é direta), avançar com o bloqueio de 80/443, e tratar o túnel como etapa posterior. Isso já entrega a maior parte do ganho, assumindo o risco conhecido de manter o SSH visível.

Esta decisão continua **em aberto** e deve ser registrada aqui quando fechada.

## 9. Rollback

| Fase | Como reverter |
|---|---|
| 1 e 2 | Remover o `conf.d/cloudflare-realip.conf`, restaurar `$proxy_add_x_forwarded_for`, `nginx -t` e reload |
| 3 | Desativar o proxy no registro DNS (nuvem cinza). Propagação rápida, mas não instantânea |
| 6 | Reabrir 80/443 no UFW para qualquer origem |

A fase de maior risco operacional é a 6, porque um erro pode isolar a VPS. Por isso a ordem "liberar antes de restringir" e a exigência de resolver o SSH primeiro.

## 10. Critérios de pronto

- [ ] Todos os registros DNS auditados e classificados
- [ ] `$remote_addr` no log do Nginx é o IP real do cliente
- [ ] `X-Forwarded-For` sobrescrito pelo Nginx (achado da seção 4 corrigido)
- [ ] Rate limit de login dispara por cliente, não pela base inteira
- [ ] fail2ban detecta pelo IP real; decisão da seção 5 registrada
- [ ] SSL/TLS em Full (Strict)
- [ ] Bypass de cache confirmado para a API
- [ ] Checklist de CORS com exatamente um `Access-Control-Allow-Origin`
- [ ] Login com 2FA, WebSocket e upload de 25 MB validados
- [ ] Rotas `/api/docs`, `/test-`, `/debug`, `/uploads/arte/` ainda em 404
- [ ] Acesso SSH resolvido e testado antes do bloqueio
- [ ] Conexão direta ao IP recusada de fora da Cloudflare
- [ ] Risco residual do histórico de DNS aceito formalmente (IP não será trocado)

## 11. Fora do escopo deste plano

- Troca do IP da VPS (decidido: não agora)
- Migração do JWT para cookie `HttpOnly` — ver Fase 6 de `docs/plano-correcao-seguranca-vps.md`
- Cloudflare Access em `/gestao` — depende do módulo de `docs/gestao-comunikapp/`
- Upgrade para plano pago da Cloudflare
