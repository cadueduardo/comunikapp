-- Amplia margem/impostos por item (valores em R$, não %) e adiciona custo no catálogo.
ALTER TABLE `ProdutoOrcamento`
    MODIFY `margem_lucro` DECIMAL(10, 2) NOT NULL,
    MODIFY `impostos` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `produtos_finitos`
    ADD COLUMN `preco_custo` DECIMAL(10, 2) NULL AFTER `preco_promocional`;
