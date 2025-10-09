# 💬 Respostas Diretas: Suas Perguntas Sobre as Validações

## 1️⃣ **Estoque Mínimo - "Qual material está com problema?"**

### Resposta:
**NENHUM MATERIAL!** Esta validação está **QUEBRADA**.

### Por quê?
A regra busca um campo `quantidade_estoque` que **NÃO EXISTE** na OS.

```sql
-- O que a regra tenta fazer:
SELECT quantidade_estoque FROM "OrdemServico" -- ❌ Campo não existe!

-- O que deveria fazer:
SELECT e.quantidade_atual 
FROM "Estoque" e
JOIN insumos_da_os...
```

### ✅ **Solução**: DESATIVAR esta validação

---

## 2️⃣ **Estoque Disponível - "De onde tirou esta informação?"**

### Resposta:
Da tabela `Estoque`, mas provavelmente está buscando na loja errada ou com IDs incompatíveis.

### De onde vem:
```sql
-- Sistema executa esta query:
SELECT * FROM "Estoque" 
WHERE insumo_id IN (
  -- IDs dos insumos do orçamento
  SELECT insumo_id FROM "OrcamentoProdutoInsumo"
  WHERE produto_id IN (...)
)
AND loja_id = 'ts11cln0o'; -- Sua loja

-- Se retornar vazio ou quantidade_atual = 0 → ERRO
```

### Por que está dando erro se você inseriu estoques?

**Possíveis causas:**
1. **Loja errada**: Estoque cadastrado em loja diferente da OS
2. **Insumo_id diferente**: IDs não batem entre orçamento e estoque
3. **Quantidade zero**: `quantidade_atual = 0` no banco

### ✅ **Como verificar**:
```sql
-- 1. Ver estoques da sua loja:
SELECT 
  i.nome as insumo,
  e.quantidade_atual,
  e.quantidade_minima,
  e.loja_id
FROM "Estoque" e
JOIN "Insumo" i ON i.id = e.insumo_id
WHERE e.loja_id = 'ts11cln0o';

-- 2. Ver materiais da OS:
SELECT 
  i.nome as insumo,
  opi.quantidade as necessaria,
  opi.insumo_id
FROM "OrcamentoProdutoInsumo" opi
JOIN "Insumo" i ON i.id = opi.insumo_id
JOIN "OrcamentoProduto" op ON op.id = opi.produto_id
WHERE op.orcamento_id = 'id_do_orcamento_da_os';

-- 3. Comparar IDs:
-- Os insumo_id da query 1 devem bater com a query 2
```

---

## 3️⃣ **Arte Aprovada - "De onde tirou esta info?"**

### Resposta:
Do campo `arquivo_arte` da OS, que provavelmente tem algum valor de teste.

### Como funciona:
```typescript
// Lógica do sistema:
if (os.arquivo_arte) {
  status_arte = 'APROVADA'; // ✅
} else {
  status_arte = 'PENDENTE'; // ❌ Erro na validação
}
```

### Por que passou?
Sua OS tem algo em `arquivo_arte`:
```sql
SELECT arquivo_arte FROM "OrdemServico" 
WHERE id = 'cmgcbwu3x0002jazo4uotdi8i';
-- Provavelmente retorna: '/uploads/arte.pdf' ou similar
```

### ✅ **Soluções**:
1. **Desativar validação** até implementar upload de arte
2. **Limpar campo**: `UPDATE "OrdemServico" SET arquivo_arte = NULL`

---

## 4️⃣ **Dados Obrigatórios - "Quais dados?"**

### Resposta:
Sistema verifica **4 campos** da OS:

```sql
SELECT 
  nome_servico,        -- ❌ Pode estar vazio
  descricao,           -- ❌ Pode estar vazio
  quantidade,          -- ❌ Pode estar NULL
  parametros_tecnicos  -- ❌ Pode estar vazio
FROM "OrdemServico"
WHERE id = 'sua_os';
```

### Regra:
```typescript
// Todos os 4 devem estar preenchidos:
dados_completos = !!(
  nome_servico && 
  descricao && 
  quantidade && 
  parametros_tecnicos
);

// Se algum está vazio → ERRO
```

### ✅ **Como verificar qual está faltando**:
```sql
SELECT 
  CASE WHEN nome_servico IS NULL OR nome_servico = '' 
    THEN '❌ nome_servico VAZIO' ELSE '✅ ok' END,
  CASE WHEN descricao IS NULL OR descricao = '' 
    THEN '❌ descricao VAZIO' ELSE '✅ ok' END,
  CASE WHEN quantidade IS NULL OR quantidade = 0 
    THEN '❌ quantidade VAZIO' ELSE '✅ ok' END,
  CASE WHEN parametros_tecnicos IS NULL OR parametros_tecnicos = '' 
    THEN '❌ parametros_tecnicos VAZIO' ELSE '✅ ok' END
FROM "OrdemServico"
WHERE id = 'sua_os';
```

---

## 5️⃣ **Prazo Expirado - "Que prazo?"**

### Resposta:
Campo `data_prazo` da OS.

### Como funciona:
```typescript
// Sistema calcula:
const hoje = new Date(); // 2025-10-07
const dataPrazo = new Date(os.data_prazo); // Ex: 2025-10-01
const diferenca = dataPrazo - hoje;

if (diferenca < 0) {
  return ERRO; // "Prazo expirado" ❌
}
```

### De onde vem a data:
```sql
SELECT data_prazo 
FROM "OrdemServico"
WHERE id = 'sua_os';

-- Se data_prazo < hoje → ERRO
-- Se data_prazo = NULL → Depende da lógica
```

### ✅ **Soluções**:
1. **Desativar validação** - Não tem gestão de prazos ainda
2. **Implementar prazos** no orçamento antes

---

## 6️⃣ **Especificações Técnicas - "De qual produto?"**

### Resposta:
**Nenhum produto específico!** Sistema verifica **APENAS** um campo da OS.

### Como funciona:
```sql
-- Sistema verifica UM campo:
SELECT parametros_tecnicos 
FROM "OrdemServico"
WHERE id = 'sua_os';

-- Se vazio → ERRO
-- Se preenchido → SUCESSO
```

### ⚠️ **Problema**:
Esta validação é **GENÉRICA DEMAIS**:
- Não verifica especificações de cada produto
- Verifica apenas um campo texto geral da OS
- Não informa qual produto tem problema

### ✅ **Melhorias necessárias**:
```typescript
// Deveria verificar cada produto:
produtos.forEach(produto => {
  if (!produto.largura || !produto.altura || !produto.acabamento) {
    return ERRO; // Especificar qual produto
  }
});
```

---

## 7️⃣ **Desconto Alto - "Não faz sentido em OS"**

### Resposta:
✅ **VOCÊ ESTÁ 100% CORRETO!**

### Por que está aqui?
Sistema pega do **ORÇAMENTO**:
```sql
SELECT valor_original, valor_total 
FROM "Orcamento"
WHERE id = (SELECT orcamento_id FROM "OrdemServico" WHERE id = 'sua_os');

-- Calcula:
desconto = ((valor_original - valor_total) / valor_original) * 100

-- Se > 15% → ALERTA
```

### ✅ **Solução**: 
**DESATIVAR IMEDIATAMENTE** - Validação financeira não pertence à OS!

Questões financeiras devem ser tratadas no **módulo de orçamentos**, não na OS.

---

## 8️⃣ **Prazo Apertado - "Como sabe se não tem data?"**

### Resposta:
Sistema usa `data_prazo` da **OS**, não do orçamento!

### Como funciona:
```sql
-- Sistema busca da OS, não do orçamento:
SELECT data_prazo 
FROM "OrdemServico"
WHERE id = 'sua_os';

-- Calcula dias:
dias = (data_prazo - hoje) / (1 dia em ms)

-- Se < 3 dias → ALERTA
```

### Por que está funcionando sem data no orçamento?
A OS **TEM** `data_prazo`, mesmo que o orçamento não tenha `data_entrega` configurada!

Provavelmente a data foi copiada do orçamento para a OS na criação.

### ✅ **Soluções**:
1. **Desativar validação** - Não tem gestão de prazos ainda
2. **Implementar campo** `data_entrega` no orçamento

---

## 📊 **Resumo: Desativar ou Manter?**

### ❌ **DESATIVAR URGENTE:**
1. ❌ Validação de Estoque Mínimo (campo não existe)
2. ❌ Alerta de Desconto Alto (não pertence à OS)
3. ❌ Validação de Cliente Inadimplente (sem módulo financeiro)
4. ❌ Validação de Prazo Expirado (sem gestão de prazos)
5. ❌ Alerta de Prazo Apertado (sem gestão de prazos)
6. ❌ Alerta de Arte Pendente (sem campo data_envio)

### ⚠️ **REVISAR:**
7. ⚠️ Validação de Estoque Disponível (verificar loja_id e IDs)
8. ⚠️ Validação de Arte Aprovada (implementar upload ou desativar)

### ✅ **MANTER:**
9. ✅ Validação de Dados Obrigatórios (funciona)
10. ✅ Validação de Especificações Técnicas (funciona, mas pode melhorar)

---

## 🎯 **Como Desativar as Validações:**

### Via SQL:
```sql
UPDATE "RegraValidacao" 
SET ativo = false
WHERE nome IN (
  'Validação de Estoque Mínimo - Teste',
  'Alerta de Desconto Alto',
  'Validação de Cliente Inadimplente',
  'Validação de Prazo Expirado',
  'Alerta de Prazo Apertado',
  'Alerta de Arte Pendente',
  'Validação de Aprovação Comercial'
);
```

### Via Interface:
Vá em **Configurações → Validações Automáticas** e desative manualmente.

---

**🎉 Agora você sabe EXATAMENTE de onde cada validação tira seus dados!**




