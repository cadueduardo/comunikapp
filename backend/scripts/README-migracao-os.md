# 🔧 Scripts de Correção de Materiais de OSs

Este diretório contém scripts para corrigir as OSs existentes na base de dados, sincronizando-as com os materiais corretos dos orçamentos.

## 📋 Problema Resolvido

As OSs estavam mostrando quantidades irreais de materiais (ex: 27 unidades de madeira para 2 banners) porque não estavam sincronizadas com os cálculos corretos do orçamento.

## 🚀 Como Usar

### Opção 1: Correção Completa (Recomendada)
```bash
npm run corrigir:os-materiais
```

**O que faz:**
1. ✅ Cria backup de segurança de todas as OSs
2. 🔧 Migra todas as OSs com materiais corretos
3. 🔍 Valida o resultado da migração

### Opção 2: Apenas Backup
```bash
npm run backup:os-materiais
```

**O que faz:**
- Cria backup de segurança antes da migração

### Opção 3: Apenas Migração
```bash
npm run migrate:os-materiais
```

**O que faz:**
- Migra as OSs sem fazer backup (⚠️ **CUIDADO!**)

## 📁 Arquivos Gerados

### Backup
- **Localização:** `backend/backups/os-materiais/`
- **Formato:** `os-materiais-backup-YYYY-MM-DDTHH-mm-ss.json`
- **Conteúdo:** Dados originais de todas as OSs

### Script de Restauração
- **Localização:** `backend/backups/os-materiais/`
- **Formato:** `restaurar-os-YYYY-MM-DDTHH-mm-ss.ts`
- **Uso:** Para reverter a migração se necessário

## 🔍 O Que Acontece na Migração

1. **Busca** todas as OSs que têm `orcamento_id`
2. **Extrai** materiais exatos do orçamento vinculado
3. **Atualiza** o campo `insumos_calculados` com dados corretos
4. **Adiciona** campos de rastreabilidade:
   - `origem: 'orcamento'`
   - `orcamento_id`
   - `data_calculo`
   - `produto_nome`

## ✅ Validação

Após a migração, o script valida:
- ✅ Quantidade de materiais extraídos
- ✅ Presença de campos de rastreabilidade
- ✅ Estrutura dos dados
- ✅ Exemplos de quantidades corretas

## 🚨 Segurança

- **Backup automático** antes de qualquer alteração
- **Validação** após migração
- **Logs detalhados** de cada operação
- **Script de restauração** gerado automaticamente

## 📊 Exemplo de Resultado

**Antes da migração:**
```json
{
  "nome": "Madeira 105cm",
  "quantidade": 27,  // ❌ Quantidade incorreta
  "unidade": "un"
}
```

**Depois da migração:**
```json
{
  "nome": "Madeira 105cm",
  "quantidade_necessaria": 2,  // ✅ Quantidade correta do orçamento
  "unidade": "un",
  "origem": "orcamento",
  "orcamento_id": "orc_123",
  "produto_nome": "Banner 100cm"
}
```

## 🔄 Como Restaurar (Se Necessário)

1. Navegue até `backend/backups/os-materiais/`
2. Execute o script de restauração gerado:
   ```bash
   ts-node restaurar-os-YYYY-MM-DDTHH-mm-ss.ts
   ```

## 📝 Logs

Todos os scripts geram logs detalhados mostrando:
- 📊 Quantidade de OSs processadas
- ✅ Sucessos
- ❌ Erros (se houver)
- 🔍 Validações realizadas

## ⚠️ Importante

- Execute sempre em **ambiente de desenvolvimento** primeiro
- Faça **backup manual** da base de dados antes de executar em produção
- Verifique os **logs** para confirmar que tudo correu bem
- Teste algumas OSs manualmente após a migração
