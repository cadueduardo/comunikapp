-- Script para corrigir permissões do Prisma
-- Execute este arquivo no MySQL

-- 1. Conceder permissão para criar bancos de dados (necessário para shadow database)
GRANT CREATE ON *.* TO 'comunikapp'@'localhost';

-- 2. Conceder permissões completas no banco comunikapp
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';

-- 3. Conceder permissão para criar bancos temporários
GRANT CREATE TEMPORARY TABLES ON *.* TO 'comunikapp'@'localhost';

-- 4. Conceder permissão para LOCK TABLES
GRANT LOCK TABLES ON comunikapp.* TO 'comunikapp'@'localhost';

-- 5. Conceder permissão para SELECT em INFORMATION_SCHEMA
GRANT SELECT ON INFORMATION_SCHEMA.* TO 'comunikapp'@'localhost';

-- 6. Aplicar mudanças
FLUSH PRIVILEGES;

-- 7. Verificar permissões
SHOW GRANTS FOR 'comunikapp'@'localhost';
