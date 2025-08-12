-- Script para configurar banco de dados Comunikapp
-- Execute este arquivo no MySQL

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS comunikapp;

-- Criar usuário
CREATE USER IF NOT EXISTS 'comunikapp'@'localhost' IDENTIFIED BY 'password';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Verificar se foi criado
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'comunikapp';
