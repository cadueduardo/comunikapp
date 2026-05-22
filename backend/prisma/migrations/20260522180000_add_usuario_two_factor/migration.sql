ALTER TABLE `usuario`
ADD COLUMN `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `two_factor_secret` TEXT NULL,
ADD COLUMN `two_factor_confirmed_at` DATETIME(3) NULL;
