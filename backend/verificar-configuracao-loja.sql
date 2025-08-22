-- Verificar configuração da loja para entender margem e impostos
SELECT 
    id,
    nome,
    margem_lucro_padrao,
    impostos_padrao,
    horas_produtivas_mensais,
    custo_maquinaria_hora
FROM loja 
LIMIT 5;

-- Verificar se há configurações específicas
SELECT 
    nome,
    margem_lucro_padrao,
    impostos_padrao
FROM loja 
WHERE margem_lucro_padrao IS NOT NULL 
   OR impostos_padrao IS NOT NULL;
