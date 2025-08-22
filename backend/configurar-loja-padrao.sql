-- Configurar valores padrão para margem e impostos na loja
UPDATE loja 
SET 
    margem_lucro_padrao = 30,
    impostos_padrao = 18
WHERE nome = 'Corte Total';

-- Verificar se foi configurado
SELECT 
    id,
    nome,
    margem_lucro_padrao,
    impostos_padrao,
    horas_produtivas_mensais
FROM loja 
WHERE nome = 'Corte Total';

