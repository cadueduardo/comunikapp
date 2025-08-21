-- ===== SCRIPT COMPLETO PARA CONFIGURAR BANCO DE TESTE =====
-- Execute este script no MySQL como root para resolver todos os problemas de permissão

-- 1. Criar banco de dados de teste
CREATE DATABASE IF NOT EXISTS comunikapp_teste
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 2. Criar usuário se não existir (nome alternativo para evitar conflitos)
CREATE USER IF NOT EXISTS 'comunikapp_test'@'localhost' IDENTIFIED BY 'password123';

-- 3. Dar TODAS as permissões necessárias
GRANT ALL PRIVILEGES ON comunikapp_teste.* TO 'comunikapp_test'@'localhost';
GRANT CREATE, DROP, ALTER, INDEX, REFERENCES, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE, CREATE VIEW, SHOW VIEW, CREATE ROUTINE, ALTER ROUTINE, EVENT, TRIGGER ON *.* TO 'comunikapp_test'@'localhost';

-- 4. Criar banco shadow para migrações Prisma (se necessário)
-- O Prisma criará automaticamente, mas vamos garantir as permissões
GRANT CREATE, DROP, ALTER, INDEX, REFERENCES ON *.* TO 'comunikapp_test'@'localhost';

-- 5. Aplicar permissões
FLUSH PRIVILEGES;

-- 6. Verificar permissões
SHOW GRANTS FOR 'comunikapp_test'@'localhost';

-- 7. Selecionar banco de teste
USE comunikapp_teste;
SELECT DATABASE() as 'Banco Atual';

-- 8. Verificar se o banco está acessível
SHOW TABLES;

-- ===== INSTRUÇÕES DE USO =====
-- 1. Execute este script como ROOT no MySQL
-- 2. Use: mysql -u root -p < setup-mysql-test.sql
-- 3. Ou copie e cole no MySQL Workbench como root
-- 4. Depois execute o projeto com: npm run dev:test

-- ===== VERIFICAÇÃO FINAL =====
-- Teste se o usuário pode criar tabelas
-- (Execute como usuário 'comunikapp_test' se quiser testar)
-- CREATE TABLE teste_permissao (id INT);
-- DROP TABLE teste_permissao;
