-- Verificar o valor final do produto Banner
SELECT 
    id, 
    nome, 
    valor_calculado, 
    atualizado_em,
    criado_em
FROM template_produtos 
WHERE nome = 'Banner';

-- Verificar se há outros produtos
SELECT COUNT(*) as total_produtos FROM template_produtos;

-- Verificar se há duplicatas
SELECT nome, COUNT(*) as quantidade
FROM template_produtos 
GROUP BY nome 
HAVING COUNT(*) > 1;

