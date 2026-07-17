# fail2ban - configuração do ComunikApp

Esta pasta contém o `jail.local` canônico para a VPS de produção. **Não edite
direto em `/etc/fail2ban/`** — altere aqui, faça commit, dê pull na VPS e
copie. O repositório é a fonte da verdade.

## Instalação na VPS (uma vez)

```bash
sudo cp /opt/comunikapp/app/deploy/fail2ban/jail.local /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

Esperado em `status`:

```
Jail list: nginx-bad-request, nginx-botsearch, nginx-http-auth, recidive, sshd
```

## Atualização (quando o `jail.local` mudar no repo)

```bash
sudo -u comunikapp -H bash -lc 'cd /opt/comunikapp/app && git pull --ff-only'
sudo cp /opt/comunikapp/app/deploy/fail2ban/jail.local /etc/fail2ban/jail.local
sudo systemctl reload fail2ban
```

## Comandos úteis

```bash
# Estado geral
sudo fail2ban-client status

# Estado de uma jail específica (mostra banidos atuais)
sudo fail2ban-client status sshd
sudo fail2ban-client status nginx-botsearch

# Desbanir um IP (caso seu próprio IP tenha sido banido por engano)
sudo fail2ban-client unban 1.2.3.4

# Banir manualmente um IP
sudo fail2ban-client set sshd banip 1.2.3.4

# Histórico de bans
sudo zgrep -h 'Ban\|Unban' /var/log/fail2ban.log*
```

## Atenção - IP em `ignoreip`

O `jail.local` inclui um IP residencial em `ignoreip` (admin/dev). IPs
residenciais costumam ser **dinâmicos**. Se o seu IP mudar, edite o
arquivo no repositório, faça push, puxe na VPS e recopie. Enquanto isso,
você pode ser banido por engano — nesse caso use `unban` (após acessar de
outro IP) ou aguarde 1 hora (bantime padrão).

## Por que adicionamos jails Nginx

A VPS já sofreu uma invasão. Mesmo com SSH protegido, o Nginx ficou
exposto e qualquer scanner pode bater em `/wp-admin`, `/.env`,
`/phpmyadmin`, etc. O `nginx-botsearch` bane esses scanners
agressivamente (2 tentativas → 24h de ban).

O `recidive` é uma segunda camada: quem é banido várias vezes por
qualquer jail leva ban de 1 semana com bloqueio em todas as portas.
