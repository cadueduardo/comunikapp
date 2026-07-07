-- DropForeignKey
ALTER TABLE `historico_custo_maquinas` DROP FOREIGN KEY `historico_custo_maquinas_maquina_id_fkey`;

-- DropForeignKey
ALTER TABLE `historico_custo_funcoes` DROP FOREIGN KEY `historico_custo_funcoes_funcao_id_fkey`;

-- DropForeignKey
ALTER TABLE `anexomensagem` DROP FOREIGN KEY `AnexoMensagem_mensagem_id_fkey`;

-- DropForeignKey
ALTER TABLE `modo_impressao` DROP FOREIGN KEY `ModoImpressao_maquina_id_fkey`;

-- DropForeignKey
ALTER TABLE `modo_impressao` DROP FOREIGN KEY `ModoImpressao_loja_id_fkey`;

-- DropTable
DROP TABLE `historico_custo_maquinas`;

-- DropTable
DROP TABLE `historico_custo_funcoes`;

-- DropTable
DROP TABLE `anexomensagem`;

-- DropTable
DROP TABLE `modo_impressao`;

