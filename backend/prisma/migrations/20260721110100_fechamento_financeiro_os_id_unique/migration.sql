-- One-to-one com OrdemServico (Prisma exige unique em os_id)
CREATE UNIQUE INDEX `fechamentos_financeiros_os_os_id_key` ON `fechamentos_financeiros_os`(`os_id`);
