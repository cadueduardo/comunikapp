-- M4.2 — participantes e histórico de transferência de carteira.

CREATE TABLE `cliente_participante` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `cliente_id` VARCHAR(191) NOT NULL,
  `usuario_id` VARCHAR(191) NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `cliente_participante_cliente_id_usuario_id_key`
  ON `cliente_participante`(`cliente_id`, `usuario_id`);

CREATE INDEX `cliente_participante_loja_id_usuario_id_idx`
  ON `cliente_participante`(`loja_id`, `usuario_id`);

CREATE INDEX `cliente_participante_loja_id_cliente_id_idx`
  ON `cliente_participante`(`loja_id`, `cliente_id`);

CREATE INDEX `cliente_participante_usuario_id_idx`
  ON `cliente_participante`(`usuario_id`);

ALTER TABLE `cliente_participante`
  ADD CONSTRAINT `cliente_participante_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cliente_participante_cliente_id_fkey`
    FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cliente_participante_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `cliente_transferencia_carteira` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `cliente_id` VARCHAR(191) NOT NULL,
  `de_usuario_id` VARCHAR(191) NULL,
  `para_usuario_id` VARCHAR(191) NOT NULL,
  `autor_id` VARCHAR(191) NOT NULL,
  `motivo` TEXT NOT NULL,
  `chave_operacao` VARCHAR(191) NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `cliente_transferencia_carteira_chave_operacao_key`
  ON `cliente_transferencia_carteira`(`chave_operacao`);

CREATE INDEX `cliente_transferencia_carteira_loja_id_cliente_id_idx`
  ON `cliente_transferencia_carteira`(`loja_id`, `cliente_id`);

CREATE INDEX `cliente_transferencia_carteira_loja_id_criado_em_idx`
  ON `cliente_transferencia_carteira`(`loja_id`, `criado_em`);

CREATE INDEX `cliente_transferencia_carteira_cliente_id_idx`
  ON `cliente_transferencia_carteira`(`cliente_id`);

CREATE INDEX `cliente_transferencia_carteira_de_usuario_id_idx`
  ON `cliente_transferencia_carteira`(`de_usuario_id`);

CREATE INDEX `cliente_transferencia_carteira_para_usuario_id_idx`
  ON `cliente_transferencia_carteira`(`para_usuario_id`);

CREATE INDEX `cliente_transferencia_carteira_autor_id_idx`
  ON `cliente_transferencia_carteira`(`autor_id`);

ALTER TABLE `cliente_transferencia_carteira`
  ADD CONSTRAINT `cliente_transferencia_carteira_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `cliente_transferencia_carteira_cliente_id_fkey`
    FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `cliente_transferencia_carteira_de_usuario_id_fkey`
    FOREIGN KEY (`de_usuario_id`) REFERENCES `usuario`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `cliente_transferencia_carteira_para_usuario_id_fkey`
    FOREIGN KEY (`para_usuario_id`) REFERENCES `usuario`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `cliente_transferencia_carteira_autor_id_fkey`
    FOREIGN KEY (`autor_id`) REFERENCES `usuario`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
