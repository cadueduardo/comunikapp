# 05 — Persistência de Anexos (Imagem e DXF)

**Status do documento:** proposto

## Objetivo

Decidir onde os arquivos de geometria (imagem colada/upload, DXF) ficam armazenados e como são referenciados.

## Opções avaliadas

### Opção A — Reaproveitar `ArteArquivo` (módulo Arte & Aprovação)

**Prós:**

- Tabela já existe e tem versionamento.

**Contras:**

- Mistura semântica: `ArteArquivo` é arte de aprovação visual com cliente, não geometria técnica.
- Acoplamento entre módulos diferentes.
- Versionamento de arte não faz sentido para anexo técnico de orçamento.

**Decisão:** rejeitada.

### Opção B — Tabela nova `ProdutoOrcamentoAnexo`

**Prós:**

- Modelo limpo, separado.
- Permite múltiplos anexos por produto no futuro.

**Contras:**

- Mais migrations.
- Por enquanto, a regra é 1 anexo por produto. Tabela seria subutilizada.

**Decisão:** adiada — pode ser feita na Fase 7 (DXF avançado) se necessário.

### Opção C — Storage externo + referência em coluna do `ProdutoOrcamento`

**Prós:**

- Simples.
- O arquivo bruto fora do banco evita inchar o MySQL.
- Permite migrar para S3/MinIO quando o volume crescer.

**Contras:**

- Precisa estratégia de storage local ou externo desde já.

**Decisão:** **escolhida** para a primeira versão (Fase 2).

## Decisão final

**Opção C** com as seguintes regras:

### Storage

- **Primeira fase (Fase 2):** armazenamento local na VPS, em diretório dedicado:

```text
/var/comunikapp/anexos/<loja_id>/<produto_orcamento_id>/<hash>.<ext>
```

- O backend NestJS expõe arquivos via endpoint autenticado, **não diretamente** pela rota pública do Nginx.

```text
GET /orcamentos-v2/produtos/:produtoId/anexo-geometria
```

- O endpoint verifica `loja_id` do JWT antes de servir o arquivo.

- **Fase futura:** migrar para S3/MinIO sem alterar o contrato (apenas a URL de retorno muda).

### Referência

Em `ProdutoOrcamento`:

```text
arquivo_geometria_url         VARCHAR(512)   -- URL relativa (ex.: /orcamentos-v2/produtos/abc/anexo-geometria)
arquivo_geometria_metadados   LONGTEXT (JSON) -- ver 04-campos-geometria.md
```

### Limites

| limite | valor |
| --- | --- |
| Tamanho máximo por arquivo (imagem) | 5 MB |
| Tamanho máximo por arquivo (DXF) | 20 MB |
| Formatos aceitos (imagem) | `image/png`, `image/jpeg`, `image/webp`, `image/gif` |
| Formatos aceitos (DXF) | `application/dxf`, `application/x-dxf`, `image/x-dxf` ou `.dxf` por extensão |
| Anexos por produto | 1 (a primeira versão) |

### Substituição

Quando o usuário cola/upload uma nova imagem ou DXF:

1. O arquivo anterior é removido do storage (best-effort).
2. O novo é salvo com novo hash.
3. `arquivo_geometria_url` é atualizado.
4. Registro de auditoria via `OrcamentoLog` (`tipo_acao = 'GEOMETRIA_ATUALIZADA'`).

### Exclusão

Se o `ProdutoOrcamento` for excluído (soft delete do orçamento), o arquivo **não é removido imediatamente**. Há job de limpeza diário que apaga arquivos órfãos com mais de 30 dias.

### Segurança

- Cada arquivo recebe hash SHA-256 no nome físico, evitando colisão e descoberta por enumeração.
- O endpoint de download exige autenticação e verifica `loja_id`.
- O frontend nunca recebe caminho físico, apenas a URL relativa.

## Backend — estrutura proposta

```text
backend/src/orcamentos-v2/services/anexo-geometria.service.ts
backend/src/orcamentos-v2/controllers/anexo-geometria.controller.ts
```

Métodos do serviço:

```ts
salvar(produtoId: string, arquivo: Express.Multer.File, lojaId: string): Promise<{ url: string; metadados: object }>
obter(produtoId: string, lojaId: string): Promise<Stream | null>
remover(produtoId: string, lojaId: string): Promise<void>
```

## Variáveis de ambiente

```text
COMUNIKAPP_ANEXOS_DIR=/var/comunikapp/anexos
COMUNIKAPP_ANEXOS_MAX_IMAGEM_MB=5
COMUNIKAPP_ANEXOS_MAX_DXF_MB=20
```

## Pontos de confirmação

1. Tamanho máximo proposto (5 MB imagem, 20 MB DXF) está adequado?
2. Diretório base `/var/comunikapp/anexos` na VPS é aceitável? (Garantir backup e permissões para o usuário do PM2.)
3. Job de limpeza diário de órfãos pode rodar 03:00 da manhã?
