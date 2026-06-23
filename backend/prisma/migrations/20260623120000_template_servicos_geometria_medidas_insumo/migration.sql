-- Geometria e anexo no template de produto
ALTER TABLE `template_produtos`
  ADD COLUMN `profundidade_produto` DECIMAL(10, 2) NULL,
  ADD COLUMN `perimetro_produto` DECIMAL(10, 2) NULL,
  ADD COLUMN `unidade_geometria` VARCHAR(4) NULL,
  ADD COLUMN `geometria_origem` VARCHAR(16) NULL,
  ADD COLUMN `arquivo_geometria_url` VARCHAR(512) NULL;

-- Serviços manuais no template de produto
CREATE TABLE `servico_template_produtos` (
  `id` VARCHAR(191) NOT NULL,
  `template_id` VARCHAR(191) NOT NULL,
  `servico_id` VARCHAR(191) NOT NULL,
  `horas_trabalhadas` DECIMAL(10, 2) NOT NULL,
  `custo_total` DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `servico_template_produtos_template_id_idx`(`template_id`),
  INDEX `servico_template_produtos_servico_id_idx`(`servico_id`),
  CONSTRAINT `servico_template_produtos_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `template_produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `servico_template_produtos_servico_id_fkey` FOREIGN KEY (`servico_id`) REFERENCES `servico_manual`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Medidas próprias por insumo (orçamento e template)
ALTER TABLE `ItemInsumo`
  ADD COLUMN `usa_medida_propria` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `largura_material` DECIMAL(10, 2) NULL,
  ADD COLUMN `altura_material` DECIMAL(10, 2) NULL,
  ADD COLUMN `profundidade_material` DECIMAL(10, 2) NULL,
  ADD COLUMN `unidade_medida_material` VARCHAR(4) NULL;

ALTER TABLE `item_template_produtos`
  ADD COLUMN `usa_medida_propria` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `largura_material` DECIMAL(10, 2) NULL,
  ADD COLUMN `altura_material` DECIMAL(10, 2) NULL,
  ADD COLUMN `profundidade_material` DECIMAL(10, 2) NULL,
  ADD COLUMN `unidade_medida_material` VARCHAR(4) NULL;
