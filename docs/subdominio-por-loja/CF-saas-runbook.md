# Runbook — Cloudflare for SaaS (Fatia D)

**Objetivo:** servir `https://sistema.minhaloja.com.br` (subdomínio do cliente)
via Custom Hostnames, sem abrir 80/443 da VPS e sem apex no MVP.

**Plano CF:** Free — até 100 hostnames grátis; depois US$ 0,10/hostname/mês
([docs](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/)).

## 1. Ativar Cloudflare for SaaS (uma vez)

Na zona `comunikapp.com.br` (dashboard Cloudflare):

1. SSL/TLS → Custom Hostnames (ou **Cloudflare for SaaS**) → Enable.
2. Criar registro DNS **proxied**:
   - Tipo: `A` (ou CNAME para o mesmo origem do apex)
   - Nome: `proxy-fallback`
   - Conteúdo: IP da origem VPS (o mesmo usado pelo apex atrás do proxy)
   - Proxy: **laranja**
3. Em Custom Hostnames → **Fallback Origin** = `proxy-fallback.comunikapp.com.br`
   → aguardar status **Active**.
4. Criar registro DNS **proxied** (CNAME target amigável):
   - Tipo: `CNAME`
   - Nome: `customers`
   - Alvo: `proxy-fallback.comunikapp.com.br`
   - Proxy: **laranja**

Cliente apontará:

```text
sistema.minhaloja.com.br  CNAME  customers.comunikapp.com.br
```

## 2. Token API

1. My Profile → API Tokens → Create Token.
2. Permissão mínima na zona: **SSL and Certificates → Edit** (Custom Hostnames).
3. Escopo: zona `comunikapp.com.br`.
4. Guardar o token (só aparece uma vez).

## 3. Secrets na VPS (`backend/.env`)

```bash
CF_ZONE_ID="<zone id de comunikapp.com.br>"
CF_API_TOKEN="<token>"
CF_SAAS_CNAME_TARGET="customers.comunikapp.com.br"
CF_SAAS_FALLBACK_ORIGIN="proxy-fallback.comunikapp.com.br"
```

Sem `CF_ZONE_ID` + `CF_API_TOKEN`, o backend **recusa** salvar domínio próprio em produção
(mensagem clara na API). Em desenvolvimento local, pode mockar/omitir (wizard mostra
instruções com o target padrão).

Após editar `.env`:

```bash
sudo -u comunikapp -H bash -lc 'cd /opt/comunikapp/app && pm2 reload comunikapp-backend --update-env'
```

## 4. Nginx

O site frontend inclui um `server` catch-all (default) que aceita o `Host` do
domínio do cliente quando a CF encaminha o tráfego pelo fallback. TLS na origem
continua com o **Cloudflare Origin Cert** (Full Strict).

Deploy com `APPLY_NGINX=1` aplica o conf canônico do repo.

## 5. Apex (fora do MVP)

`minhaloja.com.br` (raiz) **não** é suportado no wizard Free: depende de
ALIAS/flattening no DNS do cliente ou Apex proxying (Enterprise). Futuro.

## 6. Checklist pós-setup

- [ ] Fallback Origin Active
- [ ] `customers.comunikapp.com.br` resolve (proxied)
- [ ] Env CF_* no backend + reload PM2
- [ ] Wizard: salvar subdomínio → cria Custom Hostname
- [ ] Cliente configura CNAME (+ TXT DCV se a UI mostrar)
- [ ] Verificar → status CF `active` + SSL `active` → `VERIFICADO`
- [ ] Login em `https://sistema…/login` mantém sessão no mesmo host
