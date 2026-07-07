-- ============================================================================
-- REMEDIACAO NECESSARIA antes de aplicar esta branch em qualquer ambiente
-- (staging/producao) que ja tenha essas migrations aplicadas.
--
-- Contexto: 5 migrations foram criadas com timestamp errado (20250101...,
-- "1 de janeiro" - claramente um placeholder nunca corrigido), o que fazia
-- elas ordenarem ANTES da migration `_init`. Isso quebra qualquer replay de
-- migrations a partir de um banco vazio (disaster recovery, ambiente novo).
-- Renomeamos as pastas para refletir a data real em que foram efetivamente
-- aplicadas (2026-05-24, confirmado via _prisma_migrations.started_at).
--
-- Rodar este script ANTES de fazer `prisma migrate deploy` desta branch em
-- qualquer banco que ja tenha essas 5 migrations com o nome antigo.
-- Se o ambiente nao tiver essas migrations aplicadas ainda (banco novo),
-- este script nao faz nada de mal (os WHERE simplesmente nao encontram
-- linhas) e pode ser rodado com seguranca mesmo assim.
-- ============================================================================

UPDATE `_prisma_migrations` SET `migration_name` = '20260524100000_add_profundidade_produto_orcamento' WHERE `migration_name` = '20250101000000_add_profundidade_produto_orcamento';
UPDATE `_prisma_migrations` SET `migration_name` = '20260524100001_add_aprovacao_tecnica_ordem_servico' WHERE `migration_name` = '20250101000001_add_aprovacao_tecnica_ordem_servico';
UPDATE `_prisma_migrations` SET `migration_name` = '20260524100002_add_agendamento_instalacao_ordem_servico' WHERE `migration_name` = '20250101000002_add_agendamento_instalacao_ordem_servico';
UPDATE `_prisma_migrations` SET `migration_name` = '20260524100003_add_os_direta_interna_fields' WHERE `migration_name` = '20250101000003_add_os_direta_interna_fields';
UPDATE `_prisma_migrations` SET `migration_name` = '20260524100004_add_workflow_entities' WHERE `migration_name` = '20250101000004_add_workflow_entities';

-- Apos rodar, confirme com: prisma migrate status
-- Deve retornar "Database schema is up to date!" sem nenhuma menção às
-- migrations 20250101000000-4.

-- ============================================================================
-- Nota sobre 20250926130000_add_document_sequences: o conteudo desse arquivo
-- de migration foi editado (removida uma linha de CREATE UNIQUE INDEX
-- redundante que quebrava um replay do zero). Testado localmente: essa edicao
-- NAO exige remediacao de checksum porque _prisma_migrations.applied_steps_count
-- ja era 0 para essa migration (ou seja, o historico inteiro foi marcado como
-- aplicado via `migrate resolve`/bulk-resolve em algum momento, nao replay real).
-- Rode `prisma migrate status` em staging/producao logo apos o deploy desta
-- branch para confirmar que nenhum aviso de checksum aparece; se aparecer,
-- avise antes de seguir.
-- ============================================================================
