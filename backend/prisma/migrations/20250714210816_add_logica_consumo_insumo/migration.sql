-- DropForeignKey
ALTER TABLE `insumos` DROP FOREIGN KEY `insumos_fornecedorId_fkey`;

-- AlterTable
ALTER TABLE `insumos` ADD COLUMN `logica_consumo` ENUM('area', 'perimetro', 'quantidade_fixa', 'custom') NOT NULL DEFAULT 'area',
    ADD COLUMN `parametros_consumo` JSON NULL,
    MODIFY `fornecedorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_fornecedorId_fkey` FOREIGN KEY (`fornecedorId`) REFERENCES `Fornecedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
