# 🚀 Configuração MySQL na Oracle Cloud

Este guia te ajudará a configurar um banco MySQL na sua máquina Oracle Cloud para usar com o projeto ComunikApp.

## 📋 Pré-requisitos

- Máquina Oracle Cloud com Ubuntu/Debian
- Acesso SSH à máquina
- Permissões de sudo

## 🔧 Passo a Passo

### 1. Conectar na máquina Oracle Cloud

```bash
ssh usuario@seu-ip-oracle
```

### 2. Executar script de configuração automática

```bash
# Dar permissão de execução
chmod +x setup-oracle-cloud-mysql.sh

# Executar script
./setup-oracle-cloud-mysql.sh
```

### 3. Configuração manual (se preferir)

#### Instalar MySQL
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install mysql-server mysql-client -y
```

#### Configurar segurança
```bash
sudo mysql_secure_installation
```

#### Criar usuário e banco
```bash
sudo mysql -u root -p

# No prompt MySQL:
CREATE DATABASE comunikapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'comunikapp'@'%' IDENTIFIED BY 'sua-senha-segura';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'%';
FLUSH PRIVILEGES;
EXIT;
```

#### Permitir conexões remotas
```bash
sudo sed -i 's/bind-address = 127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
sudo systemctl restart mysql
```

#### Configurar firewall
```bash
sudo ufw allow 3306
sudo ufw enable
```

## 📁 Configuração do Projeto

### 1. Copiar arquivo de exemplo
```bash
cp .env-oracle-cloud-example .env
```

### 2. Editar .env
Substitua as seguintes variáveis:
- `seu-ip-oracle` → IP da sua máquina Oracle
- `sua-senha-muito-segura` → Senha escolhida para o usuário MySQL

### 3. Exemplo de configuração
```env
DATABASE_URL="mysql://comunikapp:MinhaSenha123@192.168.1.100:3306/comunikapp"
ESTOQUE_DATABASE_URL="mysql://comunikapp:MinhaSenha123@192.168.1.100:3306/comunikapp"
```

## 🧪 Testando a Conexão

### 1. Instalar dependência (se necessário)
```bash
npm install mysql2
```

### 2. Executar teste
```bash
# Editar o IP no arquivo test-oracle-connection.js
node test-oracle-connection.js
```

### 3. Testar via Prisma
```bash
# Gerar cliente Prisma
npx prisma generate

# Testar conexão
npx prisma db pull

# Criar tabelas (se necessário)
npx prisma db push
```

## 🔍 Verificações de Segurança

### 1. Verificar status do MySQL
```bash
sudo systemctl status mysql
```

### 2. Verificar logs
```bash
sudo tail -f /var/log/mysql/error.log
```

### 3. Verificar conexões ativas
```bash
sudo mysql -u root -p -e "SHOW PROCESSLIST;"
```

### 4. Verificar firewall
```bash
sudo ufw status
```

## 🚨 Troubleshooting

### Erro: "Can't connect to MySQL server"
- Verifique se o MySQL está rodando: `sudo systemctl status mysql`
- Verifique se a porta 3306 está aberta: `sudo ufw status`
- Verifique se o bind-address está correto

### Erro: "Access denied for user"
- Verifique se o usuário foi criado corretamente
- Verifique se as permissões estão corretas
- Verifique se a senha está correta

### Erro: "Connection timeout"
- Verifique se o firewall está permitindo a porta 3306
- Verifique se o IP está correto
- Verifique se há problemas de rede

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do MySQL
2. Teste a conexão localmente primeiro
3. Verifique as configurações de firewall
4. Consulte a documentação oficial do MySQL

## 🔐 Segurança em Produção

- **NUNCA** use senhas padrão
- **SEMPRE** use SSL/TLS para conexões
- **LIMITE** o acesso por IP quando possível
- **MONITORE** logs regularmente
- **ATUALIZE** o MySQL regularmente

---

**✅ Configuração concluída!** Agora você pode usar o MySQL da Oracle Cloud com o projeto ComunikApp.
