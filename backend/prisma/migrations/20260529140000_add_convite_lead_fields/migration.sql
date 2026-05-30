ALTER TABLE `convites_cadastro`
  ADD COLUMN `origem` VARCHAR(32) NULL,
  ADD COLUMN `telefone` VARCHAR(32) NULL,
  ADD COLUMN `nome_loja` VARCHAR(255) NULL;

CREATE INDEX `convites_cadastro_origem_idx` ON `convites_cadastro`(`origem`);
