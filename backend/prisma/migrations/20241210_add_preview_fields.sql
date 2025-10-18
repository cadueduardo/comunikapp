-- Migration para adicionar campos de preview de alta qualidade
ALTER TABLE arte_arquivos 
ADD COLUMN url_preview_medium VARCHAR(255) NULL,
ADD COLUMN url_preview_large VARCHAR(255) NULL;





