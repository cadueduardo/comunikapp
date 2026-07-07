-- CreateIndex
CREATE INDEX `ordens_servico_orcamento_id_idx` ON `ordens_servico`(`orcamento_id`);

-- CreateIndex
CREATE INDEX `arte_versoes_aprovado_por_idx` ON `arte_versoes`(`aprovado_por`);

-- CreateIndex
CREATE INDEX `arte_versoes_liberado_por_idx` ON `arte_versoes`(`liberado_por`);

-- CreateIndex
CREATE INDEX `arte_versoes_excluido_por_idx` ON `arte_versoes`(`excluido_por`);

-- CreateIndex
CREATE INDEX `arte_links_aprovacao_versao_id_idx` ON `arte_links_aprovacao`(`versao_id`);

-- CreateIndex
CREATE INDEX `arte_mensagens_versao_id_idx` ON `arte_mensagens`(`versao_id`);

