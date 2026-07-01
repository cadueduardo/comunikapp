-- Feature flag D5: Split Financeiro com OS Aditiva por loja (default desligado = fluxo legado)
ALTER TABLE `configuracao_instalacao_loja`
  ADD COLUMN `os_aditiva_habilitada` BOOLEAN NOT NULL DEFAULT false;
