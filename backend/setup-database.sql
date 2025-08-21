-- ===== CONFIGURAÇÃO DO BANCO COMUNIKAPP =====

-- 1. Criar banco de dados
CREATE DATABASE IF NOT EXISTS comunikapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Criar usuário com privilégios
CREATE USER IF NOT EXISTS 'comunikapp'@'localhost' IDENTIFIED BY 'password';

-- 3. Conceder privilégios ao usuário
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';

-- 4. Aplicar privilégios
FLUSH PRIVILEGES;

-- 5. Selecionar banco
USE comunikapp;

-- 6. Verificar se foi criado
SHOW DATABASES;
SHOW GRANTS FOR 'comunikapp'@'localhost';
