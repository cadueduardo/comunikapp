# Relatório de Conclusão — Fase 3: Backend de Instalações, CEP e Finanças

**Status:** ✅ Implementada — aguardando aprovação formal para Fase 4  
**Dependência:** Fases 1 e 2 concluídas e aprovadas  

### 1. Arquivos criados ou alterados
| Arquivo | Ação |
|---------|------|
| `backend/src/instalacao/controllers/instalador.controller.ts` | Criado |
| `backend/src/instalacao/controllers/instalacao.controller.ts` | Criado |
| `backend/src/instalacao/dto/instalador.dto.ts` | Criado |
| `backend/src/instalacao/guards/instalador-permissions.guard.ts` | Criado |
| `backend/src/instalacao/guards/instalador-permissions.guard.spec.ts` | Criado |
| `backend/src/instalacao/guards/instalacao-gestao-permissions.guard.ts` | Criado |
| `backend/src/instalacao/services/cep-integration.service.ts` | Criado |
| `backend/src/instalacao/services/cep-integration.service.spec.ts` | Criado |
| `backend/src/instalacao/services/instalacao.service.ts` | Criado |
| `backend/src/instalacao/services/instalacao.service.spec.ts` | Criado |
| `backend/src/instalacao/services/instalacao-pos-calculo.service.ts` | Criado |
| `backend/src/instalacao/services/instalacao-pos-calculo.service.spec.ts` | Criado |
| `backend/src/instalacao/utils/sanitizar-texto.util.ts` | Criado |
| `backend/src/instalacao/instalacao.module.ts` | Modificado |
| `backend/src/financeiro/enums/cobranca-status.enum.ts` | Modificado |
| `backend/src/financeiro/services/cobrancas.service.ts` | Modificado |
| `backend/src/financeiro/services/status-rollup.service.ts` | Modificado |
| `backend/src/financeiro/services/status-rollup.service.spec.ts` | Criado |
| `backend/prisma/schema.prisma` | Modificado |
| `backend/prisma/migrations/20260630140000_instalacoes_fase3_parcela_status/migration.sql` | Criado |

### 2. Verificação de regras de negócio e padrões
* [x] DTOs mobile filtrando e omitindo `custo_interno` e `preco_cliente` (RBAC)? **Sim**
* [x] Service de CEP resiliente com fallback para digitação manual? **Sim**
* [x] Motor de ocorrências aplicando custos automáticos via `TaxaOcorrenciaLoja`? **Sim**
* [x] Parcela de Saldo (50%) blindada até a emissão do fechamento técnico? **Sim**
* [x] Codificação UTF-8 preservada em pt-BR para acentuação? **Sim**

### 3. Resumo técnico das implementações

**Rotas mobile (`/instalador`)** — `InstaladorController` protegido por `JwtAuthGuard` + `InstaladorPermissionsGuard` (perfis `ADMINISTRADOR` e `PRODUCAO`). Todas as queries filtram por `loja_id` do token. Listagem, detalhe, início e conclusão de lotes usam `.select()` explícito no Prisma; ocorrências retornadas ao instalador omitem `custo_interno` e `preco_cliente`.

**Integração CEP** — `CepIntegrationService.buscarEnderecoPorCep()` consulta ViaCEP com timeout de 8s. CEP inválido, não encontrado ou falha de rede retornam `{ sucesso: false, permitir_preenchimento_manual: true }` sem interromper o fluxo do usuário.

**Motor de ocorrências** — `InstalacaoService.registrarOcorrenciaObra()` recebe apenas tipo, descrição e vínculos (OS/lote). O backend resolve `TaxaOcorrenciaLoja` por `loja_id` + `tipo`, calcula `custo_interno` e `preco_cliente` e persiste em `OcorrenciaInstalacao`. A resposta HTTP expõe somente metadados operacionais.

**Pós-cálculo financeiro** — `InstalacaoPosCalculoService`:
- `aplicarTravaSaldoAposAprovacao()` — hook em `CobrancasService` após criar cobrança; parcelas `SALDO` passam a `AGUARDANDO_RELATORIO_TECNICO` quando o orçamento exige instalação.
- `calcularMargemRealOs()` — lucro real = valor orçado − custo orçado − Σ `custo_interno` das ocorrências.
- `gerarRelatorioTecnicoFinal()` — valida lotes encerrados, libera saldo para `PREVISTO` (+15 dias), consolida extras de `preco_cliente` em nova parcela e registra logs.

**Proteção contra vencimento automático** — `StatusRollupService.recategorizarVencidas()` ignora parcelas em `AGUARDANDO_RELATORIO_TECNICO`, impedindo liberação por decurso de prazo.

**Rotas gerenciais (`/instalacao`)** — CEP público autenticado; margem real e relatório técnico restritos a `ADMINISTRADOR`, `FINANCEIRO` ou `VENDAS` via `InstalacaoGestaoPermissionsGuard`.

### 4. Plano de testes manuais/automatizados executados

#### Testes automatizados (Jest — 23 testes, 8 suites — todos passando)

```powershell
cd backend
npx jest --testPathPattern="instalacao|status-rollup|instalador-permissions"
```

Suites cobertas: CEP (fallback/timeout/sucesso), ocorrências (taxas ocultas + select RBAC), pós-cálculo (trava saldo, margem, relatório técnico), rollup (não vence saldo retido), guard de permissões.

#### Chamadas HTTP sugeridas (validação manual)

```http
# CEP — qualquer usuário autenticado
GET /instalacao/cep/01310100
Authorization: Bearer <token>

# Fila mobile — perfil PRODUCAO/ADMINISTRADOR
GET /instalador/lotes
Authorization: Bearer <token>

# Ocorrência — instalador envia só tipo + descrição (custos no servidor)
POST /instalador/ocorrencias
Authorization: Bearer <token>
Content-Type: application/json

{
  "os_id": "<uuid-os>",
  "item_instalacao_id": "<uuid-lote>",
  "tipo": "VISITA_IMPRODUTIVA",
  "descricao": "Cliente ausente no local"
}

# Margem real — perfil FINANCEIRO/ADMINISTRADOR/VENDAS
GET /instalacao/os/<uuid-os>/margem-real
Authorization: Bearer <token>

# Libera saldo e cobranças extras
POST /instalacao/os/<uuid-os>/relatorio-tecnico
Authorization: Bearer <token>
```

#### Queries SQL de verificação

```sql
-- Parcela SALDO retida após aprovação (orçamento com instalação)
SELECT cp.tipo, cp.status, cp.data_vencimento
FROM cobranca_parcelas cp
JOIN cobrancas c ON c.id = cp.cobranca_id
WHERE c.orcamento_id = '<orcamento_id>'
  AND cp.tipo = 'SALDO';
-- Esperado: status = 'AGUARDANDO_RELATORIO_TECNICO' até relatório técnico

-- Ocorrência com custos preenchidos pelo backend (não enviados pelo cliente)
SELECT tipo, custo_interno, preco_cliente, descricao
FROM ocorrencias_instalacao
WHERE os_id = '<os_id>' AND loja_id = '<loja_id>';

-- Após POST /instalacao/os/:id/relatorio-tecnico
SELECT tipo, status, valor_previsto, data_vencimento
FROM cobranca_parcelas
WHERE cobranca_id = '<cobranca_id>'
ORDER BY ordem;
-- Esperado: SALDO -> PREVISTO; eventual PARCELA extra com soma de preco_cliente
```

#### Migration

```powershell
cd backend
npx prisma migrate deploy
npx prisma generate
```

Migration `20260630140000_instalacoes_fase3_parcela_status`: amplia `cobranca_parcelas.status` para `VARCHAR(32)` a fim de suportar `AGUARDANDO_RELATORIO_TECNICO`.
