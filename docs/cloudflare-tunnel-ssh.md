# Cloudflare Tunnel — SSH da VPS (ComunikApp)

**Objetivo:** agentes e operadores acessam a VPS via `ssh` com chave, sem expor a porta 22 na internet.
**Status:** `cloudflared` 2026.7.3 instalado na VPS; túnel ainda não criado (falta token Zero Trust).

## Arquitetura

```text
Windows/Cursor → ssh + cloudflared access → Cloudflare Access
                 → Tunnel → localhost:22 na VPS
```

Hostname planejado: `ssh.comunikapp.com.br`  
Usuário SSH da VPS: `admin` (chave `~/.ssh/id_ed25519`)  
Usuário de app: `comunikapp` (deploy)

## O que já está feito

- [x] Zona Cloudflare ativa / proxy no site e API
- [x] Nginx `real_ip` + `X-Forwarded-For` na VPS
- [x] `cloudflared` instalado na VPS (`admin@147.93.190.212`)
- [x] `cloudflared` instalado no Windows local
- [x] Túnel remoto criado no Zero Trust (`comunikapp-ssh`)
- [x] Serviço `cloudflared` rodando na VPS (Healthy / QUIC)
- [x] Published application `ssh` → `ssh://localhost:22`
- [x] Access application + política (e-mail do admin)
- [x] `~/.ssh/config` no Windows (`Host comunikapp-vps`)
- [x] Teste `ssh comunikapp-vps` OK (`admin` / `vmi3319136`)
- [x] Porta 22 fechada no UFW (2026-07-28) — direto dá timeout; Tunnel OK

## Config SSH no Windows

Arquivo: `C:\Users\cadu\.ssh\config`

```sshconfig
Host comunikapp-vps
    HostName ssh.comunikapp.com.br
    User admin
    IdentityFile ~/.ssh/id_ed25519
    ProxyCommand C:/Users/cadu/AppData/Local/Microsoft/WinGet/Links/cloudflared.exe access ssh --hostname %h
    IdentitiesOnly yes
```

```powershell
ssh comunikapp-vps "whoami; hostname"
```

Na primeira vez o `cloudflared` abre o browser para autenticar no Access.

## Porta 22 fechada (concluído em 2026-07-28)

Removidas as regras UFW `OpenSSH` (IPv4 e IPv6). Restam apenas 80/443.

Validação:
- `ssh comunikapp-vps` → OK
- `ssh admin@147.93.190.212` → Connection timed out

Recuperação se o Tunnel cair: console/VNC da Contabo.

Pendente recomendado: regenerar o token do túnel (exposto no chat) e reinstalar o serviço.

## Token API separado (opcional, depois)

Para o agente criar/ajustar Tunnel via CLI sem dashboard:

- Nome: `comunikapp-tunnel`
- Account → Cloudflare Tunnel → Edit
- Account → Access: Apps and Policies → Edit
- Sem misturar com o token de zona `comunikapp-ops`
