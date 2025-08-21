-- ===== SCRIPT PARA CRIAR BANCO DE TESTE =====
-- Execute este script no MySQL para criar o banco de teste

-- 1. Criar banco de dados de teste
CREATE DATABASE IF NOT EXISTS comunikapp_teste
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 2. Verificar se o usuário existe, se não, criar
-- (Execute apenas se o usuário 'comunikapp' não existir)
-- CREATE USER IF NOT EXISTS 'comunikapp'@'localhost' IDENTIFIED BY 'password';

-- 3. Garantir permissões para o banco de teste
GRANT ALL PRIVILEGES ON comunikapp_teste.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;

-- 4. Selecionar o banco de teste
USE comunikapp_teste;

-- 5. Verificar se foi criado
SELECT DATABASE() as 'Banco Atual';
SHOW TABLES;

-- ===== INSTRUÇÕES DE USO =====
-- 1. Execute este script no MySQL Workbench ou linha de comando
-- 2. Use: mysql -u root -p < create-test-database.sql
-- 3. Ou copie e cole no MySQL Workbench
-- 4. Depois execute o projeto com: npm run dev:test
