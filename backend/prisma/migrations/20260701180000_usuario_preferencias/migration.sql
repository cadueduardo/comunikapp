-- Preferências de UI por usuário (ordem do menu, tema futuro, etc.)
ALTER TABLE `usuario` ADD COLUMN `preferencias` JSON NULL;
