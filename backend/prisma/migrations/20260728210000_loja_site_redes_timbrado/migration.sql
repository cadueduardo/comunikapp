-- Timbrado: site e redes sociais da loja.

ALTER TABLE `loja`
  ADD COLUMN `site_url` VARCHAR(255) NULL,
  ADD COLUMN `instagram_url` VARCHAR(255) NULL,
  ADD COLUMN `facebook_url` VARCHAR(255) NULL,
  ADD COLUMN `linkedin_url` VARCHAR(255) NULL;
