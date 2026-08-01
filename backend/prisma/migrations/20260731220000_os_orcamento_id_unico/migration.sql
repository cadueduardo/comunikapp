-- Gate 0S / HS-05: um orçamento gera no máximo uma ordem de serviço.
--
-- Antes desta migration a unicidade dependia da condição de transição do
-- aceite. Isso cobre o caminho normal, mas não o de recuperação (proposta já
-- aprovada que ficou sem OS), onde não há transição para serializar: oito
-- requisições simultâneas criavam até quatro OS para o mesmo orçamento.
--
-- `orcamento_id` continua anulável e `NULL` não conflita em índice único no
-- MySQL, então OS avulsa segue permitida sem limite.
--
-- Pré-condição verificada em produção (MySQL 8.0.46) antes de escrever esta
-- migration: nenhum orçamento possui mais de uma OS. Sem isso o
-- `CREATE UNIQUE INDEX` abortaria o deploy.

-- A criação vem antes da remoção de propósito: `orcamento_id` é coluna de
-- foreign key e o MySQL exige que ela permaneça indexada o tempo todo. Com o
-- índice único já no lugar, o antigo pode sair sem deixar a FK descoberta.
CREATE UNIQUE INDEX `ordens_servico_orcamento_id_key` ON `ordens_servico`(`orcamento_id`);

DROP INDEX `ordens_servico_orcamento_id_idx` ON `ordens_servico`;
