# 🔧 SOLUÇÃO: Estrutura da Tabela localizacoes

## ❌ PROBLEMA IDENTIFICADO

A tabela `localizacoes` no MySQL ainda tem a estrutura antiga:
- `id`, `loja_id`, `codigo`, `nome`, `tipo`, `capacidade`, `localizacao_pai_id`, `observacoes`, `ativo`, `criado_em`, `atualizado_em`

Mas o frontend/backend está tentando usar a nova estrutura:
- `id`, `loja_id`, `codigo`, `deposito`, `corredor`, `prateleira`, `nivel`, `posicao`, `descricao`, `capacidade`, `ativo`, `criado_em`, `atualizado_em`

## ✅ SOLUÇÃO

### **Passo 1: Atualizar a Estrutura da Tabela**

Execute este script no phpMyAdmin:

```sql
-- 1. Adicionar coluna 'deposito' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS deposito VARCHAR(100) NOT NULL DEFAULT 'Depósito' AFTER codigo;

-- 2. Adicionar coluna 'corredor' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS corredor VARCHAR(50) NULL AFTER deposito;

-- 3. Adicionar coluna 'prateleira' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS prateleira VARCHAR(50) NULL AFTER corredor;

-- 4. Adicionar coluna 'nivel' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS nivel VARCHAR(50) NULL AFTER prateleira;

-- 5. Adicionar coluna 'posicao' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS posicao VARCHAR(50) NULL AFTER nivel;

-- 6. Adicionar coluna 'descricao' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS descricao TEXT NULL AFTER posicao;

-- 7. Verificar a estrutura final
DESCRIBE localizacoes;
```

### **Passo 2: Verificar se o Backend está Rodando**

```bash
# Verificar se o backend está rodando na porta 3001
netstat -an | findstr :3001
```

### **Passo 3: Testar a API**

Execute o script de teste:
```bash
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

### **Passo 4: Verificar Logs do Backend**

Se ainda houver erro 500, verifique os logs:
```bash
Get-Content logs\app.log -Tail 20
```

## 🔍 POSSÍVEIS CAUSAS DO ERRO 500

### **1. Colunas não existem na tabela**
- **Solução**: Execute o script SQL acima

### **2. Backend não está rodando**
- **Solução**: Inicie o backend com `npm run start:dev`

### **3. Problema de autenticação**
- **Solução**: Verifique se o token JWT está válido

### **4. Problema de conexão com banco**
- **Solução**: Verifique as variáveis de ambiente do banco

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Tabela `localizacoes` tem as colunas: `deposito`, `corredor`, `prateleira`, `nivel`, `posicao`, `descricao`
- [ ] Backend está rodando na porta 3001
- [ ] Banco de dados está acessível
- [ ] Token de autenticação está válido
- [ ] Logs não mostram erros críticos

## 🎯 RESULTADO ESPERADO

Após executar o script SQL, a tabela deve ter esta estrutura:

```
+-------------------+--------------------------------+------+-----+-------------------+----------------+
| Field             | Type                           | Null | Key | Default           | Extra          |
+-------------------+--------------------------------+------+-----+-------------------+----------------+
| id                | varchar(36)                    | NO   | PRI | NULL              |                |
| loja_id           | varchar(36)                    | NO   | MUL | NULL              |                |
| codigo            | varchar(50)                    | NO   | MUL | NULL              |                |
| deposito          | varchar(100)                   | NO   |     | Depósito          |                |
| corredor          | varchar(50)                    | YES  |     | NULL              |                |
| prateleira        | varchar(50)                    | YES  |     | NULL              |                |
| nivel             | varchar(50)                    | YES  |     | NULL              |                |
| posicao           | varchar(50)                    | YES  |     | NULL              |                |
| descricao         | text                           | YES  |     | NULL              |                |
| capacidade        | decimal(10,2)                  | YES  |     | NULL              |                |
| ativo             | tinyint(1)                     | YES  | MUL | 1                 |                |
| criado_em         | timestamp                      | YES  |     | CURRENT_TIMESTAMP |                |
| atualizado_em     | timestamp                      | YES  |     | CURRENT_TIMESTAMP | on update ...  |
+-------------------+--------------------------------+------+-----+-------------------+----------------+
```

## 🚀 PRÓXIMOS PASSOS

1. **Execute o script SQL** no phpMyAdmin
2. **Teste a API** com o script PowerShell
3. **Verifique os logs** se houver erro
4. **Teste o frontend** criando uma localização

**Status**: ⏳ Aguardando execução do script SQL

