# Backups do ComunikApp

## MySQL

O script canônico de backup é `scripts/backup-mysql.sh`. O cron job é
`deploy/cron/comunikapp-backup`.

### Estratégia

- **Diário** às 03:30 da manhã (baixa demanda)
- `mysqldump --single-transaction` (não trava o banco InnoDB)
- Compactado com `gzip`
- Salva em `/opt/comunikapp/backups/mysql/{daily,weekly}/`
- **Retenção**: 7 dias diários + 4 semanas semanais (cópia aos domingos)
- Roda como usuário `comunikapp` (não-root)
- Lê credenciais de `~/.my.cnf` (com `chmod 600`)
- Log estruturado em `/opt/comunikapp/backups/mysql/backup.log`

### Instalação completa

```bash
# 1. Criar credenciais MySQL (ATENÇÃO: substituir SENHA_REAL)
sudo -u comunikapp -H bash -c 'umask 077 && cat > ~/.my.cnf << EOF
[client]
user=comunikapp
password=SENHA_REAL_DO_MYSQL
host=127.0.0.1
port=3306
EOF'

# 2. Criar diretórios
sudo mkdir -p /opt/comunikapp/backups/mysql/{daily,weekly}
sudo chown -R comunikapp:comunikapp /opt/comunikapp/backups
sudo chmod 750 /opt/comunikapp/backups/mysql

# 3. Permissão de execução no script
sudo chmod +x /opt/comunikapp/app/scripts/backup-mysql.sh

# 4. Validar manualmente (deve gerar 1 backup em ~10 segundos)
sudo -u comunikapp -H /opt/comunikapp/app/scripts/backup-mysql.sh

# 5. Conferir resultado
ls -lah /opt/comunikapp/backups/mysql/daily/
cat /opt/comunikapp/backups/mysql/backup.log

# 6. Instalar cron
sudo cp /opt/comunikapp/app/deploy/cron/comunikapp-backup /etc/cron.d/comunikapp-backup
sudo chmod 644 /etc/cron.d/comunikapp-backup

# 7. Recarregar cron e validar
sudo systemctl reload cron
sudo grep CRON /var/log/syslog | tail
```

### Restauração

```bash
# Listar backups
ls -lah /opt/comunikapp/backups/mysql/daily/ /opt/comunikapp/backups/mysql/weekly/

# Restaurar um backup específico (ATENÇÃO: sobrescreve o banco atual)
gunzip < /opt/comunikapp/backups/mysql/daily/comunikapp-2026-05-13_03-30-00.sql.gz | \
  mysql --defaults-file=/opt/comunikapp/.my.cnf comunikapp
```

> **Antes de restaurar em produção**, sempre:
> 1. Pare o backend: `sudo -u comunikapp -H pm2 stop comunikapp-backend`
> 2. Crie um snapshot do estado atual (banco fica congelado): `mysqldump > /tmp/before-restore.sql`
> 3. Restaure
> 4. Suba o backend: `sudo -u comunikapp -H pm2 start comunikapp-backend`

### Próximos passos (sugeridos)

Backup local protege contra acidente operacional (`DROP TABLE`, bug de
migração, etc.). **NÃO protege** contra invasão da VPS, falha de disco
catastrófica ou desastre físico no DC. Para isso, recomenda-se mover os
backups para fora da VPS:

- **Backblaze B2** (~$0.006/GB/mês) — barato, simples, integração via `rclone`
- **AWS S3** ou **S3-compatible** (Wasabi, R2)
- **Storage Box da Hetzner** — bom custo-benefício se já tem infra europeia

Quando quiser, peço o setup do `rclone` para enviar a pasta `weekly/`
para um bucket externo, com retenção de 6 meses.

### Monitoramento

Sempre verificar periodicamente:

```bash
# Último backup gerado
ls -lath /opt/comunikapp/backups/mysql/daily/ | head -5

# Últimas execuções
tail -30 /opt/comunikapp/backups/mysql/backup.log

# Tamanho total ocupado pelos backups
du -sh /opt/comunikapp/backups/mysql/
```

Para alarmar quando um backup falha, basta adicionar um endereço em `MAILTO`
no cron file `/etc/cron.d/comunikapp-backup` (cron envia stderr por e-mail
em qualquer falha).
