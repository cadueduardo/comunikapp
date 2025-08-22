-- Corrigir valores incorretos dos insumos do produto Banner
-- Os valores estão muito altos e incorretos

-- 1. Bobina Lona: R$ 12,19 (correto) em vez de R$ 853,09
UPDATE item_template_produtos 
SET custo_total = 12.19
WHERE id IN (
  SELECT it.id 
  FROM item_template_produtos it
  JOIN template_produtos tp ON it.template_id = tp.id
  JOIN insumos i ON it.insumo_id = i.id
  WHERE tp.nome = 'Banner' AND i.nome LIKE '%Bobina Lona%'
);

-- 2. Cordão: R$ 18,14 (correto) em vez de R$ 3.719,70
UPDATE item_template_produtos 
SET custo_total = 18.14
WHERE id IN (
  SELECT it.id 
  FROM item_template_produtos it
  JOIN template_produtos tp ON it.template_id = tp.id
  JOIN insumos i ON it.insumo_id = i.id
  WHERE tp.nome = 'Banner' AND i.nome LIKE '%Cordao Para Banner%'
);

-- 3. Madeira: R$ 212,40 (correto) em vez de R$ 5.310,00
UPDATE item_template_produtos 
SET custo_total = 212.40
WHERE id IN (
  SELECT it.id 
  FROM item_template_produtos it
  JOIN template_produtos tp ON it.template_id = tp.id
  JOIN insumos i ON it.insumo_id = i.id
  WHERE tp.nome = 'Banner' AND i.nome LIKE '%Madeira Para Banner%'
);

-- 4. Ponteiras: R$ 0,35 (correto) em vez de R$ 350,00
UPDATE item_template_produtos 
SET custo_total = 0.35
WHERE id IN (
  SELECT it.id 
  FROM item_template_produtos it
  JOIN template_produtos tp ON it.template_id = tp.id
  JOIN insumos i ON it.insumo_id = i.id
  WHERE tp.nome = 'Banner' AND i.nome LIKE '%Ponteiras Para Banner%'
);

-- Verificar se foi corrigido
SELECT 
    i.nome as insumo,
    it.quantidade,
    it.custo_total as custo_corrigido,
    it.custo_unitario
FROM item_template_produtos it
JOIN template_produtos tp ON it.template_id = tp.id
JOIN insumos i ON it.insumo_id = i.id
WHERE tp.nome = 'Banner'
ORDER BY i.nome;
