-- Persistência explícita do tipo de margem por orçamento (não depender apenas de JSON)
ALTER TABLE `orcamento`
    ADD COLUMN `tipo_margem_lucro` VARCHAR(24) NULL;

