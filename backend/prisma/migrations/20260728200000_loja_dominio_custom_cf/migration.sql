-- Fatia D: vínculo Cloudflare Custom Hostname (SaaS).

ALTER TABLE `loja`
  ADD COLUMN `dominio_custom_cf_id` VARCHAR(64) NULL,
  ADD COLUMN `dominio_custom_cf_status` VARCHAR(64) NULL,
  ADD COLUMN `dominio_custom_cf_ssl_status` VARCHAR(64) NULL,
  ADD COLUMN `dominio_custom_cf_validation` JSON NULL;
