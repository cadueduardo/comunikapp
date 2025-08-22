-- Verificar o valor atual do produto Banner
SELECT id, nome, valor_calculado, atualizado_em 
FROM template_produtos 
WHERE nome = 'Banner';

-- Atualizar para 63.35 se ainda não estiver
UPDATE template_produtos 
SET valor_calculado = 63.35 
WHERE nome = 'Banner' AND (valor_calculado != 63.35 OR valor_calculado IS NULL);

-- Verificar novamente
SELECT id, nome, valor_calculado, atualizado_em 
FROM template_produtos 
WHERE nome = 'Banner';

