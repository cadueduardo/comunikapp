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
- [ ] Túnel remoto criado no Zero Trust
- [ ] Serviço `cloudflared` rodando na VPS (Healthy)
- [ ] Published application `ssh` → `ssh://localhost:22`
- [ ] Access application + política (e-mail do admin)
- [ ] `~/.ssh/config` no Windows
- [ ] Teste `ssh comunikapp-vps` (Access no browser + chave SSH)
- [ ] Porta 22 fechada no UFW (somente depois do teste)

## Passo manual no painel (você)

O token `comunikapp-ops` **não** tem permissão de Tunnel/Access. Crie o túnel no dashboard:

1. Abra [Zero Trust → Networks → Tunnels](https://one.dash.cloudflare.com/)  
   (ou Cloudflare Dashboard → Zero Trust → Networks → Tunnels)
2. **Create a tunnel** → tipo **Cloudflared**
3. Nome: `comunikapp-ssh`
4. **Save tunnel**
5. Escolha **Debian** / **Ubuntu** e **copie o comando de instalação**  
   (começa com `sudo cloudflared service install ...`)
6. **Não rode ainda na VPS** — cole o comando aqui no chat (ou só o token longo depois de `install`).  
   Eu aplico na VPS.
7. Depois que o túnel ficar **Healthy**, em **Routes → Published application**:
   - Subdomain: `ssh`
   - Domain: `comunikapp.com.br`
   - Type/Service: `SSH` → `localhost:22`
8. Em **Access → Applications** (self-hosted):
   - Application: `ssh.comunikapp.com.br`
   - Policy: Allow para o e-mail do admin (One-time PIN / Google)
   - Action: Allow (ou Service Auth depois, para automação headless)

## Config SSH no Windows (após o hostname existir)

Arquivo: `C:\Users\cadu\.ssh\config`

```sshconfig
Host comunikapp-vps
    HostName ssh.comunikapp.com.br
    User admin
    IdentityFile ~/.ssh/id_ed25519
    ProxyCommand cloudflared access ssh --hostname %h
    IdentitiesOnly yes
```

Teste (porta 22 ainda aberta como fallback):

```powershell
ssh comunikapp-vps "whoami; hostname"
```

Na primeira vez o `cloudflared` abre o browser para autenticar no Access.

## Fechar a porta 22 (somente depois)

Quando `ssh comunikapp-vps` funcionar de forma estável:

```bash
# Na VPS — manter sessão Tunnel aberta em outro terminal
sudo ufw status verbose
# Liberar apenas o necessário; NÃO corte SSH sem Tunnel validado
sudo ufw delete allow 22/tcp   # ou regra equivalente — conferir antes
sudo ufw reload
```

Manter console/VNC da Contabo testado como recuperação.

## Token API separado (opcional, depois)

Para o agente criar/ajustar Tunnel via CLI sem dashboard:

- Nome: `comunikapp-tunnel`
- Account → Cloudflare Tunnel → Edit
- Account → Access: Apps and Policies → Edit
- Sem misturar com o token de zona `comunikapp-ops`
