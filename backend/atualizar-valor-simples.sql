-- Atualizar o valor_calculado do produto Banner para R$ 63,35
UPDATE template_produtos 
SET valor_calculado = 63.35 
WHERE nome = 'Banner';

-- Verificar se foi atualizado
SELECT id, nome, valor_calculado, atualizado_em 
FROM template_produtos 
WHERE nome = 'Banner';

