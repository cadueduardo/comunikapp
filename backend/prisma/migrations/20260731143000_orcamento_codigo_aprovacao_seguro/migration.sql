-- Gate 0S / HS-04: codigo de aprovacao publica seguro no orcamento.
--
-- Etapa "expand" do rollout expand-and-contract:
--   1. (aqui) adicionar as colunas do contrato seguro e invalidar o legado;
--   2. a aplicacao passa a emitir token opaco de 256 bits e gravar so o hash;
--   3. a leitura ja nasce apontando para o hash - nao ha periodo de leitura dupla;
--   4. a coluna `codigo_aprovacao` (texto claro) sera removida em entrega
--      posterior, junto com o indice unico `Orcamento_codigo_aprovacao_key`.
--
-- Rollback e fail-closed por construcao: reverter esta migration derruba as
-- colunas do contrato seguro e nao restaura nenhum codigo em texto claro,
-- porque o passo 2 abaixo apaga os valores legados de forma irreversivel.

-- 1. Colunas do contrato seguro.
--    `codigo_aprovacao_hash` guarda o SHA-256 hexadecimal (64 caracteres) do
--    token; o valor em claro nunca e persistido. Sem indice: o codigo so e
--    verificado com o orcamento ja resolvido por id, nunca por busca pelo hash.
ALTER TABLE `orcamento`
  ADD COLUMN `codigo_aprovacao_hash` CHAR(64) NULL,
  ADD COLUMN `codigo_aprovacao_expira_em` DATETIME(3) NULL,
  ADD COLUMN `codigo_aprovacao_tentativas` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `codigo_aprovacao_usado_em` DATETIME(3) NULL,
  ADD COLUMN `codigo_aprovacao_revogado_em` DATETIME(3) NULL;

-- 2. Invalidacao dos codigos legados.
--    Os codigos existentes foram gerados com `Math.random()` (8 caracteres,
--    ~41 bits, previsivel). Nao ha backfill: um codigo fraco nao pode ser
--    promovido a segredo valido apenas por virar hash. Todos os codigos ativos
--    passam a nao existir; o cliente obtem um codigo novo e forte pelo fluxo de
--    reenvio, e a equipe comercial pelo reenvio manual da proposta.
--    O indice unico aceita multiplos NULL em MySQL, entao nao ha conflito.
UPDATE `orcamento`
SET `codigo_aprovacao` = NULL
WHERE `codigo_aprovacao` IS NOT NULL;
