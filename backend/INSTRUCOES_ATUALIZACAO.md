# Instruções para Atualizar a Tabela localizacoes

## Problema Identificado
A tabela `localizacoes` no MySQL já existe, mas está faltando algumas colunas necessárias para o sistema de estoque funcionar corretamente.

## Solução

### Opção 1: Usar phpMyAdmin (Recomendado)

1. **Acesse o phpMyAdmin** no seu servidor local
2. **Selecione o banco de dados** `comunikapp`
3. **Vá na aba "SQL"**
4. **Copie e cole o conteúdo** do arquivo `add_missing_columns.sql`
5. **Clique em "Executar"**

### Opção 2: Usar MySQL CLI

Se você tiver o MySQL CLI instalado:

```bash
mysql -u root -p comunikapp < add_missing_columns.sql
```

### Opção 3: Executar Comandos Manualmente

Execute estes comandos um por vez no phpMyAdmin:

```sql
-- 1. Adicionar coluna 'nome' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS nome VARCHAR(100) NOT NULL AFTER codigo;

-- 2. Adicionar coluna 'tipo' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS tipo ENUM('DEPOSITO', 'CORREDOR', 'PRATELEIRA', 'NIVEL', 'POSICAO') NOT NULL DEFAULT 'DEPOSITO' AFTER nome;

-- 3. Adicionar coluna 'localizacao_pai_id' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS localizacao_pai_id VARCHAR(36) NULL AFTER capacidade;

-- 4. Adicionar coluna 'observacoes' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS observacoes TEXT NULL AFTER localizacao_pai_id;

-- 5. Adicionar coluna 'ativo' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE AFTER observacoes;

-- 6. Adicionar coluna 'criado_em' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ativo;

-- 7. Adicionar coluna 'atualizado_em' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER criado_em;

-- 8. Adicionar índices
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_loja_id (loja_id);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_codigo (codigo);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_tipo (tipo);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_ativo (ativo);

-- 9. Adicionar constraint único
ALTER TABLE localizacoes ADD CONSTRAINT IF NOT EXISTS uk_codigo_loja UNIQUE (codigo, loja_id);

-- 10. Verificar estrutura
DESCRIBE localizacoes;
```

## Verificação

Após executar o script, verifique se a tabela tem esta estrutura:

```
+-------------------+--------------------------------+------+-----+-------------------+----------------+
| Field             | Type                           | Null | Key | Default           | Extra          |
+-------------------+--------------------------------+------+-----+-------------------+----------------+
| id                | varchar(36)                    | NO   | PRI | NULL              |                |
| loja_id           | varchar(36)                    | NO   | MUL | NULL              |                |
| codigo            | varchar(50)                    | NO   | MUL | NULL              |                |
| nome              | varchar(100)                   | NO   |     | NULL              |                |
| tipo              | enum('DEPOSITO','CORREDOR',...) | NO   | MUL | DEPOSITO          |                |
| capacidade        | decimal(10,2)                  | YES  |     | NULL              |                |
| localizacao_pai_id| varchar(36)                    | YES  |     | NULL              |                |
| observacoes       | text                           | YES  |     | NULL              |                |
| ativo             | tinyint(1)                     | YES  | MUL | 1                 |                |
| criado_em         | timestamp                      | YES  |     | CURRENT_TIMESTAMP |                |
| atualizado_em     | timestamp                      | YES  |     | CURRENT_TIMESTAMP | on update ...  |
+-------------------+--------------------------------+------+-----+-------------------+----------------+
```

## Próximos Passos

1. **Execute o script SQL** usando uma das opções acima
2. **Teste o formulário** de localização no frontend
3. **Verifique se os dados** estão sendo salvos no banco
4. **Confirme que o grid** atualiza corretamente

## Problemas Comuns

- **Erro "Column already exists"**: Ignore, significa que a coluna já existe
- **Erro "Index already exists"**: Ignore, significa que o índice já existe
- **Erro "Constraint already exists"**: Ignore, significa que a constraint já existe

O script usa `IF NOT EXISTS` para evitar erros se as estruturas já existem.
