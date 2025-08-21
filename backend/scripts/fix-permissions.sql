-- ===== CORRIGIR PERMISSÕES DO BANCO DE TESTE =====
-- Execute este script para resolver problemas de permissão

-- 1. Garantir que o usuário tem todas as permissões necessárias
GRANT ALL PRIVILEGES ON comunikapp_teste.* TO 'comunikapp'@'localhost';
GRANT CREATE, DROP, ALTER, INDEX, REFERENCES ON *.* TO 'comunikapp'@'localhost';

-- 2. Criar banco shadow se não existir (necessário para migrações Prisma)
CREATE DATABASE IF NOT EXISTS `prisma_migrate_shadow_db_45e53804_0bfb_492d_b002_b4f2c3bcccc1`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 3. Dar permissões no banco shadow
GRANT ALL PRIVILEGES ON `prisma_migrate_shadow_db_45e53804_0bfb_492d_b002_b4f2c3bcccc1`.* TO 'comunikapp'@'localhost';

-- 4. Aplicar permissões
FLUSH PRIVILEGES;

-- 5. Verificar permissões
SHOW GRANTS FOR 'comunikapp'@'localhost';

-- 6. Selecionar banco de teste
USE comunikapp_teste;
SELECT DATABASE() as 'Banco Atual';

