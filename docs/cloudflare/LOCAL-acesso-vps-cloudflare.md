# LOCAL — Acesso VPS + Cloudflare (agentes)

**NÃO COMMITAR ESTE ARQUIVO.** Está no `.gitignore`.  
**NÃO colar tokens, API keys ou senhas neste arquivo nem no chat.**

Atualizado: 2026-07-28  
Público deste doc: agentes Cursor / operadores na máquina local do Cadu.

**Decisão do operador:** o IP da VPS **não** será trocado. Risco residual de histórico DNS/Shodan aceito; mitigação é UFW (22 fechada; 80/443 só Cloudflare) + Tunnel SSH.

---

## 1. Como acessar a VPS (padrão)

A porta **22 está fechada** na internet. SSH só via **Cloudflare Tunnel + Access**.

### Pré-requisitos na máquina do agente

- `cloudflared` instalado (Windows: WinGet / path típico abaixo)
- Chave SSH: `%USERPROFILE%\.ssh\id_ed25519`
- Host no `%USERPROFILE%\.ssh\config`:

```sshconfig
Host comunikapp-vps
    HostName ssh.comunikapp.com.br
    User admin
    IdentityFile ~/.ssh/id_ed25519
    ProxyCommand C:/Users/cadu/AppData/Local/Microsoft/WinGet/Links/cloudflared.exe access ssh --hostname %h
    IdentitiesOnly yes
```

### Comandos (PowerShell no PC — nunca de dentro da VPS)

```powershell
# Shell interativo
ssh comunikapp-vps

# Um comando
ssh comunikapp-vps "whoami; hostname"

# Deploy típico (app roda como usuário comunikapp)
ssh comunikapp-vps "sudo -u comunikapp -H bash -lc 'cd /opt/comunikapp/app && git pull --ff-only'"
```

### Autenticação Access

Na primeira conexão (ou sessão Access expirada), o `cloudflared` abre o **navegador** para login Cloudflare Access (e-mail do admin). Completar no browser; depois o SSH segue. Sessão configurada ~24h.

### O que NÃO funciona (de propósito)

```powershell
ssh admin@147.93.190.212
# → Connection timed out (UFW nega 22)
```

Não use o IP público para SSH no dia a dia.

---

## 2. Inventário da VPS

| Item | Valor |
|---|---|
| Hostname Contabo | `vmi3319136` |
| IP origem (não publicar em DNS “DNS only”) | `147.93.190.212` |
| Usuário SSH / sudo | `admin` |
| Usuário da aplicação | `comunikapp` |
| Código | `/opt/comunikapp/app` |
| PM2 (app) | sob usuário/ambiente `comunikapp` (ver docs de PM2 do repo) |
| Frontend (Next) | `127.0.0.1:3001` |
| Backend (Nest) | `127.0.0.1:4001` |
| Nginx sites | `/etc/nginx/sites-available/` (fonte canônica no repo: `deploy/nginx/`) |
| Branch observada em produção (2026-07) | `feat/module-nav-shell` (confirmar com `git -C /opt/comunikapp/app rev-parse --abbrev-ref HEAD`) |

### Domínios

| Host | Função | Proxy Cloudflare |
|---|---|---|
| `comunikapp.com.br` / `www` | Frontend | Proxied (laranja) |
| `api.comunikapp.com.br` | API | Proxied + cache bypass |
| `ssh.comunikapp.com.br` | SSH via Tunnel | Tunnel published app (não é site web) |

E-mail Hostinger: MX/TXT e CNAMEs de mail em **DNS only** (cinza).

---

## 3. Cuidados obrigatórios para agentes

1. **Nunca** `systemctl stop cloudflared` / `cloudflared service uninstall` numa sessão que depende do Tunnel — a conexão cai e a 22 está fechada.
2. **Nunca** cole token de Tunnel, API Token Cloudflare ou senhas no chat / commit / este doc.
3. Comandos `ssh comunikapp-vps` e `findstr` são do **Windows**. Dentro da VPS use Linux (`grep`, `ufw`, etc.).
4. Antes de diagnosticar “site fora”: `pm2` / `ss` / `curl 127.0.0.1:4001` **na VPS**; não assumir 502 = app morto sem checar.
5. Nginx: alterar em `deploy/nginx/` no repo → `git pull` na VPS → `cp` para `/etc/nginx/` → `nginx -t` → `reload`. Ver regra CORS do projeto.
6. CORS em produção: responsável é o **Nginx** (`CORS_VIA_PROXY=true`). Validar OPTIONS/POST com `Origin`.
7. Firewall: default deny. Só Cloudflare em 80/443; SSH só Tunnel.
8. Recuperação se Tunnel cair: **console/VNC Contabo** (ruim para cola) **ou** abrir 22 temporariamente (ver §5) se ainda houver outra via.

---

## 4. O que já foi feito no Cloudflare (2026-07)

### Zona / DNS

- Domínio conectado (Full setup / nameservers Cloudflare).
- Registros web (`@`, `www`, `api`, `app`, `monitor`, …) → **Proxied**.
- Mail (`MX`, SPF, DMARC, `autoconfig`, `autodiscover`, Hostinger) → **DNS only**.
- **Pendente Fatia B:** criar registro wildcard `*` (tipo A ou CNAME igual ao `@`) → **Proxied**.
  Sem isso, `{slug}.comunikapp.com.br` não resolve. Após criar, validar:
  `dig +short A cacauplacas.comunikapp.com.br` (deve retornar IPs Cloudflare).

### SSL/TLS

- Modo: **Full (strict)** (origem com certificado válido).
- Let’s Encrypt atual cobre só `comunikapp.com.br`, `www`, `api`.
- **Fatia B:** para `{slug}.*` com Full (strict), usar **Cloudflare Origin Certificate**:
  1. SSL/TLS → Origin Server → Create certificate
  2. Hostnames: `*.comunikapp.com.br`, `comunikapp.com.br`, `www.comunikapp.com.br`, `api.comunikapp.com.br`
  3. Validity: 15 years; Leave Cloudflare private key
  4. Instalar em `/etc/ssl/cloudflare/` na VPS e apontar Nginx (`ssl_certificate` / `ssl_certificate_key`)
  5. Manter Full (strict)
- Workaround temporário (não preferido): SSL/TLS → Overview → **Full** (sem strict) até o Origin Cert estar instalado.

### Cache

- Cache Rule `bypass-api`: Hostname = `api.comunikapp.com.br` → **Bypass cache**.

### API Token (zona)

- Nome: `comunikapp-ops` (validade ~1 ano a partir de jul/2026).
- Escopo: zona `comunikapp.com.br`.
- Permissões tipicas: Zone Read/Write, DNS Write, Zone Settings Write, Cache Purge/Settings, Zone WAF, Firewall Services.
- **Não** inclui Tunnel/Access (criar token separado se for automatizar Zero Trust).
- Guardar só em env local do operador (`CLOUDFLARE_API_TOKEN`) — nunca no Git.

### Zero Trust / Tunnel SSH

| Recurso | Nome / valor |
|---|---|
| Tunnel | `comunikapp-ssh` |
| Connector | host `vmi3319136`, serviço systemd `cloudflared` |
| Published route | `ssh.comunikapp.com.br` → `ssh://localhost:22` |
| Access app | Self-hosted em `ssh.comunikapp.com.br` |
| Policy | Allow por e-mail do admin |
| Token do túnel | regenerado após exposição; **não documentar o valor** |

### Origem (VPS) alinhada ao proxy

| Arquivo / ação | Função |
|---|---|
| `deploy/nginx/cloudflare-realip.conf` → `/etc/nginx/conf.d/` | `$remote_addr` = IP real via `CF-Connecting-IP` |
| Sites Nginx | `X-Forwarded-For $remote_addr` (sem spoofing) |
| `deploy/ufw/apply-cloudflare-only-http.sh` | UFW 80/443 só faixas Cloudflare |
| UFW OpenSSH | removido (22 fechada) |

Docs públicos relacionados (podem estar no Git):

- `docs/cloudflare-hardening-plano.md`
- `docs/cloudflare-tunnel-ssh.md`
- `deploy/nginx/README.md`
- `deploy/ufw/README.md`

---

## 5. Liberar / configurar mais recursos no futuro

### 5.1 Abrir SSH direto temporariamente (manutenção / trocar token do Tunnel)

**Só com Tunnel ainda funcionando**, ou com VNC já aberto.

Na VPS (via `ssh comunikapp-vps`):

```bash
sudo ufw allow OpenSSH
sudo ufw status | grep OpenSSH
```

No PC, em **outra** janela (esta fica estável se o Tunnel cair):

```powershell
ssh -i $env:USERPROFILE\.ssh\id_ed25519 admin@147.93.190.212
```

Nessa sessão por IP: manter / reinstalar `cloudflared`, etc.

Fechar de novo:

```bash
sudo ufw delete allow OpenSSH
```

Validar: IP deve timeout; `ssh comunikapp-vps` deve OK.

### 5.2 Trocar token do Tunnel (sem colar no chat)

1. Painel Zero Trust → Tunnels → `comunikapp-ssh` → **Refresh token**.
2. Abrir 22 temporário (§5.1) e conectar por **IP**.
3. Na sessão IP: `stop` → `service uninstall` → `service install <comando do painel>` → `enable --now`.
4. Testar `ssh comunikapp-vps` no PC.
5. Fechar OpenSSH.
6. Remover conectores Offline no painel, se houver.

**Nunca** `stop`/`uninstall` do `cloudflared` só pela sessão Tunnel.

### 5.3 Novo hostname HTTP na origem

1. DNS Cloudflare: registro **Proxied**.
2. Nginx no repo + `nginx -t` + reload.
3. Certbot/SAN se precisar de nome no certificado da origem (Full strict).
4. Se for API: considerar Cache Rule bypass.
5. CORS: atualizar `deploy/nginx/cors-map.conf` se nova Origin.

### 5.4 Atualizar faixas IP da Cloudflare

Fontes: https://www.cloudflare.com/ips-v4 e `/ips-v6`  

Atualizar **juntos**:

- `deploy/nginx/cloudflare-realip.conf`
- `deploy/ufw/apply-cloudflare-only-http.sh`

Depois pull na VPS, recopiar realip, `nginx -t` + reload, reexecutar o script UFW.

### 5.5 Fechar 80/443 “de emergência” / reabrir

Script: `sudo bash /opt/comunikapp/app/deploy/ufw/apply-cloudflare-only-http.sh`  

Para reabrir Anywhere (só emergência):

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Reaplique o script Cloudflare o quanto antes.

### 5.6 WAF / rate limit / Access em `/gestao`

Painel ou API com token adequado. Rate limit Free: **1 regra**. Access em paths de gestão: defesa em profundidade; não substitui `admin_user` do produto.

### 5.7 CLI / automação Cloudflare

- Token `comunikapp-ops` → DNS, settings, cache, WAF da zona.
- Tunnel/Access → token **separado** com permissões Zero Trust (criar quando for automatizar).
- `wrangler` = Workers/Pages, não administração geral da zona.

---

## 6. Checklist rápido pós-mudança

```powershell
ssh comunikapp-vps "systemctl is-active cloudflared; sudo ufw status | head -30"
curl.exe -I https://comunikapp.com.br
curl.exe -I -X OPTIONS https://api.comunikapp.com.br/lojas/login -H "Origin: https://comunikapp.com.br" -H "Access-Control-Request-Method: POST"
```

Esperado: Tunnel `active`; UFW sem OpenSSH Anywhere; site `200` + `server: cloudflare`; API OPTIONS com um único `Access-Control-Allow-Origin`.

---

## 7. Contatos de recuperação

- Console/VNC: painel Contabo da VPS `vmi3319136`
- Cloudflare Zero Trust: Tunnels / Access
- Se perder Tunnel e 22: VNC → `sudo systemctl start cloudflared` (se o serviço ainda existir)
